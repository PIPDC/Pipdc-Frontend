import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { BadgeCheck, Clock, FileCheck2, Send, ShieldAlert, XCircle } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { extractApiError } from '../services/api';
import {
  useMyCurrentApplication,
  useSubmitAgentApplication,
} from '../hooks/useAgentApplications';
import type { AgentApplication } from '../services/agentApplicationService';

// Mirrors the server-side limits in AgentApplicationService.Validate. The server
// re-validates regardless; this only saves a round trip.
const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name').max(200, 'Your name is too long'),
  stateOfOrigin: z.string().min(2, 'Enter your state of origin').max(100, 'Too long'),
  residentialAddress: z.string().min(5, 'Enter your residential address').max(500, 'Too long'),
  localGovernmentArea: z.string().min(2, 'Enter your local government area').max(200, 'Too long'),
  phoneNumber: z.string().min(7, 'Enter a phone number we can reach you on').max(20, 'Too long'),
  agencyName: z.string().max(200, 'Too long').optional().or(z.literal('')),
  additionalNotes: z.string().max(2000, 'Too long').optional().or(z.literal('')),
});

type ApplyForm = z.infer<typeof schema>;

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

function StatusPanel({ application }: { application: AgentApplication }) {
  const tone =
    application.status === 'Approved'
      ? 'success'
      : application.status === 'Rejected'
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

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-500">Submitted</dt>
          <dd className="text-right font-medium text-ink-900">
            {new Date(application.createdAt).toLocaleDateString()}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-500">Local government area</dt>
          <dd className="text-right font-medium text-ink-900">{application.localGovernmentArea}</dd>
        </div>
        {application.reviewedAt && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">Reviewed</dt>
            <dd className="text-right font-medium text-ink-900">
              {new Date(application.reviewedAt).toLocaleDateString()}
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

      {application.status === 'Rejected' && application.rejectionReason && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4" />
            Not approved
          </p>
          <p className="mt-2 whitespace-pre-wrap">{application.rejectionReason}</p>
          <p className="mt-2 text-red-700">You are welcome to apply again once this has been addressed.</p>
        </div>
      )}

      {(application.status === 'Submitted' || application.status === 'UnderReview') && (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your application is with our team. We will email you once it has been reviewed.</span>
        </p>
      )}
    </div>
  );
}

export function ApplyAgentPage() {
  const { notify } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const currentQuery = useMyCurrentApplication();
  const submit = useSubmitAgentApplication();

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
        stateOfOrigin: data.stateOfOrigin,
        residentialAddress: data.residentialAddress,
        localGovernmentArea: data.localGovernmentArea,
        phoneNumber: data.phoneNumber,
        agencyName: data.agencyName || undefined,
        additionalNotes: data.additionalNotes || undefined,
      });
      notify({
        type: 'success',
        title: 'Application received',
        description: 'Our team will review it and contact you by email.',
      });
    } catch (err) {
      const detail = extractApiError(err);
      setServerError(detail);
      notify({ type: 'error', title: 'Could not submit application', description: detail });
    }
  };

  const existing = currentQuery.data ?? null;
  const hasOpen = existing?.status === 'Submitted' || existing?.status === 'UnderReview';

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
            ) : hasOpen || existing?.status === 'Approved' || existing?.status === 'Rejected' ? (
              <StatusPanel application={existing!} />
            ) : (
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
                <h2 className="font-display text-xl font-semibold text-ink-900">Your details</h2>
                <p className="mt-1 text-sm text-ink-500">Fields marked with * are required.</p>

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
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label="Phone number *"
                    placeholder="+234 ..."
                    error={errors.phoneNumber?.message}
                    {...register('phoneNumber')}
                  />
                  <Input
                    label="State of origin *"
                    placeholder="Plateau"
                    error={errors.stateOfOrigin?.message}
                    {...register('stateOfOrigin')}
                  />
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
                      error={errors.residentialAddress?.message}
                      {...register('residentialAddress')}
                    />
                  </div>
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
