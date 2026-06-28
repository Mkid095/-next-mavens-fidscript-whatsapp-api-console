import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

// FAQ — addresses the top reliability concern ("Will I get blocked?") up
// front, then layers in the limits that keep accounts safe. Accordion
// pattern matches the dark/charcoal landing palette.

interface QA { q: string; a: React.ReactNode; }

const QA_LIST: QA[] = [
  {
    q: 'Will my WhatsApp account get blocked when I use these endpoints?',
    a: (
      <>
        <p>
          Not if you use the API the way it&rsquo;s designed. We pace every request through
          a per-instance <span className="text-yellow-500 font-semibold">WhatsApp call</span> limiter
          (3 reads/sec, 2 mutations/sec by default) and a per-client{' '}
          <span className="text-yellow-500 font-semibold">10 reads/sec</span> API cap, both well
          under WhatsApp&rsquo;s account thresholds.
        </p>
        <p className="mt-3">
          Bulk campaigns are throttled to <span className="text-yellow-500 font-semibold">10 MPS</span> normally
          and ramp to <span className="text-yellow-500 font-semibold">30 MPS</span> when the queue is
          ≥ 5,000 — still a fraction of WhatsApp&rsquo;s ~80 MPS ceiling. We also enforce your tier
          volume limit (e.g. <span className="text-yellow-500 font-semibold">250 unique customers/day</span>{' '}
          on Tier 0): a campaign that would exceed it is paused, not blasted.
        </p>
        <p className="mt-3">
          The result: you can run real production traffic without triggering HTTP 429/503
          account blocks.
        </p>
      </>
    ),
  },
  {
    q: 'What are the rate limits?',
    a: (
      <ul className="space-y-2 list-disc pl-5">
        <li><span className="text-yellow-500 font-semibold">Chat reads:</span> 10/sec per client (10 requests per second)</li>
        <li><span className="text-yellow-500 font-semibold">WhatsApp reads:</span> 3/sec per instance</li>
        <li><span className="text-yellow-500 font-semibold">Mutations:</span> 2/sec per instance (mark-read, group edits, settings)</li>
        <li><span className="text-yellow-500 font-semibold">Bulk send:</span> 10 MPS; 30 MPS when queue ≥ 5,000</li>
        <li><span className="text-yellow-500 font-semibold">Volume (Tier 0):</span> 250 unique customers/day initiated</li>
        <li><span className="text-yellow-500 font-semibold">Profile-pic fetches:</span> 30/sec, front-end concurrency-capped at 3</li>
      </ul>
    ),
  },
  {
    q: 'How does the volume limit work?',
    a: (
      <p>
        WhatsApp caps how many <em>new</em> customers a business can start a conversation with
        in a rolling 24-hour window — 250 on Tier 0, scaling up to unlimited at Tier 4 as
        account quality improves. We count every distinct customer you send an outgoing
        message to (from the message log) and surface <span className="text-yellow-500 font-semibold">&ldquo;47 / 250
        new contacts today&rdquo;</span> right in the composer header, plus a <span className="text-yellow-500 font-semibold">
        &ldquo;sync ready&rdquo;</span> badge at the 50% threshold so you can pace toward a tier upgrade.
      </p>
    ),
  },
  {
    q: 'What happens when a new container is connected?',
    a: (
      <p>
        The webhook fires a background <span className="text-yellow-500 font-semibold">warm-up</span> that
        runs one paced chat-list fetch through the same upstream limiter (3/sec). No flood
        of fetches the moment a user scans the QR — which is the single most common cause of
        new-container blocks.
      </p>
    ),
  },
  {
    q: 'Do contacts sync from WhatsApp?',
    a: (
      <p>
        Yes — one click on <span className="text-yellow-500 font-semibold">Sync contacts</span> pulls your
        WhatsApp phonebook and stores it under your client. Manual contacts always win; synced
        ones (flagged with their instance) are deleted automatically when that container
        disconnects, so bulk campaigns never use stale numbers.
      </p>
    ),
  },
  {
    q: 'Can I build AI chatbots that respond automatically on WhatsApp?',
    a: (
      <p>
        Yes. The built-in <span className="text-yellow-500 font-semibold">AI Chatbot Builder</span> lets
        you create WhatsApp chatbots powered by OpenAI, Anthropic, Gemini, or any OpenAI-compatible
        provider. Configure keyword triggers, conditional response rules, and AI system prompts — then
        test your bot instantly in the dashboard before going live. You bring your own API keys
        (BYOKLM): FIDScript never stores your LLM credentials.
      </p>
    ),
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number>(0);
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

        <div className="mt-12 space-y-3">
          {QA_LIST.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="overflow-hidden rounded-2xl border border-[#262413] bg-[#1b1910] transition hover:border-[#383416]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-white md:text-base">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#a8a594] transition-transform ${isOpen ? 'rotate-180 text-yellow-500' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#262413] px-5 py-4 text-sm leading-relaxed text-[#c4c1a8]">
                    {item.a}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}