import { Outlet, Link } from 'react-router-dom';
import { Logo } from '../brand/Logo';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-forest-gradient lg:block">
        <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo variant="light" />
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight">
              A property platform built as a portfolio demo.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80">
              Sign in to explore sample listings, agent profiles, enquiries, the admin dashboard and the AI
              concierge.
            </p>
            <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Portfolio demo by Simon Agboji · sample data only
            </p>
          </div>
          <p className="text-xs text-white/60">&copy; {new Date().getFullYear()} PIPDC Real Estate Demo.</p>
        </div>
      </div>
      <div className="flex flex-col bg-white">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
          <Link to="/" className="text-sm font-medium text-ink-600 hover:text-forest-600">
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
