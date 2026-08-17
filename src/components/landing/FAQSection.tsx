import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

interface QA { q: string; a: React.ReactNode; }

const QA_LIST: QA[] = [
  {
    q: 'Will my WhatsApp account get blocked when I use these endpoints?',
    a: (
      <>
        <p>
          Not if you use the API the way it is designed. We pace every request through
          a per-instance WhatsApp call limiter (3 reads/sec, 2 mutations/sec by default) and a per-client
          10 reads/sec API cap, both well under WhatsApp is account thresholds.
        </p>
        <p className="mt-3">
          Bulk campaigns are throttled to 10 MPS normally and ramp to 30 MPS when the queue is
          5,000 - still a fraction of WhatsApp is ~80 MPS ceiling. We also enforce your tier
          volume limit (250 unique customers/day on Tier 0): a campaign that would exceed it is paused, not blasted.
        </p>
        <p className="mt-3">
          The result: you can run real production traffic without triggering HTTP 429/503 account blocks.
        </p>
      </>
    ),
  },
  {
    q: 'What are the rate limits?',
    a: (
      <ul className="space-y-2 list-disc pl-5">
        <li><span className="text-[#f97316] font-semibold">Chat reads:</span> 10/sec per client</li>
        <li><span className="text-[#f97316] font-semibold">WhatsApp reads:</span> 3/sec per instance</li>
        <li><span className="text-[#f97316] font-semibold">Mutations:</span> 2/sec per instance</li>
        <li><span className="text-[#f97316] font-semibold">Bulk send:</span> 10 MPS; 30 MPS when queue 5,000+</li>
        <li><span className="text-[#f97316] font-semibold">Volume (Tier 0):</span> 250 unique customers/day initiated</li>
      </ul>
    ),
  },
  {
    q: 'How does the volume limit work?',
    a: (
      <p>
        WhatsApp caps how many new customers a business can start a conversation with
        in a rolling 24-hour window - 250 on Tier 0, scaling up to unlimited at Tier 4 as
        account quality improves. We count every distinct customer you send an outgoing
        message to and surface "47 / 250 new contacts today" right in the dashboard.
      </p>
    ),
  },
  {
    q: 'What happens when a new container is connected?',
    a: (
      <p>
        The webhook fires a background warm-up that runs one paced chat-list fetch through the same upstream limiter (3/sec). No flood
        of fetches the moment a user scans the QR - which is the single most common cause of new-container blocks.
      </p>
    ),
  },
  {
    q: 'Do contacts sync from WhatsApp?',
    a: (
      <p>
        Yes - one click on Sync contacts pulls your WhatsApp phonebook and stores it under your client. Manual contacts always win; synced
        ones (flagged with their instance) are deleted automatically when that container disconnects.
      </p>
    ),
  },
  {
    q: 'How do I get started?',
    a: (
      <p>
        Sign up for a free account, create your first WhatsApp instance, scan the QR code with your phone, and you are ready to start sending messages.
        No credit card required for the free tier.
      </p>
    ),
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className="relative bg-white py-12 md:py-20">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f97316]/20 bg-[#fb923c]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#f97316]">
            <ShieldCheck size={12} /> Reliability
          </span>
          <h2
            className="mt-6 text-[clamp(24px,3vw,40px)] font-bold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Questions about <span className="text-[#f97316]">limits &amp; blocks</span>
          </h2>
          <p className="mx-auto mt-6 text-[20px] text-[#1a1a1a]/75 leading-[150%] max-w-2xl">
            The same protections that keep our platform stable also keep your WhatsApp account healthy.
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
                className="overflow-hidden rounded-[28px] border border-[#e5e5e5] bg-white transition hover:border-[#d4d4d4]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-[#1a1a1a] md:text-base">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#525252] transition-transform ${isOpen ? 'rotate-180 text-[#f97316]' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#e5e5e5] px-5 py-4 text-sm leading-relaxed text-[#525252]">
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
