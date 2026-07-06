/**
 * Chatbot Worker — helper utilities.
 * Extracted from messageHandler.ts to keep it under 150 lines.
 */

import db from '../database.js';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
if (!EVOLUTION_API_KEY) {
  throw new Error('EVOLUTION_API_KEY environment variable is required');
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Conversation lock ────────────────────────────────────────────────────────

export interface LockResult { acquired: boolean; workerId: string | null }

export function acquireConversationLock(
  conversationId: string,
  sim: boolean,
): LockResult {
  if (sim) return { acquired: true, workerId: null };

  const workerId = `worker_${process.pid}_${Date.now()}`;
  const existing = db.prepare(
    'SELECT worker_id FROM chatbot_conversation_locks WHERE conversation_id = ?',
  ).get(conversationId) as { worker_id: string } | undefined;

  if (!existing) {
    db.prepare(
      'INSERT INTO chatbot_conversation_locks (conversation_id, chatbot_id, locked_at, worker_id) VALUES (?, ?, ?, ?)',
    ).run(conversationId, 'pending', new Date().toISOString(), workerId);
    return { acquired: true, workerId };
  }

  const existingRow = db.prepare(
    'SELECT worker_id, locked_at FROM chatbot_conversation_locks WHERE conversation_id = ?',
  ).get(conversationId) as { worker_id: string; locked_at: string } | undefined;

  if (existingRow && existingRow.worker_id !== workerId) {
    const lockAge = Date.now() - new Date(existingRow.locked_at).getTime();
    if (lockAge < 5 * 60 * 1000) {
      return { acquired: false, workerId: null };
    }
    db.prepare(
      'UPDATE chatbot_conversation_locks SET worker_id = ?, locked_at = ? WHERE conversation_id = ?',
    ).run(workerId, new Date().toISOString(), conversationId);
  }
  return { acquired: true, workerId };
}

export function releaseConversationLock(conversationId: string, workerId: string | null): void {
  if (!workerId) return;
  db.prepare('DELETE FROM chatbot_conversation_locks WHERE conversation_id = ? AND worker_id = ?')
    .run(conversationId, workerId);
}

// ─── WhatsApp sender ──────────────────────────────────────────────────────────

export interface SendResult { ok: boolean; status: number; error?: string }

export async function sendWhatsAppText(
  instanceName: string,
  chatId: string,
  text: string,
): Promise<SendResult> {
  // Defensive: never send back to the connected WhatsApp account itself.
  const inst = db.prepare(
    'SELECT phone_number FROM instances WHERE evolution_name = ? OR name = ? LIMIT 1',
  ).get(instanceName, instanceName) as { phone_number?: string } | undefined;
  const botPhone = inst?.phone_number ? inst.phone_number.replace(/^\+/, '') : null;
  const targetNumeric = chatId.replace(/@lid$/, '').replace(/^\+/, '').split('@')[0];
  if (botPhone && targetNumeric === botPhone) {
    console.error(`[worker] BLOCKED self-send: chatId=${chatId} matches instance phone ${botPhone}`);
    return { ok: false, status: 0, error: 'self_send_blocked' };
  }

  let sendTo = chatId;
  const numericId = chatId.replace(/@lid$/, '').replace(/^\+/, '');

  const ident = db.prepare(`
    SELECT ci.customer_id FROM customer_identifiers ci
    WHERE ci.value = ? OR REPLACE(ci.value, '+', '') = ? OR ci.value = ?
    LIMIT 1
  `).get(chatId, numericId, `${numericId}@lid`) as { customer_id: string } | undefined;

  if (ident?.customer_id) {
    const conv = db.prepare(`
      SELECT chat_id FROM conversations
      WHERE customer_id = ? AND channel = 'whatsapp'
      ORDER BY length(chat_id) DESC, chat_id ASC
      LIMIT 1
    `).get(ident.customer_id) as { chat_id: string } | undefined;

    if (conv?.chat_id) {
      if (conv.chat_id.startsWith('+')) {
        sendTo = conv.chat_id;
      } else if (/^\d+$/.test(conv.chat_id)) {
        sendTo = '+' + conv.chat_id;
      } else if (conv.chat_id.includes('@')) {
        const phonePart = conv.chat_id.split('@')[0].replace(/^\+/, '');
        if (/^\d+$/.test(phonePart)) sendTo = '+' + phonePart;
        else sendTo = conv.chat_id;
      } else {
        sendTo = conv.chat_id;
      }
    }
  }

  const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number: sendTo, text }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[worker] WhatsApp send failed: ${res.status} ${err} (instance=${instanceName}, chat=${sendTo})`);
      return { ok: false, status: res.status, error: err };
    }
    console.log(`[worker] WhatsApp reply sent to ${sendTo} (resolved from ${chatId}) via ${instanceName} (${text.length} chars)`);
    return { ok: true, status: res.status };
  } catch (e) {
    console.error(`[worker] WhatsApp send network error: ${String(e)} (instance=${instanceName})`);
    return { ok: false, status: 0, error: String(e) };
  }
}
