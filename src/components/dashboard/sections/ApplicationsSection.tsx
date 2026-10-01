import { useState } from 'react';
import { BadgeCheck, Eye, XCircle } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Textarea } from '../../ui/Input';
import { useToast } from '../../ui/Toast';
import { extractApiError } from '../../../services/api';
import { formatDate } from '../../../utils/format';
import {
  useAgentApplicationsForReview,
  useApproveAgentApplication,
  useRejectAgentApplication,
  useStartReview,
} from '../../../hooks/useAgentApplications';
import type {
  AgentApplicationReview,
  AgentApplicationStatus,
} from '../../../services/agentApplicationService';
import { CardTable, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';

const PAGE_SIZE = 10;

const FILTERS: { label: string; value: AgentApplicationStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Under review', value: 'UnderReview' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

const statusTone: Record<AgentApplicationStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  Submitted: 'warning',
  UnderReview: 'info',
  Approved: 'success',
  Rejected: 'danger',
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

export function ApplicationsSection() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AgentApplicationStatus | undefined>(undefined);
  const [viewing, setViewing] = useState<AgentApplicationReview | null>(null);
  const [rejecting, setRejecting] = useState<AgentApplicationReview | null>(null);
  const [reason, setReason] = useState('');

  const { notify } = useToast();
  const listQuery = useAgentApplicationsForReview({ page, pageSize: PAGE_SIZE, status });
  const startReview = useStartReview();
  const approve = useApproveAgentApplication();
  const reject = useRejectAgentApplication();

  const applications = listQuery.data?.items ?? [];
  const totalCount = listQuery.data?.totalCount ?? 0;

  const isPending = startReview.isPending || approve.isPending || reject.isPending;

  const handleStartReview = async (application: AgentApplicationReview) => {
    try {
      await startReview.mutateAsync(application.id);
      notify({ type: 'success', title: 'Application claimed', description: 'It is now marked as under review.' });
    } catch (err) {
      notify({ type: 'error', title: 'Could not claim application', description: extractApiError(err) });
    }
  };

  const handleApprove = async (application: AgentApplicationReview) => {
    try {
      await approve.mutateAsync(application.id);
      notify({
        type: 'success',
        title: 'Application approved',
        description:
          'The applicant now has the Agent role and a unique licence number. Verification is a separate step in the Agents section.',
      });
    } catch (err) {
      notify({ type: 'error', title: 'Could not approve application', description: extractApiError(err) });
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      notify({ type: 'error', title: 'Reason required', description: 'Tell the applicant why, in a few words.' });
      return;
    }
    try {
      await reject.mutateAsync({ id: rejecting.id, reason: reason.trim() });
      notify({ type: 'success', title: 'Application rejected', description: 'The applicant has been notified by email.' });
      setRejecting(null);
      setReason('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not reject application', description: extractApiError(err) });
    }
  };

  return (
    <>
      <CardTable
        title="Agent applications"
        actions={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
                className={
                  status === f.value
                    ? 'rounded-lg bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-forest-300 hover:text-forest-700'
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {listQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : applications.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink-100">
                <tr>
                  <th className={thClass}>Applicant</th>
                  <th className={thClass}>LGA</th>
                  <th className={thClass}>Submitted</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {applications.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-ink-50">
                    <td className={tdClass}>
                      <p className="font-medium text-ink-900">{a.fullName}</p>
                      <p className="text-xs text-ink-400">{a.applicantEmail}</p>
                    </td>
                    <td className={tdClass}>{a.localGovernmentArea}</td>
                    <td className={tdClass}>{formatDate(a.createdAt)}</td>
                    <td className={tdClass}>
                      <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => setViewing(a)}
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-forest-50 hover:text-forest-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {a.status === 'Submitted' && (
                          <button
                            type="button"
                            title="Claim for review"
                            disabled={isPending}
                            onClick={() => handleStartReview(a)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                          >
                            Start review
                          </button>
                        )}
                        {(a.status === 'Submitted' || a.status === 'UnderReview') && (
                          <>
                            <button
                              type="button"
                              title="Approve and issue a licence"
                              disabled={isPending}
                              onClick={() => handleApprove(a)}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                            >
                              <BadgeCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Reject application"
                              disabled={isPending}
                              onClick={() => {
                                setRejecting(a);
                                setReason('');
                              }}
                              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
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

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Application details" size="md">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold text-ink-900">{viewing.fullName}</span>
              <Badge tone={statusTone[viewing.status]}>{viewing.status}</Badge>
            </div>

            <dl className="divide-y divide-ink-100 rounded-lg border border-ink-100 px-4 py-2">
              <DetailRow label="Email" value={viewing.applicantEmail} />
              {!viewing.applicantEmailConfirmed && (
                <p className="py-2 text-xs text-amber-700">
                  This address is not confirmed, so the notification email will not be delivered.
                </p>
              )}
              <DetailRow label="Phone" value={viewing.phoneNumber} />
              <DetailRow label="State of origin" value={viewing.stateOfOrigin} />
              <DetailRow label="Local government area" value={viewing.localGovernmentArea} />
              <DetailRow label="Residential address" value={viewing.residentialAddress} />
              <DetailRow label="Agency" value={viewing.agencyName} />
              <DetailRow label="Submitted" value={formatDate(viewing.createdAt)} />
              <DetailRow label="Reviewed" value={viewing.reviewedAt ? formatDate(viewing.reviewedAt) : null} />
            </dl>

            {viewing.additionalNotes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Additional notes</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                  {viewing.additionalNotes}
                </p>
              </div>
            )}

            {viewing.rejectionReason && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Rejection reason</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {viewing.rejectionReason}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" onClick={() => setViewing(null)}>
                Close
              </Button>
              {(viewing.status === 'Submitted' || viewing.status === 'UnderReview') && (
                <>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      setRejecting(viewing);
                      setViewing(null);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isPending}
                    onClick={() => {
                      handleApprove(viewing);
                      setViewing(null);
                    }}
                  >
                    Approve and issue licence
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject application"
        description="The reason is emailed to the applicant, so be specific."
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for rejection *"
            rows={4}
            placeholder="e.g. We could not verify your agency registration with the relevant body."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={reject.isPending} onClick={handleReject}>
              Reject application
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
