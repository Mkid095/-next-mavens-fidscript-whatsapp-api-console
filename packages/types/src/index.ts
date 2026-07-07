/**
 * index.ts — Main barrel for @fidscript/types
 * Re-exports all shared types.
 */

// Entities
export type { Instance, InstanceStatus, CreateInstance } from './entities.js';

// API
export type {
  ApiResponse,
  PaginatedResponse,
  Whoami,
  Usage,
  AnalyticsPeriod,
  MetricRollup,
  AnalyticsOverview,
  Customer,
  CustomerTimelineEvent,
  Conversation,
  ConversationStatus,
  ConversationPriority,
  ConversationMessage,
  Campaign,
  Webhook,
} from './api.js';

// WhatsApp messaging
export type {
  SendText,
  SendMedia,
  SendLocation,
  SendContact,
  SendReaction,
  SendPoll,
  SendList,
  SendAudio,
  SendSticker,
  SendStatus,
  ContactCard,
  MessageKey,
  ListSection,
  ListRow,
  SendResult,
} from './whatsapp.js';

// Chatbot & AI
export type {
  Chatbot,
  ChatbotHealth,
  ChatbotAiConfig,
  LlmConnection,
  CreateLlmConnection,
} from './chatbot.js';
