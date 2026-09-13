import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useVerifyEmail, useResendVerification } from '../../hooks/mutations';
import { extractApiError, extractApiErrorCode } from '../../services/api';

const RESEND_COOLDOWN_SECONDS = 60;

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

type VerifyForm = z.infer<typeof schema>;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useToast();
  const email = searchParams.get('email') ?? '';
  const [serverError, setServerError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyForm>({
    resolver: zodResolver(schema),
  });
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const onSubmit = async (data: VerifyForm) => {
    setServerError(null);
    try {
      await verifyEmail.mutateAsync({ email, code: data.code });
      notify({ type: 'success', title: 'Email verified', description: 'Your account is now active. Sign in to continue.' });
      navigate('/login');
    } catch (err) {
      if (extractApiErrorCode(err) === 'ALREADY_VERIFIED') {
        notify({ type: 'success', title: 'Email verified', description: 'Your account is already active.' });
        navigate('/login');
        return;
      }
      setServerError(extractApiError(err));
    }
  };

  const onResend = async () => {
    setServerError(null);
    try {
      await resend.mutateAsync({ email, idempotencyKey: crypto.randomUUID() });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      notify({ type: 'info', title: 'Code sent', description: 'A new verification code is on its way to your inbox.' });
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  if (!email) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink-900">Verify your email</h1>
          <p className="mt-2 text-sm text-ink-500">
            We could not find the email attached to this verification link.
          </p>
        </div>
        <Link to="/login" className="inline-block">
          <Button variant="primary" size="lg" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter the 6-digit code we sent to{' '}
          <span className="font-semibold text-ink-800">{email}</span>. The code expires in 15 minutes.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          leftIcon={<KeyRound className="h-4 w-4" />}
          error={errors.code?.message}
          {...register('code')}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting} rightIcon={<ShieldCheck className="h-4 w-4" />}>
          Verify email
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-ink-100 bg-ink-50 p-4 text-center">
        <p className="text-sm text-ink-500">Didn&rsquo;t receive it, or it expired?</p>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          loading={resend.isPending}
          disabled={secondsLeft > 0}
          onClick={onResend}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-ink-500">
        Wrong email?{' '}
        <Link to="/login" className="font-semibold text-forest-600 hover:text-forest-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}