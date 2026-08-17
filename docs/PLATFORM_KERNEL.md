# FIDScript Platform Kernel

## What IS the Kernel

The kernel is the minimal, stable layer that owns the **"what"** -- canonical definitions and lifecycle management of all business entities, the message ledger, and the audit trail. It is the single source of truth that every other part of the platform depends on. The kernel does not know about transport mechanisms, AI/LLM providers, or delivery specifics -- those are adapters that call into the kernel.

## What Belongs IN the Kernel

### Identity (`kernel/identity/`)

**Concept:** Multi-tenant workspace, billing account, human user.

**Files today:** `modules/platform/workspace/context.ts`, `modules/platform/workspace/scope.ts`, `modules/platform/workspace/can.ts`

**Boundary rule:** Every API request is scoped to a `WorkspaceContext`. If your code takes a `workspaceId` parameter, it operates on kernel concepts.

```typescript
// kernel/identity/WorkspaceContext.ts
export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  roleId: string;
  perms: string[];
}
```

**What stays outside:** Permission enforcement in route handlers (application layer reads `ctx.perms` but does not define the permission catalog).

---

### Business Entities (`kernel/entities/`)

**Concept:** Contact (phonebook entry), Conversation (thread = contact x channel x instance), and their lifecycle.

**Files today:** `modules/customers/resolveConversation.ts` -- the single chokepoint for customer + conversation resolution.

**Boundary rule:** Every inbound/outbound message routes through `resolveConversation()`. No other code creates customers or conversations directly.

```typescript
// kernel/entities/conversations.ts
export async function resolveConversation(
  ctx: WorkspaceContext,
  channel: 'whatsapp' | 'sms' | 'email' | 'instagram',
  identifier: string,
  instanceId?: string,
  displayName?: string | null,
  pushName?: string | null
): Promise<ResolveResult>
```

**What stays outside:** Contact import/export logic (application layer), contact display UI.

---

### Message Ledger (`kernel/ledger/`)

**Concept:** Immutable message records. `inbox_messages` is append-only after insert.

**Files today:** None yet -- messages are written directly in route handlers and services.

**Boundary rule:** `kernel/ledger/messages.ts` provides the single `appendMessage()` function. No direct `INSERT INTO inbox_messages` statements anywhere else.

---

### Audit Trail (`kernel/audit/`)

**Concept:** Immutable, append-only record of all state-changing operations.

**Files today:** `modules/platform/audit/trail.ts`, `modules/platform/audit/writer.ts`

**Boundary rule:** The audit trail is the safety net. Every significant state transition in the kernel must emit an event that the audit trail subscribes to.

```typescript
// kernel/audit/trail.ts
export function registerAuditTrail(): void {
  bus().subscribe('*', (envelope: WildcardEnvelope) => {
    // writes to audit_logs table
  });
}
```

---

### Event Registry (`kernel/events/`)

**Concept:** The platform event bus and the catalog of all domain event types. The bus is the kernel's internal communication mechanism.

**Files today:** `modules/platform/events/bus.ts`, `modules/platform/events/catalog.ts`, `modules/platform/events/dispatch/`

**Boundary rule:** Everything in the kernel communicates through the bus. No direct function calls between kernel submodules.

```typescript
// kernel/events/catalog.ts - event type definitions
export type DomainEventType =
  | 'message.received' | 'message.sent' | 'message.delivered'
  | 'conversation.created' | 'conversation.assigned' | 'conversation.status_changed'
  | 'customer.created' | 'customer.tagged' | 'customer.noted'
  | 'campaign.started' | 'campaign.completed'
  | 'automation.triggered' | 'ai.state_changed' | 'ai.handoff_requested'
  | ...
```

**What stays outside:** `modules/platform/analytics/` and `modules/platform/search/` are bus subscribers (consumers), not part of the kernel itself.

---

### Automation Rules (`kernel/automation/`)

**Concept:** Rule definitions and condition evaluation. A rule says "when conditions X are met, perform action Y."

**Files today:** `modules/automation/types.ts`, `modules/automation/engine/`, `modules/automation/loaders/`

**Boundary rule:** The automation engine evaluates conditions against the current state (contact, conversation, workspace). It does NOT send messages or call external services -- that is the dispatch adapter.

```typescript
// kernel/automation/types.ts
export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: Condition[];
  action: AutomationAction;
  enabled: boolean;
  priority: number;
}
```

**What stays outside:** The dispatch of automation actions (e.g., "send this WhatsApp message") is an adapter that the automation engine calls.

---

### Campaign Entities (`kernel/campaigns/`)

**Concept:** Campaign definition and metadata. The "what" a campaign is, not "how" it sends.

**Files today:** `modules/campaigns/index.ts` (thin barrel), `modules/campaigns/statuses.ts`, `modules/campaigns/triggers.ts`

**Boundary rule:** `kernel/campaigns/types.ts` defines `Campaign` and `CampaignStep`. The delivery/drip mechanics (dispatch, scheduling) are adapters.

---

## What Belongs OUTSIDE the Kernel (Adapters)

### AI Adapters

```
modules/ai/
├── adapters/           ← LLM provider implementations (anthropic, gemini, openrouter, byollm)
├── toolRunner/         ← Tool execution implementation
├── memoryService.ts    ← AI-specific conversation context
├── knowledgeService.ts ← AI-specific content indexing
├── promptService.ts    ← Prompt templating
└── chatbotEngine/      ← Trigger evaluation logic (⚠ see note below)
    ├── triggerEvaluator.ts   ← belongs in kernel/automation/
    └── chatbotEngineImpl.ts ← belongs in kernel/automation/
```

**Note on `chatbotEngine`:** The chatbot engine evaluates triggers and rules against a message. This logic is identical in intent to `kernel/automation/` -- it is automation specific to chatbots, not AI-specific. It should move into `kernel/automation/`.

### Transport Adapters

```
services/whatsapp/
├── messaging.ts        ← WhatsApp send implementations (sendText, sendMedia, etc.)
├── groups.ts           ← WhatsApp group operations
├── chats.ts            ← WhatsApp chat operations
└── instanceOps.ts      ← WhatsApp instance lifecycle
```

The WhatsApp service layer is a **transport adapter**. It receives a `kernel/entities/Message` and delivers it via the WhatsApp API. It does not define what a message is or manage conversation state.

### Campaign Delivery Adapters

```
modules/campaigns/
├── dispatch.ts         ← Calls whatsapp/messaging.ts to send (delivery mechanism)
├── drip.ts             ← Drip scheduling timing logic
└── statusScheduler.ts  ← Campaign status update scheduler
```

These are delivery adapters built on top of the `kernel/campaigns/` entity definitions.

### Analytics and Search (Post-Write Consumers)

```
modules/platform/analytics/   ← Bus subscribers that maintain read models
modules/platform/search/      ← Bus subscribers that maintain search index
```

These subscribe to kernel events and build read models. They do not write to kernel entities.

---

## The Core Rule

> **"If it knows about `workspace_id`, it belongs in or below the kernel."**

Any file that imports `WorkspaceContext` or operates on `workspaceId` is working with kernel concepts. The kernel is the only layer that directly touches `workspace_id` in its core definitions.

Application modules (campaigns, AI, chatbot publish) receive a `WorkspaceContext` but should not directly INSERT into workspace-scoped tables -- they call kernel functions.

---

## Why This Matters

A new developer asks: **"Where does X logic live?"**

| Question | Answer |
|---|---|
| Where is a customer created? | `kernel/entities/` -- `resolveConversation()` |
| Where is a message recorded? | `kernel/ledger/messages.appendMessage()` |
| Where are automation rules defined? | `kernel/automation/` |
| Where is the event bus? | `kernel/events/bus.ts` |
| Where is the audit trail? | `kernel/audit/trail.ts` |
| How does a campaign send a message? | Calls `kernel/ledger/messages.appendMessage()` then `services/whatsapp/messaging.ts` |
| How does AI respond to a message? | Subscribes to `kernel/events/bus.ts`, calls `kernel/automation/` |
| Where is campaign drip timing? | `modules/campaigns/drip.ts` (delivery adapter) |

---

## Migration: Moving Logic Into the Kernel

### Phase 1: Event Bus + Audit Trail (Low Risk) ✅ DONE

**Moves:**
- `modules/platform/events/bus.ts` → `kernel/events/bus.ts` ✅
- `modules/platform/events/catalog.ts` → `kernel/events/catalog.ts` ✅
- `modules/platform/events/dispatch/` → `kernel/events/dispatch/` ✅ (dispatch.ts + dispatchImpl.ts)
- `modules/platform/events/log.ts` → `kernel/events/log.ts` ✅
- `modules/platform/audit/trail.ts` → `kernel/audit/trail.ts` ✅
- `modules/platform/audit/writer.ts` → `kernel/audit/writer.ts` ✅
- `modules/platform/events/index.ts` → re-exports from `kernel/events/index.js` ✅
- `modules/platform/audit/index.ts` → re-exports from `kernel/audit/index.js` ✅

**Import changes:** Updated 11 files across analytics, search, webhooks, AI inbound, automation engine, campaigns, and server bootstrap. All imports now route through `modules/platform/events/index.js` and `modules/platform/audit/index.js` (forwarding re-export barrels) or directly to `kernel/events/index.js`.

**Risk:** Low. These are well-isolated with clear interfaces.

---

### Phase 2: Automation Rules (Low-Medium Risk) ✅ DONE

**Moves:**
- `modules/automation/types.ts` → `kernel/automation/types.ts` ✅
- `modules/automation/engine/` → `kernel/automation/engine/` ✅ (engine.ts + barrel)
- `modules/automation/loaders/` → `kernel/automation/loaders.ts` ✅
- `modules/automation/conditionEvaluator.js` → `kernel/automation/conditionEvaluator.ts` ✅
- `modules/ai/chatbotEngine/chatbotEngineImpl.ts` → `kernel/automation/chatbotEngine/chatbotEngineImpl.ts` ✅
- `modules/ai/chatbotEngine/triggerEvaluator.ts` → `kernel/automation/chatbotEngine/triggerEvaluator.ts` ✅
- `modules/automation/types/index.ts` → re-exports from `kernel/automation/types.ts` ✅
- `modules/automation/engine/index.ts` → re-exports from `kernel/automation/engine.js` ✅
- `modules/automation/loaders/index.ts` → re-exports from `kernel/automation/loaders.js` ✅
- `modules/ai/chatbotEngine/index.ts` → re-exports from `kernel/automation/chatbotEngine/index.js` ✅

**Import changes:** All callers continue to use existing `modules/automation/index.js` and `modules/ai/chatbotEngine/index.js` barrels (forwarding re-exports to kernel). No caller paths needed updating.

**Risk:** Medium. `evalCondition`/`triggerMatches` are duplicated across `kernel/automation/engine.ts` and `kernel/automation/conditionEvaluator.ts` - intentional (engine re-exports the pure evaluator). Chatbot engine DB queries extracted cleanly.

---

### Phase 3: Entities + Ledger (Medium Risk) ✅ DONE

**Moves:**
- `modules/customers/resolveConversation.ts` → `kernel/entities/conversations.ts` ✅
- New `kernel/entities/contacts.ts` (getCustomer, getConversation) ✅
- `modules/customers/index.ts` → re-exports from `kernel/entities/index.js` ✅
- `services/whatsapp/shared.ts` → imports from `kernel/entities/index.js` ✅
- `routes/webhookDispatchHandlers.ts` → imports from `kernel/entities/index.js` ✅
- `routes/webhook/messages.ts` → imports from `kernel/entities/index.js` ✅
- `routes/webhook/receipt.ts` → imports from `kernel/entities/index.js` ✅

**Note:** `kernel/entities/conversations.ts` now imports `dispatchCustomerCreated/dispatchConversationCreated` from `kernel/events/` (Phase 1 ✅) and `WorkspaceContext` from `kernel/identity/` (Phase 4 ✅).

**Risk:** Medium. `resolveConversation` is called in many places - all updated to `kernel/entities/index.js`.

---

### Phase 4: Identity (Low Risk) ✅ DONE

**Moves:**
- `modules/platform/workspace/context.ts` → `kernel/identity/context.ts` ✅
- `modules/platform/workspace/scope.ts` → `kernel/identity/scope.ts` ✅
- `modules/platform/workspace/can.ts` → `kernel/identity/can.ts` ✅
- `modules/platform/workspace/index.ts` → re-exports from `kernel/identity/index.js` + `tables.js` + `migrations.js` ✅

**Import changes:** All callers continue to use `modules/platform/workspace/index.js` (forwarding re-export barrel). `kernel/entities/conversations.ts` and `kernel/automation/engine.ts` now import `WorkspaceContext` from `kernel/identity/index.js` ✅.

**Risk:** Low. Pure rename - the interface does not change.

---

### Phase 5: Campaigns Entity (Low Risk) ✅ DONE

**Moves:**
- New `kernel/campaigns/types.ts` (Campaign, CampaignRecipient, CampaignTrigger, CampaignStep + bus payloads) ✅
- New `kernel/campaigns/index.ts` (barrel) ✅
- `modules/campaigns/index.ts` updated to re-export Campaign types from `kernel/campaigns/` ✅

**What stays in `modules/campaigns/`:** `dispatch.ts`, `drip.ts`, `triggers.ts`, `steps.ts`, `statuses.ts`, `statusScheduler.ts` - these are delivery mechanics (adapters), not entity definitions.

**Import changes:** None - `modules/campaigns/index.js` now additionally re-exports Campaign types from kernel.

**Risk:** Low. Only a new types file + barrel; delivery mechanics unchanged.

---

## Summary: What Stays Where

| Layer | Location | Examples |
|---|---|---|
| **Kernel** | `server/src/kernel/` | WorkspaceContext, **resolveConversation**, getCustomer, getConversation, event bus, audit trail, automation rules |
| **Application** | `server/src/modules/campaigns/`, `server/src/modules/automation/` | Campaign dispatch, drip timing, automation action dispatch |
| **AI Adapters** | `server/src/modules/ai/adapters/`, `server/src/modules/ai/toolRunner/` | LLM providers, tool execution, knowledge indexing |
| **Transport** | `server/src/services/whatsapp/` | WhatsApp senders, instance operations |
| **Consumers** | `server/src/modules/platform/analytics/`, `server/src/modules/platform/search/` | Analytics projectors, search indexer |
