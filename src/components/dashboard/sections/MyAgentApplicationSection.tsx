import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BadgeCheck, Clock, FileCheck2, Trash2, XCircle, UserMinus, Scale } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import { Spinner } from '../../ui/Spinner';
import { useToast } from '../../ui/Toast';
import { extractApiError } from '../../../services/api';
import {
  useMyAgentAppeals,
  useMyAgentApplicationEligibility,
  useMyCurrentApplication,
  useSubmitAgentAppeal,
  useWithdrawAgentApplication,
} from '../../../hooks/useAgentApplications';
import type { AgentApplication } from '../../../services/agentApplicationService';

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not provided';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString();
}

const toneFor = (status: AgentApplication['status']) =>
  status === 'Approved'
    ? 'success'
    : status === 'Rejected' || status === 'Revoked'
      ? 'danger'
      : status === 'UnderReview'
        ? 'info'
        : 'warning';

const appealTone = (status: string) =>
  status === 'Upheld' ? 'success' : status === 'Refused' ? 'danger' : 'info';

const MIN_APPEAL_LENGTH = 20;

/**
 * The applicant's own view of their application.
 *
 * Reachable at /dashboard/agent-application, but only linked from the sidebar
 * once an application actually exists. Before that there is nothing to show, so
 * the sidebar points at the public apply page instead.
 */
export function MyAgentApplicationSection() {
  const { notify } = useToast();
  const currentQuery = useMyCurrentApplication();
  const eligibilityQuery = useMyAgentApplicationEligibility();
  const appealsQuery = useMyAgentAppeals();
  const withdraw = useWithdrawAgentApplication();
  const submitAppeal = useSubmitAgentAppeal();

  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  const onWithdraw = async () => {
    try {
      await withdraw.mutateAsync();
      notify({
        type: 'success',
        title: 'Application withdrawn',
        description: 'You can now submit a fresh application.',
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Could not withdraw application',
        description: extractApiError(err),
      });
    }
  };

  const onSubmitAppeal = async () => {
    try {
      await submitAppeal.mutateAsync(appealReason.trim());
      notify({
        type: 'success',
        title: 'Appeal submitted',
        description: 'An administrator will review it and email you the outcome.',
      });
      setAppealOpen(false);
      setAppealReason('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not submit appeal', description: extractApiError(err) });
    }
  };

  if (currentQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-ink-100" />;
  }

  if (currentQuery.isError) {
    return (
      <EmptyState
        icon={<FileCheck2 className="h-6 w-6" />}
        title="Could not load your application"
        description="We could not reach the server. Please try again in a moment."
        action={
          <Button variant="outline" onClick={() => void currentQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const application = currentQuery.data ?? null;
  const eligibility = eligibilityQuery.data ?? null;
  const appeals = appealsQuery.data ?? [];
  const openAppeal = appeals.find((a) => a.status === 'Submitted' || a.status === 'UnderReview') ?? null;
  const decidedAppeals = appeals.filter((a) => a.status === 'Upheld' || a.status === 'Refused');

  if (!application) {
    // A bar outranks the invitation to apply. Offering the form here would only
    // produce a rejection at submit time with no explanation.
    if (eligibility?.isBlocked) {
      return (
        <EmptyState
          icon={<UserMinus className="h-6 w-6" />}
          title="You cannot apply as an agent"
          description={
            eligibility.blockedReason
              ? `An administrator has barred your account from applying: ${eligibility.blockedReason}`
              : 'An administrator has barred your account from applying as an agent.'
          }
        />
      );
    }

    return (
      <EmptyState
        icon={<FileCheck2 className="h-6 w-6" />}
        title="You have not applied yet"
        description="Fill in the agent application form and our team will review it."
        action={
          <Link to="/apply-agent">
            <Button variant="primary">Apply to become an agent</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">Your application</h2>
            <p className="mt-1 text-sm text-ink-500">
              Submitted {formatDate(application.createdAt)}
            </p>
          </div>
          <Badge tone={toneFor(application.status)}>{application.status}</Badge>
        </div>

        {application.status === 'Approved' && (
          <p className="mt-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              You have been approved as an agent. Your licence number was emailed to you and is also shown in
              your agent dashboard.
            </span>
          </p>
        )}

        {application.status === 'Rejected' && application.rejectionReason && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="flex items-center gap-2 font-semibold">
              <XCircle className="h-4 w-4" />
              Not approved
            </p>
            <p className="mt-2 whitespace-pre-wrap">{application.rejectionReason}</p>
          </div>
        )}

        {(application.status === 'Submitted' || application.status === 'UnderReview') && (
          <p className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Your application is with our team. We will email you once it has been reviewed.</span>
          </p>
        )}

        {/*
          Revoked is not Rejected. The application was approved and the
          registration it granted has since been withdrawn, so the honest message
          is the stated reason plus a route back through an appeal, not a form.
        */}
        {application.status === 'Revoked' && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="flex items-center gap-2 font-semibold">
              <UserMinus className="h-4 w-4" />
              Your agent registration has been revoked
            </p>
            {application.revocationReason && (
              <p className="mt-2 whitespace-pre-wrap">{application.revocationReason}</p>
            )}
            <p className="mt-2">
              {application.revokedAt && <>Revoked on {formatDate(application.revokedAt)}. </>}
              You no longer have access to the agent dashboard. You can appeal this decision, and you may also submit
              a fresh application unless your account is barred.
            </p>
          </div>
        )}

        {application.status === 'Revoked' && eligibility?.isBlocked && (
          <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-700">
            <p className="font-semibold">Your account is barred from applying</p>
            <p className="mt-1">
              {eligibility.blockedReason ?? 'An administrator has barred your account from applying.'} A bar has to be
              lifted by an administrator before you can apply again, but you can still appeal the revocation above.
            </p>
          </div>
        )}

        {/* Appeals: the live one, then any that have been decided. */}
        {openAppeal && (
          <div className="mt-4 rounded-lg border border-info-200 bg-info-50 px-4 py-3 text-sm text-info-800">
            <p className="flex items-center gap-2 font-semibold">
              <Scale className="h-4 w-4" />
              Your appeal is with our team
            </p>
            <p className="mt-1">Submitted {formatDate(openAppeal.createdAt)}. We will email you the outcome.</p>
          </div>
        )}

        {decidedAppeals.map((appeal) => (
          <div
            key={appeal.id}
            className="mt-4 rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700"
          >
            <p className="flex flex-wrap items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="font-semibold">Appeal {appeal.status.toLowerCase()}</span>
              <Badge tone={appealTone(appeal.status)}>{appeal.status}</Badge>
            </p>
            {appeal.decisionNote && (
              <p className="mt-2 whitespace-pre-wrap text-ink-600">{appeal.decisionNote}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
        <h3 className="font-display text-base font-semibold text-ink-900">Details you submitted</h3>
        <dl className="mt-4 divide-y divide-ink-100 text-sm">
          {[
            { label: 'Full name', value: application.fullName },
            { label: 'Date of birth', value: formatDate(application.dateOfBirth) },
            { label: 'Phone number', value: application.phoneNumber },
            { label: 'State of origin', value: application.stateOfOrigin },
            { label: 'Local government area', value: application.localGovernmentArea },
            { label: 'Residential address', value: application.residentialAddress },
            {
              label: 'Government ID number',
              value: application.nationalIdentityNumber || 'Not provided',
            },
            {
              label: 'Years of experience',
              value:
                application.yearsOfExperience != null
                  ? `${application.yearsOfExperience} year${application.yearsOfExperience === 1 ? '' : 's'}`
                  : 'Not provided',
            },
            { label: 'Agency name', value: application.agencyName || 'Not provided' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-ink-500">{row.label}</dt>
              <dd className="text-right font-medium text-ink-900">{row.value}</dd>
            </div>
          ))}
          {application.additionalNotes && (
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-ink-500">Notes</dt>
              <dd className="whitespace-pre-wrap text-right font-medium text-ink-900">
                {application.additionalNotes}
              </dd>
            </div>
          )}
          {application.reviewedAt && (
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-ink-500">Reviewed</dt>
              <dd className="text-right font-medium text-ink-900">
                {formatDate(application.reviewedAt)}
              </dd>
            </div>
          )}
        </dl>

        {application.status === 'Rejected' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/apply-agent">
              <Button variant="primary">Apply again</Button>
            </Link>
            <Button
              variant="outline"
              loading={withdraw.isPending}
              onClick={onWithdraw}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Withdraw application
            </Button>
          </div>
        )}

        {/*
          A revoked registration gets an appeal and a fresh application, never a
          withdrawal: there is nothing to withdraw, the decision was not a refusal
          of the application, and a bar can still be in force.
        */}
        {application.status === 'Revoked' && (
          <div className="mt-6 flex flex-wrap gap-3">
            {(eligibility?.canAppeal ?? false) && !openAppeal && (
              <Button
                variant="primary"
                onClick={() => { setAppealOpen(true); setAppealReason(''); }}
                leftIcon={<Scale className="h-4 w-4" />}
              >
                Appeal this decision
              </Button>
            )}
            {openAppeal && <p className="self-center text-sm text-ink-500">You can only have one appeal open at a time.</p>}
            {!eligibility?.isBlocked && (
              <Link to="/apply-agent">
                <Button variant="outline">Submit a fresh application</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Appeal form: needs a written reason, so a dialog rather than a confirm */}
      <Modal open={appealOpen} onClose={() => setAppealOpen(false)} title="Appeal the decision" size="md">
        <div className="space-y-5">
          <p className="text-sm text-ink-700">
            Tell us why the decision to revoke your registration was wrong. An administrator will read it and email
            you the outcome. If your appeal is upheld, your registration and agent access are restored.
          </p>
          <div>
            <label className="text-sm font-medium text-ink-700" htmlFor="appeal-reason">
              Your appeal <span className="text-red-600">*</span>
            </label>
            <textarea
              id="appeal-reason"
              rows={6}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain what you believe was missed or wrong, between 20 and 4000 characters."
              className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
            <p className="mt-1.5 text-xs text-ink-400">{appealReason.trim().length}/4000 characters.</p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setAppealOpen(false)} disabled={submitAppeal.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSubmitAppeal}
              disabled={submitAppeal.isPending || appealReason.trim().length < MIN_APPEAL_LENGTH}
            >
              {submitAppeal.isPending ? <Spinner size="sm" /> : <Scale className="h-4 w-4" />}
              Submit appeal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
