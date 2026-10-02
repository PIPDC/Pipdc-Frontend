import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, LocateFixed, Navigation } from 'lucide-react';
import { PropertyCard } from '../../components/property/PropertyCard';
import { PropertyCardSkeleton } from '../../components/property/PropertyCardSkeleton';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Button } from '../../components/ui/Button';
import { useNearbyProperties } from '../../hooks/useNearbyProperties';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Batch 5: "Properties Near You".
 *
 * Three honest outcomes, because the underlying data is not always good enough for
 * a distance:
 *   - the visitor is signed out: prompt to sign in, show nothing ranked
 *   - the user has no saved location: prompt to set one
 *   - the user saved an area but no coordinates: show the area's properties, but
 *     never attach a kilometre figure, because none was calculated
 */
export function PropertiesNearYouSection() {
  const { isAuthenticated, isRestoring } = useAuth();
  const query = useNearbyProperties(true);
  const { isFavourite, toggle } = useFavourites();

  // Nothing is shown to signed-out visitors: a nearby list is derived from a
  // saved location, and asking an anonymous visitor to grant location access to a
  // public landing page is not a trade worth making.
  if (isRestoring || !isAuthenticated) return null;

  const data = query.data;
  const hasLocation = data?.hasLocation === true;
  const items = data?.items ?? [];
  const distanceMode = data?.mode === 'distance';

  const heading = (
    <SectionHeading
      align="left"
      eyebrow="Near You"
      title={
        distanceMode
          ? `Properties near ${data?.locationName ?? 'you'}`
          : hasLocation
            ? `Properties in ${data?.locationName ?? 'your area'}`
            : 'Properties Near You'
      }
      description={
        distanceMode
          ? 'The closest available listings to the location saved on your account.'
          : hasLocation
            ? `Available in ${data?.locationName ?? 'your saved area'}. Share your exact location to see how close each one is.`
            : 'Tell us where you are and we will show the closest available listings.'
      }
    />
  );

  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          {heading}
          <Link to="/properties" className="hidden sm:block">
            <Button variant="outline" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View all properties
            </Button>
          </Link>
        </div>

        {query.isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : query.isError ? (
          <p className="mt-8 text-sm text-ink-500">
            Could not load nearby properties. Please try again shortly.
          </p>
        ) : !hasLocation ? (
          <NoLocationPrompt />
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-ink-100 bg-ink-50/60 px-6 py-10 text-center">
            <MapPin className="mx-auto h-6 w-6 text-ink-400" />
            <p className="mt-3 text-sm font-medium text-ink-900">
              Nothing available near you right now
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
              There are no matching listings within range of your saved location. New properties are
              added regularly, so it is worth checking back.
            </p>
            <Link to="/properties" className="mt-5 inline-block">
              <Button variant="outline">Browse all properties</Button>
            </Link>
          </div>
        ) : (
          <>
            {/*
              The backend deliberately reports DistanceAvailable = false for an
              area match. In that case no chip is rendered at all rather than
              implying a measurement that was never made.
            */}
            {!distanceMode && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-xs text-ink-500">
                <Navigation className="h-3 w-3" />
                Matched by area, not distance
              </p>
            )}
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, idx) => (
                <div key={item.property.id} className="relative">
                  {item.distanceLabel && distanceMode && (
                    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-forest-700 shadow-sm">
                      <MapPin className="h-3 w-3" />
                      {item.distanceLabel}
                    </span>
                  )}
                  <PropertyCard
                    property={item.property}
                    index={idx}
                    agentName={item.property.agentName}
                    isFavourite={isFavourite(item.property.id)}
                    onToggleFavourite={toggle}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/properties">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View all properties
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function NoLocationPrompt() {
  return (
    <div className="mt-10 rounded-2xl border border-ink-100 bg-ink-50/60 px-6 py-10 text-center">
      <LocateFixed className="mx-auto h-6 w-6 text-forest-600" />
      <p className="mt-3 text-sm font-medium text-ink-900">Set your location to see what is near you</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
        We use the location saved on your account to find the closest available properties. It is only
        used to rank listings for you, and you can remove it at any time.
      </p>
      <Link to="/dashboard/settings" className="mt-5 inline-block">
        <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Set my location
        </Button>
      </Link>
    </div>
  );
}
