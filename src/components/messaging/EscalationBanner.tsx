import { CheckCircle2, ShieldCheck, Siren } from 'lucide-react';
import { formatDate } from '../../utils/format';
import type { Conversation, ConversationEscalationStatus } from '../../types';

const banner: Record<
  Exclude<ConversationEscalationStatus, 'Active'>,
  { icon: typeof Siren; wrapper: string; title: string }
> = {
  Escalated: {
    icon: Siren,
    wrapper: 'border-gold-200 bg-gold-50 text-gold-800',
    title: 'Waiting for PIPDC',
  },
  Assigned: {
    icon: ShieldCheck,
    wrapper: 'border-blue-200 bg-blue-50 text-blue-800',
    title: 'PIPDC has taken over',
  },
  Resolved: {
    icon: CheckCircle2,
    wrapper: 'border-ink-200 bg-ink-50 text-ink-600',
    title: 'Resolved by PIPDC',
  },
};

interface EscalationBannerProps {
  conversation: Conversation;
  currentUserId: string;
}

/**
 * Batch 6. Explains who currently owns the conversation.
 *
 * The escalating agent's reason is internal: the client is told that PIPDC has
 * taken over, but not why the agent escalated, because the reason may reference
 * something the client should not read. The audience is therefore decided by
 * comparing the viewer against the client, not by a claim in the payload.
 */
export function EscalationBanner({ conversation, currentUserId }: EscalationBannerProps) {
  const status = conversation.escalationStatus ?? 'Active';
  if (status === 'Active') return null;

  const copy = banner[status];
  const Icon = copy.icon;
  const viewerIsClient = conversation.client.userId === currentUserId;

  return (
    <div className={`flex items-start gap-2.5 border-b px-4 py-2.5 text-xs ${copy.wrapper}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{copy.title}</p>
        {status === 'Escalated' && conversation.escalatedAt && (
          <p className="mt-0.5 opacity-90">
            Raised {formatDate(conversation.escalatedAt)}
            {conversation.escalatedByName ? ` by ${conversation.escalatedByName}` : ''}. An administrator will
            claim it shortly.
          </p>
        )}
        {status === 'Assigned' && conversation.assignedAdminName && (
          <p className="mt-0.5 opacity-90">
            {conversation.assignedAdminName} is handling this thread
            {conversation.assignedAt ? ` since ${formatDate(conversation.assignedAt)}` : ''}.
          </p>
        )}
        {status === 'Resolved' && conversation.resolvedAt && (
          <p className="mt-0.5 opacity-90">
            Closed {formatDate(conversation.resolvedAt)}
            {conversation.resolvedByName ? ` by ${conversation.resolvedByName}` : ''}. The full history is kept.
          </p>
        )}
        {status === 'Escalated' && conversation.escalationReason && !viewerIsClient && (
          <p className="mt-1 rounded-lg bg-white/70 px-2 py-1 opacity-90">“{conversation.escalationReason}”</p>
        )}
      </div>
    </div>
  );
}
