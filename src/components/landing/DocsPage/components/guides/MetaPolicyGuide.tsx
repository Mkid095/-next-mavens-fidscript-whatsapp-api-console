import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';
import { PUBLIC_API_BASE } from '../../../../../data/apiEndpoints/index';

export function MetaPolicyGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">
        WhatsApp Meta Policy Compliance
      </h1>
      <p className="text-sm text-[#525252] mb-8">
        WhatsApp enforces two hard ceilings on every business account that uses the Business
        API. FIDScript paces your traffic through multiple layers so you stay well under both,
        but you should design your chatbot accordingly.
      </p>

      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">1. The two ceilings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-2xl p-4">
          <p className="text-[#f97316] font-bold text-sm">Speed ceiling</p>
          <p className="text-3xl font-black text-[#1a1a1a] mt-2">~80 MPS</p>
          <p className="text-xs text-[#525252] mt-2">
            Max messages-per-second per phone number. Bulk senders are paced adaptively.
          </p>
        </div>
        <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-2xl p-4">
          <p className="text-[#f97316] font-bold text-sm">Volume ceiling</p>
          <p className="text-3xl font-black text-[#1a1a1a] mt-2">250 / day → ∞</p>
          <p className="text-xs text-[#525252] mt-2">
            Unique customers initiated in a rolling 24h, tiered by quality rating.
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">2. Quality rating tiers</h2>
      <p className="text-xs text-[#525252] mb-3">
        Your tier is set by Meta based on the quality of conversations you have - recipient
        blocks, reports, and low engagement all drag it down. Higher tiers unlock higher
        volume.
      </p>
      <div className="space-y-2 mb-8">
        {[
          { tier: 'Tier 0', limit: '250', note: 'New accounts and accounts with quality issues' },
          { tier: 'Tier 1', limit: '1,000', note: 'After sustained positive quality' },
          { tier: 'Tier 2', limit: '10,000', note: 'Strong quality over rolling 7 days' },
          { tier: 'Tier 3', limit: '100,000', note: 'Consistent high quality at scale' },
          { tier: 'Tier 4', limit: 'Unlimited', note: 'Reserved for very large senders' },
        ].map(({ tier, limit, note }) => (
          <div
            key={tier}
            className="flex items-center justify-between bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl px-4 py-3"
          >
            <div>
              <div className="text-sm font-semibold text-[#1a1a1a]">{tier}</div>
              <div className="text-xs text-[#525252] mt-0.5">{note}</div>
            </div>
            <div className="text-[#f97316] font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">3. Prohibited content categories</h2>
      <p className="text-xs text-[#525252] mb-3">
        WhatsApp explicitly bans the following. Your chatbot's{' '}
        <code className="font-mono text-[#f97316]">system_prompt</code> should refuse or hand
        off on any of these - never try to comply:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        {[
          'Adult / sexual content',
          'Hate speech or threats',
          'Weapons, explosives, ammunition',
          'Drugs (recreational, prescription without verification)',
          'Tobacco, vape, alcohol sales',
          'Gambling, lotteries (without prior approval)',
          'Medical, financial, legal advice (must disclaim)',
          'Multi-level marketing / pyramid schemes',
          'Crypto / forex / "get rich quick" schemes',
          'Surveillance products',
          'Adult dating services',
          'Misleading health claims',
        ].map(cat => (
          <div
            key={cat}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800"
          >
            <span className="text-red-500">✗</span>
            {cat}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">4. How FIDScript enforces compliance</h2>
      <ul className="list-disc list-inside text-sm text-[#525252] space-y-2 mb-8">
        <li>
          <strong className="text-[#1a1a1a]">Tier-aware volume cap</strong> - daily unique-customer
          initiations are tracked against your tier. Sends past the cap are queued for the next
          24h window, never dropped.
        </li>
        <li>
          <strong className="text-[#1a1a1a]">Adaptive bulk pacing</strong> - 10 MPS at idle, ramps
          to 30 MPS when the queue hits 5,000+ (still well under Meta's 80 MPS cap).
        </li>
        <li>
          <strong className="text-[#1a1a1a]">Per-instance rate limiter</strong> - 3 reads/sec/instance
          and 2 mutations/sec/instance to prevent account-level blocks.
        </li>
        <li>
          <strong className="text-[#1a1a1a]">Hallucination policy</strong> - set per-chatbot.{' '}
          <code className="font-mono text-[#f97316]">strict</code> refuses on low confidence;{' '}
          <code className="font-mono text-[#f97316]">balanced</code> gives a hedged answer;{' '}
          <code className="font-mono text-[#f97316]">creative</code> lets the model improvise;{' '}
          <code className="font-mono text-[#f97316]">disabled</code> passes through unchanged.
        </li>
        <li>
          <strong className="text-[#1a1a1a]">Confidence threshold + handoff</strong> - below your
          configured threshold (e.g. 0.6), the bot hands the conversation to a human instead of
          risking a wrong answer that triggers a user block.
        </li>
        <li>
          <strong className="text-[#1a1a1a]">24h session window</strong> - utility templates can
          only be sent within 24h of the user's last message. Marketing templates require
          explicit opt-in via template approval.
        </li>
      </ul>

      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">
        5. Best practices for your system_prompt
      </h2>
      <p className="text-xs text-[#525252] mb-3">
        Configure <code className="font-mono text-[#f97316]">system_prompt</code>{' '}
        defensively. Recommended clauses to include:
      </p>
      <DocsCodeBlock
        code={`You are an assistant for ACME, a Kenyan e-commerce store.

Tone: warm, concise, never pushy. Reply in the user's language when you can detect it.

Hard rules:
- Never promise a refund, return, or legal outcome. If the user asks for one,
  respond: "I'll connect you with a manager who can help" and trigger a handoff.
- Never give medical, legal, or financial advice. Respond: "I'm not qualified
  to advise on that - please consult a professional."
- Never discuss politics, religion, or competitor products.
- Never claim to be a real person. You can say you're an AI assistant for ACME.
- If you're not sure, say so. It's better to admit uncertainty than to guess
  and risk the user being misled.

Operational:
- If you're confident in your answer, reply directly. If you have ANY doubt,
  ask a clarifying question or hand off.
- Keep replies under 80 words. Use line breaks for lists.
- If a user asks something outside your scope, hand off with a friendly note.`}
        lang="text"
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">6. When to hand off to a human</h2>
      <p className="text-xs text-[#525252] mb-3">
        Configure handoff conditions per chatbot. Examples of conditions that should always
        escalate:
      </p>
      <ul className="list-disc list-inside text-sm text-[#525252] space-y-1 mb-8">
        <li>User asks for a human / manager / supervisor</li>
        <li>User expresses frustration (sentiment below threshold)</li>
        <li>User requests a refund, return, cancellation, or account closure</li>
        <li>User reports a bug, abuse, or safety issue</li>
        <li>User asks about anything in the prohibited content list above</li>
        <li>Conversation has been going in circles (3+ ambiguous turns)</li>
        <li>Bot's own confidence score is below the configured threshold</li>
      </ul>

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">7. Monitoring your quality rating</h2>
      <DocsCodeBlock
        code={`# Check current tier + volume
curl ${PUBLIC_API_BASE.replace('/api/v1', '')}/api/auth/client/me \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Token forecast for next 30 days
fidscript --json chatbot token-forecast <chatbot-id>`}
        lang="bash"
      />
      <p className="text-xs text-[#525252] mt-3">
        If your quality rating drops, lower your tier limit, tighten the bot's handoff
        conditions, and review recent conversations for blocks or reports.
      </p>
    </motion.div>
  );
}
