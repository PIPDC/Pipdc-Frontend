import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { authService, type TurnstileVerification } from '../../services/authService';
import { extractApiError } from '../../services/api';
import { TurnstileWidget } from '../../components/TurnstileWidget';
import { turnstileEnabled } from '../../lib/turnstile';
import { isInternalPath } from '../../utils/navigation';

const schema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName: z.string().min(2, 'Enter your last name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  terms: z.boolean().refine((v) => v, 'You must accept the terms'),
});

type RegisterForm = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstile, setTurnstile] = useState<TurnstileVerification | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  // When Turnstile is off there is no widget and no token, so the form must not
  // wait for one. Keep in sync with the backend's Turnstile:Enabled flag.
  const turnstileRequired = turnstileEnabled;
  // Owned here rather than derived from the Turnstile widget, which is disabled.
  // Stable across retries of the same submission; rotated only on failure.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const pendingFrom = (() => {
    const from = (location.state as { from?: string } | null)?.from;
    return isInternalPath(from) ? from : undefined;
  })();

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await authService.register(
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        },
        idempotencyKey,
        turnstile ?? undefined,
      );
      notify({
        type: 'success',
        title: 'Account created',
        description: 'We sent a 6-digit verification code to your email. Enter it to activate your account.',
      });
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        state: pendingFrom ? { from: pendingFrom } : undefined,
      });
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
        <h1 className="font-display text-3xl font-bold text-ink-900">Create your PIPDC account</h1>
        <p className="mt-2 text-sm text-ink-500">Join the official Plateau State property platform.</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" placeholder="Nankin" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" placeholder="Bagudu" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Email" type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:text-ink-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register('password')}
        />
        <label className="flex items-start gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-forest-500 focus:ring-forest-500"
            {...register('terms')}
          />
          <span>
            I agree to the{' '}
            <Link to="/about" className="font-medium text-forest-600 hover:text-forest-700">Terms</Link> and{' '}
            <Link to="/about" className="font-medium text-forest-600 hover:text-forest-700">Privacy Policy</Link>.
          </span>
        </label>
        {errors.terms && <p className="text-xs font-medium text-red-600">{errors.terms.message}</p>}

        <TurnstileWidget onVerification={setTurnstile} resetKey={turnstileReset} />

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting} disabled={turnstileRequired && !turnstile?.token} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Create account
        </Button>
      </form>

      <ul className="mt-6 space-y-2 text-sm text-ink-500">
        {['Verified listings across Plateau State', 'Direct access to PIPDC agents', 'Save favourites and track enquiries'].map((b) => (
          <li key={b} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-forest-500" /> {b}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" state={pendingFrom ? { from: pendingFrom } : undefined} className="font-semibold text-forest-600 hover:text-forest-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
