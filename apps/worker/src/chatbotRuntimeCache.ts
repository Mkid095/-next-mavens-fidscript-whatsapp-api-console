/**
 * Chatbot Runtime Cache
 *
 * Write-through cache for compiled chatbot configuration.
 * Avoids hitting chatbot_versions on every inbound message.
 *
 * Strategy:
 *   - On publish: populate cache (write-through)
 *   - On message: check cache first → cache miss → load from chatbot_versions
 *   - No TTL needed: invalidated on next publish (upsert)
 */
import db from '../database.js';

interface RuntimeConfig {
  compiledPrompt: string;
  compiledTools: string;   // JSON array
  compiledCaps: string;   // JSON object
  compiledVersion: number;
}

export function getRuntimeConfig(chatbotId: string): RuntimeConfig | null {
  const row = db.prepare(
    'SELECT compiled_prompt, compiled_tools, compiled_capabilities, compiled_version FROM chatbot_runtime_configs WHERE chatbot_id = ?'
  ).get(chatbotId) as { compiled_prompt: string; compiled_tools: string; compiled_capabilities: string; compiled_version: number } | undefined;

  if (!row) return null;
  return {
    compiledPrompt: row.compiled_prompt,
    compiledTools: row.compiled_tools,
    compiledCaps: row.compiled_capabilities,
    compiledVersion: row.compiled_version,
  };
}

export function setRuntimeConfig(
  chatbotId: string,
  config: RuntimeConfig
): void {
  db.prepare(`INSERT OR REPLACE INTO chatbot_runtime_configs
    (chatbot_id, compiled_prompt, compiled_tools, compiled_caps, compiled_version, cached_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    chatbotId,
    config.compiledPrompt,
    config.compiledTools,
    config.compiledCaps,
    config.compiledVersion
  );
}

/**
 * Invalidate cache for a chatbot (called before republishing).
 */
export function invalidateCache(chatbotId: string): void {
  db.prepare('DELETE FROM chatbot_runtime_configs WHERE chatbot_id = ?').run(chatbotId);
}
