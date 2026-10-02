import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Spinner } from '../../ui/Spinner';
import { useToast } from '../../ui/Toast';
import { useAgentReports, useUpdateAgentReportStatus } from '../../../hooks/useAgentReports';
import {
  AGENT_REPORT_REASON_LABELS,
  AGENT_REPORT_STATUS_LABELS,
  type AgentReportReason,
  type AgentReportStatus,
} from '../../../services/agentReportService';
import { extractApiError } from '../../../services/api';
import { CardTable, LoadingRows, thClass, tdClass, SectionFooter } from './shared';
import { EmptyState } from '../../ui/EmptyState';
import type { AgentReport } from '../../../types';

const PAGE_SIZE = 10;

const STATUS_TONE: Record<AgentReportStatus, 'danger' | 'warning' | 'success' | 'neutral'> = {
  Open: 'danger',
  UnderReview: 'warning',
  Resolved: 'success',
  Dismissed: 'neutral',
};

const STATUS_FILTERS: Array<{ value: AgentReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Open', label: 'Open' },
  { value: 'UnderReview', label: 'Under review' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Dismissed', label: 'Dismissed' },
];

/** A resolution note is required by the API for both terminal states. */
const CLOSING_STATUSES: AgentReportStatus[] = ['Resolved', 'Dismissed'];

export function ReportsSection() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AgentReportStatus | 'all'>('all');
  const [triage, setTriage] = useState<AgentReport | null>(null);
  const [nextStatus, setNextStatus] = useState<AgentReportStatus>('UnderReview');
  const [note, setNote] = useState('');
  const { notify } = useToast();
  const updateStatus = useUpdateAgentReportStatus();

  const reportsQuery = useAgentReports({
    pageNumber: page,
    pageSize: PAGE_SIZE,
    status: status === 'all' ? undefined : status,
  });

  const reports = reportsQuery.data?.items ?? [];
  const totalCount = reportsQuery.data?.totalCount ?? 0;

  const openTriage = (report: AgentReport) => {
    setTriage(report);
    // Default the next action from where the report currently sits so the
    // common path is a single click.
    setNextStatus(report.status === 'Open' ? 'UnderReview' : 'Resolved');
    setNote(report.resolutionNote ?? '');
  };

  const closeTriage = () => {
    setTriage(null);
    setNote('');
  };

  const noteRequired = CLOSING_STATUSES.includes(nextStatus);
  const noteMissing = noteRequired && note.trim().length === 0;

  const save = async () => {
    if (!triage) return;
    if (noteMissing) {
      notify({
        type: 'error',
        title: 'Resolution note required',
        description: 'Record what was decided before resolving or dismissing a report.',
      });
      return;
    }
    try {
      await updateStatus.mutateAsync({
        id: triage.id,
        status: nextStatus,
        resolutionNote: note.trim() || null,
      });
      notify({
        type: 'success',
        title: 'Report updated',
        description: `Report #${triage.id} is now ${AGENT_REPORT_STATUS_LABELS[nextStatus].toLowerCase()}.`,
      });
      closeTriage();
    } catch (err) {
      notify({ type: 'error', title: 'Could not update report', description: extractApiError(err) });
    }
  };

  return (
    <>
      <CardTable title="Agent Reports">
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-4 py-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setPage(1); setStatus(f.value); }}
              className={
                status === f.value
                  ? 'rounded-full bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors'
                  : 'rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-200'
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {reportsQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : reports.length === 0 ? (
          // Names the flow that fills this queue, so an empty table reads as
          // "nothing reported yet" rather than a missing feature.
          <EmptyState
            title="No agent reports yet"
            description="When a signed-in client reports an agent from their public profile, it appears here for triage."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Agent</th>
                  <th className={thClass}>Reason</th>
                  <th className={thClass}>Reporter</th>
                  <th className={thClass}>Description</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Filed</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {reports.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-ink-50/60">
                    <td className={tdClass}>
                      <a href={`/agents/${r.agentId}`} className="font-medium text-ink-900 hover:text-forest-600">
                        {r.agentName}
                      </a>
                      <span className="block text-xs text-ink-400">{r.agentAgency}</span>
                    </td>
                    <td className={tdClass}>
                      {AGENT_REPORT_REASON_LABELS[r.reason as AgentReportReason] ?? r.reason}
                    </td>
                    <td className={tdClass}>
                      <span className="text-ink-700">{r.reporterName}</span>
                      <span className="block text-xs text-ink-400">{r.reporterEmail}</span>
                    </td>
                    <td className={`${tdClass} max-w-xs`}>
                      <span className="line-clamp-2 text-ink-600">{r.description}</span>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={STATUS_TONE[r.status as AgentReportStatus] ?? 'neutral'}>
                        {AGENT_REPORT_STATUS_LABELS[r.status as AgentReportStatus] ?? r.status}
                      </Badge>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-xs text-ink-500`}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className={tdClass}>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => openTriage(r)}>
                          Triage
                        </Button>
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

      <Modal open={Boolean(triage)} onClose={closeTriage} title="Triage report" size="md">
        {triage && (
          <div className="space-y-5">
            <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{triage.agentName}</p>
                  <p className="text-xs text-ink-400">{triage.agentAgency}</p>
                </div>
                <Badge tone={STATUS_TONE[triage.status as AgentReportStatus] ?? 'neutral'}>
                  {AGENT_REPORT_STATUS_LABELS[triage.status as AgentReportStatus] ?? triage.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-ink-700">{triage.description}</p>
              <p className="mt-3 text-xs text-ink-400">
                Reported by {triage.reporterName} ({triage.reporterEmail}) on{' '}
                {new Date(triage.createdAt).toLocaleString()}
              </p>
            </div>

            {triage.resolutionNote && (
              <div className="rounded-lg border border-forest-100 bg-forest-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Existing note</p>
                <p className="mt-1.5 text-sm text-ink-700">{triage.resolutionNote}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-ink-700" htmlFor="report-status">
                New status
              </label>
              <select
                id="report-status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as AgentReportStatus)}
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
              >
                <option value="Open">Open</option>
                <option value="UnderReview">Under review</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-ink-700" htmlFor="report-note">
                Resolution note {noteRequired && <span className="text-red-600">*</span>}
              </label>
              <textarea
                id="report-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Record what was decided and any action taken against the agent."
                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
              />
              {noteMissing && (
                <p className="mt-1.5 text-xs text-red-600">
                  A note is required when resolving or dismissing a report.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" size="sm" onClick={closeTriage} disabled={updateStatus.isPending}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={save} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? <Spinner size="sm" /> : <CheckCircle2 className="h-4 w-4" />}
                Save decision
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
