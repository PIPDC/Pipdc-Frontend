import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Newspaper, AlertTriangle } from 'lucide-react';
import type { PropertyFilters } from '../../types';
import { useFavourites } from '../../hooks/useFavourites';
import { useFeaturedProperties, useProperties, useAgents, useBlogPosts } from '../../hooks/queries';
import { PropertyCard } from '../../components/property/PropertyCard';
import { AgentCard } from '../../components/agent/AgentCard';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PropertyCardSkeleton } from '../../components/property/PropertyCardSkeleton';
import { formatDate } from '../../utils/format';
import { HeroSection } from './HeroSection';
import { WhyChooseSection } from './WhyChooseSection';
import { FeaturedDevelopmentsSection } from './FeaturedDevelopmentsSection';
import { PropertiesNearYouSection } from './PropertiesNearYouSection';
import { StatsSection } from './StatsSection';
import { CTASection } from './CTASection';

export function HomePage() {
  const [filters, setFilters] = useState<PropertyFilters>({});
  const { isFavourite, toggle } = useFavourites();

  const featuredQuery = useFeaturedProperties();
  const latestQuery = useProperties({ pageSize: 6, sort: 'newest' });
  const agentsQuery = useAgents();
  const postsQuery = useBlogPosts();

  const featured = featuredQuery.data?.slice(0, 6) ?? [];
  const latest = latestQuery.data?.items ?? [];
  const agents = agentsQuery.data?.items?.slice(0, 4) ?? [];
  const posts = postsQuery.data?.items?.slice(0, 3) ?? [];

  const onSearch = () => {
    const params = new URLSearchParams();
    if (filters.location && filters.location !== 'All') params.set('location', filters.location);
    if (filters.type && filters.type !== 'All') params.set('type', filters.type);
    if (filters.status && filters.status !== 'All') params.set('status', filters.status);
    if (filters.listingType && filters.listingType !== 'All') params.set('listingType', filters.listingType);
    if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    window.location.href = `/properties?${params.toString()}`;
  };

  return (
    <>
      <HeroSection filters={filters} onFiltersChange={setFilters} onSearch={onSearch} />

      {/* Featured Properties */}
      <section className="section-pad bg-ink-50">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              align="left"
              eyebrow="Featured Listings"
              title="Handpicked properties from across the Plateau"
              description="A curated selection of verified, premium homes and investments."
            />
            <Link to="/properties" className="hidden sm:block">
              <Button variant="outline" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View all properties
              </Button>
            </Link>
          </div>

          {featuredQuery.isLoading ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredQuery.isError ? (
            <SectionError message="Could not load featured properties. Is the backend running?" />
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, idx) => (
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

      <WhyChooseSection />

      {/* Batch 5: signed-in only; renders nothing for anonymous visitors */}
      <PropertiesNearYouSection />

      <FeaturedDevelopmentsSection />

      {/* Agents Section */}
      <section className="section-pad bg-ink-50">
        <div className="container-x">
          <SectionHeading
            eyebrow="Meet the Team"
            title="Verified agents you can trust"
            description="Our agents are vetted, trained and accountable to PIPDC standards."
          />
          {agentsQuery.isLoading ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AgentCardSkeleton key={i} />
              ))}
            </div>
          ) : agentsQuery.isError ? (
            <SectionError message="Could not load agents. Is the backend running?" />
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {agents.map((a, idx) => (
                <AgentCard key={a.id} agent={a} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>

      <StatsSection />

      {/* Latest Properties */}
      <section className="section-pad bg-white">
        <div className="container-x">
          <SectionHeading
            eyebrow="Just Listed"
            title="The latest properties on the market"
            description="Fresh, verified listings added by PIPDC agents across Plateau State."
          />
          {latestQuery.isLoading ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : latestQuery.isError ? (
            <SectionError message="Could not load the latest properties." />
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((p, idx) => (
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
          )}
        </div>
      </section>

      {/* Blog / Insights */}
      <section className="section-pad bg-ink-50">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Insights"
              title="Guidance from the PIPDC advisory team"
              description="Practical, plain-language guidance for buyers, sellers and investors."
            />
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 transition-colors hover:text-forest-700"
            >
              View all insights <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {postsQuery.isError ? (
            <SectionError message="Could not load insights." />
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {posts.map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.2) }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <Link to={`/blog/${post.slug}`}>
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={post.coverImageUrl ?? ''}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2">
                      {post.categoryName ? <Badge tone="forest">{post.categoryName}</Badge> : <Badge tone="neutral">General</Badge>}
                      <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                        <Newspaper className="h-3.5 w-3.5" /> {post.readMinutes} min read
                      </span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-ink-900 line-clamp-2 hover:text-forest-600">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm text-ink-500 line-clamp-2">{post.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4 text-xs text-ink-400">
                      <span>PIPDC Advisory</span>
                      <span>{post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <CTASection />
    </>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
      <AlertTriangle className="h-6 w-6 text-gold-500" />
      <p className="text-sm text-ink-500">{message}</p>
    </div>
  );
}

function AgentCardSkeleton() {
  return <div className="h-96 animate-pulse rounded-2xl bg-ink-100" />;
}
