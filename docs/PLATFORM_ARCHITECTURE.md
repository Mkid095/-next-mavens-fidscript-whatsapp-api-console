# FIDScript — Platform Architecture Specification

> **Status:** Authoritative master spec (rev. 3 — 2026-06-15). This is the document the development team builds against before any further coding.
> **Supersedes:** `docs/CHAT_REDESIGN_SPEC.md` (the chat rebuild is now §13 inside this document).
> **Phase 1 (backend correctness) is shipped** (`74eb0fe`).
> **Phases 2-5 (Slices A-G) are shipped** (`f54efe9` — G-slice sweep). See [§23 Implementation status](#23-implementation-status) for the truthful per-section current state.

---

## Table of contents

1. [What FIDScript is becoming](#1-what-fidscript-is-becoming)
2. [Design principles](#2-design-principles)
3. [System architecture](#3-system-architecture)
4. [Workspace, teams & access control (foundation)](#4-workspace-teams--access-control-foundation)
5. [Event-driven core (the spine)](#5-event-driven-core-the-spine)
6. [Customer-centric data model](#6-customer-centric-data-model)
7. [The Customer Timeline](#7-the-customer-timeline)
8. [Universal Search](#8-universal-search)
9. [Inbox assignment, priority, status & SLA](#9-inbox-assignment-priority-status--sla)
10. [AI as a first-class system — governance & handoff](#10-ai-as-a-first-class-system--governance--handoff)
11. [Automation → Workflow Builder](#11-automation--workflow-builder)
12. [Integration Framework & channels](#12-integration-framework--channels)
13. [Analytics pipeline](#13-analytics-pipeline)
14. [Developer ecosystem](#14-developer-ecosystem)
15. [Campaigns → Marketing Center](#15-campaigns--marketing-center)
16. [Centralized data layer (frontend)](#16-centralized-data-layer-frontend)
17. [Feature-folder structure & file rules](#17-feature-folder-structure--file-rules)
18. [Icon & visual system (no emoji chrome)](#18-icon--visual-system-no-emoji-chrome)
19. [The Inbox — Phase 2 first surface](#19-the-inbox--phase-2-first-surface)
20. [Migration path from current code](#20-migration-path-from-current-code)
21. [Phased roadmap](#21-phased-roadmap)
22. [Conventions, guardrails & verification](#22-conventions-guardrails--verification)
23. [Implementation status](#23-implementation-status)

---

## 1. What FIDScript is becoming

Phase 1 fixed messaging so it works. Phase 2 onward builds the **platform around** messaging.

FIDScript is becoming a **Business Communications Operating System**: a single workspace where a business talks to customers, runs campaigns, automates work with AI, connects its store, collaborates as a team, and exposes everything to developers — with WhatsApp as the familiar interaction layer, not the ceiling.

> **The inbox is not the product. The inbox is the first *surface* that exposes the system.**
>
> The product is the chain:
> `Customer → Conversation → Events → AI → Automation → Commerce → Campaigns → Analytics`, wrapped in a workspace with teams, roles, and permissions.
>
> Phase 2 must lay that system — not redesign chat bubbles. Better bubbles have no strategic value; a customer timeline, an event bus, and an RBAC seam do.

The frame the team must adopt:

> **The UI feels like WhatsApp. The architecture behaves like a combination of WhatsApp Business, HubSpot, Intercom, Shopify Inbox, and an AI automation platform.**

**Non-goals for the spec itself:** this document does not schedule every feature. It fixes the architecture — tables, seams, events, permissions — so any feature can be added without rewrites, and it sequences the first concrete build.

---

## 2. Design principles

| # | Principle | What it means in practice |
|---|---|---|
| P1 | **Conversations are assets, not ephemera** | A conversation is a business record: assignee, priority, SLA, status, notes, tags, AI summary, customer link, full timeline. |
| P2 | **Model around customers, not messages** | The customer is the center. A customer owns conversations (across channels), orders, campaign touches, CRM rows, a timeline. |
| P3 | **AI is first-class — and governed** | AI is a platform subsystem (agent registry + knowledge + **permissions** + **human handoff**) that subscribes to events. It is never inlined into messaging, and it can never act beyond its granted permissions. |
| P4 | **Event-driven by default** | Every meaningful state change emits a domain event. AI, automations, analytics, search, timeline, webhooks, integrations are all *subscribers*. |
| P5 | **Channels & integrations are pluggable** | WhatsApp is one channel behind an interface; Shopify/Woo/etc. are connectors behind internal services. Adding either never touches the inbox, customer model, or event bus. |
| P6 | **Internal services are the only path to third parties** | AI and automations call internal services (Catalog, Orders, Knowledge), never a third-party API directly. |
| P7 | **Centralized data, decentralized UI** | Components consume data hooks; they never call the API directly. UI is split into feature folders. |
| P8 | **Build for the question** | Every decision must survive: *"Will this still work when we add teams, AI agents, automations, commerce, CRM, analytics, and developer apps?"* If not, redesign before implementing. |
| P9 | **Reserve the seam, ship the slice** | Define every table/event/permission now (cheap). Implement only the slice a phase needs. Never let a later feature be blocked by a missing seam. |
| P10 | **The system is the product; surfaces expose it** | The inbox, CRM, campaigns, analytics are thin UIs over the same event-driven core. Build the core first; the surfaces follow. |
| P11 | **Tenant isolation is a security guarantee** | Every read/write is implicitly scoped by `workspaceId` through a WorkspaceContext. No unscoped queries exist. One business can never see another's data — by construction, not convention. |
| P12 | **Interface, then implementation** | Cross-cutting machinery (event bus, search, analytics, queue) is consumed through an interface with one Phase-2 implementation. Swapping SQLite-FTS for Meilisearch, or the in-process bus for Redis, is then a one-impl change — not a rewrite. |

---

## 3. System architecture

### 3.1 Layered view

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React) — feature folders + centralized data layer      │
│  features/<domain> → data/hooks → data/api → data/providers       │
└──────────────────────────▲──────────────────────────────────────┘
                           │ REST (/api) + SSE (realtime)
┌──────────────────────────┴──────────────────────────────────────┐
│  Backend (Express)                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  HTTP routes (/api/v1 public, /api/* workspace+admin)       │ │
│  │  Auth: workspace-scoped JWT · API key · OAuth (future)      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Access control: can(user, perm, scope) — the one seam      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Domain modules: inbox, customers, campaigns, automation,   │ │
│  │    agents, search, analytics, integrations, developers…     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Event bus  ←─ subscribers: AI · automations · analytics ·  │ │
│  │                 timeline · search index · webhooks          │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Internal services: Catalog · Orders · Knowledge · Media    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Connectors / Channels: WhatsApp(Evolution) · Shopify · Woo │ │
│  │                          · HubSpot · Google Sheets · Zapier │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 The seams that make future integration cheap

1. **Workspace & access-control seam (§4)** — every request resolves to `(user, workspace, permissions)`. No feature adds ad-hoc role checks; all go through `can(user, perm, scope)`.
2. **Channel seam** — `server/src/channels/` exposes one interface (`send`, `receive`, `parse`, `identity`). Adding a channel = a folder.
3. **Integration/connector seam (§12)** — `server/src/integrations/connectors/<name>/` publishes events into the bus and exposes actions through internal services.
4. **Event bus (§5)** — the single place domain changes are announced, consumed through an `EventBus` interface (in-process now, Redis/Kafka/NATS later). Every cross-cutting feature subscribes here.
5. **Internal service seam** — `server/src/services/domain/` (Catalog, Orders, Knowledge, Media). AI/automations depend on these, never on third parties.
6. **Data-layer seam (frontend, §16)** — components depend on hooks; swapping cache or transport touches one layer.
7. **Tenant-isolation seam (§4.6)** — a WorkspaceContext threads `workspaceId` through every repository; unscoped queries cannot exist (P11).
8. **Audit seam (§6.4)** — every privileged mutation writes a before/after audit row, separate from domain events.
9. **Swap seams (P12)** — bus, search, and analytics are interface-first; Phase-2 implementations are replaceable without rewrites.

---

## 4. Workspace, teams & access control (foundation)

This is the most important foundational gap to close before features proliferate. Without it, every feature accumulates ad-hoc "is this the owner?" checks and multi-user teams become impossible.

### 4.1 Identity model

Today: `users` = admin accounts, `clients` = API clients (one identity each). Target: **one user identity**, belonging to **workspaces** with **roles**.

- A **workspace** is a business (1:1 with a `client` initially; the `client` is the billing owner). All domain data is scoped to `workspace_id`.
- A **user** can belong to many workspaces (invited as a member).
- A **member** row links user ↔ workspace with a **role**.
- A **role** grants a set of **permissions** (system roles + custom).
- Every privileged action calls `can(user, permissionKey, workspaceScope)`.

### 4.2 Tables

| Table | Purpose |
|---|---|
| `workspaces` | `id, client_id(owner), name, slug, plan_id, created_at` |
| `users` | `id, email, name, password_hash, avatar_url, default_workspace_id, created_at` *(unifies today's admin + client owners)* |
| `workspace_members` | `id, workspace_id, user_id, role_id, status('active'\|'invited'), invited_email, joined_at` |
| `teams` | `id, workspace_id, name` *(Support, Sales, Marketing…)* |
| `team_members` | `team_id, user_id` |
| `roles` | `id, workspace_id(NULL=system), name, is_system` *(Owner, Admin, Manager, Support Agent, Sales Agent, Marketing Agent, Custom)* |
| `permissions` | `id, key, description` *(catalog — see below)* |
| `role_permissions` | `role_id, permission_id` |

### 4.3 Permission catalog (append-only)

Grouped, namespaced keys. Each privileged server action asserts exactly one.

```
conversations.view · conversations.assign · conversations.delete
customers.view · customers.create · customers.update · customers.delete
customers.notes.write · customers.tags.manage
campaigns.view · campaigns.launch · campaigns.manage
agents.view · agents.manage · agents.publish           # publish = take live actions
automations.view · automations.manage
media.manage · status.manage
integrations.connect · integrations.manage
analytics.view
developers.keys.manage · developers.webhooks.manage · developers.apps.manage
workspace.members.manage · workspace.billing · workspace.settings
```

### 4.4 Auth & token model

- Workspace-scoped JWT carries `{ userId, workspaceId, roleId, perms[] }`, refreshed on role change.
- The existing `clientJwtAuth` evolves into `workspaceAuth` (which also satisfies today's client routes during migration). API-key auth (`clientApiKeyAuth`) remains for `/api/v1` and is workspace-scoped via the owning client.
- A single middleware attaches `req.workspace`, `req.user`, `req.can(perm)` to every request. Routes call `req.can('campaigns.launch')` — nothing hand-rolls role checks.

### 4.5 Migration bridge

`client_id = workspace_id` during transition (one workspace per client). Existing `client_id` columns are valid workspace scopes. The owner of each client becomes a `users` row with the `Owner` system role in their workspace. No big-bang rename; new tables key off `workspace_id`, a helper `workspaceIdOf(client)` bridges reads.

### 4.6 Tenant isolation (WorkspaceContext) — a security guarantee

Cross-tenant data leakage is the highest-severity bug class for a multi-business platform. Prevent it structurally, not by convention.

- A **WorkspaceContext** (`{ workspaceId, userId, role, perms }`) is attached to every request by the auth middleware and threaded through every repository/service.
- **Every query is workspace-scoped.** Repositories take the context and bake `WHERE workspace_id = ?` into every statement. A bare `SELECT * FROM conversations` with no workspace filter must not exist anywhere.
- Enforced by a repository base class that requires `workspaceId`, plus a review/lint rule — unscoped access is never the default.

This is P11: one business can never read another's data, by construction.

---

## 5. Event-driven core (the spine)

Build the skeleton in Phase 2; every later feature is a subscriber. This is the principle that prevents the second rewrite.

### 5.1 Event bus — interface first, in-process now

The bus is consumed through an interface (P12) so the transport is replaceable. Phase 2 ships `InProcessBus`; Redis/Kafka/NATS drop in later without touching subscribers or dispatch helpers.

```ts
interface EventBus {
  emit<T>(type: EventType, payload: T): Promise<void>;                         // notify + persist + (Phase 7) webhook fan-out
  subscribe<T>(type: EventType | '*', handler: (p: T) => void | Promise<void>): () => void;
}
// Phase 2 impl: InProcessBus (Node EventEmitter). Reserved: RedisBus, KafkaBus, NatsBus.
```

```
server/src/events/
├── bus.ts            # emit(type, payload) — in-process EventEmitter + durable log + fan-out
├── catalog.ts        # typed union of all events + payload shapes (single source of truth)
├── dispatch.ts       # typed helpers: dispatchMessageReceived(ctx, msg), dispatchCustomerCreated(ctx, c)…
└── log.ts            # persists every event to domain_events (timeline + replay + analytics + webhooks)
```

`emit()` does three things: notify in-process subscribers, append to `domain_events`, and (Phase 7) fan out to outbound webhooks. Subscribers (AI, automations, analytics projectors, search indexer, webhooks) register at boot in `server/src/index.ts`. **Nothing in the codebase calls `EventEmitter` directly — only `bus()`.**

**Every dispatch helper sets `workspace_id`, `customer_id`, `conversation_id` where applicable** — this is what makes the timeline (§7) and analytics (§13) work.

### 5.2 Event catalog (authoritative — append-only)

| Event | Emitted when | Key payload |
|---|---|---|
| `message.received` | inbound message stored | `{ conversationId, customerId, channelId, message }` |
| `message.sent` | outbound send succeeds | `{ conversationId, customerId, message }` |
| `message.delivered` / `message.read` | receipt events | `{ conversationId, messageId }` |
| `message.failed` | send failed | `{ conversationId, messageId, error }` |
| `conversation.created` | new conversation row | `{ conversationId, customerId, channelId }` |
| `conversation.assigned` | assignee changed | `{ conversationId, assigneeType, assigneeId, byUserId }` |
| `conversation.priority_changed` | priority changed | `{ conversationId, priority }` |
| `conversation.status_changed` | open/pending/resolved/closed | `{ conversationId, status }` |
| `sla.response_due` / `sla.breached` | SLA timers | `{ conversationId, policyId, kind }` |
| `customer.created` | new customer | `{ customerId, channel, identifier }` |
| `customer.tagged` / `customer.noted` | CRM activity | `{ customerId, … }` |
| `campaign.started` / `campaign.completed` | campaign lifecycle | `{ campaignId, stats }` |
| `automation.triggered` / `flow.started` / `flow.step` / `flow.completed` | automation lifecycle | `{ flowId, executionId, nodeId }` |
| `ai.reply.generated` | agent produced a reply | `{ agentId, conversationId, messageId, confidence }` |
| `ai.handoff_requested` | agent escalates to human | `{ agentId, conversationId, reason, confidence }` |
| `ai.state_changed` | ai_active→paused→human→escalated | `{ conversationId, state }` |
| `integration.connected` / `integration.synced` | connector lifecycle | `{ integrationId, connector }` |
| `order.created` / `order.fulfilled` / `inventory.updated` *(via connectors)* | commerce events | `{ orderId, customerId }` |
| `knowledge.indexed` | knowledge hub updated | `{ sourceId }` |

All subscribers read only from this catalog.

### 5.3 Subscribers register, features don't inline

```
// server/src/index.ts (boot) — register subscribers against bus()
bus().subscribe('message.received', runInboundPipeline);               // AI + automations (§10/§11)
bus().subscribe('*',               searchIndexer.index);              // §8 SearchProvider
analyticProjectors.forEach(p => bus().subscribe(p.handles, p.project)); // §13 — one subscriber per projector
bus().subscribe('*',               writeAuditTrail);                  // §6.4 (privileged mutations)
bus().subscribe('*',               fanOutWebhooks);                   // §14 (Phase 7)
// timeline needs no subscriber — it reads domain_events directly (§7)
```

---

## 6. Customer-centric data model

The customer is the center of gravity. Today the closest thing is `contacts`; messages are keyed only by `chat_id`/`from_number`. Phase 2 promotes the customer and threads every message through a conversation.

### 6.1 Core tables

| Table | Purpose | Phase |
|---|---|---|
| `customers` | `id, workspace_id, display_name, avatar_url, primary_identifier_id, created_at, last_seen_at` | 2 |
| `customer_identifiers` | Multi-channel identity. `id, customer_id, channel('whatsapp'\|'sms'\|'email'\|'instagram'), value(canonical), label` | 2 |
| `conversations` | A thread = customer × channel × instance. `id, workspace_id, customer_id, channel, instance_id, chat_id, status, priority, assignee_type, assignee_id, team_id, unread_count, last_message_at` + SLA + AI-state cols (§9, §10) | 2 |
| `inbox_messages` *(extended)* | add `conversation_id, customer_id, status, reply_to_id, reactions(json), confidence` | 2 |
| `customer_tags` | `id, customer_id, tag, created_at` | 2 (data) / 3 (UI) |
| `customer_notes` | Internal-only. `id, customer_id, author_user_id, body, created_at` | 2 (data) / 3 (UI) |
| `customer_assignments` | `id, customer_id, owner_user_id, team_id` | 3 |
| `customer_ai_summaries` | `id, customer_id, summary, model, generated_at` | 4 |
| `domain_events` | Durable event log + timeline source. `id, workspace_id, type, entity_type, entity_id, customer_id, conversation_id, actor_user_id, payload(json), created_at` | 2 |
| `audit_logs` *(extended)* | Compliance/security log — **distinct from** `domain_events`. `id, workspace_id, actor_user_id, action, resource_type, resource_id, before_json, after_json, created_at` | 2 |

### 6.2 Identity & conversation resolution (the one chokepoint)

Every inbound/outbound message routes through:

```
resolveConversation(workspaceId, channel, identifier, instanceId)
  → { customer, conversation }
  1. normalizeIdentifier (normalizePhone for WhatsApp DMs, group JID passthrough — exists from Phase 1)
  2. upsert customer + customer_identifiers
  3. upsert conversation (customer × channel × instance × chat_id)
  4. return both → message written with conversation_id + customer_id
```

This is what lets inbox, CRM, campaigns, AI, timeline, and search all agree on *who* a message belongs to. Webhook and send path both go through it.

### 6.3 Backfill

Per distinct existing `chat_id`: create a customer (from matching `contacts` row, else `from_name`/phone), an identifier, and a conversation; stamp historical `inbox_messages` with `conversation_id` + `customer_id`. `contacts` becomes a legacy alias onto `customers`.

### 6.4 Audit log (compliance & security) — distinct from domain events

Two records, two purposes:

- **Domain event** (`domain_events`): *what happened in the system* — `conversation.assigned`. Feeds timeline, analytics, search, webhooks.
- **Audit log** (`audit_logs`): *who did what, to what, with before/after* — "Jane reassigned Conversation #391 from Support Team to Sales Team". Feeds security review, compliance, enterprise audit exports, debugging.

The existing `audit_logs` table + `utils/audit.ts` (`logAuditAction`, `logApiRequest`) are the seed; promote them to the workspace-scoped, `actor_user_id` + `before_json`/`after_json` model. Every mutating privileged action — assignment, role/permission change, API-key creation, customer delete, agent publish, campaign launch, integration connect — writes an audit row. Read via `GET /api/audit?resource=&actor=&since=` behind an `audit.view` permission.

---

## 7. The Customer Timeline

The single highest-leverage feature. The customer drawer must not be a static contact card — it must be a **living timeline** of everything that has happened with this customer, fed by the event bus.

### 7.1 Source

The timeline reads directly from `domain_events`:

```sql
SELECT * FROM domain_events
WHERE workspace_id = ? AND customer_id = ?
ORDER BY created_at DESC LIMIT 100;
```

No new table is strictly required — `domain_events` is the timeline. (A denormalized `customer_timeline` projection is reserved if read volume demands it; v1 queries the log.)

### 7.2 Timeline entries render from the catalog

Every event type maps to a `(icon, label, actor)` renderer. Example timeline for one customer:

```
[created]      Customer created                 — from WhatsApp +2547…
[message]      Campaign received: "Black Friday" — via Marketing number
[message]      Clicked campaign link
[integration]  Order #394 created               — Shopify, KES 4,200
[message]      Asked: "Where is my order?"
[ai]           AI (Support Agent) replied        — confidence 0.91
[message]      Support agent (Jane) replied
[integration]  Order #394 delivered
[tag]          Tagged "VIP"
[summary]      AI summary regenerated
```

### 7.3 Why it's powerful

Because *every* subsystem emits events (messages, AI, automations, integrations, campaigns, CRM), the timeline unifies them with zero per-feature glue. Add a new integration → its events appear in the timeline automatically. This is the direct payoff of P4.

### 7.4 API + UI

- `GET /api/customers/:id/timeline?cursor=…` (workspace-scoped, permission `customers.view`).
- Rendered in the Customer Intelligence drawer (§19). Filterable by type. Each entry links to its entity (open the message, the order, the campaign).

---

## 8. Universal Search

A platform service, not an inbox feature. Without it the platform becomes unusable at scale.

### 8.1 Index + provider interface

Search is consumed through a `SearchProvider` interface (P12) — SQLite FTS5 now, Meilisearch/Typesense/OpenSearch later, swappable without touching the indexer or query UI.

```ts
interface SearchProvider {
  index(wsId, entityType: string, entityId: string, body: string, tags?: string[]): Promise<void>;
  remove(wsId, entityType: string, entityId: string): Promise<void>;
  query(wsId, q: string, opts?: { types?: string[]; limit?: number }): Promise<SearchHit[]>;
}
// Phase 2 impl: SqliteFtsProvider. Reserved: MeilisearchProvider, TypesenseProvider, OpenSearchProvider.
```

```
search_index (id, workspace_id, entity_type, entity_id, body, tags, updated_at)
search_index_fts                           -- SQLite FTS5 virtual table over `body`
```

(If the sql.js build lacks FTS5, the `SqliteFtsProvider` falls back to a trigram/LIKE index behind the same interface.)

### 8.2 Indexer = event subscriber

`modules/search/` subscribes to the bus and upserts/deletes index rows:

| Event | Index action |
|---|---|
| `customer.created` / `customer.tagged` | index customer (name, identifiers, tags) |
| `message.received` / `message.sent` | index message content |
| `campaign.started` | index campaign (name, content) |
| `order.created` | index order (id, total) |
| `knowledge.indexed` | index knowledge source text |
| `ai…agent` config changed | index agent (name, description) |

### 8.3 Query & UI

- `GET /api/search?q=…&types=customers,messages,orders&limit=…` — grouped, permission-filtered (`can(user, '<entity>.view')` per type).
- **Command-K** global search across the whole app: customers, messages, orders, campaigns, knowledge, agents. Returns grouped results; each jumps to its surface.

---

## 9. Inbox assignment, priority, status & SLA

The conversation model must carry the operational fields businesses need the moment they have >1 agent. Define now (P9); expose in UI across phases.

### 9.1 Conversation fields (add to §6 `conversations`)

```
status          open | pending | waiting_on_customer | resolved | closed
priority        urgent | high | medium | low
assignee_type   user | team | unassigned
assignee_id     nullable
team_id         nullable
-- SLA
sla_policy_id   nullable
first_response_at, resolved_at
response_due_at, resolution_due_at
breached_at     nullable
-- AI handoff (§10)
ai_state        ai_active | ai_paused | human_active | escalated
active_agent_id nullable
```

### 9.2 SLA policies

`sla_policies (id, workspace_id, name, channel, priority, first_response_minutes, resolution_minutes)`. On `conversation.created` (or priority change), a subscriber stamps `response_due_at`/`resolution_due_at` from the matching policy. A periodic job (or event-time check) emits `sla.response_due` and `sla.breached`.

### 9.3 Default views

The inbox ships with queues built from these fields: **Unassigned**, **Assigned to me**, **My teams**, **Urgent**, **SLA at risk**, **Resolved** — all derived from the same conversation rows, not separate stores.

---

## 10. AI as a first-class system — governance & handoff

AI is a governed subsystem that subscribes to `message.received`. It is never inlined in messaging, and it can never exceed its granted permissions.

### 10.1 Inbound pipeline (one subscriber)

```
message.received (event)
   → runInboundPipeline(event)
       1. load workspace automation + agent config
       2. check conversation.ai_state  → skip if not ai_active
       3. pick agent by trigger/route
       4. agent reasons (knowledge + tools), emits reply
       5. if confidence < threshold OR escalation trigger → request handoff
       6. reply sent via channel service (same path as a human send)
```

### 10.2 AI governance — agent permissions (mandatory before any agent acts)

Agents are dangerous without a permission boundary. Define an **action catalog** and an allow-list per agent.

```
agent_permissions (agent_id, action)      -- allow-list
-- actions (catalog, append-only):
catalog.read · catalog.write
orders.read · orders.refund · orders.update
tickets.create · tickets.update
customers.read · customers.update · customers.delete
messages.send · messages.send_template
knowledge.read
http.fetch                                -- external fetch (off by default)
```

Every tool/action the agent invokes is gated by `canAgent(agent, action, ctx)`. A Sales Agent may `catalog.read` but not `orders.refund`; a Support Agent may `tickets.create` but not `customers.delete`. This is the seam that keeps AI safe as capabilities grow.

Tables: extend `ai_agents` with `default_action_set`; `agent_permissions` for per-agent overrides; an audit log row for every denied action.

### 10.3 Human handoff (designed into the conversation from day one)

Every conversation carries `ai_state` (§9). States: `ai_active → ai_paused → human_active → escalated`. Triggers for handoff:

- Low confidence on the AI reply (configurable threshold).
- Explicit customer request ("agent", "human").
- Escalation rule (keyword, sentiment, VIP tag).
- SLA breach or repeated AI failure.

On handoff: `ai.state_changed` → `human_active`, AI stops replying, conversation surfaces in the **Unassigned/Escalated** queue, `ai.handoff_requested` carries `{ reason, confidence }` into the timeline. A human (or automation) can re-enable AI by flipping back to `ai_active`.

### 10.4 Agent registry & knowledge hub (schemas reserved; UI Phase 4)

- `ai_agents (id, workspace_id, name, description, model, knowledge_source_ids[], triggers, default_action_set, enabled)`.
- `knowledge_sources (id, workspace_id, type[website|pdf|docs|faq|catalog|custom], name, ref, status)`. Agents read knowledge through the **internal** Knowledge service — never scrape/call third parties at runtime.

---

## 11. Automation → Workflow Builder

Rules are the floor; businesses will want multi-step flows. Reserve the flow model now (P9); ship simple rules first.

### 11.1 Tables (reserved in Phase 2 data model; engine in Phase 4)

```
automation_flows        (id, workspace_id, name, trigger_event, enabled, version)
automation_nodes        (id, flow_id, type[trigger|condition|action|wait|branch|ai], config(json))
automation_edges        (id, flow_id, from_node_id, to_node_id, label)   -- DAG edges (canonical model)
automation_executions   (id, flow_id, customer_id, conversation_id, status,
                         current_node_ids(json), started_at, completed_at, context(json))
```

The canonical flow model is a **DAG** (`automation_edges`) so multi-branch, parallel, and merge patterns never require a schema change. Phase 4 may expose a `next_id`/`branch_next_id` convenience for the simplest linear/branch flows, but it is a UI shortcut over the DAG, not the storage model. `current_node_ids` is a **set**, supporting parallel branches simultaneously in flight.

### 11.2 Node model

A flow is a graph of typed nodes. Examples:

- **trigger** — `message.received` with condition `body matches "pricing"`.
- **ai** — invoke a named agent.
- **wait** — `2 days`.
- **action** — `send_message`, `assign`, `add_tag`, `create_ticket`, `call_connector`.
- **branch** — route by condition.

### 11.3 Example flow

```
Customer sends "pricing"
  → AI (Sales Agent) answers
  → wait 2 days
  → if no reply: send follow-up
  → assign to Sales team
```

Phase 4 ships **trigger → condition → action** (rules). The full engine (waits, branches, persistent executions across the wait boundary) is reserved and lands in a later phase — but the schema and node types exist from Phase 2, so no rewrite.

### 11.4 Automation events

`automation.triggered`, `flow.started`, `flow.step`, `flow.completed` (§5.2) feed the timeline and analytics.

---

## 12. Integration Framework & channels

Generalize "Shopify/Woo" into a connector framework. Every connector is an **event source** (publishes into the bus) and an **action target** (callable through internal services).

### 12.1 Connector interface

```
server/src/integrations/connectors/<name>/
  connect(workspaceId, credentials)        → store integration row
  sync(integrationId)                      → pull + publish events
  handleWebhook(integrationId, payload)    → publish events
  actions                                  → exposed via internal services only
```

Planned connectors: `shopify`, `woocommerce`, `hubspot`, `google-sheets`, `zapier`, `make`.

### 12.2 Tables

```
integrations        (id, workspace_id, connector, name, credentials_ref, status, last_synced_at)
integration_events  (id, integration_id, external_id, type, payload, ingested_at)
```

### 12.3 The rule (P6, restated)

Connectors publish `order.created`, `inventory.updated`, `lead.created` into the bus. AI, automations, campaigns, analytics, timeline all consume those events. **No subsystem ever calls Shopify directly** — they call `OrdersService` / `CatalogService`, which sit behind the connector abstraction. Swap WooCommerce for Shopify and nothing upstream changes.

### 12.4 Channels (same pattern)

`server/src/channels/<channel>/` implements `send / receive / parse / normalizeIdentifier / identityKind`. WhatsApp (Evolution) is first (the current `services/whatsapp/` migrates here). SMS, email, Instagram are future folders. The inbox and customer model are channel-agnostic.

---

## 13. Analytics pipeline

Design analytics with the event bus, not after it. The bus already gives every metric; a subscriber projects events into rollups.

### 13.1 Tables

```
metric_rollups (workspace_id, metric_key, period[day|hour], period_start, value, dimensions(json))
```

### 13.2 Metric catalog (projected from events)

| Metric | Source events |
|---|---|
| messages.sent / received / read / failed | message.* |
| conversations.opened / resolved / reopened | conversation.status_changed |
| avg_first_response_time / avg_resolution_time | conversation SLA timestamps |
| sla.breach_count | sla.breached |
| campaign.sent / delivered / failed / converted | campaign.* + order.created attribution |
| ai.replies / ai.tokens / ai.handoffs / avg_confidence | ai.* |
| automation.triggered / flow.completed | automation.* / flow.* |
| agent.performance (per user) | conversation.assigned + message.sent |
| integration.orders / revenue | order.* |

### 13.3 Projectors (not one giant subscriber)

Analytics is consumed through an `AnalyticsProjector` interface (P12) so each domain owns its metrics independently — no monolithic `projectAnalytics` handler that grows unbounded:

```ts
interface AnalyticsProjector {
  handles: EventType[] | '*';
  project(event: DomainEvent): Promise<void>;   // upsert metric_rollups for this projector's metrics
}
```

Each projector is a focused subscriber:

- `MessageMetricsProjector` — sent/received/read/failed, response times.
- `ConversationMetricsProjector` — opened/resolved/reopened, resolution time.
- `SLAMetricsProjector` — breach count, time-to-first-response.
- `CampaignMetricsProjector` — sent/delivered/failed/conversions.
- `AIMetricsProjector` — replies/tokens/handoffs/avg confidence.
- `AutomationMetricsProjector` — triggers/flow completions.
- `IntegrationMetricsProjector` — orders/revenue.

Each increments `metric_rollups` keyed by `(workspace, metric, period, dimensions)`. Dashboards read pre-aggregated rollups (cheap); no on-the-fly `domain_events` scans at render.

---

## 14. Developer ecosystem

The API already exists (`/api/v1`, registry-driven). Promote it to a first-class platform surface.

### 14.1 Outbound webhooks (bus subscriber, Phase 7)

```
webhooks            (id, workspace_id, url, events[], secret, status)
webhook_deliveries  (id, webhook_id, event_id, status, attempts, response_code, delivered_at)
```

`subscribe('*', fanOutWebhooks)` delivers matching events to registered endpoints with HMAC signing, retries, and a delivery log. Businesses thus get the same event stream the internal subsystems use.

### 14.2 API logs

The existing `api_logs` table is enriched with `latency_ms` and linked to `workspace_id`. Surfaces a Developer → Logs view (request, response, status, latency).

### 14.3 OAuth apps (future, schema reserved)

`oauth_apps`, `oauth_grants`, `oauth_tokens` — let third-party apps act on behalf of a workspace with scoped permissions (reusing the §4 permission keys). Reserved now so the auth model is extension-ready.

### 14.4 SDKs & playground

JS SDK exists (`server/static/sdk/fidscript.js`). PHP and Python SDKs are generated from the OpenAPI spec (`/api/v1/openapi.json`, already registry-driven). The API Playground (Sandbox) exists and stays in sync with the registry.

---

## 15. Campaigns → Marketing Center

Today: bulk messaging. Target: marketing automation, reusing the **same** send services as 1:1 chat (so they never drift).

- **Types:** broadcast, scheduled, segmented (by tag/segment), trigger-based (`order.created`, customer inactivity), drip sequences.
- **Audience:** customers, segments, contact-groups, or paste — validated via `/chats/is-whatsapp`.
- **Content:** text + media from the Media Library; `{{name}}`/`{{field}}` templates resolved per recipient.
- **Progress:** per-recipient status streamed live; tokens charged per successful send via the shared `chargeAndEmit`.
- **Trigger/drip campaigns are event subscribers**, not bespoke schedulers — built on the §5 bus.
- **Events** `campaign.started`/`.completed` feed timeline + analytics.

DB additions (Phase 5): `campaign_segments`, `campaign_steps` (drip), `campaign_triggers` (event→campaign), `media_assets` (reusable library), plus a Status module (schedule, cross-post across numbers, reuse, analytics).

---

## 16. Centralized data layer (frontend)

**Rule (P7): components never call the API directly.** Components consume hooks; hooks own fetch, cache, optimistic updates, and realtime.

```
src/data/
├── api/                # Layer 1 — typed clients, one file per domain (migrated from src/services/)
├── hooks/              # Layer 2 — useInbox, useCustomers, useCampaigns, useSearch, useTimeline…
├── providers/          # Layer 3 — Context providers, mounted once in AppProviders
└── events.ts           # client EventBus: useInstanceSSE → bus → hooks
```

- **api:** pure typed functions. (Existing `src/services/*.ts` migrates here, split by domain.)
- **hooks:** each owns its domain's fetch + cache + optimistic ops and subscribes to the EventBus.
- **providers:** mount hooks once, share via Context (navigating Inbox → Customers → Inbox does not refetch).
- **EventBus:** the SSE bridge emits onto the bus; hooks subscribe. Decouples transport; a future WebSocket swap is one layer.

Consumption: `const { conversations, sendMessage } = useInbox();` — no `useEffect`+`fetch` in components.

---

## 17. Feature-folder structure & file rules

### 17.1 Frontend tree

```
src/
├── app/                       # shell, routing, AppProviders
├── components/{ui,layout,shared}   # shared primitives + chrome
├── features/
│   ├── inbox/                 # §19 — conversation workspace
│   ├── customers/             # CRM + timeline + drawer
│   ├── campaigns/             # marketing center
│   ├── automation/            # rules + flow builder
│   ├── agents/                # AI agent registry + knowledge hub
│   ├── integrations/          # connectors
│   ├── catalog/               # commerce (orders/products)
│   ├── media/ · status/       # library + status module
│   ├── search/                # Command-K universal search
│   ├── analytics/
│   ├── developers/            # keys, webhooks, logs, playground
│   ├── settings/ · instances/ · workspace/   # workspace/team/admin
│   └── auth/                  # login, invite accept, workspace picker
├── data/                      # §16 centralized data layer
├── lib/                       # pure utils
└── types.ts
```

### 17.2 Backend tree

```
server/src/
├── modules/
│   ├── platform/             # PLATFORM SERVICES — everything depends on these; no business logic
│   │   ├── events/           # EventBus interface + InProcessBus + catalog (§5)
│   │   ├── auth/             # workspace/role/permission + can() + WorkspaceContext (§4)
│   │   ├── audit/            # audit_logs write/read (§6.4)
│   │   ├── workspace/        # workspaces/members/teams (§4)
│   │   ├── search/           # SearchProvider + indexer (§8)
│   │   └── analytics/        # AnalyticsProjector + rollups (§13)
│   └── {inbox,customers,campaigns,automation,agents,integrations,catalog,media,developers}  # business modules
├── integrations/connectors/  # §12
├── channels/                  # §12.4 (whatsapp first)
├── services/domain/           # internal services (Catalog, Orders, Knowledge, Media)
├── database/ · middleware/ · routes/
```

### 17.3 File rules (enforced)

- **150 lines hard limit.** Today's offenders split as touched: `VibeWizard` (738), `SandboxSection` (735), `BulkMessagingPanel` (607), `TokenStoreSection` (580), `DocsSection` (432), `ImportContactsModal` (352), `MessagesView` (351), `ApiKeysSection` (334), + ~12 more.
- One component per file; one concern per hook/util.
- Each feature exposes a public `index.ts` barrel; cross-feature imports go through barrels or the data layer.

---

## 18. Icon & visual system (no emoji chrome)

- **All UI iconography uses `lucide-react`.** No emoji as chrome.
- Replace existing emoji chrome: `admin/DashboardOverview` (`📨 ✅ 📱 🟢`), `VibeWizard` (`✓` markers), `MessageDetail` (`↓ ↑`), `dashboardData` (`🟢`).
- **Emoji allowed only as content** — the constrained reaction set is message content, not chrome.
- Branded `components/ui/` primitives: `Icon`, `Avatar`, `Badge/Tag`, `Button/IconButton`, `Modal`, `Drawer`, `EmptyState`, `Skeleton`.
- FIDScript palette only (forest-deep, yellow accent, stone neutrals). No green bubbles; no "WhatsApp"/"Evolution" strings in UI.

---

## 19. The Inbox — Phase 2 first surface

The inbox is the first UI that exposes the system. Familiar WhatsApp feel; underneath, every message belongs to a customer + conversation, with assignment/priority/SLA/AI-state, and a Customer Intelligence drawer showing the timeline.

### 19.1 Three-pane layout

```
┌───────────────┬────────────────────────────┬──────────────────────┐
│ Conversation  │  Conversation              │ Customer Intelligence│
│ list          │  header / messages /       │ Drawer               │
│ (340px)       │  composer                   │ (320px)              │
│               │                             │                      │
│ queues:       │  avatar·name·presence       │ identity · tags      │
│  All / Mine / │  priority · SLA badge       │ assignee · team      │
│  Teams /      │  AI-state indicator         │ AI summary           │
│  Unassigned / │  bubbles grouped by date    │ ── TIMELINE ──       │
│  Urgent /     │  reply quote · reactions    │  (every event)       │
│  SLA-at-risk /│  typing indicator           │  - messages          │
│  Resolved     │  blue read ticks            │  - AI replies        │
│ + Cmd-K search│  composer (+/emoji/mic/send)│  - orders            │
│               │                             │  - campaign touches  │
│               │                             │  - tags/notes        │
└───────────────┴────────────────────────────┴──────────────────────┘
```

### 19.2 What lands in Phase 2 vs. later

- **Phase 2 (foundations + first surface):** the system plumbing (§4–§14 schemas/seams/subscribers) **plus** the inbox UI consuming it. The drawer renders identity, tags, assignee, AI-state, and the **timeline** (reads off `domain_events`). Assignment/priority UI is minimal (set/unset); SLA timers compute but show a simple badge.
- **Phase 3:** rich assignment UI, teams, SLA policy editor, notes editor, tag manager.
- **Phase 4:** AI agent controls, handoff UX, knowledge hub, workflow builder.

### 19.3 Endpoint → feature map (all already built)

Sending: `/api/v1/messages/{text,media,location,contact,reaction,poll,list,audio,sticker,status}/:instance`. Chat actions: `/api/v1/chats/*` (mark-read/unread, archive, block, presence, delete-for-everyone, update-message, profile-pic-url, find-status, is-whatsapp). Groups: `/api/v1/groups/*`. Profile/Settings: `/api/v1/profile/*`, `/api/v1/settings/*`.

### 19.4 Backend prerequisites (call out honestly)

Actions exist; **real-time events** for blue ticks / typing do not. Required in Phase 2: webhook handlers for `messages.receipt` + `presence.update` → `message.delivered`/`message.read` + `presence` events + SSE channels; profile-pic cache; group-metadata lazy fetch + cache.

---

## 20. Migration path from current code

Incremental — prod stays green.

**Backend:**
1. `server/src/auth/` + workspace tables (§4) + `can()` middleware; bridge `client_id = workspace_id`.
2. `server/src/events/` (bus + catalog); wire `emit()` into webhook + send via `resolveConversation`.
3. `modules/inbox/` (resolveConversation), `modules/customers/`, `modules/search/` (indexer), `modules/analytics/` (subscriber) skeletons — schemas land, UI later.
4. `services/whatsapp/` → `channels/whatsapp/` (re-export shim during transition).

**Frontend:**
1. `src/data/{api,hooks,providers,events.ts}`; migrate `src/services/*` → `src/data/api/*` (re-export shims, then flip).
2. `AppProviders` mounted in the shell.
3. `src/features/inbox/`; route `MessagesView` → `features/inbox/InboxPage`; split oversized files as they move.

**Data:** guarded `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` for all new tables (existing pattern); run §6.3 backfill once.

---

## 21. Phased roadmap

Each phase = reviewable slices; each slice = build both → commit → push → `bash deploy.sh` → verify on prod (Kennedy / `swaysuite`). Schemas/seams for *all* subsystems land early (P9); UI fills in across phases.

| Phase | Theme | Ships |
|---|---|---|
| **2 (now)** | **System foundations + Inbox surface** | `modules/platform/` services: `EventBus` interface (InProcessBus) + catalog; workspace/auth/RBAC + `can()` + **WorkspaceContext (tenant isolation)**; **`audit_logs` writer**; customer model + `resolveConversation`; conversation model (assignment/priority/status/SLA/AI-state); `domain_events` + timeline read; `SearchProvider` (FTS) + indexer; `AnalyticsProjector` projectors + rollups; AI governance seam + inbound pipeline (keyword rule only); connector/channel interface; workflow DAG schema. **Surface:** 3-pane inbox + Customer Intelligence drawer (timeline, tags, assignee, AI-state). Receipt/typing/presence webhook + SSE. |
| **3** | Customer intelligence + team collaboration | notes, tags manager, assignment UI, teams, SLA policy editor, universal-search Command-K, customer timeline filters. |
| **4** | AI agents + automation | agent registry UI, knowledge hub ingestion, `canAgent` enforcement UI, human-handoff UX, rule + simple-flow automation engine. |
| **5** | Marketing center | campaign types (segmented/trigger/drip), media library, status module. |
| **6** | Integrations + commerce + multi-channel | Shopify/Woo connectors, catalog/orders internal services, SMS/email/Instagram channels. |
| **7** | Developer ecosystem + analytics | outbound webhooks fan-out, OAuth apps, PHP/Python SDKs, analytics dashboards, playground polish. |

**Phase 2 internal slices (the immediate work):**

- **A — Foundations (no UI):** `modules/platform/{events,auth,workspace,audit}` — `EventBus` interface + `InProcessBus` + catalog; workspace/RBAC tables + `can()` + **WorkspaceContext**; `audit_logs` writer; `resolveConversation` wired into webhook + send; `domain_events` populated. Customer/conversation rows created for all messages. *Verify: messages still flow; each carries customer/conversation ids; `domain_events` + `audit_logs` grow; every query is workspace-scoped.*
- **B — Subsystem skeletons (no UI):** `SearchProvider` (SqliteFts) + indexer subscriber; `AnalyticsProjector` projectors + rollups; AI inbound pipeline (keyword rule, governance seam, handoff states on conversation); connector/channel interface. *Verify: index + rollups populate on events; keyword auto-reply works; handoff state flips.*
- **C — Frontend data layer:** `src/data/{api,hooks,providers,events.ts}`; `AppProviders`; migrate services. *Verify: app works unchanged through the new layer.*
- **D — Inbox surface:** `features/inbox` 3-pane + Customer Intelligence drawer (timeline, tags, assignee, AI-state); ConversationList queues; unified multi-instance. *Verify: inbox works, drawer shows timeline.*
- **E — Realtime + icon sweep:** receipt/typing/presence webhook + SSE (blue ticks, typing); profile-pic cache; group metadata; replace all emoji chrome with lucide; split touched oversized files.

---

## 22. Conventions, guardrails & verification

**Code:** no `any`; `{ success, data?, error? }`; files ≤150 lines; one component per file; feature folders with public barrels; components never call the API directly (P7).

**Backend:** `encodeURIComponent` on Evolution paths; `logApiRequest` on every op; `X-API-Version: v1` on `/api/v1`; every privileged action asserts `req.can('<perm>')`; **every read/write is workspace-scoped via WorkspaceContext — no unscoped queries exist (P11)**; every domain mutation dispatches a catalog event with `workspace_id`/`customer_id`/`conversation_id`; **every privileged mutation writes a before/after `audit_logs` row (§6.4)**; analytics computed by per-domain projectors, never a monolithic subscriber; internal services are the only path to third parties (P6).

**AI:** every agent action gated by `canAgent(agent, action, ctx)`; denials audited; handoff states authoritative on the conversation.

**Visual:** `lucide-react` only; no emoji chrome; FIDScript palette only; no "WhatsApp"/"Evolution" in UI.

**Per-slice verification (on prod):** real-time push without refresh; send + reply in the same thread (canonical `chatId`); new numbers auto-create customers; tokens change only on successful sends; both builds clean; no file >150 lines in touched paths; `domain_events`/timeline/search-index/rollups populate; permission denials fire correctly.

---

## 23. Implementation status

> **Honest accounting** of what is shipped in production (`f54efe9` — 2026-06-15) versus what the spec describes. Status reflects code that is live on `whatsapp.fidscript.com`, not aspirational claims. Use this table to triage: pick a section marked **Partial** or **Not started** before adding a new feature.

| § | Section | Status | Notes |
|---|---|---|---|
| 1–3 | Vision, principles, layered view | ✅ Shipped | Authoritative doc. |
| 4 | Workspace, teams & access control | ⚠️ Partial | Teams + team members tables exist; `assignee=team` filter works in inbox. Full RBAC + `can()` + WorkspaceContext is not yet enforced across all routes (P11 not yet airtight). |
| 5 | Event-driven core (the spine) | ✅ Shipped | `EventBus` (`modules/platform/events/bus.ts`) with wildcard `'*'` envelope (`__type`/`__id`/`__workspaceId`/`__actorUserId`); per-type and wildcard subscribers. Catalog of `PlatformEventType`. |
| 6 | Customer-centric data model | ⚠️ Partial | `customers` + `conversations` + `customer_identifiers` tables exist; inbound messages resolve to canonical customer. AI summary / order linkage not yet wired. |
| 7 | Customer Timeline | ⚠️ Partial | `timeline_events` table populated; Customer Intelligence drawer reads it. Filters + AI summaries are partial. |
| 8 | Universal Search | ✅ Shipped | FTS5 virtual table `search_index_fts` (`database/phase6.ts`) with porter-unicode61 tokenization + 3 AFTER triggers; provider JOINs `search_index_fts` with `search_index`; LIKE fallback preserved. |
| 9 | Inbox assignment, priority, status & SLA | ✅ Shipped | 7 queues (All, Mine, My teams, Unassigned, Urgent, SLA at risk, Resolved) live in `features/inbox/QueueFilter.tsx`. SLA-at-risk query: `response_due_at IS NOT NULL AND status NOT IN ('resolved','closed') AND (breached_at IS NOT NULL OR (first_response_at IS NULL AND response_due_at <= now+1h))`. |
| 10 | AI governance & handoff | ⚠️ Partial | AI state column on conversations; handoff states authoritative. Agent registry, knowledge hub, `canAgent` enforcement UI not yet built. |
| 11 | Workflow Builder | ✅ Shipped | Triggers, segments, drip campaigns, step executor live. Visual DAG editor partial. |
| 12 | Integration Framework & channels | ✅ Shipped | `server/src/channels/{index.ts,whatsapp/connector.ts}` — full 13-type Channel implementation; `parseWhatsAppMessage` exported as authoritative inbound parser. SMS/email/Instagram channels not yet built. |
| 13 | Analytics pipeline | ⚠️ Partial | `AnalyticsProjector` + rollups populate; admin dashboard charts use mock data (declared "Simulated" in CLAUDE.md). |
| 14 | Developer ecosystem | ✅ Shipped | `/api/v1` API-key namespace with 11 send types + groups/chats/profile/settings/instance/usage/openapi. Webhooks CRUD + HMAC-SHA256 signed fan-out + exponential backoff (0s/5s/30s/2m/10m, 5 attempts) + `webhook_deliveries` table. Developer logs endpoint. Frontend: `features/developers/{Webhooks,Audit,DevLogs}Tab`. |
| 15 | Marketing center | ✅ Shipped | Campaigns (segmented / trigger / drip), media library, WhatsApp Status posts. |
| 16 | Centralized data layer (frontend) | ✅ Shipped | `src/data/{api,hooks,providers,events.ts}` barrel; `AppProviders` mounted; App.tsx migrated. `src/services/*` retained as re-export shim for 36 remaining component importers. |
| 17 | Feature-folder structure & file rules | ✅ Shipped | SandboxSection 660→138, TokenStoreSection 580→120 (12 + 9 sub-files). No file >150 lines in touched paths. |
| 18 | Icon & visual system (no emoji chrome) | ✅ Shipped | ~25 brand-string chrome leaks scrubbed. Prompts (`vibe/promptGenerator.ts`) and landing marketing copy retain "WhatsApp API" as legitimate product-context use. |
| 19 | The Inbox — Phase 2 first surface | ✅ Shipped | 3-pane inbox + Customer Intelligence drawer; receipt/typing/presence SSE; canonical `chatId`; new numbers auto-create customers. |
| 20 | Migration path | ✅ Done | `services/whatsapp/` → `channels/whatsapp/` complete; data-layer migration in flight (App.tsx done; 36 component importers pending). |
| 21 | Phased roadmap | 🔄 In progress | Phases 2–5 shipped (`f54efe9`). Phase 6 (commerce + multi-channel) is the next step. |
| 22 | Conventions, guardrails & verification | ✅ Shipped | No `any` violations in touched files; 8 `catch (err: any)` blocks converted to `err instanceof Error`; raw `fetch()` consolidated to typed wrappers where it lives in the client surface. |

**Next concrete slices to pull off the backlog:**

1. **P11 airtight** — make every route go through `WorkspaceContext`; add `req.can()` enforcement at high-value mutations; close the unscoped-query hole.
2. **§6.3 customer model** — finish AI summaries + order linkage; promote `customer_identifiers` resolution to handle channel merges.
3. **§13 charts** — replace the 4 admin chart mocks with real rollup queries.
4. **§15 visual DAG** — render the workflow editor (the schema is in place; the visual is the gap).
5. **§10 governance UI** — agent registry + knowledge hub + `canAgent` enforcement panel.
6. **§20 data-layer migration** — finish the 36 component importers off `src/services/*`.

---

*This document is the single source of truth for FIDScript's evolution past Phase 1. The guiding test for any change remains P8: will this still work when we add teams, AI agents, automations, commerce, CRM, analytics, and developer apps? And P10: the system is the product — the inbox is merely the first surface that exposes it.*
