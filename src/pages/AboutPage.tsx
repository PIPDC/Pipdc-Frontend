import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, MessageSquare, LayoutDashboard, Sparkles, Code2, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { CTASection } from './home/CTASection';

const features = [
  {
    icon: Building2,
    title: 'Property listings',
    description: 'Search and filter sample properties across Plateau State.',
  },
  {
    icon: MessageSquare,
    title: 'Enquiries',
    description: 'Contact agents and track enquiries from a client dashboard.',
  },
  {
    icon: LayoutDashboard,
    title: 'Admin dashboard',
    description: 'Manage listings, agents, applications and reports.',
  },
  {
    icon: Sparkles,
    title: 'AI concierge',
    description: 'Get property suggestions from the built-in assistant.',
  },
];

export function AboutPage() {
  return (
    <div className="bg-white">
      <div className="container-x pt-28 pb-10 lg:pt-36">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
        <SectionHeading
          align="left"
          eyebrow="About this project"
          title="A full-stack real-estate demo"
          description="Built with ASP.NET Core and React, this portfolio project shows listings, enquiries, an admin dashboard and an AI concierge."
        />
      </div>

      {/* Hero band */}
      <section className="relative overflow-hidden">
        <div className="container-x">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-forest-gradient px-6 py-14 text-white shadow-lift sm:px-12 lg:py-20"
          >
            <div className="absolute inset-0 bg-grid opacity-[0.08]" />
            <div className="relative grid gap-8 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <Code2 className="h-4 w-4 text-gold-400" /> Portfolio demo
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl text-balance">
                  Listings, enquiries and an AI concierge — built end to end.
                </h2>
                <p className="mt-4 max-w-xl text-white/85">
                  This project demonstrates a complete real-estate flow: browsing and searching properties,
                  contacting agents, tracking enquiries in a dashboard, and asking an AI concierge for
                  recommendations. Everything runs on sample data.
                </p>
                <p className="mt-4 max-w-xl text-sm text-white/70">
                  Not affiliated with the Plateau State Government or the real PIPDC.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/contact">
                    <Button variant="gold" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>Get in touch</Button>
                  </Link>
                  <Link to="/properties">
                    <Button variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">Browse properties</Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {features.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <f.icon className="h-5 w-5 text-gold-400" />
                    <p className="mt-3 font-display text-sm font-semibold text-white">{f.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/70">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Explore the demo"
        description="Browse sample listings or try the AI concierge."
        buttonLabel="Browse Properties"
        to="/properties"
      />
    </div>
  );
}
