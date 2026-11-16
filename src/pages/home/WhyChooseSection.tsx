import { motion } from 'framer-motion';
import { ShieldCheck, Users, Lock, Landmark, Headphones } from 'lucide-react';
import { SectionHeading } from '../../components/ui/SectionHeading';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Properties',
    description: 'Every listing is checked for documentation and ownership before it goes live.',
  },
  {
    icon: Users,
    title: 'Trusted Agents',
    description: 'Work with vetted agents committed to transparent dealings.',
  },
  {
    icon: Lock,
    title: 'Secure Transactions',
    description: 'Bank-grade processes protect your payments and personal information.',
  },
  {
    icon: Landmark,
    title: 'Clear Documentation',
    description: 'Every step from enquiry to handover is recorded and tracked on the platform.',
  },
  {
    icon: Headphones,
    title: 'Fast Support',
    description: 'Reach our advisory team on weekdays and weekends for prompt assistance.',
  },
];

export function WhyChooseSection() {
  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <SectionHeading
          eyebrow="Why PIPDC"
          title="The trusted standard for property on the Plateau"
          description="From documentation to handover, we hold every transaction to a higher standard."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.3) }}
              className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-forest-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-forest-gradient text-white shadow-soft">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-5 font-display text-lg font-semibold text-ink-900">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-ink-500">{f.description}</p>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative overflow-hidden rounded-2xl bg-forest-gradient p-6 text-white shadow-lift"
          >
            <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden="true" />
            <div className="relative">
              <h3 className="font-display text-lg font-semibold">A partner for every step</h3>
              <p className="mt-2 text-sm text-white/85">
                Whether you are buying your first home or expanding an investment portfolio, PIPDC is your long-term
                property partner.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat value="24/7" label="Online access" />
                <Stat value="Live" label="Real-time updates" />
                <Stat value="AI" label="Concierge" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <p className="font-display text-xl font-bold text-gold-400">{value}</p>
      <p className="mt-0.5 text-[11px] text-white/70">{label}</p>
    </div>
  );
}
