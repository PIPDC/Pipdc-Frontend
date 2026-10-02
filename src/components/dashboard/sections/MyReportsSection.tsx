import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { CardTable, LoadingRows, thClass, tdClass } from './shared';
import { EmptyState } from '../../ui/EmptyState';
import { useMyReports } from '../../../hooks/useAgentReports';
import {
  AGENT_REPORT_REASON_LABELS,
  AGENT_REPORT_STATUS_LABELS,
  type AgentReportReason,
  type AgentReportStatus,
} from '../../../services/agentReportService';

const STATUS_TONE: Record<AgentReportStatus, 'danger' | 'warning' | 'success' | 'neutral'> = {
  Open: 'danger',
  UnderReview: 'warning',
  Resolved: 'success',
  Dismissed: 'neutral',
};

/**
 * The reports the signed-in client has filed, with the moderation outcome.
 *
 * The reporter identity is fixed server-side from the JWT subject claim, so this
 * view can only ever return the caller's own reports.
 */
export function MyReportsSection() {
  const reportsQuery = useMyReports();
  const reports = reportsQuery.data?.items ?? [];

  return (
    <CardTable title="My Reports">
      {reportsQuery.isLoading ? (
        <LoadingRows rows={3} />
      ) : reports.length === 0 ? (
        // Tells the user how to file one, since the entry point is the agent
        // profile rather than this page.
        <EmptyState
          title="You havenâ€™t reported an agent"
          description="Open an agentâ€™s public profile and choose â€œReport this agentâ€. You can follow the outcome here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className={thClass}>Agent</th>
                <th className={thClass}>Reason</th>
                <th className={thClass}>What you told us</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Outcome</th>
                <th className={thClass}>Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {reports.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-ink-50/60">
                  <td className={tdClass}>
                    <Link to={`/agents/${r.agentId}`} className="font-medium text-ink-900 hover:text-forest-600">
                      {r.agentName}
                    </Link>
                    <span className="block text-xs text-ink-400">{r.agentAgency}</span>
                  </td>
                  <td className={tdClass}>
                    {AGENT_REPORT_REASON_LABELS[r.reason as AgentReportReason] ?? r.reason}
                  </td>
                  <td className={`${tdClass} max-w-xs`}>
                    <span className="line-clamp-2 text-ink-600">{r.description}</span>
                  </td>
                  <td className={tdClass}>
                    <Badge tone={STATUS_TONE[r.status as AgentReportStatus] ?? 'neutral'}>
                      {AGENT_REPORT_STATUS_LABELS[r.status as AgentReportStatus] ?? r.status}
                    </Badge>
                  </td>
                  <td className={`${tdClass} max-w-xs`}>
                    {r.resolutionNote ? (
                      <span className="text-ink-600">{r.resolutionNote}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                        <Flag className="h-3.5 w-3.5" /> Awaiting review
                      </span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-xs text-ink-500`}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardTable>
  );
}
