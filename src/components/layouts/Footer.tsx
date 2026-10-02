import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { canApplyAsAgent } from '../../utils/roles';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Properties', to: '/properties' },
  { label: 'Agents', to: '/agents' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const resourceLinks = [
  { label: 'Property Guidelines', to: '/about' },
  { label: 'Land Documentation', to: '/about' },
  { label: 'Become an Agent', to: '/apply-agent' },
  { label: 'Investor Portal', to: '/properties' },
  { label: 'FAQs', to: '/contact' },
];

const socials = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
];

export function Footer() {
  const { user, isAuthenticated } = useAuth();

  // Not offered to admins or existing agents, who cannot apply. Guests are sent
  // through sign-in first, with the return trip carried so they still reach the
  // form afterwards.
  const canApply = isAuthenticated && canApplyAsAgent(user?.roles);
  const agentLink = isAuthenticated ? { to: '/apply-agent' } : { to: '/login', state: { from: '/apply-agent' } };

  return (
    <footer className="relative overflow-hidden bg-ink-900 text-ink-100">
      <div className="absolute inset-0 bg-grid opacity-[0.04]" aria-hidden="true" />
      <div className="container-x relative py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo variant="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-300">
              The Plateau State Property Investment &amp; Development Company is the official gateway to verified
              property transactions across the Plateau. Buy, sell, rent and invest with confidence.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-ink-200 transition-all hover:border-gold-400 hover:bg-gold-400 hover:text-ink-900"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="mt-4 space-y-1 text-sm">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="inline-block py-1.5 text-ink-300 transition-colors hover:text-gold-400">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Resources</h3>
            <ul className="mt-4 space-y-1 text-sm">
              {resourceLinks.map((l) => {
                const isAgentCta = l.to === '/apply-agent';
                if (isAgentCta && !canApply) return null;
                return (
                  <li key={l.label}>
                    <Link
                      to={isAgentCta ? agentLink.to : l.to}
                      state={isAgentCta ? agentLink.state : undefined}
                      className="inline-block py-1.5 text-ink-300 transition-colors hover:text-gold-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">Stay Informed</h3>
            <p className="mt-4 text-sm text-ink-300">
              Subscribe to receive verified listings and market insights from PIPDC.
            </p>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                name="newsletter"
                placeholder="Enter your email"
                aria-label="Email address"
                className="border-white/10 bg-white/5 text-white placeholder-ink-400"
              />
              <Button type="submit" variant="gold" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Subscribe
              </Button>
            </form>
            <ul className="mt-6 space-y-2.5 text-sm text-ink-300">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-gold-400" /> 12 Secretariat Road, Jos, Plateau State
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gold-400" /> +234 803 555 0100
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gold-400" /> info@pipdc.gov.ng
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Plateau State Property Investment &amp; Development Company. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="inline-block py-1 transition-colors hover:text-gold-400">Privacy</Link>
            <Link to="/about" className="inline-block py-1 transition-colors hover:text-gold-400">Terms</Link>
            <Link to="/contact" className="inline-block py-1 transition-colors hover:text-gold-400">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
