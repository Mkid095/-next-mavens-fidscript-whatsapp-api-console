/**
 * NATS Publisher — publishes chatbot.inbound events to NATS.
 * The chatbot-worker subscribes and processes messages asynchronously.
 */
import { connect, type NatsConnection } from 'nats';

const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

let _nc: NatsConnection | null = null;

async function getConnection(): Promise<NatsConnection> {
  if (!_nc || !_nc.isClosed()) {
    _nc = await connect({ servers: NATS_URL, name: 'fidscript-api' });
  }
  return _nc;
}

export interface ChatbotInboundPayload {
  conversationId: string;
  customerId: string;
  contactId?: string;
  workspaceId: string;
  instanceId: string;
  instanceName: string;
  message: string;
  messageType: string;
  chatId: string;
  isGroup: boolean;
  senderName?: string;
  senderPhone?: string;
  groupJid?: string;
}

/**
 * Publish an inbound message to NATS for async chatbot processing.
 * Subject: chatbot.inbound.<workspace_id>
 */
export async function publishChatbotInbound(payload: ChatbotInboundPayload): Promise<void> {
  try {
    const nc = await getConnection();
    const subject = `chatbot.inbound.${payload.workspaceId}`;
    const data = JSON.stringify(payload);
    nc.publish(subject, new TextEncoder().encode(data));
    console.log(`[nats] Published chatbot.inbound for conv=${payload.conversationId} workspace=${payload.workspaceId}`);
  } catch (err) {
    // Non-fatal — log but don't block the webhook
    console.error('[nats] Failed to publish chatbot.inbound:', err);
  }
}

export async function closeNatsConnection(): Promise<void> {
  if (_nc && !_nc.isClosed()) {
    await _nc.close();
    _nc = null;
  }
}
