import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { authService, type TurnstileVerification } from '../../services/authService';
import { extractApiError } from '../../services/api';
import { TurnstileWidget } from '../../components/TurnstileWidget';
import { turnstileEnabled } from '../../lib/turnstile';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type ForgotForm = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstile, setTurnstile] = useState<TurnstileVerification | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  // See RegisterPage: no widget and no token when Turnstile is off, so the form
  // must not wait for one. Keep in sync with the backend's Turnstile:Enabled flag.
  const turnstileRequired = turnstileEnabled;
  // See RegisterPage: the key is owned here, not derived from the widget.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    try {
      await authService.forgotPassword(data.email, idempotencyKey, turnstile ?? undefined);
      notify({ type: 'info', title: 'Code sent', description: 'Check your inbox for a 6-digit code.' });
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setServerError(extractApiError(err));
      setTurnstile(null);
      setTurnstileReset((n) => n + 1);
      // The reservation is released on failure, so a corrected retry must use a
      // fresh key rather than replaying the failed one.
      setIdempotencyKey(crypto.randomUUID());
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-900">Forgot password?</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter the email associated with your account and we&rsquo;ll send a 6-digit code to reset your password.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <TurnstileWidget onVerification={setTurnstile} resetKey={turnstileReset} />
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting} disabled={turnstileRequired && !turnstile?.token} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Send reset code
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-500">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-forest-600 hover:text-forest-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
