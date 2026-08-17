import { motion } from 'framer-motion';

export function RateLimitsGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Rate Limits</h1>
      <p className="text-sm text-[#525252] mb-8">
        Every request is paced through multiple layers so production traffic stays well under
        WhatsApp's account thresholds.
      </p>
      <div className="space-y-2">
        {[
          {
            cat: 'Chat reads (portal)',
            limit: '10/sec/client',
            note: 'Chat list, threads, profile-pic via /api/platform/*',
          },
          {
            cat: 'WhatsApp reads',
            limit: '3/sec/instance',
            note: 'Per-instance pacer; protects your account from blocks',
          },
          {
            cat: 'Mutations',
            limit: '2/sec/instance',
            note: 'markRead, group edits, settings, presence',
          },
          {
            cat: 'Bulk send',
            limit: '10 MPS (30 MPS @ queue ≥ 5,000)',
            note: 'Dynamic per-campaign pacing; well under WhatsApp 80 MPS ceiling',
          },
          {
            cat: 'Volume (Tier 0)',
            limit: '250 unique/day',
            note: 'Tier 1: 1k · Tier 2: 10k · Tier 3: 100k · Tier 4: unlimited',
          },
          {
            cat: 'Phonebook sync',
            limit: '5/min',
            note: 'Manual trigger; use sparingly - full phonebook size',
          },
        ].map(({ cat, limit, note }) => (
          <div
            key={cat}
            className="flex items-center justify-between bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold text-[#1a1a1a]">{cat}</div>
              <div className="text-xs text-[#525252] mt-0.5">{note}</div>
            </div>
            <div className="text-[#f97316] font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[#e5e5e5] bg-[#f8f8f8] p-4">
        <p className="text-sm font-semibold text-[#1a1a1a]">Why these limits?</p>
        <p className="mt-2 text-xs leading-relaxed text-[#525252]">
          WhatsApp enforces two ceilings on business accounts: a <em>speed</em> ceiling
          (~80 MPS sends) and a <em>volume</em> ceiling (unique customers initiated per
          rolling 24h, tiered: 250 → 1k → 10k → 100k → unlimited). We pace every request
          through both a portal API limiter (10/sec) and a per-instance WhatsApp call limiter
          (3 reads/sec / 2 mutations/sec) so production traffic stays well under both. Bulk
          campaigns adapt their throughput to queue depth, and the composer surfaces your
          daily usage with an upgrade-ready indicator at the 50% threshold.
        </p>
      </div>
    </motion.div>
  );
}
