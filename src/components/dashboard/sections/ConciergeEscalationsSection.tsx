import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  useClaimConciergeEscalation,
  useConciergeEscalationDetail,
  useConciergeEscalationQueue,
  useResolveConciergeEscalation,
} from '../../../hooks/useConciergeEscalation';
import { extractApiError } from '../../../services/api';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { useToast } from '../../ui/Toast';
import { formatDate, formatPrice, timeAgo } from '../../../utils/format';
import { cn } from '../../../utils/cn';
import type {
  AiChatMessage,
  ConciergeContactPreference,
  ConciergeEscalation,
  ConciergeEscalationStatus,
  Property,
} from '../../../types';

const PAGE_SIZE = 50;

function statusTone(status: ConciergeEscalationStatus): 'warning' | 'info' | 'success' {
  if (status === 'Escalated') return 'warning';
  if (status === 'Assigned') return 'info';
  return 'success';
}

function contactPreferenceLabel(preference: ConciergeContactPreference | null): string {
  if (preference === 'EmailAndPhone') return 'Email and phone';
  if (preference === 'Email') return 'Email only';
  return 'Not stated';
}

/**
 * The administrator's concierge-escalation queue: AI-assistant chats PIPDC was
 * handed because the assistant could not resolve them (no matching property, a
 * request to speak to a human, or an organizational request). Each case hangs off
 * its chat transcript, so the admin reads the conversation and then reaches the
 * client outside the chat.
 */
export function ConciergeEscalationsSection() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'' | ConciergeEscalationStatus>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const params: Record<string, unknown> = { pageNumber: 1, pageSize: PAGE_SIZE };
  if (statusFilter) params.status = statusFilter;
  const queueQuery = useConciergeEscalationQueue(params);
  const queue = queueQuery.data?.items ?? [];

  if (selectedId != null) {
    return (
      <CaseDetail
        id={selectedId}
        currentUserId={user?.id ?? ''}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <section className="rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-5">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-forest-600" />
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Concierge escalations</h2>
            <p className="text-sm text-ink-500">
              Chats the AI assistant handed to PIPDC for a human follow-up.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | ConciergeEscalationStatus)}
            aria-label="Filter by status"
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-700 transition-colors focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          >
            <option value="">All statuses</option>
            <option value="Escalated">Escalated</option>
            <option value="Assigned">Assigned</option>
            <option value="Resolved">Resolved</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void queueQuery.refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {queueQuery.isLoading ? (
        <div className="p-6 text-sm text-ink-500">Loading escalations...</div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="No concierge escalations"
          description="Chats the assistant hands to PIPDC will appear here."
        />
      ) : (
        <div className="divide-y divide-ink-50">
          {queue.map((escalation) => (
            <EscalationRow
              key={escalation.id}
              escalation={escalation}
              onOpen={() => setSelectedId(escalation.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EscalationRow({
  escalation,
  onOpen,
}: {
  escalation: ConciergeEscalation;
  onOpen: () => void;
}) {
  const { notify } = useToast();
  const claim = useClaimConciergeEscalation();
  const canClaim = escalation.status === 'Escalated';

  const claimCase = async () => {
    try {
      await claim.mutateAsync(escalation.id);
      notify({
        type: 'success',
        title: 'Case claimed',
        description: 'The case is now assigned to you.',
      });
      onOpen();
    } catch (error) {
      notify({ type: 'error', title: 'Could not claim case', description: extractApiError(error) });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <UserRound className="h-4 w-4 text-forest-600" />
          <p className="font-semibold text-ink-900">{escalation.clientName || 'Unknown client'}</p>
          <Badge tone={statusTone(escalation.status)}>{escalation.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">{escalation.clientEmail}</p>
        {escalation.clientPhone && (
          <a
            href={`tel:${escalation.clientPhone}`}
            className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-600 transition-colors hover:text-forest-600"
          >
            <Phone className="h-3.5 w-3.5 text-forest-500" /> {escalation.clientPhone}
          </a>
        )}
        <p className="mt-1 line-clamp-2 text-xs text-ink-500">
          {escalation.escalationReason || 'No reason provided'}
        </p>
        <p className="mt-1 text-[11px] text-ink-400">
          {escalation.messageCount} message{escalation.messageCount === 1 ? '' : 's'} · escalated{' '}
          {timeAgo(escalation.escalatedAt)}
        </p>
      </div>
      <Button
        size="sm"
        loading={claim.isPending && claim.variables === escalation.id}
        onClick={() => (canClaim ? void claimCase() : onOpen())}
      >
        {canClaim ? 'Claim case' : 'Open case'}
      </Button>
    </div>
  );
}

function CaseDetail({
  id,
  currentUserId,
  onBack,
}: {
  id: number;
  currentUserId: string;
  onBack: () => void;
}) {
  const { notify } = useToast();
  const detailQuery = useConciergeEscalationDetail(id);
  const claim = useClaimConciergeEscalation();
  const resolve = useResolveConciergeEscalation();

  const escalation = detailQuery.data?.escalation;
  const messages = detailQuery.data?.messages ?? [];

  const canClaim = escalation?.status === 'Escalated';
  const canResolve =
    escalation?.status === 'Assigned' && escalation.assignedAdminId === currentUserId;

  const claimCase = async () => {
    if (!escalation) return;
    try {
      await claim.mutateAsync(escalation.id);
      notify({ type: 'success', title: 'Case claimed', description: 'The case is now assigned to you.' });
    } catch (error) {
      notify({ type: 'error', title: 'Could not claim case', description: extractApiError(error) });
    }
  };

  const resolveCase = async () => {
    if (!escalation) return;
    try {
      await resolve.mutateAsync(escalation.id);
      notify({ type: 'success', title: 'Case resolved', description: 'The case has been closed.' });
    } catch (error) {
      notify({ type: 'error', title: 'Could not resolve case', description: extractApiError(error) });
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={onBack}
      >
        Back to concierge escalations
      </Button>

      {!escalation ? (
        <div className="rounded-2xl border border-ink-100 bg-white p-6 text-sm text-ink-500 shadow-soft">
          {detailQuery.isError ? 'Could not load this case.' : 'Loading case...'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="rounded-2xl border border-ink-100 bg-white shadow-soft">
            <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-5">
              <MessageSquare className="h-5 w-5 text-forest-600" />
              <h2 className="font-display text-lg font-bold text-ink-900">Chat transcript</h2>
              <span className="text-xs text-ink-400">
                {messages.length} message{messages.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <p className="text-sm text-ink-500">No messages were recorded for this chat.</p>
              ) : (
                messages.map((message, index) => (
                  <TranscriptMessage key={`${message.sentAt}-${index}`} message={message} />
                ))
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-ink-900">Case</h3>
                <Badge tone={statusTone(escalation.status)}>{escalation.status}</Badge>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Client</dt>
                  <dd className="text-ink-800">{escalation.clientName || 'Unknown client'}</dd>
                  <dd className="flex items-center gap-1 text-xs text-ink-500">
                    <Mail className="h-3 w-3" /> {escalation.clientEmail}
                  </dd>
                  {escalation.clientPhone && (
                    <dd className="flex items-center gap-1 text-xs">
                      <Phone className="h-3 w-3 text-forest-500" />
                      <a href={`tel:${escalation.clientPhone}`} className="text-ink-700 transition-colors hover:text-forest-600">
                        {escalation.clientPhone}
                      </a>
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Contact via</dt>
                  <dd className="text-ink-800">{contactPreferenceLabel(escalation.contactPreference)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Reason</dt>
                  <dd className="text-ink-800">{escalation.escalationReason || 'No reason provided'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Escalated</dt>
                  <dd className="text-ink-800">{formatDate(escalation.escalatedAt)}</dd>
                </div>
                {escalation.assignedAdminName && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Assigned to
                    </dt>
                    <dd className="text-ink-800">{escalation.assignedAdminName}</dd>
                  </div>
                )}
                {escalation.resolvedByName && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Resolved by
                    </dt>
                    <dd className="text-ink-800">
                      {escalation.resolvedByName}
                      {escalation.resolvedAt ? ` · ${formatDate(escalation.resolvedAt)}` : ''}
                    </dd>
                  </div>
                )}
                {escalation.lastMessageAt && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Last activity
                    </dt>
                    <dd className="text-ink-800">{timeAgo(escalation.lastMessageAt)}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                {canClaim && (
                  <Button loading={claim.isPending} onClick={() => void claimCase()}>
                    Claim case
                  </Button>
                )}
                {canResolve && (
                  <Button
                    variant="dark"
                    leftIcon={<ShieldCheck className="h-4 w-4" />}
                    loading={resolve.isPending}
                    onClick={() => void resolveCase()}
                  >
                    Resolve case
                  </Button>
                )}
                {escalation.status === 'Assigned' && !canResolve && (
                  <p className="text-xs text-ink-500">
                    Claimed by {escalation.assignedAdminName ?? 'another administrator'}.
                  </p>
                )}
                {escalation.status === 'Resolved' && (
                  <p className="text-xs text-ink-500">This case is resolved.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function TranscriptMessage({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-ink-100 text-ink-600' : 'bg-forest-500 text-white',
        )}
      >
        {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('max-w-[80%]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed',
            isUser
              ? 'bg-forest-500 text-white'
              : 'rounded-tl-md border border-ink-100 bg-ink-50 text-ink-800',
          )}
        >
          {message.content ||
            (message.properties?.length ? 'Here are some properties that match the request:' : '')}
        </div>
        {message.properties && message.properties.length > 0 && (
          <div className="mt-2 space-y-2 text-left">
            {message.properties.map((property) => (
              <MiniPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
        <p className={cn('mt-1 text-[11px] text-ink-400', isUser && 'text-right')}>
          {timeAgo(message.sentAt)}
        </p>
      </div>
    </div>
  );
}

function MiniPropertyCard({ property }: { property: Property }) {
  const location = [property.area, property.city].filter(Boolean).join(', ') || property.state;
  return (
    <Link
      to={`/properties/${property.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 text-left transition-colors hover:border-forest-500"
    >
      <img
        src={property.coverImage ?? property.images[0]}
        alt={property.title}
        className="h-14 w-18 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-forest-600">
          {formatPrice(property.price, property.currency)}
          {property.period && <span className="text-xs font-medium text-ink-400">{property.period}</span>}
        </p>
        <h3 className="truncate text-sm font-medium text-ink-800">{property.title}</h3>
        <p className="mt-0.5 truncate text-xs text-ink-500">{location}</p>
      </div>
    </Link>
  );
}
