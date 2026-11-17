import { motion } from 'framer-motion';
import { ShieldCheck, Users, MessageSquare, LayoutDashboard, Sparkles } from 'lucide-react';
import { SectionHeading } from '../../components/ui/SectionHeading';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Properties',
    description: 'Listings can be marked verified by agents and reviewed by admins.',
  },
  {
    icon: Users,
    title: 'Agent Profiles',
    description: 'Browse agent profiles with contact options and client reviews.',
  },
  {
    icon: MessageSquare,
    title: 'Enquiry Tracking',
    description: 'Send enquiries and follow their status from the client dashboard.',
  },
  {
    icon: LayoutDashboard,
    title: 'Admin Dashboard',
    description: 'Manage listings, applications, enquiries and reports in one place.',
  },
  {
    icon: Sparkles,
    title: 'AI Concierge',
    description: 'Ask the built-in assistant for property suggestions by location and budget.',
  },
];

export function WhyChooseSection() {
  return (
    <section className="section-pad bg-white">
      <div className="container-x">
        <SectionHeading
          eyebrow="Platform Features"
          title="What the demo covers"
          description="A walkthrough of the main features in this portfolio project."
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
              <h3 className="font-display text-lg font-semibold">Explore the full flow</h3>
              <p className="mt-2 text-sm text-white/85">
                Browse listings, contact agents, track enquiries and manage everything from the admin dashboard.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
