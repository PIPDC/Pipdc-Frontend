import { useState } from 'react';
import { Plus, ShieldCheck, ShieldOff, BarChart3, Search } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AgentForm } from '../../forms/AgentForm';
import { useDeleteAgent, useToggleAgentVerification } from '../../../hooks/mutations';
import { useAgents, useAgentSummary } from '../../../hooks/queries';
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
  const [verifying, setVerifying] = useState<Agent | null>(null);
  const [summarizing, setSummarizing] = useState<Agent | null>(null);

  const summaryQuery = useAgentSummary(summarizing?.id);

  const agents = agentsQuery.data?.items ?? [];
  const totalCount = agentsQuery.data?.totalCount ?? 0;

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAgent.mutateAsync(deleting.id);
      notify({ type: 'success', title: 'Agent removed', description: `${deleting.fullName} was deleted.` });
      setDeleting(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete agent', description: extractApiError(err) });
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
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className={thClass}>Agent</th>
                <th className={thClass}>Agency</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>License</th>
                <th className={thClass}>Properties</th>
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
                  <td className={tdClass}>{a.phone || '—'}</td>
                  <td className={tdClass}>{a.licenseNumber || '—'}</td>
                  <td className={tdClass}>
                    <Badge tone={a.propertyCount > 0 ? 'forest' : 'neutral'}>
                      {a.propertyCount} {a.propertyCount === 1 ? 'property' : 'properties'}
                    </Badge>
                  </td>
                  <td className={tdClass}><Badge tone={a.verified ? 'forest' : 'neutral'}>{a.verified ? 'Verified' : 'Unverified'}</Badge></td>
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
                      <RowActions
                        viewUrl={`/agents/${a.id}`}
                        onEdit={() => { setEditing(a); setFormOpen(true); }}
                        onDelete={() => setDeleting(a)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete agent"
        description={`Are you sure you want to delete ${deleting?.fullName}? Agents with active listings cannot be deleted.`}
        confirmLabel="Delete agent"
        loading={deleteAgent.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Agency</p>
                <p className="mt-1 text-sm text-ink-900">{summaryQuery.data.agency}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Phone</p>
                <p className="mt-1 text-sm text-ink-900">{summaryQuery.data.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">License</p>
                <p className="mt-1 text-sm text-ink-900">{summaryQuery.data.licenseNumber || '—'}</p>
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
