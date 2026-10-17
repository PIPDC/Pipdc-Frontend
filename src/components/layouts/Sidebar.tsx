import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  ChevronDown,
  KeyRound,
  Handshake,
  Radar,
  Flag,
  HardHat,
  FileCheck2,
  Scale,
  ShieldAlert,
  Bot,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { primaryRole, type Role } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useMyCurrentApplication } from '../../hooks/useAgentApplications';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
}

export function Sidebar({ open, onClose, collapsed }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  const isDesktop = useIsDesktop();
  const rail = collapsed && isDesktop;

  const applicationQuery = useMyCurrentApplication();
  const hasApplication = applicationQuery.data != null;

  const role = primaryRole(user?.roles);
  const navGroups = buildGroups(role, hasApplication);

  // Open the group that owns the current route whenever the user navigates, so
  // a link is never hidden inside a collapsed section they previously closed.
  const activeGroup = navGroups.find((group) =>
    group.items.some((item) =>
      item.to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.to),
    ),
  )?.label;

  useEffect(() => {
    if (activeGroup) {
      setClosedGroups((prev) => ({ ...prev, [activeGroup]: false }));
    }
  }, [activeGroup]);

  useScrollLock(open);

  const toggleGroup = (label: string) =>
    setClosedGroups((prev) => ({ ...prev, [label]: !prev[label] }));

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
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-100 bg-white transition-all duration-300 lg:translate-x-0',
          rail ? 'lg:w-20' : 'lg:w-72',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Dashboard navigation"
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-ink-100',
            rail ? 'justify-center px-3' : 'justify-between px-6',
          )}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group"
            aria-label="PIPDC home"
          >
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-forest-gradient shadow-soft">
              <svg viewBox="0 0 64 64" className="h-7 w-7" fill="none" aria-hidden="true">
                <path d="M32 14L50 30V50H38V38H26V50H14V30L32 14Z" fill="#D4AF37" />
                <rect x="14" y="50" width="36" height="4" fill="#FFFFFF" />
              </svg>
            </span>
            {!rail && (
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-bold tracking-tight text-ink-900">PIPDC</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">
                  Plateau State
                </span>
              </span>
            )}
          </Link>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className={cn('flex-1 overflow-y-auto py-6', rail ? 'px-3' : 'px-4')}>
          {rail ? (
            <ul className="space-y-1.5">
              {navGroups.flatMap((group) => group.items).map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} rail onNavigate={onClose} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4">
              {navGroups.map((group) => {
                const isClosed = Boolean(closedGroups[group.label]);
                return (
                  <div key={group.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      aria-expanded={!isClosed}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400 transition-colors hover:text-ink-600"
                    >
                      {group.label}
                      <ChevronDown
                        className={cn('h-3.5 w-3.5 transition-transform', isClosed && '-rotate-90')}
                      />
                    </button>
                    {!isClosed && (
                      <ul className="mt-1.5 space-y-1">
                        {group.items.map((item) => (
                          <li key={item.to}>
                            <SidebarLink item={item} onNavigate={onClose} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="border-t border-ink-100 p-4">
          {rail ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-gradient text-sm font-semibold text-white">
                {user?.fullName?.charAt(0) ?? 'A'}
              </div>
              <Link
                to="/"
                title="View Site"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-700 transition-colors hover:border-forest-500 hover:text-forest-600"
              >
                <Building2 className="h-4 w-4" />
              </Link>
              <button
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white transition-colors hover:bg-ink-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  item,
  rail,
  onNavigate,
}: {
  item: NavItem;
  rail?: boolean;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onNavigate}
      title={rail ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
          rail ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
          isActive ? 'bg-forest-50 text-forest-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
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
          {!rail && item.label}
        </>
      )}
    </NavLink>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}

function buildGroups(role: Role, hasApplication: boolean): NavGroup[] {
  const dashboard: NavItem = { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard };

  const admin: NavGroup[] = [
    { label: 'Overview', items: [dashboard] },
    {
      label: 'Properties',
      items: [
        { label: 'Properties', to: '/dashboard/properties', icon: Building2 },
        { label: 'Developments', to: '/dashboard/developments', icon: HardHat },
        { label: 'Locations', to: '/dashboard/locations', icon: Radar },
      ],
    },
    {
      label: 'People',
      items: [
        { label: 'Agents', to: '/dashboard/agents', icon: Users },
        { label: 'Agent Reports', to: '/dashboard/reports', icon: Flag },
        { label: 'Agent Applications', to: '/dashboard/applications', icon: FileCheck2 },
        { label: 'Appeals & Bars', to: '/dashboard/appeals', icon: Scale },
        { label: 'Users', to: '/dashboard/users', icon: UserCircle },
      ],
    },
    {
      label: 'Transactions',
      items: [
        { label: 'Statistics', to: '/dashboard/statistics', icon: BarChart3 },
        { label: 'Tenants', to: '/dashboard/tenants', icon: KeyRound },
        { label: 'Purchasers', to: '/dashboard/purchasers', icon: Handshake },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Enquiries', to: '/dashboard/enquiries', icon: MessageSquare },
        { label: 'Messages', to: '/dashboard/messages', icon: MessagesSquare },
        { label: 'Escalations', to: '/dashboard/escalations', icon: ShieldAlert },
        { label: 'Concierge Escalations', to: '/dashboard/concierge-escalations', icon: Bot },
      ],
    },
    { label: 'Content', items: [{ label: 'Blog', to: '/dashboard/blog', icon: Newspaper }] },
    { label: 'Account', items: [{ label: 'Settings', to: '/dashboard/settings', icon: Settings }] },
  ];

  const agent: NavGroup[] = [
    { label: 'Overview', items: [dashboard] },
    {
      label: 'Listings',
      items: [
        { label: 'My Properties', to: '/dashboard/properties', icon: Building2 },
        { label: 'Saved Properties', to: '/dashboard/saved', icon: Heart },
      ],
    },
    {
      label: 'Transactions',
      items: [
        { label: 'Statistics', to: '/dashboard/statistics', icon: BarChart3 },
        { label: 'Tenants', to: '/dashboard/tenants', icon: KeyRound },
        { label: 'Purchasers', to: '/dashboard/purchasers', icon: Handshake },
      ],
    },
    {
      label: 'Communication',
      items: [
        { label: 'My Enquiries', to: '/dashboard/enquiries', icon: MessageSquare },
        { label: 'Messages', to: '/dashboard/messages', icon: MessagesSquare },
      ],
    },
    { label: 'Account', items: [{ label: 'Settings', to: '/dashboard/settings', icon: Settings }] },
  ];

  const activity: NavItem[] = [
    { label: 'My Enquiries', to: '/dashboard/my-enquiries', icon: MessageSquare },
    { label: 'My Reports', to: '/dashboard/my-reports', icon: Flag },
  ];
  if (hasApplication) {
    activity.push({ label: 'My Agent Application', to: '/dashboard/my-agent-application', icon: FileCheck2 });
  }

  const client: NavGroup[] = [
    { label: 'Overview', items: [dashboard] },
    {
      label: 'Properties',
      items: [
        { label: 'My Purchases', to: '/dashboard/my-purchases', icon: Handshake },
        { label: 'My Rentals', to: '/dashboard/my-tenancies', icon: KeyRound },
        { label: 'Saved Properties', to: '/dashboard/saved', icon: Heart },
        { label: 'Tracked Projects', to: '/dashboard/tracked', icon: Radar },
      ],
    },
    { label: 'Activity', items: activity },
    { label: 'Communication', items: [{ label: 'Messages', to: '/dashboard/messages', icon: MessagesSquare }] },
    { label: 'Account', items: [{ label: 'Settings', to: '/dashboard/settings', icon: Settings }] },
  ];

  if (role === 'Admin') return admin;
  if (role === 'Agent') return agent;
  return client;
}
