import { motion } from 'framer-motion';
import { Building2, Users, Sparkles, MessageSquare, type LucideIcon } from 'lucide-react';

const highlights = [
  { icon: Building2, label: 'Property listings' },
  { icon: Users, label: 'Agent profiles' },
  { icon: Sparkles, label: 'AI concierge' },
  { icon: MessageSquare, label: 'Real-time enquiries' },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-16 text-white">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />
      <div className="container-x relative">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, idx) => (
            <HighlightCard key={h.label} {...h} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HighlightCard({ icon: Icon, label, index }: { icon: LucideIcon; label: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-gold-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-3 font-display text-lg font-semibold text-white">{label}</p>
    </motion.div>
  );
}
