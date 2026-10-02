import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, Phone, Building2, ArrowUpRight, Star } from 'lucide-react';
import type { Agent } from '../../types';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface AgentCardProps {
  agent: Agent;
  index?: number;
}

export function AgentCard({ agent, index = 0 }: AgentCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {agent.photo ? (
          <img
            src={agent.photo}
            alt={agent.fullName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-forest-gradient">
            <span className="font-display text-6xl font-bold text-white/90">{agent.fullName.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex justify-end p-3">
          {agent.verified && (
            <Badge tone="forest" className="backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </Badge>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent p-4 pt-12">
          <h3 className="font-display text-lg font-semibold text-white">{agent.fullName}</h3>
          <p className="text-xs text-white/80">{agent.title ?? 'PIPDC Agent'}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-ink-800">
            <Building2 className="h-4 w-4 text-forest-500" /> {agent.agency}
          </span>
          {agent.averageRating != null ? (
            <span className="inline-flex items-center gap-1 text-ink-700">
              <Star className="h-4 w-4 fill-gold-400 text-gold-500" />
              <span className="font-semibold">{agent.averageRating.toFixed(1)}</span>
              <span className="text-xs text-ink-400">({agent.reviewCount})</span>
            </span>
          ) : (
            <span className="text-xs text-ink-400">No reviews</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-ink-600">
          <Phone className="h-4 w-4 text-forest-500" />
          <span className={cn('truncate', !agent.phone && 'italic text-ink-400')}>{agent.phone || 'No phone listed'}</span>
        </div>
        <Link
          to={`/agents/${agent.id}`}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink-100 px-3.5 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-forest-500 hover:text-white"
        >
          View Profile <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}
