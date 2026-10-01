import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { contactService } from '../services/contactService';
import { extractApiError } from '../services/api';

// The schema mirrors the server-side limits in ContactRequest so the visitor gets
// immediate feedback instead of a round-trip. The server re-validates regardless,
// since client validation is a convenience, not a control.
const schema = z.object({
  name: z.string().min(2, 'Enter your full name').max(120, 'Your name is too long'),
  email: z.string().email('Enter a valid email').max(256, 'Your email is too long'),
  // Optional on the server, so only validate the length when supplied.
  phone: z.string().max(32, 'Your phone number is too long').optional().or(z.literal('')),
  subject: z.string().min(2, 'Select a subject').max(150, 'Your subject is too long'),
  message: z.string().min(10, 'Tell us a little more').max(4000, 'Your message is too long'),
});

type ContactForm = z.infer<typeof schema>;

const contactInfo = [
  { icon: MapPin, label: 'Visit us', value: '12 Secretariat Road, Jos, Plateau State', href: '#' },
  { icon: Phone, label: 'Call us', value: '+234 803 555 0100', href: 'tel:+2348035550100' },
  { icon: Mail, label: 'Email us', value: 'info@pipdc.gov.ng', href: 'mailto:info@pipdc.gov.ng' },
  { icon: Clock, label: 'Office hours', value: 'Mon – Fri, 8:00 – 17:00' },
];

export function ContactPage() {
  const { notify } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(schema),
  });

  // Previously this form discarded the submission with `void data` and faked a
  // success toast on a timer, so every message was silently lost. It now posts to
  // the API and only reports success once the backend has accepted it.
  const onSubmit = async (data: ContactForm) => {
    setServerError(null);
    try {
      await contactService.submit({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
      });
      notify({
        type: 'success',
        title: 'Message sent',
        description: 'Our team will respond within one business day.',
      });
      reset();
    } catch (err) {
      const detail = extractApiError(err);
      setServerError(detail);
      notify({ type: 'error', title: 'Could not send message', description: detail });
    }
  };

  return (
    <div className="bg-ink-50">
      <div className="container-x pt-28 pb-10 lg:pt-36">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />
        <SectionHeading
          align="left"
          eyebrow="Contact PIPDC"
          title="We are here to help"
          description="Reach our advisory team for questions about listings, documentation, partnerships or general enquiries."
        />
      </div>

      <div className="container-x pb-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Send us a message</h2>
              <p className="mt-1 text-sm text-ink-500">Fields marked with * are required.</p>
              {serverError && (
                <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {serverError}
                </p>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input label="Full name *" placeholder="Your name" error={errors.name?.message} {...register('name')} />
                <Input label="Email *" type="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
                <Input label="Phone (optional)" placeholder="+234 ..." error={errors.phone?.message} {...register('phone')} />
                <Select label="Subject *" error={errors.subject?.message} {...register('subject')}>
                  <option value="">Select a subject</option>
                  <option value="General enquiry">General enquiry</option>
                  <option value="Listing question">Listing question</option>
                  <option value="Documentation &amp; verification">Documentation &amp; verification</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Support">Support</option>
                </Select>
                <div className="sm:col-span-2">
                  <Textarea label="Message *" rows={5} placeholder="How can we help?" error={errors.message?.message} {...register('message')} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" variant="primary" size="lg" loading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
                    Send message
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="grid gap-4">
              {contactInfo.map((c) => (
                <a
                  key={c.label}
                  href={c.href ?? '#'}
                  className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-gradient text-white shadow-soft">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-400">{c.label}</p>
                    <p className="mt-1 font-display text-base font-semibold text-ink-900">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
              <div className="relative aspect-[4/3] bg-ink-100 bg-grid">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-500 text-white shadow-lift">
                    <MapPin className="h-5 w-5" />
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-700 backdrop-blur-sm">
                  PIPDC HQ, Jos
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-forest-gradient p-6 text-white shadow-lift">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gold-400" />
                <h3 className="font-display text-base font-semibold">Need a quick answer?</h3>
              </div>
              <p className="mt-2 text-sm text-white/85">
                Call our advisory line on weekdays from 8:00 to 17:00 for immediate assistance.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
