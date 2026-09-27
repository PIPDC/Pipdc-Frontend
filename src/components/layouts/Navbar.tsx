import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Building2, MessagesSquare, ChevronDown } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { cn } from '../../utils/cn';

const exploreItems = [
  { label: 'Properties', to: '/properties' },
  { label: 'Developments', to: '/developments' },
  { label: 'Agents', to: '/agents' },
];

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Insights', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const [desktopExploreOpen, setDesktopExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isAuthenticated, isRestoring, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileExploreOpen(false);
    setDesktopExploreOpen(false);
  }, [location.pathname]);

  useScrollLock(mobileOpen);

  // Close desktop explore dropdown on outside click
  useEffect(() => {
    if (!desktopExploreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setDesktopExploreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [desktopExploreOpen]);

  const isActiveExplore = exploreItems.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'));

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-soft' : 'bg-transparent lg:bg-white/45 lg:backdrop-blur-md',
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo variant={scrolled ? 'default' : 'default'} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-forest-600' : 'text-ink-700 hover:text-forest-600',
                )
              }
            >
              {({ isActive }) => (
                <span className="relative">
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute -bottom-1.5 left-0 right-0 mx-auto h-0.5 w-6 rounded-full bg-forest-500"
                    />
                  )}
                </span>
              )}
            </NavLink>
          ))}

          {/* Explore dropdown */}
          <div
            ref={exploreRef}
            className="relative"
            onMouseEnter={() => setDesktopExploreOpen(true)}
            onMouseLeave={() => setDesktopExploreOpen(false)}
          >
            <button
              onClick={() => setDesktopExploreOpen(true)}
              className={cn(
                'relative inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                isActiveExplore ? 'text-forest-600' : 'text-ink-700 hover:text-forest-600',
              )}
            >
              Explore
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', desktopExploreOpen && 'rotate-180')} />
              {isActiveExplore && !desktopExploreOpen && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -bottom-1.5 left-0 right-0 mx-auto h-0.5 w-6 rounded-full bg-forest-500"
                />
              )}
            </button>
            <div className="absolute right-0 top-full z-50 pt-1">
              <AnimatePresence>
                {desktopExploreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="w-48 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-lift"
                  >
                    {exploreItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setDesktopExploreOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2.5 text-sm font-medium transition-colors',
                            isActive ? 'bg-forest-50 text-forest-700' : 'text-ink-700 hover:bg-ink-50 hover:text-forest-600',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isRestoring ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-ink-100" />
          ) : isAuthenticated ? (
            <>
              <Link to="/dashboard/messages">
                <Button variant="outline" size="lg" leftIcon={<MessagesSquare className="h-4 w-4" />}>
                  Messages
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" leftIcon={<Building2 className="h-4 w-4" />}>
                  Dashboard
                </Button>
              </Link>
              <Button variant="primary" size="lg" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="lg">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="gold" size="lg">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 bg-white/70 text-ink-800 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass mx-4 mb-4 rounded-2xl border border-white/40 p-3 shadow-soft lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-forest-50 text-forest-700' : 'text-ink-700 hover:bg-ink-100',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Mobile Explore section */}
              <button
                onClick={() => setMobileExploreOpen((v) => !v)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActiveExplore ? 'bg-forest-50 text-forest-700' : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                Explore
                <ChevronDown className={cn('h-4 w-4 transition-transform', mobileExploreOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {mobileExploreOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4"
                  >
                    {exploreItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive ? 'bg-forest-50 text-forest-700' : 'text-ink-600 hover:bg-ink-100',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">
                {isRestoring ? (
                  <div className="h-11 animate-pulse rounded-xl bg-ink-100" />
                ) : isAuthenticated ? (
                  <>
                    <Link to="/dashboard/messages" className="inline-flex" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full" leftIcon={<MessagesSquare className="h-4 w-4" />}>
                        Messages
                      </Button>
                    </Link>
                    <Link to="/dashboard" className="inline-flex" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false);
                        signOut();
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="inline-flex" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" className="inline-flex" onClick={() => setMobileOpen(false)}>
                      <Button variant="gold" size="lg" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
