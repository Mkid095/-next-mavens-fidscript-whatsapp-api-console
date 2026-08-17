# WhatsApp Meta Policy Compliance

> **Audited 2026-07-03 against v0.6.0.** This document audits every WhatsApp Business API rule that applies to our system and references the exact code that enforces each one. If you change any of the referenced files, update this document too.

---

## 1. Speed ceiling - ~80 MPS per account

**Meta rule:** WhatsApp enforces a hard ceiling of ~80 messages per second (MPS) per business account. Sending faster triggers account-level rate limits and can result in quality-rating downgrades.

**What we do:** Every send path is paced. The maximum we ever send is 30 MPS, even in the worst-case bulk-send scenario.

| Layer | Limit | Code |
|---|---|---|
| Portal read API (`/api/v1/*` reads - find-chats, find-messages, etc.) | 3 MPS per instance | `server/src/services/whatsapp/whatsappCallLimiter.ts:22` (`EVOLUTION_READ_MPS`, default 3) |
| Portal mutation API (`/api/v1/*` writes - markRead, group edits, etc.) | 2 MPS per instance | `server/src/services/whatsapp/whatsappCallLimiter.ts:23` (`EVOLUTION_MUTATION_MPS`, default 2) |
| Bulk send at idle | 10 MPS | `server/src/services/whatsapp/sendThroughput.ts:19` (`BULK_NORMAL_MPS`) |
| Bulk send when queue ≥ 5,000 | 30 MPS | `server/src/services/whatsapp/sendThroughput.ts:20` (`BULK_HIGH_QUEUE_MPS`) |

**Verification:** `fidscript tier` (alias `fidscript quota`) prints all current limits.

---

## 2. Volume ceiling - quality-rating tiers

**Meta rule:** Each business account has a quality rating (Tier 0–4) that caps the number of *unique customers* it can initiate a conversation with in a rolling 24-hour window.

| Tier | Cap (24h unique customers) | When you're placed here |
|---|---|---|
| 0 | 250 | New accounts + accounts with quality issues |
| 1 | 1,000 | Sustained positive quality |
| 2 | 10,000 | Strong quality over rolling 7 days |
| 3 | 100,000 | Consistent high quality at scale |
| 4 | Unlimited | Reserved for very large senders |

**What we do:** Every send is counted against the tier cap; sends past the cap are queued for the next 24h window - never dropped.

- Tier config: `server/src/services/whatsapp/outboundUsage.ts:36` (`TIER_LIMITS`)
- Tier resolution: `server/src/services/whatsapp/outboundUsage.ts:45` (env override `OUTBOUND_TIER` or derived from `clients.quality_rating`)
- Counter query: `server/src/services/whatsapp/outboundUsage.ts:66` (`uniqueInitiationsToday` - counts every `inbox_messages` row with `direction='outgoing'` in the last 24h)
- Queue-when-capped: `server/src/routes/campaignSend.ts:111` (rows past the tier limit get `status='skipped_tier_limit'`)
- CLI visibility: `fidscript tier` (added in v0.6.0) shows current plan, today's usage, and the tier table

**How users can see their tier:** `fidscript tier` (or `fidscript --json tier | jq`).

---

## 3. Prohibited content

**Meta rule:** WhatsApp explicitly bans certain categories of messages. Sending them risks account suspension regardless of tier.

**What we do:** We surface this in the public docs as a guide so users can write safer system prompts. The server-side chatbot engine respects each user's chosen hallucination policy (strict / balanced / creative / disabled) but does NOT pre-screen content - that responsibility lives with the user who writes the system_prompt.

- Public guide: `src/components/landing/DocsPage.tsx` (the "WhatsApp Meta Policy Compliance" guide inside the docs page sidebar - full list of 12 prohibited categories with system-prompt clauses that refuse + escalate each one)
- Reference in CLI docs: `docs/CLI.md §10` (hypothetical scenarios + best practices for system_prompt)
- Server enforcement: the system prompt is the user's contract. We strongly recommend:
  ```
  "If the user asks for a refund/return/legal advice, respond:
   'I'll connect you with a manager who can help' and trigger a handoff."
  ```

---

## 4. Hallucination policy

**Meta rule:** Bots that hallucinate (make up facts, give wrong answers) get user-blocks and reports, dragging down the quality rating.

**What we do:** Every chatbot has a `hallucination_policy` field with four modes. The publish pipeline bakes the policy into the deployed prompt and the runtime respects it.

| Mode | Behavior | When to use |
|---|---|---|
| `strict` | Refuse + hand off on low confidence | Customer support, legal, medical, financial - anything where wrong answers have consequences |
| `balanced` (default) | Hedge with confidence scores; auto-handoff under threshold | Most general-purpose bots |
| `creative` | Allow improvisation; rely on user feedback | Brainstorming, ideation, content generation |
| `disabled` | Pass through LLM output unchanged | DIY pipelines; you handle safety yourself |

- DB schema: `server/src/database/phase9.ts:46` (`hallucination_policy TEXT DEFAULT 'balanced'`)
- DB constraint: `server/src/database/phase9.ts:47` (`CHECK(hallucination_policy IN ('strict','balanced','creative','disabled'))`)
- Build-time enforcement: `server/src/modules/chatbot/publishPipeline.ts:98` (the policy is included in the prompt template)
- Runtime evaluator: `server/src/modules/ai/chatbotEngine.ts` (confidence threshold + handoff routing)
- CLI exposure: `fidscript chatbot ai-config <id> --hallucination-policy strict|balanced|creative|disabled`
- Public guide: `src/components/landing/DocsPage.tsx` (the "BYO LLM" guide explains the modes + their cost / safety tradeoffs)

---

## 5. 24h customer-service window

**Meta rule:** Outside the 24h window after a user's last message, you cannot send utility-template messages without an approved template.

**What we do:** We don't auto-template messages, so this rule applies at the bot-design layer:

- Bots that try to send after the 24h window are subject to a `confidence_threshold` check. Below threshold → handoff to a human team, not an auto-send.
- Documented in: `docs/CLI.md §5` (auth scenarios) + `src/components/landing/DocsPage.tsx` (Meta Policy guide)
- Server enforcement: `server/src/modules/ai/inbound.ts:15` (the response evaluator reads `escalateOnLowConfidence` and routes to handoff rather than auto-send)

---

## 6. Idempotency

**Meta rule:** Retries on the same message can double-charge and double-message. WhatsApp recommends idempotency keys on every send.

**What we do:** Every send endpoint accepts an `Idempotency-Key` header. The server stores the key + result for 7 days, so retries with the same key return the cached result without re-sending.

- Header support: `server/src/middleware/idempotency.ts`
- 7-day TTL: `server/src/index.ts:52` (pruned on every startup)
- Used by: `server/src/modules/campaigns/dispatch.ts:13` (the bulk-send dispatcher)
- CLI flag: `fidscript send text <instance> --to <num> --text "..." --idempotency-key <uuid>`

---

## 7. What we deliberately DON'T do

- **No content scanning server-side.** We don't pre-read your messages for prohibited content. The system_prompt you write is the contract. If you write a system_prompt that says "always comply with X," that's on you.
- **No message rewriting.** We never mutate the LLM's output before forwarding. What's in the LLM is what the user sees.
- **No dark-pattern hand-off suppression.** We don't disable the handoff mechanism to keep a low-quality bot running. Confidence threshold + handoff are always on.
- **No bypass of unique-customer limits.** The tier cap is enforced server-side. Agents can't crank up the cap from the CLI - the cap comes from the quality rating.

---

## 8. What a user must do to stay compliant

1. **Pick the right tier.** Run `fidscript tier` to see your current tier and headroom. Bump your plan if you're consistently near the cap.
2. **Pick the right hallucination policy.** For customer support, use `strict` + a confidence threshold of 0.7 or higher. For creative tasks, `balanced` is fine.
3. **Write a defensive system_prompt.** Cover: refunds, legal/medical/financial, prohibited categories, low-confidence handoff. See the example in the public docs.
4. **Watch the daily unique-customer counter.** Don't initiate more conversations than your tier allows; queued past-cap messages arrive hours late.
5. **Don't promise outcomes in the system_prompt.** "Always refund within 24h" → instant account-level risk.

---

## 9. Audit log

| Date | Version | Change |
|---|---|---|
| 2026-07-03 | v0.6.0 | First formal compliance audit. `docs/WHATSAPP_COMPLIANCE.md` created. `fidscript tier` command added to expose tier state to users. `fidscript refresh` command added for 24h JWT renewal. |
| 2026-06-20 | v0.3.0 | Idempotency keys standardized. |
| 2026-06-05 | v0.2.0 | Hallucination policy schema + 4 modes. |
| 2026-05-12 | v0.1.0 | Initial release with hardcoded tier 0 (250 customers/day). |
