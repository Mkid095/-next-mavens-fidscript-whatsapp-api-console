/**
 * FAQSection — thin shell with section chrome and motion wrapper.
 */
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { FAQAccordion } from './FAQAccordion.js';

export default function FAQSection() {
  return (
    <section className="relative bg-[#11110a] py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-yellow-500/10 blur-[128px]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-yellow-500">
            <ShieldCheck size={12} /> Reliability
          </span>
          <h2 className="mt-6 text-3xl font-bold text-white md:text-4xl">
            Questions about <span className="gradient-headline-text">limits &amp; blocks</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#a8a594]">
            The same protections that keep our platform stable also keep your
            WhatsApp account healthy. Here&rsquo;s how.
          </p>
        </motion.div>

        <FAQAccordion />
      </div>
    </section>
  );
}
