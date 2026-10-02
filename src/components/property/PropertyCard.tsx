import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bed, Bath, Maximize, Heart, MapPin, ArrowUpRight } from 'lucide-react';
import type { Property } from '../../types';
import { formatPrice, formatCompact } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { propertyStatusLabel, listingTypeLabel } from '../../utils/propertyStatus';

interface PropertyCardProps {
  property: Property;
  agentName?: string | null;
  isFavourite?: boolean;
  onToggleFavourite?: (id: number) => void;
  index?: number;
}

const statusTone: Record<Property['status'], 'forest' | 'gold' | 'neutral' | 'info' | 'danger'> = {
  Available: 'forest',
  Pending: 'gold',
  Sold: 'neutral',
  Rented: 'info',
  Unavailable: 'danger',
};

export function PropertyCard({ property, agentName, isFavourite, onToggleFavourite, index = 0 }: PropertyCardProps) {
  const location = [property.area, property.city].filter(Boolean).join(', ') || property.address;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.coverImage ?? property.images[0]}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex gap-2">
            <Badge tone={statusTone[property.status]} className="backdrop-blur-sm">
              {propertyStatusLabel(property.status)}
            </Badge>
            {property.listingType && (
              <Badge tone="gold" className="backdrop-blur-sm">
                {listingTypeLabel(property.listingType)}
              </Badge>
            )}
          </div>
          <button
            onClick={() => onToggleFavourite?.(property.id)}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={Boolean(isFavourite)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 backdrop-blur-md transition-all',
              isFavourite ? 'bg-gold-400 text-ink-900' : 'bg-white/70 text-ink-700 hover:bg-white',
            )}
          >
            <Heart className={cn('h-4 w-4', isFavourite && 'fill-current')} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent p-3 pt-10">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
            <MapPin className="h-3 w-3" /> {location}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-xl font-bold text-forest-600">
            {formatPrice(property.price, property.currency)}
            {property.period && <span className="text-sm font-medium text-ink-400">{property.period}</span>}
          </p>
          {property.size != null && (
            <span className="text-xs font-medium text-ink-400">{formatCompact(property.size)} {property.sizeUnit}</span>
          )}
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink-900 line-clamp-2">
          {property.title}
        </h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-1">{property.address}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-100 pt-4 text-sm">
          <Spec icon={<Bed className="h-4 w-4" />} value={property.bedrooms} label="Bedrooms" />
          <Spec icon={<Bath className="h-4 w-4" />} value={property.bathrooms} label="Baths" />
          <Spec icon={<Maximize className="h-4 w-4" />} value={property.size} label={property.sizeUnit} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-50 text-xs font-semibold text-forest-700">
              {agentName?.charAt(0) ?? 'P'}
            </div>
            <span className="truncate text-xs text-ink-500">{agentName ?? 'PIPDC Official'}</span>
          </div>
          <Link
            to={`/properties/${property.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest-600"
          >
            View Details <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function Spec({ icon, value, label }: { icon: React.ReactNode; value: number | null; label: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-600">
      <span className="text-forest-500">{icon}</span>
      <span className="font-semibold text-ink-800">{value ?? '—'}</span>
      <span className="text-xs text-ink-400">{label}</span>
    </div>
  );
}
