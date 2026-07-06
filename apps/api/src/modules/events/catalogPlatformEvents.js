// Event catalog — AI + integration + order + knowledge interfaces.
export interface AiReplyGeneratedPayload { agentId: string; conversationId: string; messageId: string; confidence: number; }
export interface AiHandoffRequestedPayload { agentId: string; conversationId: string; reason: string; confidence: number; }
export interface AiStateChangedPayload {
  conversationId: string; state: 'ai_active' | 'ai_paused' | 'human_active' | 'escalated'; byUserId?: string;
}
export interface IntegrationConnectedPayload { integrationId: string; connector: string; }
export interface IntegrationSyncedPayload { integrationId: string; connector: string; eventCount: number; }
export interface OrderCreatedPayload { orderId: string; customerId: string; total: number; currency: string; }
export interface OrderFulfilledPayload { orderId: string; customerId: string; }
export interface InventoryUpdatedPayload { productId: string; connector: string; }
export interface KnowledgeIndexedPayload { sourceId: string; }
