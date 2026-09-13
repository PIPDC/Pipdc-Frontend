import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bed, Bath, Maximize, MapPin, Calendar, Check, Phone, Mail, Share2,
  Heart, ArrowLeft, ChevronLeft, ChevronRight, BadgeCheck, Star, AlertTriangle, MessagesSquare,
  MessageSquare,
} from 'lucide-react';
import { useProperty, useSimilarProperties, useAgent, usePropertyEnquiries } from '../hooks/queries';
import { useFavourites } from '../hooks/useFavourites';
import { useAuth } from '../contexts/AuthContext';
import { conversationService } from '../services/conversationService';
import { extractApiError } from '../services/api';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PropertyCard } from '../components/property/PropertyCard';
import { useToast } from '../components/ui/Toast';
import { formatPrice, formatDate } from '../utils/format';
import { cn } from '../utils/cn';
import { propertyStatusLabel, listingTypeLabel } from '../utils/propertyStatus';
import { primaryRole } from '../utils/roles';

export function PropertyDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const propertyQuery = useProperty(slug);
  const property = propertyQuery.data;
  const similarQuery = useSimilarProperties(property?.id);
  const agentQuery = useAgent(property?.agentId ?? undefined);
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [starting, setStarting] = useState(false);
  const { isFavourite, toggle } = useFavourites();
  const { notify } = useToast();

  const userRole = primaryRole(user?.roles);
  const showEnquiries = userRole === 'Admin' || userRole === 'Agent';
  const enquiriesQuery = usePropertyEnquiries(showEnquiries ? property?.id : undefined);

  if (propertyQuery.isLoading) {
    return (
      <div className="container-x flex min-h-[60vh] items-center justify-center pt-28">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
      </div>
    );
  }

  if (propertyQuery.isError || !property) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center pt-28 text-center">
        <AlertTriangle className="h-10 w-10 text-gold-500" />
        <h1 className="mt-4 heading-3">Property not found</h1>
        <p className="mt-2 text-ink-500">The property you are looking for may have been removed.</p>
        <Link to="/properties" className="mt-6">
          <Button variant="primary" size="lg" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to properties</Button>
        </Link>
      </div>
    );
  }

  const agent = agentQuery.data;
  const similar = similarQuery.data ?? [];
  const fav = isFavourite(property.id);

  const startMessaging = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/dashboard/messages?property=${property.id}` } });
      return;
    }
    setStarting(true);
    try {
      const enquiry = await conversationService.resolveEnquiryForProperty(property.id, crypto.randomUUID());
      navigate(`/dashboard/messages?enquiry=${enquiry.id}`);
    } catch (err) {
      notify({ type: 'error', title: 'Could not start conversation', description: extractApiError(err) });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="bg-ink-50 pb-20 pt-28 lg:pt-36">
      <div className="container-x">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Properties', to: '/properties' },
            { label: property.title },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink-200"
            >
              <img
                src={property.images[activeImage] ?? property.coverImage ?? ''}
                alt={`${property.title} - image ${activeImage + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge tone={property.status === 'Available' ? 'forest' : property.status === 'Sold' ? 'neutral' : property.status === 'Pending' ? 'gold' : property.status === 'Rented' ? 'info' : 'danger'}>{propertyStatusLabel(property.status)}</Badge>
                {property.listingType && <Badge tone="neutral">{listingTypeLabel(property.listingType)}</Badge>}
                <Badge tone="neutral">{property.type}</Badge>
              </div>
              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  onClick={() => toggle(property.id)}
                  aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 backdrop-blur-md transition-all',
                    fav ? 'bg-gold-400 text-ink-900' : 'bg-white/70 text-ink-700 hover:bg-white',
                  )}
                >
                  <Heart className={cn('h-4 w-4', fav && 'fill-current')} />
                </button>
                <button
                  aria-label="Share property"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href).catch(() => {});
                    notify({ type: 'info', title: 'Link copied', description: 'Share link copied to clipboard.' });
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/70 text-ink-700 backdrop-blur-md transition-all hover:bg-white"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((i) => (i - 1 + property.images.length) % property.images.length)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink-800 backdrop-blur-md transition-colors hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveImage((i) => (i + 1) % property.images.length)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink-800 backdrop-blur-md transition-colors hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </motion.div>

            {property.images.length > 1 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      'aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all',
                      idx === activeImage ? 'border-forest-500' : 'border-transparent hover:border-forest-200',
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title block */}
            <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{property.title}</h1>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-500">
                    <MapPin className="h-4 w-4 text-forest-500" /> {property.address}, {property.area}, {property.state}
                  </p>
                </div>
                <div className="min-w-0 text-right sm:text-right">
                  <p className="font-display text-3xl font-bold text-forest-600">
                    {formatPrice(property.price, property.currency)}
                    {property.period && <span className="text-sm font-medium text-ink-400">{property.period}</span>}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">Listed {formatDate(property.createdAt)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-6 sm:grid-cols-4">
                <Spec icon={<Bed className="h-5 w-5" />} value={property.bedrooms ?? '—'} label="Bedrooms" />
                <Spec icon={<Bath className="h-5 w-5" />} value={property.bathrooms ?? '—'} label="Bathrooms" />
                <Spec icon={<Maximize className="h-5 w-5" />} value={`${property.size ?? '—'} ${property.sizeUnit}`} label="Size" />
                <Spec icon={<Calendar className="h-5 w-5" />} value={property.yearBuilt ?? '—'} label="Year Built" />
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink-900">About this property</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                <h2 className="font-display text-lg font-semibold text-ink-900">Amenities</h2>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-ink-700">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
                        <Check className="h-4 w-4" />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Map placeholder */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
              <div className="border-b border-ink-100 px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-ink-900">Location</h2>
                <p className="mt-1 text-sm text-ink-500">{property.area}, {property.city}, {property.state}</p>
              </div>
              <div className="relative aspect-[16/8] bg-ink-100 bg-grid">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-500 text-white shadow-lift">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-forest-500/40" />
                </div>
                <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-700 backdrop-blur-sm">
                  Map data © PIPDC GIS
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Agent + Enquiry */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  {agent?.photo ? (
                    <img src={agent.photo} alt={agent.fullName} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-gradient text-lg font-semibold text-white">
                      {(agent?.fullName ?? property.agentName ?? 'P').charAt(0)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display text-base font-semibold text-ink-900">{agent?.fullName ?? property.agentName}</h3>
                      {agent?.verified && <BadgeCheck className="h-4 w-4 text-forest-500" />}
                    </div>
                    <p className="text-xs text-ink-500">{agent?.title ?? 'PIPDC Agent'}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                      <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                      Verified listing
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={`tel:${agent?.phone ?? property.agentId}`} className="flex-1">
                    <Button variant="primary" size="lg" className="w-full" leftIcon={<Phone className="h-4 w-4" />}>
                      Call
                    </Button>
                  </a>
                  <a href={`mailto:${agent?.email ?? property.agentId}`} className="flex-1">
                    <Button variant="outline" size="lg" className="w-full" leftIcon={<Mail className="h-4 w-4" />}>
                      Email
                    </Button>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                <h3 className="font-display text-base font-semibold text-ink-900">Message the agent</h3>
                <p className="mt-1 text-xs text-ink-500">
                  Have questions about this property? Start a conversation with {agent?.fullName ?? property.agentName ?? 'the assigned agent'}.
                </p>
                <Button
                  variant="gold"
                  size="lg"
                  className="mt-4 w-full"
                  loading={starting}
                  leftIcon={<MessagesSquare className="h-4 w-4" />}
                  onClick={startMessaging}
                >
                  Message Agent
                </Button>
              </div>
            </div>
          </aside>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="heading-3">Similar properties</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p, idx) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  index={idx}
                  agentName={p.agentName}
                  isFavourite={isFavourite(p.id)}
                  onToggleFavourite={toggle}
                />
              ))}
            </div>
          </section>
        )}

        {/* Property Enquiries (Admin/Agent only) */}
        {showEnquiries && enquiriesQuery.data && enquiriesQuery.data.items.length > 0 && (
          <section className="mt-16">
            <h2 className="heading-3">Property Enquiries</h2>
            <div className="mt-6 rounded-2xl border border-ink-100 bg-white shadow-soft">
              <div className="divide-y divide-ink-50">
                {enquiriesQuery.data.items.map((eq) => (
                  <div key={eq.id} className="flex items-start gap-4 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 text-sm font-semibold text-forest-700">
                      {eq.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{eq.fullName}</p>
                          <p className="text-xs text-ink-400">{eq.email}{eq.phone ? ` · ${eq.phone}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={eq.status === 'Resolved' ? 'forest' : eq.status === 'Pending' ? 'gold' : 'neutral'}>
                            {eq.status}
                          </Badge>
                          <span className="text-xs text-ink-400">{formatDate(eq.createdAt)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-ink-600">{eq.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Spec({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-50 text-forest-600">{icon}</span>
      <div>
        <p className="font-display text-base font-semibold text-ink-900">{value}</p>
        <p className="text-xs text-ink-500">{label}</p>
      </div>
    </div>
  );
}
