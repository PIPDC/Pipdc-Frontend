import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Ban, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { useAgentApplicationForReview } from '../../hooks/useAgentApplications';
import {
  useApproveAgentApplication,
  useBlockAgentApplication,
  useRejectAgentApplication,
  useStartReview,
} from '../../hooks/useAgentApplications';
import { extractApiError } from '../../services/api';
import { formatDate } from '../../utils/format';
import type {
  AgentApplicationReview,
  AgentApplicationStatus,
} from '../../services/agentApplicationService';

const statusTone: Record<AgentApplicationStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  Submitted: 'warning',
  UnderReview: 'info',
  Approved: 'success',
  Rejected: 'danger',
  Revoked: 'danger',
};

/**
 * A definition row that stacks its label above the value on small screens. The
 * previous side-by-side layout forced the page to scroll horizontally on a phone,
 * which is why the review form moved off a modal and onto its own page.
 */
function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-ink-100 py-3 last:border-b-0 sm:grid-cols-3 sm:gap-4 sm:py-2.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400 sm:text-sm sm:font-normal sm:tracking-normal sm:text-ink-500">
        {label}
      </dt>
      <dd className="text-sm font-medium text-ink-900 break-words sm:col-span-2 sm:text-right">{value}</dd>
    </div>
  );
}

export function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const applicationId = id ? Number(id) : undefined;
  const query = useAgentApplicationForReview(applicationId);
  const application = query.data;

  const startReview = useStartReview();
  const approve = useApproveAgentApplication();
  const reject = useRejectAgentApplication();
  const block = useBlockAgentApplication();

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const isPending = startReview.isPending || approve.isPending || reject.isPending || block.isPending;
  const actionable = application?.status === 'Submitted' || application?.status === 'UnderReview';

  const goBack = () => navigate('/dashboard/applications');

  const handleStartReview = async (target: AgentApplicationReview) => {
    try {
      await startReview.mutateAsync(target.id);
      notify({ type: 'success', title: 'Application claimed', description: 'It is now marked as under review.' });
    } catch (err) {
      notify({ type: 'error', title: 'Could not claim application', description: extractApiError(err) });
    }
  };

  const handleApprove = async (target: AgentApplicationReview) => {
    try {
      await approve.mutateAsync(target.id);
      notify({
        type: 'success',
        title: 'Application approved',
        description:
          'The applicant now has the Agent role and a unique licence number. Verification is a separate step in the Agents section.',
      });
      goBack();
    } catch (err) {
      notify({ type: 'error', title: 'Could not approve application', description: extractApiError(err) });
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (reason.trim().length < 5) {
      notify({ type: 'error', title: 'Reason required', description: 'Tell the applicant why, in a few words.' });
      return;
    }
    try {
      await reject.mutateAsync({ id: application.id, reason: reason.trim() });
      notify({ type: 'success', title: 'Application rejected', description: 'The applicant has been notified by email.' });
      goBack();
    } catch (err) {
      notify({ type: 'error', title: 'Could not reject application', description: extractApiError(err) });
    }
  };

  const handleBlock = async () => {
    if (!application) return;
    if (blockReason.trim().length < 10) {
      notify({ type: 'error', title: 'Reason required', description: 'Give a reason of at least 10 characters.' });
      return;
    }
    try {
      await block.mutateAsync({ id: application.id, reason: blockReason.trim() });
      notify({
        type: 'success',
        title: 'Application rejected and account barred',
        description:
          'The application was rejected and the account is permanently barred from applying. Only an admin lifting the bar restores access.',
      });
      goBack();
    } catch (err) {
      notify({ type: 'error', title: 'Could not bar the account', description: extractApiError(err) });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Agent Applications', to: '/dashboard/applications' },
            { label: application?.fullName ?? 'Review' },
          ]}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Button type="button" variant="ghost" onClick={goBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to applications
            </Button>
            <h1 className="heading-3 mt-2 break-words">{application?.fullName ?? 'Application review'}</h1>
            {application && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[application.status]}>{application.status}</Badge>
                <span className="break-all text-sm text-ink-500">{application.applicantEmail}</span>
              </div>
            )}
          </div>

          {/*
            Actions sit in the page flow rather than in a modal footer, so they are
            always visible and always reachable without scrolling a dialog. They
            wrap instead of overflowing on narrow screens.
          */}
          {application && actionable && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {application.status === 'Submitted' && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  loading={startReview.isPending}
                  onClick={() => handleStartReview(application)}
                >
                  Start review
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setRejecting(true);
                  setReason('');
                }}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setBlocking(true);
                  setBlockReason('');
                }}
                leftIcon={<Ban className="h-4 w-4" />}
              >
                Reject and bar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isPending}
                loading={approve.isPending}
                onClick={() => handleApprove(application)}
                leftIcon={<BadgeCheck className="h-4 w-4" />}
              >
                Approve and issue licence
              </Button>
            </div>
          )}
        </div>

        {query.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : query.isError ? (
          <Card>
            <div className="p-6 text-sm text-ink-600">
              Could not load this application. It may have been withdrawn or you may not have access.
            </div>
          </Card>
        ) : !application ? (
          <Card>
            <div className="p-6 text-sm text-ink-600">This application could not be found.</div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Applicant details</CardTitle>
                </CardHeader>
                <dl className="px-4 py-2 sm:px-6 sm:py-3">
                  <DetailRow label="Email" value={application.applicantEmail} />
                  {!application.applicantEmailConfirmed && (
                    <p className="py-3 text-xs text-amber-700">
                      This address is not confirmed, so the notification email will not be delivered.
                    </p>
                  )}
                  <DetailRow label="Phone" value={application.phoneNumber} />
                  <DetailRow
                    label="Date of birth"
                    value={application.dateOfBirth ? formatDate(application.dateOfBirth) : null}
                  />
                  <DetailRow label="State of origin" value={application.stateOfOrigin} />
                  <DetailRow label="Local government area" value={application.localGovernmentArea} />
                  <DetailRow label="Residential address" value={application.residentialAddress} />
                  {/* Unmasked deliberately: the reviewer cannot vet identity without it. */}
                  <DetailRow label="Government ID number" value={application.nationalIdentityNumber} />
                  <DetailRow
                    label="Years of experience"
                    value={
                      application.yearsOfExperience != null
                        ? `${application.yearsOfExperience} year${application.yearsOfExperience === 1 ? '' : 's'}`
                        : null
                    }
                  />
                  <DetailRow label="Agency" value={application.agencyName} />
                </dl>
              </Card>

              {application.additionalNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional notes</CardTitle>
                  </CardHeader>
                  <p className="whitespace-pre-wrap px-4 pb-4 text-sm text-ink-700 sm:px-6 sm:pb-6">
                    {application.additionalNotes}
                  </p>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <dl className="px-4 py-2 sm:px-6 sm:py-3">
                  <DetailRow label="Submitted" value={formatDate(application.createdAt)} />
                  <DetailRow label="Reviewed" value={application.reviewedAt ? formatDate(application.reviewedAt) : null} />
                  {application.revokedAt && <DetailRow label="Revoked" value={formatDate(application.revokedAt)} />}
                </dl>
              </Card>

              {application.rejectionReason && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rejection reason</CardTitle>
                  </CardHeader>
                  <p className="whitespace-pre-wrap px-4 pb-4 text-sm text-red-800 sm:px-6 sm:pb-6">
                    {application.rejectionReason}
                  </p>
                </Card>
              )}

              {application.revocationReason && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revocation reason</CardTitle>
                  </CardHeader>
                  <p className="whitespace-pre-wrap px-4 pb-4 text-sm text-red-800 sm:px-6 sm:pb-6">
                    {application.revocationReason}
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
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
            <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={reject.isPending} onClick={handleReject}>
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
        open={blocking}
        onClose={() => setBlocking(false)}
        title="Reject and permanently bar this account"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            This rejects the application <em>and</em> bars the account from ever applying again. Only
            another admin can lift the bar from the Appeals &amp; Bars page.
          </div>
          <Textarea
            label="Reason for the permanent bar *"
            rows={4}
            placeholder="Explain, in a few words, why this account should be permanently barred."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setBlocking(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={block.isPending} onClick={handleBlock}>
              Reject and bar account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
