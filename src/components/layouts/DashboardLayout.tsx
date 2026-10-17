import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, PanelLeft, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  // Everyone signed in has a notification feed, and the contents differ by
  // recipient: admins get the "list this property" prompt when a project
  // completes, while anyone tracking a project gets the status changes for it.
  // Restricting the bell to admins meant trackers were told about a status
  // change by email but had no way to read or dismiss it in the app.
  const showNotifications = Boolean(user);

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} />
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink-100 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
            className="rounded-lg p-2.5 text-ink-600 hover:bg-ink-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden rounded-lg p-2.5 text-ink-600 hover:bg-ink-100 lg:block"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="relative hidden flex-1 max-w-md sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Search properties, agents, enquiries…"
              className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pl-10 pr-4 text-base md:text-sm text-ink-800 placeholder-ink-400 transition-all focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/30"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {showNotifications && <NotificationBell />}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-gradient text-sm font-semibold text-white">
              {user?.fullName?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
