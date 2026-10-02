import { useState } from 'react';
import { Plus, ShieldCheck, ShieldOff, BarChart3, Search, Star, UserX, UserCheck, UserMinus, Ban } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Spinner } from '../../ui/Spinner';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AgentForm } from '../../forms/AgentForm';
import { useDeleteAgent, useToggleAgentVerification } from '../../../hooks/mutations';
import { useAgents, useAgentSummary } from '../../../hooks/queries';
import { useSuspendAgent, useReinstateAgent } from '../../../hooks/useAgentReports';
import { extractApiError, isConcurrencyConflict, CONCURRENCY_CONFLICT_DESCRIPTION } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';
import type { Agent } from '../../../types';

const PAGE_SIZE = 10;

export function AgentsSection() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const agentsQuery = useAgents({ pageNumber: page, pageSize: PAGE_SIZE, keyword: keyword || undefined });
  const { notify } = useToast();
  const deleteAgent = useDeleteAgent();
  const toggleVerification = useToggleAgentVerification();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState<Agent | null>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [successorId, setSuccessorId] = useState('');
  const [verifying, setVerifying] = useState<Agent | null>(null);
  const [summarizing, setSummarizing] = useState<Agent | null>(null);
  const [suspending, setSuspending] = useState<Agent | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [reinstating, setReinstating] = useState<Agent | null>(null);

  const suspendAgent = useSuspendAgent();
  const reinstateAgent = useReinstateAgent();

  const summaryQuery = useAgentSummary(summarizing?.id);

  const agents = agentsQuery.data?.items ?? [];
  const totalCount = agentsQuery.data?.totalCount ?? 0;

  // The admin directory is the only caller that receives suspended agents, so
  // this is the only place a suspended badge can be rendered.
  const suspendedAgentIds = new Set(agents.filter((a) => a.isSuspended).map((a) => a.id));
  // Likewise, only admins see removed agents, because a removed one is hidden from
  // the public directory along with their listings.
  const removedAgentIds = new Set(agents.filter((a) => a.isRemoved).map((a) => a.id));

  // Successors offered in the removal dialog: everyone except the agent being
  // removed and anyone suspended or already removed, since handing live work to
  // an agent who cannot act on it just strands the clients.
  const successorOptions = agents.filter(
    (a) => a.id !== deleting?.id && !a.isSuspended && !a.isRemoved,
  );

  const openRemoval = (agent: Agent) => {
    setDeleting(agent);
    setRemovalReason('');
    setSuccessorId('');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      const result = await deleteAgent.mutateAsync({
        id: deleting.id,
        reason: removalReason.trim(),
        reassignToAgentId: successorId ? Number(successorId) : null,
      });
      notify({
        type: 'success',
        title: 'Agent removed',
        description: result.reassigned
          ? `${deleting.fullName} was removed. ${result.propertiesReassigned} properties and ${result.enquiriesReassigned} open enquiries were handed to another agent, and they have been emailed the reason.`
          : `${deleting.fullName} was removed, their application is revoked, and they have been emailed the reason.`,
      });
      setDeleting(null);
      setRemovalReason('');
      setSuccessorId('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not remove agent', description: extractApiError(err) });
    }
  };

  const confirmVerify = async () => {
    if (!verifying) return;
    try {
      await toggleVerification.mutateAsync(verifying.id);
      notify({
        type: 'success',
        title: verifying.verified ? 'Verification removed' : 'Agent verified',
        description: `${verifying.fullName} is now ${verifying.verified ? 'unverified' : 'verified'}.`,
      });
      setVerifying(null);
    } catch (err) {
      notify({
        type: 'error',
        title: isConcurrencyConflict(err) ? 'This agent just changed' : 'Could not update verification',
        description: isConcurrencyConflict(err) ? CONCURRENCY_CONFLICT_DESCRIPTION : extractApiError(err),
      });
    }
  };

  const openSuspend = (agent: Agent) => {
    setSuspending(agent);
    setSuspendReason('');
  };

  const confirmSuspend = async () => {
    if (!suspending) return;
    try {
      await suspendAgent.mutateAsync({ id: suspending.id, reason: suspendReason.trim() });
      notify({
        type: 'success',
        title: 'Agent suspended',
        description: `${suspending.fullName} is hidden from the public directory and cannot manage properties.`,
      });
      setSuspending(null);
      setSuspendReason('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not suspend agent', description: extractApiError(err) });
    }
  };

  const confirmReinstate = async () => {
    if (!reinstating) return;
    try {
      await reinstateAgent.mutateAsync(reinstating.id);
      notify({
        type: 'success',
        title: 'Agent reinstated',
        description: `${reinstating.fullName} is visible again and can manage properties.`,
      });
      setReinstating(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not reinstate agent', description: extractApiError(err) });
    }
  };

  return (
    <>
      <CardTable
        title="All Agents"
        actions={
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Add Agent
          </Button>
        }
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setKeyword(searchInput); } }}
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
          </div>
        </div>
        {agentsQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : agents.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Agent</th>
                  <th className={thClass}>Agency</th>
                  <th className={thClass}>Phone</th>
                  <th className={thClass}>License</th>
                  <th className={thClass}>Properties</th>
                  <th className={thClass}>Rating</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {agents.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-ink-50/60">
                    <td className={tdClass}>
                      <span className="font-medium text-ink-900">{a.fullName}</span>
                      <span className="block text-xs text-ink-400">{a.email}</span>
                    </td>
                    <td className={tdClass}>{a.agency}</td>
                    <td className={tdClass}>{a.phone || 'â€”'}</td>
                    <td className={tdClass}>{a.licenseNumber || 'â€”'}</td>
                    <td className={tdClass}>
                      <Badge tone={a.propertyCount > 0 ? 'forest' : 'neutral'}>
                        {a.propertyCount} {a.propertyCount === 1 ? 'property' : 'properties'}
                      </Badge>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {a.averageRating == null ? (
                        <span className="text-xs text-ink-400">No reviews</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink-700">
                          <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" />
                          <span className="font-medium">{a.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-ink-400">({a.reviewCount})</span>
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={a.verified ? 'forest' : 'neutral'}>{a.verified ? 'Verified' : 'Unverified'}</Badge>
                        {suspendedAgentIds.has(a.id) && (
                          <Badge tone="danger">Suspended</Badge>
                        )}
                        {removedAgentIds.has(a.id) && (
                          <Badge tone="danger">Removed</Badge>
                        )}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title={a.verified ? 'Remove verification' : 'Verify agent'}
                          onClick={() => setVerifying(a)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-forest-50 hover:text-forest-600"
                        >
                          {a.verified ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          title="View summary"
                          onClick={() => setSummarizing(a)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        {/* Suspension manages a live agent; removal revokes a
                            registration. They are different decisions, so they get
                            different controls and a removed agent is not offered
                            either. */}
                        {!removedAgentIds.has(a.id) &&
                          (suspendedAgentIds.has(a.id) ? (
                            <button
                              type="button"
                              title="Reinstate agent"
                              onClick={() => setReinstating(a)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-forest-50 hover:text-forest-600"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Suspend agent"
                              onClick={() => openSuspend(a)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          ))}
                        <RowActions
                          viewUrl={`/agents/${a.id}`}
                          onEdit={() => { setEditing(a); setFormOpen(true); }}
                          onDelete={() => openRemoval(a)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

      <AgentForm open={formOpen} agent={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />

      {/* Verify / Unverify Confirm */}
      <ConfirmDialog
        open={Boolean(verifying)}
        title={verifying?.verified ? 'Remove verification' : 'Verify agent'}
        description={
          verifying?.verified
            ? `Remove verification from ${verifying?.fullName}? They will lose their verified badge.`
            : `Verify ${verifying?.fullName}? They will receive a verified badge on their profile.`
        }
        confirmLabel={verifying?.verified ? 'Remove verification' : 'Verify agent'}
        tone="primary"
        loading={toggleVerification.isPending}
        onConfirm={confirmVerify}
        onCancel={() => setVerifying(null)}
      />

      {/*
        Removing an agent needs two things a confirm dialog cannot collect: a
        reason the agent will be emailed, and a decision about who takes over
        their listings. Both are gathered here rather than defaulted, because
        defaulting either is how the removal became invisible last time.
      */}
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Remove agent" size="md">
        {deleting && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3">
              <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">
                This revokes <span className="font-medium">{deleting.fullName}</span>&apos;s agent registration. Their
                profile and history are kept, but they lose access to the agent dashboard, their application is marked
                revoked, and they are emailed this reason. They can appeal, and an upheld appeal reinstates them.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700" htmlFor="removal-reason">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="removal-reason"
                rows={4}
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="Record why this registration is being revoked, between 10 and 1000 characters."
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
              />
              <p className="mt-1.5 text-xs text-ink-400">
                {removalReason.trim().length}/1000 characters. The agent is emailed this, so it has to say why.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700" htmlFor="removal-successor">
                Hand listings and open enquiries to
              </label>
              <select
                id="removal-successor"
                value={successorId}
                onChange={(e) => setSuccessorId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
              >
                <option value="">Leave them with no agent</option>
                {successorOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} â€” {a.agency}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-400">
                {successorOptions.length === 0
                  ? 'No other active agent is available, so their listings stay hidden until one exists.'
                  : 'Their properties and open enquiries move to this agent so clients are not stranded. Suspended and removed agents cannot be chosen.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setDeleting(null)} disabled={deleteAgent.isPending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                disabled={deleteAgent.isPending || removalReason.trim().length < 10}
              >
                {deleteAgent.isPending ? <Spinner size="sm" /> : <UserMinus className="h-4 w-4" />}
                Remove agent
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Suspend â€” needs a written reason, so a form rather than a confirm */}
      <Modal open={Boolean(suspending)} onClose={() => setSuspending(null)} title="Suspend agent" size="md">
        {suspending && (
          <div className="space-y-5">
            <p className="text-sm text-ink-700">
              Suspending <span className="font-medium text-ink-900">{suspending.fullName}</span> immediately hides
              their profile and listings from the public directory, stops new enquiries from reaching them, and
              blocks them from creating, editing or deleting properties. Their existing data is kept.
            </p>
            <div>
              <label className="text-sm font-medium text-ink-700" htmlFor="suspend-reason">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="suspend-reason"
                rows={4}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Record the reason for this suspension, between 10 and 500 characters."
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
              />
              <p className="mt-1.5 text-xs text-ink-400">
                {suspendReason.trim().length}/500 characters. This is stored as the audit record for the decision.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setSuspending(null)} disabled={suspendAgent.isPending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmSuspend}
                disabled={suspendAgent.isPending || suspendReason.trim().length < 10}
              >
                {suspendAgent.isPending ? <Spinner size="sm" /> : <UserX className="h-4 w-4" />}
                Suspend agent
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(reinstating)}
        title="Reinstate agent"
        description={`Restore ${reinstating?.fullName}? They will reappear in the public directory and can manage their properties again.`}
        confirmLabel="Reinstate agent"
        tone="primary"
        loading={reinstateAgent.isPending}
        onConfirm={confirmReinstate}
        onCancel={() => setReinstating(null)}
      />

      {/* Summary Modal */}
      <Modal open={Boolean(summarizing)} onClose={() => setSummarizing(null)} title="Agent Summary" size="md">
        {summaryQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-ink-100" />
            ))}
          </div>
        ) : summaryQuery.data ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 font-display text-lg font-semibold text-forest-700">
                {summaryQuery.data.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-ink-900">{summaryQuery.data.fullName}</p>
                <p className="text-sm text-ink-400">{summaryQuery.data.email}</p>
              </div>
              <Badge tone={summaryQuery.data.verified ? 'forest' : 'neutral'} className="ml-auto">
                {summaryQuery.data.verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-forest-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-forest-700">{summaryQuery.data.propertyCount}</p>
                <p className="mt-0.5 text-xs font-medium text-forest-600">Properties</p>
              </div>
              <div className="rounded-lg bg-gold-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-gold-700">{summaryQuery.data.enquiryCount}</p>
                <p className="mt-0.5 text-xs font-medium text-gold-600">Enquiries</p>
              </div>
              <div className="rounded-lg bg-ink-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-ink-700">{summaryQuery.data.conversationCount}</p>
                <p className="mt-0.5 text-xs font-medium text-ink-500">Conversations</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Agency</p>
                <p className="mt-1 text-sm text-ink-900">{summaryQuery.data.agency}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Phone</p>
                <p className="mt-1 text-sm text-ink-900">{summaryQuery.data.phone || 'â€”'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">License</p>
                <p className="mt-1 text-sm text-ink-900">{summaryQuery.data.licenseNumber || 'â€”'}</p>
              </div>
            </div>
            {summaryQuery.data.bio && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Bio</p>
                <p className="mt-1 text-sm text-ink-700 leading-relaxed">{summaryQuery.data.bio}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
