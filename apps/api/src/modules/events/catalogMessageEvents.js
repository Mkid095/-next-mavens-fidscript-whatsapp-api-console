// Event catalog — message + conversation + SLA interfaces.
export interface MessageReceivedPayload {
  conversationId: string;
  customerId: string;
  channel: string;
  messageId: string;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  fromNumber: string;
  fromName?: string | null;
}
export interface MessageSentPayload {
  conversationId: string;
  customerId: string;
  messageId: string;
  messageType: string;
  content: string;
  toNumber: string;
}
export interface MessageDeliveredPayload { conversationId: string; messageId: string; }
export interface MessageReadPayload { conversationId: string; messageId: string; }
export interface MessageFailedPayload { conversationId: string; messageId: string; error: string; }
export interface ConversationCreatedPayload {
  conversationId: string; customerId: string; channel: string; instanceId?: string; chatId: string;
}
export interface ConversationAssignedPayload {
  conversationId: string; assigneeType: 'user' | 'team' | 'unassigned'; assigneeId: string | null; byUserId: string;
}
export interface ConversationPriorityChangedPayload {
  conversationId: string; priority: 'urgent' | 'high' | 'medium' | 'low'; byUserId: string;
}
export interface ConversationStatusChangedPayload {
  conversationId: string; status: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed'; byUserId?: string;
}
export interface SlaResponseDuePayload { conversationId: string; policyId: string; }
export interface SlaBreachedPayload { conversationId: string; policyId: string; kind: 'response' | 'resolution'; }
