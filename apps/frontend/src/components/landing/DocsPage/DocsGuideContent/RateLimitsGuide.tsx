import React from 'react';
import { motion } from 'motion/react';

export function RateLimitsGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Rate Limits</h1>
      <p className="text-sm text-[#8a886a] mb-8">Every request is paced through multiple layers so production traffic stays well under WhatsApp's account thresholds.</p>
      <div className="space-y-2">
        {[
          { cat: 'Chat reads (portal)', limit: '10/sec/client', note: 'Chat list, threads, profile-pic via /api/platform/*' },
          { cat: 'WhatsApp reads', limit: '3/sec/instance', note: 'Per-instance pacer; protects your account from blocks' },
          { cat: 'Mutations', limit: '2/sec/instance', note: 'markRead, group edits, settings, presence' },
          { cat: 'Bulk send', limit: '10 MPS (30 MPS @ queue ≥ 5,000)', note: 'Dynamic per-campaign pacing' },
          { cat: 'Volume (Tier 0)', limit: '250 unique/day', note: 'Tier 1: 1k · Tier 2: 10k · Tier 3: 100k · Tier 4: unlimited' },
          { cat: 'Phonebook sync', limit: '5/min', note: 'Manual trigger; use sparingly' },
        ].map(({ cat, limit, note }) => (
          <div key={cat} className="flex items-center justify-between bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div><div className="text-sm font-semibold text-white">{cat}</div><div className="text-xs text-[#6a6c5d] mt-0.5">{note}</div></div>
            <div className="text-yellow-500 font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[#262413] bg-[#1a1910] p-4">
        <p className="text-sm font-semibold text-white">Why these limits?</p>
        <p className="mt-2 text-xs leading-relaxed text-[#a8a594]">WhatsApp enforces a speed ceiling (~80 MPS) and a volume ceiling (unique customers per rolling 24h, tiered). We pace every request through both a portal API limiter (10/sec) and a per-instance WhatsApp call limiter (3 reads/sec / 2 mutations/sec).</p>
      </div>
    </motion.div>
  );
}
