/**
 * FIDScript Platform Kernel
 * =========================
 *
 * The kernel is the single source of truth for:
 *   - Platform identity (workspace, client, user)
 *   - Business entity lifecycle (contact, conversation, message)
 *   - Automation rule definitions
 *   - Campaign definitions
 *   - Immutable audit trail
 *   - Platform event registry
 *
 * The kernel does NOT know about:
 *   - WhatsApp-specific transport
 *   - AI/LLM providers or tool implementations
 *   - How campaigns are delivered (drip timing, dispatch mechanisms)
 *   - Analytics projectors or search indexing
 *
 * These are adapters/extensions that sit above the kernel and call into it.
 *
 * RULE: If a file imports workspace_id or WorkspaceContext, the logic it
 * implements belongs IN or BELOW the kernel, not scattered in application modules.
 *
 * Architecture:
 *
 *   Application Layer (campaigns, chatbot publish, AI adapters)
 *         |
 *         v
 *   ┌─────────────────────────────────────────────────┐
 *   │              PLATFORM KERNEL                     │
 *   │                                                  │
 *   │  identity/     — Workspace, Client, User        │
 *   │  entities/     — Contact, Conversation, Message │ ← resolveConversation, getCustomer, getConversation
 *   │  ledger/       — Message record CRUD            │
 *   │  audit/        — Immutable audit trail          │
 *   │  events/       — Event bus + catalog             │
 *   │  automation/   — Rule definitions + conditions  │
 *   │  campaigns/    — Campaign entity definitions    │
 *   └─────────────────────────────────────────────────┘
 *         |
 *         v
 *   Transport Adapters (WhatsApp service, NATS publisher)
 */

export const KERNEL_BOUNDS = {
  // Identity — multi-tenant workspace, billing account, human user
  Workspace: true,
  Client: true,
  User: true,

  // Business entities — lifecycle management
  Contact: true,      // phonebook contact (canonical identifier per channel)
  Conversation: true,  // thread: contact × channel × instance
  Message: true,       // immutable message record (inbox_messages)

  // Platform operations
  AuditLog: true,       // immutable, append-only audit trail
  AutomationRule: true, // rule definitions + condition schemas
  Campaign: true,       // campaign entity (not delivery/drip mechanics)

  // Event registry
  DomainEvent: true,    // event type catalog + bus interface
} as const;

export type KernelConcept = keyof typeof KERNEL_BOUNDS;
