import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  UserCircle,
  Settings,
  Heart,
  LogOut,
  X,
  HardHat,
  Radar,
  MapPin,
  FileCheck2,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { cn } from '../../utils/cn';
import { primaryRole, type Role } from '../../utils/roles';

const adminItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', to: '/dashboard/properties', icon: Building2 },
  { label: 'Locations', to: '/dashboard/locations', icon: MapPin },
  { label: 'Developments', to: '/dashboard/developments', icon: HardHat },
  { label: 'Agents', to: '/dashboard/agents', icon: Users },
  { label: 'Agent Applications', to: '/dashboard/applications', icon: FileCheck2 },
  { label: 'Enquiries', to: '/dashboard/enquiries', icon: MessageSquare },
  { label: 'Messages', to: '/dashboard/messages', icon: MessagesSquare },
  { label: 'Blog', to: '/dashboard/blog', icon: Newspaper },
  { label: 'Users', to: '/dashboard/users', icon: UserCircle },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

const agentItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Properties', to: '/dashboard/properties', icon: Building2 },
  { label: 'My Enquiries', to: '/dashboard/enquiries', icon: MessageSquare },
  { label: 'Messages', to: '/dashboard/messages', icon: MessagesSquare },
  { label: 'Saved Properties', to: '/dashboard/saved', icon: Heart },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

const clientItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tracked Projects', to: '/dashboard/tracked', icon: Radar },
  { label: 'My Enquiries', to: '/dashboard/my-enquiries', icon: MessageSquare },
  { label: 'Messages', to: '/dashboard/messages', icon: MessagesSquare },
  { label: 'Saved Properties', to: '/dashboard/saved', icon: Heart },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

const groups: Record<Role, { label: string; items: typeof adminItems }> = {
  Admin: { label: 'Manage', items: adminItems },
  Agent: { label: 'My Listings', items: agentItems },
  Client: { label: 'Account', items: clientItems },
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const role = primaryRole(user?.roles);
  const group = groups[role];

  useScrollLock(open);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-100 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-100 px-6">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{group.label}</p>
          <ul className="mt-3 space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-forest-50 text-forest-700'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                          isActive ? 'bg-forest-500 text-white' : 'bg-ink-100 text-ink-500',
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-gradient text-sm font-semibold text-white">
              {user?.fullName?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.fullName}</p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link to="/" className="flex-1">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 transition-colors hover:border-forest-500 hover:text-forest-600">
                View Site
              </button>
            </Link>
            <button
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-ink-800"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
