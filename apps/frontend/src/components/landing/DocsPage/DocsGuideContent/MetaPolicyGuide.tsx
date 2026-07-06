import React from 'react';
import { motion } from 'motion/react';
import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.js';

export function MetaPolicyGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Meta Policy Compliance</h1>
      <p className="text-sm text-[#8a886a] mb-8">WhatsApp enforces two hard ceilings on every business account. FIDScript paces your traffic so you stay well under both.</p>
      <h2 className="text-lg font-bold text-white mb-4">1. The two ceilings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <div className="bg-[#1a1910] border border-[#262413] rounded-2xl p-4">
          <p className="text-yellow-500 font-bold text-sm">Speed ceiling</p>
          <p className="text-3xl font-black text-white mt-2">~80 MPS</p>
          <p className="text-xs text-[#6a6c5d] mt-2">Max messages-per-second per phone number.</p>
        </div>
        <div className="bg-[#1a1910] border border-[#262413] rounded-2xl p-4">
          <p className="text-yellow-500 font-bold text-sm">Volume ceiling</p>
          <p className="text-3xl font-black text-white mt-2">250 / day → ~</p>
          <p className="text-xs text-[#6a6c5d] mt-2">Unique customers initiated in a rolling 24h, tiered by quality.</p>
        </div>
      </div>
      <h2 className="text-lg font-bold text-white mb-4">2. Quality rating tiers</h2>
      <div className="space-y-2 mb-8">
        {[
          { tier: 'Tier 0', limit: '250', note: 'New accounts and accounts with quality issues' },
          { tier: 'Tier 1', limit: '1,000', note: 'After sustained positive quality' },
          { tier: 'Tier 2', limit: '10,000', note: 'Strong quality over rolling 7 days' },
          { tier: 'Tier 3', limit: '100,000', note: 'Consistent high quality at scale' },
          { tier: 'Tier 4', limit: 'Unlimited', note: 'Reserved for very large senders' },
        ].map(({ tier, limit, note }) => (
          <div key={tier} className="flex items-center justify-between bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div><div className="text-sm font-semibold text-white">{tier}</div><div className="text-xs text-[#6a6c5d] mt-0.5">{note}</div></div>
            <div className="text-yellow-500 font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-bold text-white mb-4">3. Prohibited content categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        {['Adult / sexual content','Hate speech or threats','Weapons, explosives, ammunition','Drugs (recreational, prescription without verification)','Tobacco, vape, alcohol sales','Gambling, lotteries (without prior approval)','Medical, financial, legal advice (must disclaim)','Multi-level marketing / pyramid schemes','Crypto / forex / "get rich quick" schemes','Surveillance products','Adult dating services','Misleading health claims'].map((cat) => (
          <div key={cat} className="flex items-center gap-2 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2 text-xs text-red-200">
            <span className="text-red-400">✗</span>{cat}
          </div>
        ))}
      </div>
      <h2 className="text-lg font-bold text-white mb-4">4. How FIDScript enforces compliance</h2>
      <ul className="list-disc list-inside text-sm text-[#a8a594] space-y-2 mb-8">
        <li><strong className="text-white">Tier-aware volume cap</strong> — daily unique-customer initiations tracked against tier.</li>
        <li><strong className="text-white">Adaptive bulk pacing</strong> — 10 MPS at idle, ramps to 30 MPS @ queue ≥ 5,000.</li>
        <li><strong className="text-white">Per-instance rate limiter</strong> — 3 reads/sec/instance, 2 mutations/sec/instance.</li>
        <li><strong className="text-white">Hallucination policy</strong> — strict/balanced/creative/disabled per chatbot.</li>
        <li><strong className="text-white">Confidence threshold + handoff</strong> — below threshold hands off to human.</li>
        <li><strong className="text-white">24h session window</strong> — utility templates require recent user message.</li>
      </ul>
      <h2 className="text-lg font-bold text-white mb-4">5. Best practices for system_prompt</h2>
      <DocsCodeBlock code={`You are an assistant for ACME, a Kenyan e-commerce store.\n\nHard rules:\n- Never promise a refund, return, or legal outcome. If the user asks, respond: "I'll connect you with a manager."\n- Never give medical, legal, or financial advice. Respond: "I'm not qualified to advise on that."\n- Never discuss politics, religion, or competitor products.\n- Never claim to be a real person.\n- If you're not sure, say so. It's better to admit uncertainty than to guess.\n\nOperational:\n- Keep replies under 80 words. Use line breaks for lists.\n- If a user asks something outside your scope, hand off with a friendly note.`} lang="text" />
    </motion.div>
  );
}
