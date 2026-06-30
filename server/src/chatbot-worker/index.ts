/**
 * Chatbot Worker — NATS subscriber for async chatbot processing.
 *
 * Listens on: chatbot.inbound.<workspace_id>
 * Message shape: { conversationId, customerId, contactId, workspaceId, instanceId, message, messageType, chatId }
 *
 * Pipeline:
 *   1. Receive message from NATS
 *   2. Load chatbot configs for instance/workspace
 *   3. Evaluate triggers + rules (chatbotEngine)
 *   4. If AI action → call LLM gateway
 *   5. Send reply via Evolution API
 *   6. Log token usage
 */
import { connect, type NatsConnection } from 'nats';
import { initializeDatabase, saveDatabase } from '../database/index.js';
import db from '../database.js';
import { pickBestBot, evaluateTriggers } from '../modules/ai/chatbotEngine.js';
import { LLMGateway } from '../modules/ai/llmGateway.js';
import { logChatbotToolCall } from './tools.js';
import { logTokenUsage } from './billing.js';
import { getRuntimeConfig } from './chatbotRuntimeCache.js';
import { traceAsync, insertTrace, recordResponseMetadata } from './tracing.js';
import { emitAiOverrideChanged } from '../utils/gateway.js';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? '';

interface InboundMessage {
  conversationId: string;
  customerId: string;
  contactId?: string;
  workspaceId: string;
  instanceId: string;
  instanceName?: string;
  message: string;
  messageType: string;
  chatId: string;
  isGroup: boolean;
  senderName?: string;
  senderPhone?: string;
  groupJid?: string;
}

let nc: NatsConnection;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWhatsAppText(instanceName: string, chatId: string, text: string): Promise<void> {
  const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: chatId,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[worker] WhatsApp send failed: ${res.status} ${err}`);
  }
}

/** Returns true if the manual override is still active (not expired). */
function isOverrideActive(row: { mode: string; expires_at?: string | null }): boolean {
  if (row.mode !== 'manual') return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at) > new Date();
}

/** Insert a timeline/audit message into inbox_messages. */
function insertTimelineMessage(conversationId: string, content: string, workspaceId: string): void {
  db.prepare(`INSERT INTO inbox_messages
    (id, conversation_id, workspace_id, from_number, from_name, message_type, content, direction, is_read, timestamp, is_system)
    VALUES (?, ?, ?, '', ?, 'text', ?, 'system', 1, ?, 1)`
  ).run(
    `sys_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId, workspaceId, content, new Date().toISOString(),
  );
}

async function processMessage(msg: InboundMessage): Promise<void> {
  const { conversationId, workspaceId, instanceId, instanceName, message, messageType, chatId, isGroup, contactId, groupJid } = msg;

  console.log(`[worker] Processing message in conv=${conversationId} instance=${instanceId}`);

  if (messageType !== 'text') return;

  // 1. Conversation lock — prevent duplicate processing when user spams "hi"
  const workerId = `worker_${process.pid}_${Date.now()}`;
  const acquired = db.prepare(
    'INSERT OR IGNORE INTO chatbot_conversation_locks (conversation_id, chatbot_id, locked_at, worker_id) VALUES (?, ?, ?, ?)'
  ).run(conversationId, 'pending', new Date().toISOString(), workerId);

  if (!acquired) {
    console.log(`[worker] Conversation ${conversationId} is locked — another worker is processing`);
    return;
  }

  let lockedBotId: string | null = null;

  try {
    // 2. Check for active human-takeover override
    const override = db.prepare(
      'SELECT mode, expires_at, resume_policy FROM chatbot_conversation_overrides WHERE conversation_id = ?'
    ).get(conversationId) as { mode: string; expires_at?: string | null; resume_policy?: string | null } | undefined;

    if (override?.mode === 'manual') {
      if (!isOverrideActive(override)) {
        // Expired — delete override, insert timeline, emit SSE, resume AI
        db.prepare('DELETE FROM chatbot_conversation_overrides WHERE conversation_id = ?').run(conversationId);
        insertTimelineMessage(conversationId, 'AI resumed automatically (override expired)', workspaceId);
        if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });
        console.log(`[worker] Override expired for ${conversationId} — AI resumed`);
      } else {
        console.log(`[worker] Conversation ${conversationId} has manual override — skipping AI`);
        return;
      }
    }

    // next_message resume: clear override after AI processes this message (one-shot manual)
    const willResumeNextMessage = override?.resume_policy === 'next_message';

    // 3. Find the best bot for this message
    const botId = pickBestBot(workspaceId, instanceId, message, contactId, conversationId, groupJid);
    if (!botId) {
      console.log(`[worker] No bot matched for message in conversation=${conversationId}`);
      return;
    }

    lockedBotId = botId;

    // 2b. Try to use runtime cache for compiled config
    const cached = getRuntimeConfig(botId);
    if (cached) {
      console.log(`[worker] Using cached runtime config for bot ${botId} (v${cached.compiledVersion})`);
    } else {
      console.log(`[worker] No cached config for bot ${botId} — will load from versions`);
    }

    const evalResult = evaluateTriggers(botId, message, { workspaceId, contactId, conversationId });
    insertTrace(conversationId, botId, workspaceId, 'trigger_eval', 0, {
      triggered: evalResult.shouldRespond,
      triggerId: evalResult.trigger.triggerId,
    });
    if (!evalResult.shouldRespond) {
      console.log(`[worker] Bot ${botId} did not trigger response`);
      return;
    }

    const { rule } = evalResult;

    // 2b. Handle non-AI actions
    if (rule.action === 'skip') {
      console.log(`[worker] Rule matched: skip (no response)`);
      return;
    }

    if (rule.action === 'manual') {
      // Flag for human agent — update conversation state
      console.log(`[worker] Rule matched: manual handoff`);
      db.prepare(`INSERT OR REPLACE INTO conversation_states (conversation_id, state, updated_at)
        VALUES (?, 'WAITING_AGENT', CURRENT_TIMESTAMP)`
      ).run(conversationId);
      saveDatabase();
      return;
    }

    if (rule.action === 'workflow') {
      // TODO: execute workflow nodes
      console.log(`[worker] Rule matched: workflow (not yet implemented)`);
      return;
    }

    // 3b. AI response
    const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ?').get(botId) as Record<string, unknown> | undefined;
    if (!bot) return;

    const aiConfig = db.prepare('SELECT * FROM chatbot_ai_configs WHERE chatbot_id = ?').get(botId) as Record<string, unknown> | undefined;
    if (!aiConfig) return;

    const policies = db.prepare('SELECT * FROM chatbot_response_policies WHERE chatbot_id = ?').get(botId) as Record<string, unknown> | undefined;

    // Load conversation history
    const history = db.prepare(`
      SELECT from_number, from_name, content, direction, timestamp
      FROM inbox_messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
      LIMIT ${Number(aiConfig.max_history_messages ?? 20) * 2}
    `).all(conversationId) as Record<string, string>[];

    const llmMessages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }> = [];

    // System prompt from AI config
    const systemPrompt = String(aiConfig.system_prompt ?? '');
    if (systemPrompt) llmMessages.push({ role: 'system', content: systemPrompt });

    // History as messages
    for (const h of history) {
      const role = h.direction === 'outgoing' ? 'model' : 'user';
      llmMessages.push({ role, content: h.content });
    }

    // Current message
    llmMessages.push({ role: 'user', content: message });

    try {
      const gateway = LLMGateway.resolve(botId, workspaceId);

      const response = await traceAsync(
        conversationId,
        botId,
        workspaceId,
        'llm_call',
        () => gateway.call({
          messages: llmMessages,
          systemPrompt,
          maxTokens: Number(aiConfig.max_tokens ?? 2048),
          temperature: Number(aiConfig.temperature ?? 0.7),
        }),
        (r) => ({ tokenCount: r.tokensUsed.total })
      );

      const { reply, confidence, tokensUsed } = response;

      // 4. Log token usage
      logTokenUsage(botId, conversationId, String(aiConfig.model ?? 'gemini'), tokensUsed.prompt, tokensUsed.completion, tokensUsed.total);

      // 5. Check confidence threshold
      const threshold = Number(policies?.confidence_threshold ?? 0.6);
      if (confidence < threshold) {
        console.log(`[worker] Low confidence ${confidence} < ${threshold} — escalate`);
        // TODO: escalate to human
      }

      // 6. Send reply via WhatsApp
      if (reply && instanceName) {
        await traceAsync(
          conversationId, botId, workspaceId, 'response_send',
          () => sendWhatsAppText(instanceName, chatId, reply),
          () => ({ triggered: true })
        );
        console.log(`[worker] Sent reply to ${chatId}: "${reply.slice(0, 50)}..."`);
      }

      // 7. Insert AI reply into inbox
      const messageId = `ai_${Date.now()}`;
      db.prepare(`INSERT INTO inbox_messages
        (id, workspace_id, customer_id, conversation_id, from_number, from_name, message_type, content, media_url, is_read, timestamp, direction)
        VALUES (?, ?, ?, ?, ?, ?, 'text', ?, '', 1, datetime('now'), 'outgoing')`
      ).run(messageId, workspaceId, msg.customerId, conversationId, chatId, String(bot.name ?? 'Bot'), reply);

      // 8. Record AI response explainability metadata
      recordResponseMetadata({
        messageId,
        chatbotId: botId,
        confidence,
        model: String(aiConfig.model ?? 'gemini'),
      });

      // next_message policy: after AI responds, clear override so next message goes to AI
      if (willResumeNextMessage) {
        db.prepare('DELETE FROM chatbot_conversation_overrides WHERE conversation_id = ?').run(conversationId);
        insertTimelineMessage(conversationId, 'AI resumed automatically (one-shot manual)', workspaceId);
        if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });
        console.log(`[worker] next_message policy — override cleared after AI response`);
      }

      saveDatabase();
    } catch (err) {
      console.error(`[worker] LLM call failed:`, err);
      // Send fallback
      const fallback = String(policies?.fallback_reply ?? 'Sorry, I could not process your request.');
      if (instanceName) await sendWhatsAppText(instanceName, chatId, fallback);
    } finally {
      // Always release the conversation lock
      if (lockedBotId) {
        db.prepare('DELETE FROM chatbot_conversation_locks WHERE conversation_id = ? AND chatbot_id = ?')
          .run(conversationId, lockedBotId);
      }
    }
  } catch (err) {
    console.error(`[worker] processMessage error:`, err);
  } finally {
    // Ensure lock is always released
    if (lockedBotId) {
      db.prepare('DELETE FROM chatbot_conversation_locks WHERE conversation_id = ? AND chatbot_id = ?')
        .run(conversationId, lockedBotId);
    }
  }
}

export async function startChatbotWorker(): Promise<void> {
  console.log(`[worker] Connecting to NATS at ${NATS_URL}...`);

  nc = await connect({ servers: NATS_URL, name: 'chatbot-worker' });
  console.log(`[worker] Connected to NATS`);

  // Background: clean up stale conversation locks (TTL 30s) every 30s.
  // This handles the case where a worker crashed without releasing a lock.
  setInterval(() => {
    try {
      const result = db.prepare(
        `DELETE FROM chatbot_conversation_locks WHERE locked_at < datetime('now', '-30 seconds')`
      ).run();
      if (result.changes > 0) {
        console.log(`[worker] Cleaned up ${result.changes} stale conversation lock(s)`);
      }
    } catch (_) { /* non-fatal */ }
  }, 30_000);

  // Subscribe to wildcard topic — workspace-specific subscriptions can be added
  // by matching subjects. For now, subscribe to all inbound events and filter
  // internally by workspaceId in the message payload.
  const sub = nc.subscribe('chatbot.inbound.>');
  console.log(`[worker] Subscribed to 'chatbot.inbound.>' (queue: chatbot-workers)`);

  (async () => {
    for await (const msg of sub) {
      try {
        const payload = JSON.parse(new TextDecoder().decode(msg.data)) as InboundMessage;
        await processMessage(payload);
      } catch (err) {
        console.error(`[worker] Error processing NATS message:`, err);
      }
    }
  })();
}

// ─── Standalone entry point ────────────────────────────────────────────────────

async function main() {
  await initializeDatabase();
  await startChatbotWorker();

  // Simple health server for Docker healthcheck
  const healthPort = Number(process.env.PORT ?? 8080);
  const { createServer } = await import('http');
  const server = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(healthPort, () => {
    console.log(`[worker] Health server listening on port ${healthPort}`);
  });

  console.log('[worker] Chatbot worker started — waiting for messages...');
}

main().catch(err => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
