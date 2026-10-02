import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, ShieldCheck, Star } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SearchFilterCard } from '../../components/property/SearchFilter';
import { useAuth } from '../../contexts/AuthContext';
import { canApplyAsAgent } from '../../utils/roles';
import type { PropertyFilters } from '../../types';

interface HeroSectionProps {
  filters: PropertyFilters;
  onFiltersChange: (f: PropertyFilters) => void;
  onSearch: () => void;
}

export function HeroSection({ filters, onFiltersChange, onSearch }: HeroSectionProps) {
  const { user, isAuthenticated } = useAuth();

  // Signed-in non-staff users go straight to the form. Admins and existing
  // agents cannot apply, so the button is not offered to them at all. Guests are
  // sent to sign in first, carrying the return trip, and the login page offers
  // account creation from there.
  const canApply = isAuthenticated && canApplyAsAgent(user?.roles);
  const applyLink = isAuthenticated ? { to: '/apply-agent' } : { to: '/login', state: { from: '/apply-agent' } };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Luxury property on the Jos Plateau"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/70 via-ink-900/30 to-transparent" />
      </div>

      <div className="container-x pt-28 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-3xl text-white">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
          >
            <ShieldCheck className="h-4 w-4 text-gold-400" /> Official Plateau State Property Portal
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Find Your Dream Property in Plateau State
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-xl text-lg text-white/85"
          >
            Buy, sell, rent and invest with confidence. Verified listings, trusted agents and government-backed
            documentation across the Plateau.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/properties">
              <Button variant="gold" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View Properties
              </Button>
            </Link>
            {canApply && (
              <Link to={applyLink.to} state={applyLink.state}>
                <Button variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" leftIcon={<Building2 className="h-4 w-4" />}>
                  Become an Agent
                </Button>
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/80"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['A', 'G', 'D', 'S'].map((i) => (
                  <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-forest-gradient text-xs font-semibold text-white">
                    {i}
                  </span>
                ))}
              </div>
              <span>320+ verified agents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              <span className="ml-1">4.9/5 client rating</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 lg:mt-16"
        >
          <SearchFilterCard filters={filters} onChange={onFiltersChange} onSearch={onSearch} />
        </motion.div>
      </div>
    </section>
  );
}
