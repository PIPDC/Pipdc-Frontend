import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { BadgeCheck, Clock, FileCheck2, Send, ShieldAlert, Trash2, UserMinus, XCircle } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { extractApiError } from '../services/api';
import { useLocations } from '../hooks/queries';
import {
  useMyAgentApplicationEligibility,
  useMyCurrentApplication,
  useSubmitAgentApplication,
  useWithdrawAgentApplication,
} from '../hooks/useAgentApplications';
import type { AgentApplication } from '../services/agentApplicationService';

// Mirrors the server-side limits in AgentApplicationService.Validate. The server
// re-validates regardless; this only saves a round trip.
const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name').max(200, 'Your name is too long'),
  phoneNumber: z.string().min(7, 'Enter a phone number we can reach you on').max(20, 'Too long'),
  dateOfBirth: z
    .string()
    .min(1, 'Select your date of birth')
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), 'Select your date of birth')
    .refine((v) => {
      const dob = new Date(`${v}T00:00:00`);
      if (Number.isNaN(dob.getTime())) return false;
      const eighteenth = new Date(dob);
      eighteenth.setFullYear(eighteenth.getFullYear() + 18);
      return eighteenth.getTime() <= Date.now();
    }, 'You must be 18 or older to apply'),
  stateOfOrigin: z.string().min(2, 'Select your state of origin').max(100, 'Too long'),
  localGovernmentArea: z.string().min(2, 'Enter your local government area').max(200, 'Too long'),
  residentialAddress: z.string().min(5, 'Enter your residential address').max(500, 'Too long'),
  nationalIdentityNumber: z
    .string()
    .min(1, 'Enter your government ID number')
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => /^\d+$/.test(v), 'Government ID number must contain digits only')
    .refine((v) => v.length === 11, 'Government ID number must be 11 digits'),
  // Kept as a string so the field can be left genuinely empty, then validated
  // here and converted at submit. A numeric schema would coerce a blank input to
  // 0, which would read as "no experience" instead of "not answered".
  yearsOfExperience: z
    .string()
    .min(1, 'Enter your years of experience')
    .refine((v) => /^\d{1,2}$/.test(v.trim()), 'Enter a whole number of years')
    .refine((v) => Number(v) <= 80, 'Enter 80 or fewer'),
  agencyName: z.string().max(200, 'Too long').optional().or(z.literal('')),
  additionalNotes: z.string().max(2000, 'Too long').optional().or(z.literal('')),
});

type ApplyForm = z.input<typeof schema>;

const today = new Date().toISOString().slice(0, 10);

const steps = [
  {
    icon: FileCheck2,
    title: 'Submit your details',
    body: 'Tell us who you are and where you are based. We review every application by hand.',
  },
  {
    icon: BadgeCheck,
    title: 'Approval and licence',
    body: 'If approved, you receive a unique licence number and can begin listing properties.',
  },
  {
    icon: ShieldAlert,
    title: 'Verification',
    body: 'Licence issuance and public verification are separate steps, so nothing is published until you are ready.',
  },
];

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not provided';
  // Date-only values are parsed as UTC midnight, which can render as the
  // previous day in a negative-offset timezone, so the parts are read directly.
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString();
}

function StatusPanel({
  application,
  onWithdraw,
  withdrawing,
}: {
  application: AgentApplication;
  onWithdraw: () => void;
  withdrawing: boolean;
}) {
  const tone =
    application.status === 'Approved'
      ? 'success'
      : application.status === 'Rejected' || application.status === 'Revoked'
        ? 'danger'
        : application.status === 'UnderReview'
          ? 'info'
          : 'warning';

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink-900">Your application</h2>
        <Badge tone={tone}>{application.status}</Badge>
      </div>

      <dl className="mt-5 divide-y divide-ink-100 text-sm">
        {[
          { label: 'Submitted', value: formatDate(application.createdAt) },
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

      {application.status === 'Approved' && (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            You have been approved as an agent. Your licence number was emailed to you and is also shown in
            your agent dashboard.
          </span>
        </p>
      )}

      {application.status === 'Rejected' && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4" />
            Not approved
          </p>
          {application.rejectionReason && <p className="mt-2 whitespace-pre-wrap">{application.rejectionReason}</p>}
          <p className="mt-2 text-red-700">
            You can withdraw this application and submit a fresh one once the reason above has been addressed.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="primary"
              loading={withdrawing}
              onClick={onWithdraw}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Withdraw and apply again
            </Button>
          </div>
        </div>
      )}

      {(application.status === 'Submitted' || application.status === 'UnderReview') && (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your application is with our team. We will email you once it has been reviewed.</span>
        </p>
      )}

      {application.status === 'Revoked' && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="flex items-center gap-2 font-semibold">
            <UserMinus className="h-4 w-4" />
            Your agent registration has been revoked
          </p>
          {application.revocationReason && (
            <p className="mt-2 whitespace-pre-wrap">{application.revocationReason}</p>
          )}
          <p className="mt-2 text-red-700">
            You no longer have access to the agent dashboard. You can appeal the decision from your dashboard, and
            you may apply again here unless your account is barred.
          </p>
        </div>
      )}
    </div>
  );
}

export function ApplyAgentPage() {
  const { notify } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const currentQuery = useMyCurrentApplication();
  const eligibilityQuery = useMyAgentApplicationEligibility();
  const statesQuery = useLocations({ type: 'State' });
  const submit = useSubmitAgentApplication();
  const withdraw = useWithdrawAgentApplication();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ApplyForm) => {
    setServerError(null);
    try {
      await submit.mutateAsync({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        stateOfOrigin: data.stateOfOrigin,
        localGovernmentArea: data.localGovernmentArea,
        residentialAddress: data.residentialAddress,
        nationalIdentityNumber: data.nationalIdentityNumber,
        yearsOfExperience: Number(data.yearsOfExperience),
        agencyName: data.agencyName || undefined,
        additionalNotes: data.additionalNotes || undefined,
      });
      notify({
        type: 'success',
        title: 'Application received',
        description: 'We have emailed you a confirmation. Our team will review it and be in touch.',
      });
    } catch (err) {
      const detail = extractApiError(err);
      setServerError(detail);
      notify({ type: 'error', title: 'Could not submit application', description: detail });
    }
  };

  const existing = currentQuery.data ?? null;
  const states = (statesQuery.data ?? []).filter((s) => s.type === 'State');
  const eligibility = eligibilityQuery.data ?? null;
  // A revoked registration is not an open application, so it does not block a
  // fresh one. A bar, however, hides the form outright.
  const blocked = eligibility?.isBlocked === true;

  const onWithdraw = async () => {
    setServerError(null);
    try {
      await withdraw.mutateAsync();
      notify({
        type: 'success',
        title: 'Application withdrawn',
        description: 'You can now submit a fresh application.',
      });
    } catch (err) {
      const detail = extractApiError(err);
      setServerError(detail);
      notify({ type: 'error', title: 'Could not withdraw application', description: detail });
    }
  };

  return (
    <div className="py-12">
      <div className="container-x">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Apply as an agent' }]} />
        <SectionHeading
          title="Apply to become a PIPDC agent"
          description="List your properties on the Plateau Internal Development Commission portal and reach verified clients."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-ink-900">
                {i + 1}. {step.title}
              </h3>
              <p className="mt-1 text-sm text-ink-500">{step.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {currentQuery.isLoading ? (
              <div className="h-72 animate-pulse rounded-2xl bg-ink-100" />
            ) : blocked ? (
              /*
                A bar outranks everything else on this page. The form is not
                rendered at all rather than rendered and refused on submit, so a
                barred applicant is never asked for personal details that will
                simply be rejected.
              */
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <UserMinus className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-900">
                      You cannot apply as an agent
                    </h2>
                    <p className="mt-2 text-sm text-ink-700">
                      {eligibility?.blockedReason
                        ? eligibility.blockedReason
                        : 'An administrator has barred your account from applying as an agent.'}
                    </p>
                    <p className="mt-3 text-sm text-ink-500">
                      This bar is permanent and can only be lifted by an administrator. If you believe it was a
                      mistake, appeal the decision from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            ) : existing && existing.status !== 'Revoked' ? (
              <StatusPanel
                application={existing}
                onWithdraw={() => void onWithdraw()}
                withdrawing={withdraw.isPending}
              />
            ) : (
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
                <h2 className="font-display text-xl font-semibold text-ink-900">Your details</h2>
                <p className="mt-1 text-sm text-ink-500">Fields marked with * are required.</p>

                <p className="mt-3 rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 text-xs text-ink-600">
                  Your government ID number is collected so we can verify your identity during review. It is
                  reviewed by our team only.
                </p>

                {serverError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {serverError}
                  </p>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name *"
                    placeholder="Your name"
                    autoComplete="name"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label="Phone number *"
                    type="tel"
                    placeholder="+234 ..."
                    autoComplete="tel"
                    error={errors.phoneNumber?.message}
                    {...register('phoneNumber')}
                  />
                  <Input
                    label="Date of birth *"
                    type="date"
                    max={today}
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth')}
                  />
                  {statesQuery.isLoading ? (
                    <div className="sm:col-span-1">
                      <Select label="State of origin *" disabled error={errors.stateOfOrigin?.message}>
                        <option value="">Loading states...</option>
                      </Select>
                    </div>
                  ) : states.length === 0 ? (
                    <div className="sm:col-span-1">
                      <Input
                        label="State of origin *"
                        placeholder="e.g. Plateau"
                        error={errors.stateOfOrigin?.message}
                        {...register('stateOfOrigin')}
                      />
                    </div>
                  ) : (
                    <div className="sm:col-span-1">
                      <Select
                        label="State of origin *"
                        error={errors.stateOfOrigin?.message}
                        {...register('stateOfOrigin')}
                      >
                        <option value="">Select a state</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <Input
                    label="Local government area *"
                    placeholder="Jos North"
                    error={errors.localGovernmentArea?.message}
                    {...register('localGovernmentArea')}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Residential address *"
                      placeholder="Street, city"
                      autoComplete="street-address"
                      error={errors.residentialAddress?.message}
                      {...register('residentialAddress')}
                    />
                  </div>
                  <Input
                    label="Government ID number (NIN) *"
                    placeholder="11 digits"
                    inputMode="numeric"
                    autoComplete="off"
                    hint="Your National Identification Number. Spaces are ignored."
                    error={errors.nationalIdentityNumber?.message}
                    {...register('nationalIdentityNumber')}
                  />
                  <Input
                    label="Years of real-estate experience *"
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    placeholder="0"
                    error={errors.yearsOfExperience?.message}
                    {...register('yearsOfExperience')}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Agency name (optional)"
                      placeholder="If you are already operating an agency"
                      error={errors.agencyName?.message}
                      {...register('agencyName')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Additional notes (optional)"
                      rows={4}
                      placeholder="Anything else we should know"
                      error={errors.additionalNotes?.message}
                      {...register('additionalNotes')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={isSubmitting}
                      leftIcon={<Send className="h-4 w-4" />}
                    >
                      Submit application
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="lg:col-span-4"
          >
            <div className="rounded-2xl bg-forest-gradient p-6 text-white shadow-lift">
              <h3 className="font-display text-base font-semibold">Why apply through PIPDC?</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/90">
                <li>Reach clients searching the official Plateau property register.</li>
                <li>A unique licence number that identifies your agency on every listing.</li>
                <li>Enquiries and client messages delivered to your dashboard.</li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
