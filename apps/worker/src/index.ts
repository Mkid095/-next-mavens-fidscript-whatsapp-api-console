/**
 * Chatbot Worker — NATS subscriber entry point.
 *
 * Thin barrel: connects to NATS and dispatches inbound messages to processMessage.
 * All message processing logic lives in processMessage.ts.
 */
import { connect, type NatsConnection } from 'nats';
import { initializeDatabase } from '../database/index.js';
import db from '../database.js';
import { processMessage, type InboundMessage } from './processMessage.js';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

let nc: NatsConnection;

export async function startChatbotWorker(): Promise<void> {
  console.log(`[worker] Connecting to NATS at ${NATS_URL}...`);

  nc = await connect({ servers: NATS_URL, name: 'chatbot-worker' });
  console.log(`[worker] Connected to NATS`);

  // Background: clean up stale conversation locks (TTL 30s) every 30s.
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
