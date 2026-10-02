import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, ShieldCheck, MailCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { extractApiError, extractApiErrorCode } from '../../services/api';
import { isInternalPath } from '../../utils/navigation';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { notify } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setUnconfirmedEmail(null);
    try {
      const auth = await authService.login({ email: data.email, password: data.password });
      await signIn(auth);
      notify({ type: 'success', title: 'Welcome back', description: 'You have signed in successfully.' });
      const from = (location.state as { from?: string } | null)?.from;
      const destination = isInternalPath(from) ? from : auth.roles.includes('Admin') ? '/dashboard' : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      if (extractApiErrorCode(err) === 'EMAIL_NOT_CONFIRMED') {
        setUnconfirmedEmail(data.email);
        return;
      }
      setServerError(extractApiError(err));
    }
  };

  const pendingFrom = (() => {
    const from = (location.state as { from?: string } | null)?.from;
    return isInternalPath(from) ? from : undefined;
  })();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-900">Sign in to PIPDC</h1>
        <p className="mt-2 text-sm text-ink-500">Welcome back. Enter your details to continue.</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
      )}

      {unconfirmedEmail && (
        <div className="mb-4 rounded-xl border border-forest-200 bg-forest-50 p-4 text-sm text-ink-700">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" />
            <div>
              <p className="font-semibold text-forest-800">Please verify your email first</p>
              <p className="mt-1 text-ink-600">
                A verification code has been sent to <span className="font-semibold text-ink-800">{unconfirmedEmail}</span>.
                Enter it to activate your account before signing in.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="mt-3"
                onClick={() =>
                  navigate(`/verify-email?email=${encodeURIComponent(unconfirmedEmail)}`, {
                    state: pendingFrom ? { from: pendingFrom } : undefined,
                  })
                }
                >
                Verify my email
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
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
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-forest-500 focus:ring-forest-500"
              {...register('remember')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-forest-600 hover:text-forest-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs text-ink-500">
        <ShieldCheck className="h-4 w-4 text-forest-500" />
        Your session is protected with bank-grade encryption.
      </div>

      <p className="mt-8 text-center text-sm text-ink-500">
        Don&rsquo;t have an account?{' '}
        <Link to="/register" state={pendingFrom ? { from: pendingFrom } : undefined} className="font-semibold text-forest-600 hover:text-forest-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
