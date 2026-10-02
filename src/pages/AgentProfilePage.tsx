import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, Phone, Mail, Building2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAgent, useAgentProperties } from '../hooks/queries';
import { useFavourites } from '../hooks/useFavourites';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PropertyCard } from '../components/property/PropertyCard';
import { AgentFeedbackPanel } from '../components/agent/AgentFeedbackPanel';
import { EmptyState } from '../components/ui/EmptyState';

export function AgentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const agentId = Number(id);
  const validId = Number.isFinite(agentId) && agentId > 0 ? agentId : undefined;
  const { isFavourite, toggle } = useFavourites();

  const agentQuery = useAgent(validId);
  const listingsQuery = useAgentProperties(validId);
  const agent = agentQuery.data;

  if (agentQuery.isLoading) {
    return (
      <div className="container-x min-h-[60vh] animate-pulse pt-28">
        <div className="h-4 w-64 rounded bg-ink-100" />
        <div className="mt-8 h-64 rounded-2xl bg-ink-100" />
      </div>
    );
  }

  if (agentQuery.isError || !agent) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center pt-28 text-center">
        <AlertTriangle className="h-8 w-8 text-gold-500" />
        <h1 className="mt-4 heading-3">Agent not found</h1>
        <p className="mt-2 text-sm text-ink-500">The agent profile you are looking for does not exist or is unavailable.</p>
        <Button variant="primary" size="lg" className="mt-6" onClick={() => navigate('/agents')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to agents
        </Button>
      </div>
    );
  }

  const listings = listingsQuery.data?.items ?? [];

  return (
    <div className="bg-ink-50 pb-20 pt-28 lg:pt-36">
      <div className="container-x">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Agents', to: '/agents' }, { label: agent.fullName }]} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft"
        >
          <div className="h-28 bg-forest-gradient" />
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-16 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-soft">
                {agent.photo ? (
                  <img src={agent.photo} alt={agent.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-4xl font-bold text-forest-600">{agent.fullName.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink-900">{agent.fullName}</h1>
                  {agent.verified && (
                    <Badge tone="forest">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-500">{agent.title ?? 'PIPDC Agent'}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-700">
                  <Building2 className="h-4 w-4 text-forest-500" /> {agent.agency}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm text-ink-600">
              <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 transition-colors hover:text-forest-600">
                <Phone className="h-4 w-4 text-forest-500" /> {agent.phone || 'Not listed'}
              </a>
              <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-forest-600">
                <Mail className="h-4 w-4 text-forest-500" /> {agent.email}
              </a>
            </div>
          </div>
        </motion.div>

        {agent.bio && (
          <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-ink-900">About</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{agent.bio}</p>
          </div>
        )}

        <AgentFeedbackPanel agent={agent} />

        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink-900">
            Listings by {agent.fullName.split(' ')[0]}
          </h2>
          {listingsQuery.isLoading ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-ink-100" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              title="No active listings"
              description="This agent has no listings available right now. Check back soon."
              action={
                <Link to="/properties">
                  <Button variant="outline" size="lg">Browse all properties</Button>
                </Link>
              }
            />
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((p, idx) => (
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
      </div>
    </div>
  );
}
