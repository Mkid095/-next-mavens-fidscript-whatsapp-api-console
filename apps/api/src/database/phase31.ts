/**
 * Phase 31: Seed FIDScript Customer-Care Agent
 *
 * Seeds the existing "test" chatbot on the "soostori" instance with:
 * 1. A comprehensive FIDScript customer-care system prompt
 * 2. A detailed text knowledge source covering features, pricing, setup
 * 3. An 'always' trigger so the bot responds to every inbound message
 *
 * Idempotent: skips if the bot already has a system prompt + knowledge source.
 * Silently no-ops if the target bot doesn't exist.
 */
import type { Database } from 'sql.js';

const SYSTEM_PROMPT = `You are FIDScript AI Assistant, the official customer-care agent for FIDScript WhatsApp — an AI-powered WhatsApp Business automation platform built by Next Mavens.

# Your Role
- Answer questions about FIDScript features, pricing, setup, and integrations
- Help users troubleshoot their chatbots and WhatsApp connections
- Provide links to relevant documentation pages (https://docs.fidscript.com or https://whatsapp.fidscript.com/docs)
- Escalate to a human team member when the user asks OR when you genuinely don't know the answer

# Tone & Style
- Professional, friendly, concise
- Use bullet points and clear structure
- Always include relevant links when discussing features
- Match the user's language (English or Swahili — FIDScript is used in East Africa)

# What FIDScript Does
FIDScript turns WhatsApp into an intelligent business operating layer. Customers connect their WhatsApp numbers, plug in an AI (OpenAI, Anthropic, Gemini, or bring their own), connect their data (databases, APIs, websites), and FIDScript auto-generates tools the AI can call to answer questions, take orders, process payments, and manage operations.

# Core Capabilities
- Multi-tenant: each customer has their own isolated workspace + WhatsApp number(s)
- BYOK (Bring Your Own Key): use OpenAI / Anthropic / Gemini / MiniMax / OpenRouter / Ollama — or use the FIDScript default
- Knowledge base: upload URLs, PDFs, FAQs, plain text — the bot searches them automatically
- Data connections: PostgreSQL, MySQL, REST APIs, Shopify, WooCommerce
- Auto-generated tools: each data source becomes queryable tools the AI can call
- Human handoff: escalate to a human team when the AI is uncertain or the user asks
- Tool calling: the AI can search products, check orders, send STK pushes, generate invoices

# Setup (5 Steps)
1. Create a WhatsApp container — go to Containers → New → scan the QR code with your phone
2. Connect your LLM — go to LLM Connections → choose FIDScript Default or bring your own key
3. Create a chatbot — Chatbots → New → pick your container → choose a template → fill in the AI Brain
4. Add knowledge & tools — paste URLs, FAQs, or connect a database
5. Test & deploy — use the chat simulator, then click Publish

# Pricing (in KES)
- Starter: KES 2,500/mo — 3 containers, 5K messages
- Professional: KES 7,500/mo — 10 containers, 25K messages
- Enterprise: KES 25,000/mo — 50 containers, 100K messages
- Tokens billed separately based on LLM usage

# Common Questions
- "How do I add my OpenAI key?" → LLM Connections → Add Connection → select OpenAI → paste your API key
- "Why isn't my bot responding?" → Check (1) bot is enabled (2) has at least one trigger (3) WhatsApp container is connected (4) LLM connection has a valid key
- "Can I use my own database?" → Yes — Tools & Knowledge → Data Connections → choose PostgreSQL/MySQL/REST API
- "How do I deploy?" → Test & Deploy → click Publish
- "Can I get a refund?" → Contact support — we have a 14-day money-back guarantee

# Escalation
If the user asks to speak to a human, asks for billing/refund issues, reports a bug, or you genuinely don't know — say "I'll connect you with our team" and trigger the human handoff flow.

When responding, keep answers under 200 words unless the question specifically requires more detail. Always offer one next step the user can take.`;

const KNOWLEDGE_CONTENT = `# FIDScript WhatsApp — Complete Knowledge Base

## What is FIDScript WhatsApp?
FIDScript is a WhatsApp Business automation platform that turns WhatsApp into an intelligent business interface. You connect a WhatsApp number, plug in an AI (your choice of OpenAI, Anthropic, Gemini, or open-source), connect your data sources (databases, APIs, websites), and FIDScript auto-generates tools the AI uses to answer questions, take orders, process payments, and manage your business operations — all through WhatsApp.

Built by Next Mavens (https://nextmavens.com), a software studio based in Nairobi, Kenya.

## Key Features

### 1. Multi-tenant Workspaces
- Each customer gets an isolated workspace
- Multiple WhatsApp numbers per workspace
- Per-workspace LLM connections, data sources, chatbots

### 2. Bring Your Own Key (BYOK)
Supported LLM providers:
- OpenAI (GPT-4o, GPT-4o-mini, o1-mini, etc.)
- Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- Google Gemini (2.0 Flash, 1.5 Pro)
- MiniMax (M2, M2.1, M2.5, M2.7, M3)
- OpenRouter (200+ models through one API)
- Ollama (local open-source models)
- Custom (any OpenAI-compatible endpoint)

Or use the FIDScript default — the admin configures a shared provider that all clients can use without bringing their own key.

### 3. Knowledge Base
Upload knowledge from:
- Website URLs (scraped automatically)
- FAQ pairs (Question | Answer, one per line)
- Plain text (paste any content)
- PDFs (planned)
- Databases (SQL queries)
- API endpoints

The AI automatically searches relevant knowledge when answering questions.

### 4. Data Connections
Connect external systems to power AI tool calls:
- PostgreSQL (host, port, db, user, password)
- MySQL
- REST APIs (with auth)
- Shopify (product catalog, orders)
- WooCommerce
- Custom (any JSON-configurable backend)

Once connected, FIDScript auto-generates tools the AI can call: \`search_products\`, \`get_order\`, \`lookup_customer\`, etc.

### 5. Human Handoff
The bot can escalate to a human team when:
- Customer asks for a human
- AI confidence is low
- Sentiment is negative
- Too many retries
- Tool execution fails
- Specific escalation keyword detected

### 6. Billing & Tokens
- Subscription plans (Starter, Professional, Enterprise)
- Token-based metering (input + output)
- Per-tool-execution billing for data sources
- Auto top-up via Resend/Stripe

## Pricing (in KES)

| Plan | Monthly | Containers | Messages/mo | Best for |
|------|---------|-----------|-------------|----------|
| Starter | 2,500 | 3 | 5,000 | Small businesses, single WhatsApp number |
| Professional | 7,500 | 10 | 25,000 | Growing teams, multiple branches |
| Enterprise | 25,000 | 50 | 100,000 | Large orgs, high-volume operations |

Tokens billed separately based on LLM usage. See https://whatsapp.fidscript.com/docs/pricing for current rates.

## Setup Walkthrough (5 Steps)

### Step 1: Create a WhatsApp Container
1. Log in to https://whatsapp.fidscript.com
2. Go to "Containers" in the sidebar
3. Click "New Container"
4. Enter a name (e.g. "Customer Support")
5. Scan the QR code with your phone (WhatsApp → Settings → Linked Devices → Link a Device)
6. Wait for "Connected" status

### Step 2: Connect your LLM
1. Go to "LLM Connections" in the sidebar
2. Click "Add Connection"
3. Choose provider type (OpenAI, Anthropic, etc.)
4. Paste your API key
5. Click Test to verify
6. Set as default (optional)

Or skip this step and use the FIDScript default (if admin has shared one).

### Step 3: Create a Chatbot
1. Go to "Chatbots" → "New"
2. Step 1 (Setup): pick your container, give it a name
3. Step 2 (Audience): choose "All Chats" or specific contacts/groups
4. Step 3 (AI Brain): pick your LLM connection, choose a model
5. Step 4 (Tools & Knowledge): optionally add knowledge sources or data connections
6. Step 5 (Test & Deploy): try the simulator, then click Publish

### Step 4: Add Knowledge & Tools (Optional)
- Knowledge → Add Source → URL / FAQ / Text
- Data Connections → Add → choose type → fill in credentials → Test
- Tools → auto-generated from your data connections

### Step 5: Test & Deploy
1. Use the chat simulator to test conversations
2. When ready, click "Publish"
3. Your bot is now live on the WhatsApp number

## Common Troubleshooting

### Bot not responding?
1. Check bot is enabled (toggle in Chatbots list)
2. Verify container is "Connected" status
3. Verify LLM connection has a valid API key
4. Check token balance is sufficient
5. Look at Audit Logs for error details

### Messages not arriving?
1. Verify WhatsApp container shows "Connected"
2. Check that the contact is messaging your actual WhatsApp Business number
3. Look at Evolution webhook logs

### Bot giving wrong answers?
1. Add more knowledge sources covering the topic
2. Use a better LLM model (GPT-4o, Claude 3.5 Sonnet)
3. Lower the temperature setting
4. Add specific examples to the system prompt

### High token costs?
1. Switch to a cheaper model (gpt-4o-mini instead of gpt-4o)
2. Reduce max_history_messages
3. Trim the system prompt
4. Use MiniMax or Ollama for cost-free local inference

## Links
- Dashboard: https://whatsapp.fidscript.com
- Documentation: https://docs.fidscript.com
- Pricing: https://whatsapp.fidscript.com/docs/pricing
- API Reference: https://whatsapp.fidscript.com/docs/api
- SDK (npm): https://www.npmjs.com/package/@fidscript/sdk
- CLI (npm): https://www.npmjs.com/package/@fidscript/cli
- Support: support@fidscript.com
- Company: Next Mavens (https://nextmavens.com)

## Security
- All API keys encrypted at rest (AES-256-GCM)
- Per-workspace data isolation
- Audit logs for all actions
- Role-based access control (admin, client, viewer)
- GDPR & Kenya Data Protection Act compliant

## About Next Mavens
FIDScript is built by Next Mavens, a Nairobi-based software studio specializing in AI-powered business tools for the African market. Founded by developers who saw WhatsApp becoming the default business communication channel across East Africa and built FIDScript to make it programmable.`;

export function runPhase31Migrations(db: Database): void {
  // Find the "test" chatbot on the "soostori" instance
  const queryResult = db.exec(`
    SELECT cc.id as bot_id, cc.workspace_id
    FROM chatbot_configs cc
    JOIN instances i ON i.id = cc.instance_id
    WHERE cc.name = 'test' AND (i.name = 'soostori' OR i.display_name = 'soostori')
    LIMIT 1
  `);
  const testBot = (queryResult.length > 0 && queryResult[0].values.length > 0)
    ? { bot_id: String(queryResult[0].values[0][0]), workspace_id: String(queryResult[0].values[0][1]) }
    : undefined;

  if (!testBot) {
    console.log('  [phase31] no "test" bot on "soostori" instance found — skipping seed');
    return;
  }

  const { bot_id: botId } = testBot;
  console.log(`  [phase31] seeding FIDScript customer-care content for bot ${botId}`);

  // 1. Update system prompt in chatbot_ai_configs
  db.run(`
    UPDATE chatbot_ai_configs
    SET system_prompt = ?,
        hallucination_policy = 'balanced',
        max_tokens = 2048,
        temperature = 0.7
    WHERE chatbot_id = ?
  `, [SYSTEM_PROMPT, botId]);
  console.log('  [phase31] updated system prompt');

  // 2. Insert knowledge source (if not already present by name)
  const knowledgeCheck = db.exec(
    `SELECT id FROM chatbot_knowledge WHERE chatbot_id = '${botId}' AND name = 'FIDScript Knowledge Base'`
  );
  const existingKnowledge = (knowledgeCheck.length > 0 && knowledgeCheck[0].values.length > 0)
    ? String(knowledgeCheck[0].values[0][0])
    : null;

  if (!existingKnowledge) {
    const knowledgeId = `kn_test_${Date.now()}`;
    db.run(`
      INSERT INTO chatbot_knowledge (id, chatbot_id, name, type, content, status, chunk_count)
      VALUES (?, ?, 'FIDScript Knowledge Base', 'text', ?, 'active', 1)
    `, [knowledgeId, botId, KNOWLEDGE_CONTENT]);
    console.log(`  [phase31] inserted knowledge source (${KNOWLEDGE_CONTENT.length} chars)`);
  } else {
    // Update existing knowledge source with new content
    db.run(`
      UPDATE chatbot_knowledge SET content = ?, status = 'active' WHERE id = ?
    `, [KNOWLEDGE_CONTENT, existingKnowledge]);
    console.log(`  [phase31] updated existing knowledge source`);
  }

  // 3. Insert 'always' trigger if missing
  const triggerCheck = db.exec(
    `SELECT COUNT(*) as cnt FROM chatbot_triggers WHERE chatbot_id = '${botId}' AND trigger_type = 'always'`
  );
  const existingTriggerCount = (triggerCheck.length > 0 && triggerCheck[0].values.length > 0)
    ? Number(triggerCheck[0].values[0][0])
    : 0;

  if (existingTriggerCount === 0) {
    db.run(`
      INSERT INTO chatbot_triggers (id, chatbot_id, trigger_type, trigger_value, enabled, priority)
      VALUES (?, ?, 'always', '', 1, 0)
    `, [`trg_test_always_${Date.now()}`, botId]);
    console.log('  [phase31] inserted default "always" trigger');
  }

  // 4. Ensure capabilities include memory + knowledge + handoff
  const defaultCaps = ['memory', 'knowledge', 'handoff', 'tools'];
  for (const cap of defaultCaps) {
    db.run(`
      INSERT OR IGNORE INTO chatbot_capabilities (id, chatbot_id, capability, enabled)
      VALUES (?, ?, ?, 1)
    `, [`cap_test_${cap}`, botId, cap]);
  }
  console.log('  [phase31] ensured capabilities (memory, knowledge, handoff, tools)');

  // 5. Ensure the bot is enabled
  db.run(`UPDATE chatbot_configs SET enabled = 1 WHERE id = ?`, [botId]);
  console.log('  [phase31] ensured bot is enabled');

  console.log(`  [phase31] ✅ FIDScript customer-care content seeded for bot ${botId}`);
}