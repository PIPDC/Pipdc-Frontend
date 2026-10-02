import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BadgeCheck, Ban, ChevronRight, XCircle } from 'lucide-react';
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
  useBlockAgentApplication,
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
  { label: 'Revoked', value: 'Revoked' },
];

const statusTone: Record<AgentApplicationStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  Submitted: 'warning',
  UnderReview: 'info',
  Approved: 'success',
  Rejected: 'danger',
  Revoked: 'danger',
};

export function ApplicationsSection() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AgentApplicationStatus | undefined>(undefined);
  const [rejecting, setRejecting] = useState<AgentApplicationReview | null>(null);
  const [reason, setReason] = useState('');
  // A bar is a separate decision from a rejection, so it gets its own dialog
  // rather than a checkbox bolted onto the reject form.
  const [blocking, setBlocking] = useState<AgentApplicationReview | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { notify } = useToast();
  const navigate = useNavigate();
  const listQuery = useAgentApplicationsForReview({ page, pageSize: PAGE_SIZE, status });
  const startReview = useStartReview();
  const approve = useApproveAgentApplication();
  const reject = useRejectAgentApplication();
  const block = useBlockAgentApplication();

  const applications = listQuery.data?.items ?? [];
  const totalCount = listQuery.data?.totalCount ?? 0;

  const isPending = startReview.isPending || approve.isPending || reject.isPending || block.isPending;

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

  const handleBlock = async () => {
    if (!blocking) return;
    if (blockReason.trim().length < 10) {
      notify({ type: 'error', title: 'Reason required', description: 'Give a reason of at least 10 characters.' });
      return;
    }
    try {
      await block.mutateAsync({ id: blocking.id, reason: blockReason.trim() });
      notify({
        type: 'success',
        title: 'Application rejected and account barred',
        description:
          'The application was rejected and the account is permanently barred from applying. Only an admin lifting the bar restores access.',
      });
      setBlocking(null);
      setBlockReason('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not bar the account', description: extractApiError(err) });
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
          <>
            {/*
              Phones get stacked cards rather than a table. A five-column table
              either forces horizontal scrolling or squeezes the columns until the
              status and dates are unreadable, so the same data is laid out as one
              card per application below `md`.
            */}
            <ul className="divide-y divide-ink-100 md:hidden">
              {applications.map((a) => (
                <li key={a.id} className="px-4 py-4">
                  {/*
                    The whole card is one real link, with the decision buttons as
                    siblings below it rather than nested inside. Wrapping buttons
                    in a link would be invalid nesting and would swallow their
                    clicks, and a div with role="link" would not be reachable by
                    keyboard without extra key handling.
                  */}
                  <Link
                    to={`/dashboard/applications/${a.id}`}
                    className="-mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900">{a.fullName}</p>
                        <p className="truncate text-xs text-ink-400">{a.applicantEmail}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                      <span className="text-xs text-ink-500">{a.localGovernmentArea}</span>
                      <span className="text-xs text-ink-400">Submitted {formatDate(a.createdAt)}</span>
                    </div>
                  </Link>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-3">
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
                          <button
                            type="button"
                            title="Reject and permanently bar this account"
                            disabled={isPending}
                            onClick={() => {
                              setBlocking(a);
                              setBlockReason('');
                            }}
                            className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
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
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/dashboard/applications/${a.id}`)}
                      className="cursor-pointer transition-colors hover:bg-ink-50"
                    >
                      <td className={tdClass}>
                        {/*
                          The applicant name is a real link so the row is reachable
                          by keyboard and can be opened in a new tab. The row itself
                          carries the same onClick so clicking anywhere else in the
                          row also opens the page; the action buttons stop
                          propagation so a decision is not turned into a navigation.
                        */}
                        <Link
                          to={`/dashboard/applications/${a.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-ink-900 hover:text-forest-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
                        >
                          {a.fullName}
                        </Link>
                        <p className="text-xs text-ink-400">{a.applicantEmail}</p>
                      </td>
                      <td className={tdClass}>{a.localGovernmentArea}</td>
                      <td className={tdClass}>{formatDate(a.createdAt)}</td>
                      <td className={tdClass}>
                        <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                      </td>
                      <td className={tdClass}>
                        {/*
                          The row is the link to the review page, so the action
                          buttons must stop the click from also navigating.
                        */}
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
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
                              <button
                                type="button"
                                title="Reject and permanently bar this account"
                                disabled={isPending}
                                onClick={() => {
                                  setBlocking(a);
                                  setBlockReason('');
                                }}
                                className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                <Ban className="h-4 w-4" />
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
          </>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

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
          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={reject.isPending} onClick={handleReject}>
              Reject application
            </Button>
          </div>
        </div>
      </Modal>

      {/*
        Rejecting and barring are one action here but two consequences: the
        application is refused, and the account loses the ability to apply at all
        until an admin lifts it. Spelled out because the bar outlives the form
        and the applicant will be told about both.
      */}
      <Modal
        open={Boolean(blocking)}
        onClose={() => setBlocking(null)}
        title="Reject and bar this applicant"
        description="This is permanent. The bar is only lifted by an administrator."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3">
            <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">
              <span className="font-medium">{blocking?.fullName}</span>&apos;s application will be rejected and their
              account permanently barred from applying as an agent. The apply form will be hidden from them, and the bar
              can only be lifted by an administrator lifting it explicitly.
            </p>
          </div>
          <Textarea
            label="Reason for rejection and the bar *"
            rows={4}
            placeholder="e.g. Agency registration could not be verified, and the submitted documents were not genuine."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            hint={`${blockReason.trim().length}/1000 characters. Emailed to the applicant.`}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setBlocking(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={block.isPending}
              onClick={handleBlock}
              disabled={blockReason.trim().length < 10}
            >
              Reject and bar permanently
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
