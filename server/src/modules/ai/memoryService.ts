/**
 * Memory KV Store — short-term + long-term memory per conversation.
 *
 * Short-term: recent messages within a session window (auto-expires)
 * Long-term: explicitly stored facts/preferences (persisted until overwritten)
 * Fact: structured key-value extracted from conversation
 * Preference: user preference learned over time
 * Intent: last detected intent
 */
import db, { saveDatabase } from '../../database.js';

export interface MemoryEntry {
  id: string;
  chatbotId: string;
  conversationId: string;
  memoryType: 'short_term' | 'long_term' | 'fact' | 'preference' | 'intent';
  memoryKey: string;
  memoryValue: string;
  confidence: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemorySummary {
  shortTerm: string[];
  longTerm: Array<{ key: string; value: string; confidence: number }>;
  facts: Array<{ key: string; value: string; confidence: number }>;
  preferences: Array<{ key: string; value: string; confidence: number }>;
  lastIntent?: string;
}

/**
 * Save a memory entry. Upserts on (chatbot_id, conversation_id, memory_type, memory_key).
 */
export function saveMemory(
  chatbotId: string,
  conversationId: string,
  memoryType: MemoryEntry['memoryType'],
  memoryKey: string,
  memoryValue: string,
  confidence = 1.0,
  expiresAt?: string
): void {
  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`INSERT INTO chatbot_memories
    (id, chatbot_id, conversation_id, memory_type, memory_key, memory_value, confidence, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chatbot_id, conversation_id, memory_type, memory_key)
    DO UPDATE SET memory_value = excluded.memory_value, confidence = excluded.confidence, updated_at = excluded.updated_at`
  ).run(id, chatbotId, conversationId, memoryType, memoryKey, memoryValue, confidence, expiresAt ?? null, now, now);
  saveDatabase();
}

/**
 * Load all memory for a conversation, grouped by type.
 */
export function loadMemory(conversationId: string, chatbotId: string): MemorySummary {
  const rows = db.prepare(`
    SELECT * FROM chatbot_memories
    WHERE conversation_id = ? AND chatbot_id = ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY memory_type, updated_at DESC
  `).all(conversationId, chatbotId) as unknown as MemoryEntry[];

  const shortTerm: string[] = [];
  const longTerm: Array<{ key: string; value: string; confidence: number }> = [];
  const facts: Array<{ key: string; value: string; confidence: number }> = [];
  const preferences: Array<{ key: string; value: string; confidence: number }> = [];
  let lastIntent: string | undefined;

  for (const row of rows) {
    const entry = { key: row.memoryKey, value: row.memoryValue, confidence: row.confidence };
    switch (row.memoryType) {
      case 'short_term': shortTerm.push(row.memoryValue); break;
      case 'long_term':  longTerm.push(entry); break;
      case 'fact':       facts.push(entry); break;
      case 'preference':  preferences.push(entry); break;
      case 'intent':     lastIntent = row.memoryValue; break;
    }
  }

  return { shortTerm, longTerm, facts, preferences, lastIntent };
}

/**
 * Format memory into a string suitable for LLM context injection.
 */
export function formatMemoryContext(memory: MemorySummary): string {
  const parts: string[] = [];

  if (memory.facts.length > 0) {
    const facts = memory.facts.map(f => `  ${f.key}: ${f.value}`).join('\n');
    parts.push(`FACTS:\n${facts}`);
  }

  if (memory.preferences.length > 0) {
    const prefs = memory.preferences.map(p => `  ${p.key}: ${p.value}`).join('\n');
    parts.push(`PREFERENCES:\n${prefs}`);
  }

  if (memory.lastIntent) {
    parts.push(`LAST INTENT: ${memory.lastIntent}`);
  }

  if (memory.shortTerm.length > 0) {
    const recent = memory.shortTerm.slice(-5).join(' | ');
    parts.push(`RECENT CONTEXT: ${recent}`);
  }

  return parts.length > 0 ? `\n--- MEMORY ---\n${parts.join('\n')}\n--- END MEMORY ---\n` : '';
}

/**
 * Prune expired memories (call occasionally, e.g. daily cron).
 */
export function pruneExpiredMemory(): number {
  const result = db.prepare(`
    DELETE FROM chatbot_memories
    WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
  `).run();
  saveDatabase();
  return result.changes;
}

/**
 * Save conversation context key-value (ephemeral, not memory-type).
 */
export function setContext(conversationId: string, key: string, value: string): void {
  const id = `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`INSERT INTO conversation_context
    (id, conversation_id, context_key, context_value, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(conversation_id, context_key)
    DO UPDATE SET context_value = excluded.context_value, updated_at = excluded.updated_at`
  ).run(id, conversationId, key, value);
  saveDatabase();
}

export function getContext(conversationId: string, key: string): string | null {
  const row = db.prepare(
    'SELECT context_value FROM conversation_context WHERE conversation_id = ? AND context_key = ?'
  ).get(conversationId, key) as { context_value: string } | undefined;
  return row?.context_value ?? null;
}
