# FIDScript — Platform Architecture Specification

> **Status:** Authoritative master spec (2026-06-15). This is the document the development team builds against before any further coding.
> **Supersedes:** `docs/CHAT_REDESIGN_SPEC.md` (the chat rebuild is now §10 inside this document).
> **Phase 1 (backend correctness) is shipped** (`74eb0fe`). This spec defines everything from here forward.

---

## Table of contents

1. [What FIDScript is becoming](#1-what-fidscript-is-becoming)
2. [Design principles](#2-design-principles)
3. [System architecture](#3-system-architecture)
4. [Event-driven core (the spine)](#4-event-driven-core-the-spine)
5. [Customer-centric data model](#5-customer-centric-data-model)
6. [Centralized data layer (frontend)](#6-centralized-data-layer-frontend)
7. [Feature-folder structure & file rules](#7-feature-folder-structure--file-rules)
8. [Icon & visual system (no emoji chrome)](#8-icon--visual-system-no-emoji-chrome)
9. [Product surfaces](#9-product-surfaces)
10. [The Inbox — Phase 2 chat rebuild](#10-the-inbox--phase-2-chat-rebuild)
11. [AI as a first-class system](#11-ai-as-a-first-class-system)
12. [Campaigns → Marketing Center](#12-campaigns--marketing-center)
13. [Commerce & channels (future seams)](#13-commerce--channels-future-seams)
14. [Migration path from current code](#14-migration-path-from-current-code)
15. [Phased roadmap](#15-phased-roadmap)
16. [Conventions, guardrails & verification](#16-conventions-guardrails--verification)

---

## 1. What FIDScript is becoming

Phase 1 fixed messaging so it works. Phase 2 onward builds the **platform around** messaging.

FIDScript is becoming a **Business Communications Operating System**: a single workspace where a Kenyan business talks to customers, runs campaigns, automates replies with AI, connects its store, and exposes everything to developers — with WhatsApp as the familiar interaction layer, not the ceiling.

The frame the team must adopt:

> **The UI feels like WhatsApp. The architecture behaves like a combination of WhatsApp Business, HubSpot, Intercom, Shopify Inbox, and an AI automation platform.**

Messaging is one *channel*. Customers, conversations, campaigns, automations, AI agents, commerce, and analytics are *first-class domains* that messaging feeds into — not features bolted onto a chat app.

**Non-goals for the spec itself:** this document does not schedule every feature. It fixes the architecture so any of them can be added without rewrites, and it sequences the first concrete build (Phase 2: foundations + inbox).

---

## 2. Design principles

| # | Principle | What it means in practice |
|---|---|---|
| P1 | **Conversations are assets, not ephemera** | A conversation is a business record: it carries notes, tags, assignments, an AI summary, and links to a customer profile and history. |
| P2 | **Model around customers, not messages** | The center of gravity is the *customer*. A customer owns many conversations (across channels), orders, campaign interactions, CRM rows. |
| P3 | **AI is first-class, never bolted on** | AI is a platform subsystem (agent registry + knowledge hub) that subscribes to events. It is never inlined into messaging code. |
| P4 | **Event-driven by default** | Every meaningful state change emits a domain event. AI, automations, analytics, integrations, and webhooks are all *subscribers*. |
| P5 | **Channels are pluggable** | WhatsApp (Evolution) sits behind a channel interface. SMS, email, Instagram can be added without touching the inbox UI or customer model. |
| P6 | **Internal services are the only path to third parties** | AI and automations call internal services (Catalog, Orders), never a third-party API directly. |
| P7 | **Centralized data, decentralized UI** | Components consume data hooks; they never call the API directly. UI is split into feature folders. |
| P8 | **Build for the question** | Every architectural decision must survive: *"Will this still work when we add AI agents, automations, commerce, CRM, team collaboration, analytics, and developer APIs?"* If not, redesign before implementing. |

---

## 3. System architecture

### 3.1 Layered view

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (React) — feature folders + centralized data layer  │
│  features/<domain> → data/hooks → data/api → data/providers    │
└───────────────────────────▲──────────────────────────────────┘
                            │ REST (/api) + SSE (realtime)
┌───────────────────────────┴──────────────────────────────────┐
│  Backend (Express)                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  HTTP routes (/api/v1 public, /api/* client+admin)       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Domain modules (inbox, customers, campaigns, agents…)   │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Event bus  ←── subscribers: AI, automations, analytics, │ │
│  │                                    webhooks, search index│ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Internal services (Catalog, Orders, Knowledge, Media)   │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Channel abstraction  ← WhatsApp(Evolution) · future: SMS│ │
│  │                           email · Instagram              │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 The four seams that make future integration cheap

1. **Channel seam** — `server/src/channels/` exposes one interface (`send`, `receive`, `parse`, `identity`). WhatsApp is the first implementation. Adding a channel = adding a folder; nothing upstream changes.
2. **Event bus** — `server/src/events/`. The single place domain changes are announced. All cross-cutting features subscribe here.
3. **Internal service seam** — `server/src/services/domain/` (Catalog, Orders, Knowledge, Media). AI/automations depend on these interfaces, never on Shopify/Woo/Evolution directly.
4. **Data-layer seam (frontend)** — `src/data/`. Components depend on hooks, hooks depend on api+providers. Swapping the cache or transport later touches one layer.

---

## 4. Event-driven core (the spine)

This is the single most important architectural decision. Build it in Phase 2 as a skeleton; every later phase is a new subscriber.

### 4.1 Event bus

```
server/src/events/
├── bus.ts            # emit(type, payload), subscribe(type, handler) — in-process EventEmitter + durable log
├── catalog.ts        # the typed union of all event types + payload shapes (single source of truth)
├── dispatch.ts       # helpers called from modules: e.g. dispatchMessageReceived(ctx, msg)
└── log.ts            # persists every event to domain_events (analytics + replay + webhook fan-out)
```

`emit()` does three things atomically: notify in-process subscribers, append to `domain_events`, and trigger outbound webhook fan-out (Phase 7). Subscribers (AI, automations, analytics) register at boot in `server/src/index.ts`.

### 4.2 Event catalog (authoritative list — append-only)

| Event | Emitted when | Key payload |
|---|---|---|
| `message.received` | inbound message stored | `{ conversationId, customerId, channelId, message }` |
| `message.sent` | outbound send succeeds | `{ conversationId, customerId, message }` |
| `message.delivered` | receipt: delivered | `{ conversationId, messageId }` |
| `message.read` | receipt: read | `{ conversationId, messageId }` |
| `message.failed` | send failed | `{ conversationId, messageId, error }` |
| `conversation.created` | new conversation row | `{ conversationId, customerId, channelId }` |
| `conversation.assigned` | assignment changes | `{ conversationId, assignee }` |
| `conversation.resolved` | status → resolved | `{ conversationId }` |
| `customer.created` | new customer record | `{ customerId, channel, identifier }` |
| `customer.tagged` | tag added/removed | `{ customerId, tag, op }` |
| `campaign.started` / `campaign.completed` | campaign lifecycle | `{ campaignId, stats }` |
| `automation.triggered` | rule fired | `{ ruleId, eventId, action }` |
| `ai.reply.generated` | agent produced a reply | `{ agentId, conversationId, message }` |
| `order.created` *(future)* | commerce order event | `{ orderId, customerId }` |

Every subscriber (AI, automations, analytics, search indexer, webhooks) reads from this catalog and nothing else.

### 4.3 Why this matters

AI, automations, drip campaigns, analytics, and webhooks all become **event subscribers** instead of code woven into messaging. Adding "send a follow-up 7 days after a purchase" is a new subscriber on `order.created` — zero changes to messaging code. This is the principle that prevents the rebuild the user is warning against.

---

## 5. Customer-centric data model

Today the closest thing to a customer is the `contacts` table, and messages are keyed only by `chat_id`/`from_number`. Phase 2 promotes the customer to the center of the model.

### 5.1 New / changed tables

| Table | Purpose | Status |
|---|---|---|
| `customers` | The canonical person/org. `id, client_id, display_name, avatar_url, primary_identifier_id, created_at, last_seen_at` | **Phase 2** |
| `customer_identifiers` | Multi-channel identity. `id, customer_id, channel ('whatsapp'\|'sms'\|'email'\|…), value (canonical phone / jid / email), label` | **Phase 2** |
| `conversations` | A thread = customer × channel × instance. `id, client_id, customer_id, channel, instance_id, chat_id, status ('open'\|'pending'\|'resolved'), assignee_type, assignee_id, unread_count, last_message_at` | **Phase 2** |
| `inbox_messages` *(extended)* | add `conversation_id, customer_id, status ('sent'\|'delivered'\|'read'\|'failed'), reply_to_id, reactions (json)` | **Phase 2** |
| `customer_tags` | `id, customer_id, tag, created_at` | Phase 3 |
| `customer_notes` | Internal-only notes. `id, customer_id, author_id, body, created_at` | Phase 3 |
| `customer_assignments` | Team/agent ownership. `id, customer_id, assignee_type, assignee_id` | Phase 3 |
| `customer_ai_summaries` | `id, customer_id, summary, model, generated_at` | Phase 4 |
| `domain_events` | Durable event log. `id, client_id, type, entity_type, entity_id, payload(json), created_at` | **Phase 2** |
| `media_assets` | Reusable media library. `id, client_id, kind, url, name, bytes, created_at` | Phase 5 |
| `automation_rules` | `id, client_id, trigger_event, condition(json), action(json), enabled` | Phase 4 |
| `ai_agents` | Agent registry. `id, client_id, name, description, model, knowledge_source_ids, triggers, enabled` | Phase 4 |
| `knowledge_sources` | `id, client_id, type, name, ref, status` | Phase 4 |
| `catalog_products` / `catalog_orders` | Commerce abstraction (internal, fed by connectors) | Phase 6 |

### 5.2 Identity & conversation resolution

Every inbound/outbound message resolves through one function: `resolveConversation(clientId, channel, identifier, instanceId) → { customer, conversation }`. It:

1. Normalizes the identifier (`normalizePhone` for WhatsApp DMs, group JID passthrough — already exists from Phase 1).
2. Finds or creates a `customer` + `customer_identifiers` row.
3. Finds or creates a `conversation` for (customer, channel, instance, chat_id).
4. Returns both so the message is written with `conversation_id` + `customer_id`.

This single chokepoint is what lets the inbox, CRM, campaigns, and AI all agree on *who* a message belongs to. The webhook and the send path both route through it.

### 5.3 Backfill (one-time, guarded migration)

For each distinct existing `chat_id`: create a `customer` (from any matching `contacts` row, else name = `from_name`/phone), a `customer_identifiers` row, and a `conversation`; stamp every historical `inbox_messages` row with `conversation_id` + `customer_id`. `contacts` becomes a legacy alias view onto `customers` (or is migrated wholesale) — decided in the Phase 2 slice that introduces the tables.

---

## 6. Centralized data layer (frontend)

**Rule (P7): components never call the API directly.** Today, components call `contactsApi.getAll()`, `clientMessagesApi.getAll()` inside ad-hoc `useEffect`s. This scatters fetching, caching, and realtime wiring. We centralize it.

### 6.1 Three layers

```
src/data/
├── api/                # Layer 1 — typed clients, one file per domain (migrated from src/services/)
│   ├── client.ts         # fetchApi wrapper + auth + { success, data?, error? } shape
│   ├── inbox.ts
│   ├── customers.ts
│   ├── campaigns.ts
│   ├── instances.ts
│   └── …
├── hooks/              # Layer 2 — domain data hooks (what components call)
│   ├── useInbox.ts       # messages + conversations + realtime + optimistic send
│   ├── useCustomers.ts
│   ├── useCampaigns.ts
│   └── …
├── providers/          # Layer 3 — Context providers, mounted once in AppProviders
│   ├── InboxProvider.tsx
│   ├── CustomersProvider.tsx
│   └── AppProviders.tsx  # composes them all
└── events.ts           # client-side EventBus: useInstanceSSE → bus → hooks
```

- **Layer 1 (api):** pure typed functions. No React. (The existing `src/services/*.ts` files migrate here, split by domain.)
- **Layer 2 (hooks):** each hook owns fetch, in-memory cache, optimistic updates, and subscribes to the `EventBus` for its domain. `useInbox()` returns `{ conversations, messages, sendMessage, markRead, … }`.
- **Layer 3 (providers):** mount the hook once and share via Context, so navigating Inbox → Customers → Inbox does not refetch. `AppProviders` composes every provider.
- **EventBus (`events.ts`):** the SSE bridge (`useInstanceSSE`, already mounted in `ClientDashboard`) emits onto this bus; hooks subscribe. Decouples transport from consumers and makes future WebSocket swap a one-layer change.

### 6.2 Consumption pattern

```tsx
// a component:
const { conversations, sendMessage } = useInbox();
```

No `useEffect` + `fetch` in components. No prop drilling of server state. This is the "centralized area where components fetch specific data."

---

## 7. Feature-folder structure & file rules

### 7.1 Frontend tree

```
src/
├── app/                       # shell, routing, global providers
│   ├── AppProviders.tsx
│   ├── routes.tsx
│   └── Shell.tsx
├── components/
│   ├── ui/                    # shared primitives: Button, Modal, Avatar, Badge, Icon, EmptyState…
│   ├── layout/                # Sidebar, Topbar, CommandBar, BottomNav
│   └── shared/                # UpdateToast, ErrorBoundary
├── features/                  # one folder per product surface
│   ├── inbox/                 # §10 — the conversation experience
│   │   ├── components/        # ConversationList, ConversationRow, ChatPanel, MessageBubble, Composer, CustomerDrawer…
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── customers/             # CRM / customer intelligence
│   ├── campaigns/             # marketing center
│   ├── automation/            # rules + triggers
│   ├── agents/                # AI agent registry + knowledge hub
│   ├── catalog/               # commerce (future)
│   ├── media/                 # media library
│   ├── status/                # status management
│   ├── developers/            # API keys, webhooks, logs, playground
│   ├── analytics/
│   ├── settings/
│   └── instances/             # WhatsApp containers
├── data/                      # §6 centralized data layer
├── lib/                       # pure utils: phone, formatters, tokens, dates
└── types.ts
```

### 7.2 Backend tree (mirrors domains)

```
server/src/
├── modules/                   # one folder per domain
│   ├── inbox/                 # conversations + messages + resolution
│   ├── customers/
│   ├── campaigns/
│   ├── automation/
│   ├── agents/
│   ├── media/
│   └── analytics/
├── events/                    # §4 event bus + catalog
├── channels/                  # §13 channel abstraction (whatsapp first)
│   └── whatsapp/              # current services/whatsapp/ moves here
├── services/domain/           # internal services (Catalog, Orders, Knowledge)
├── database/
├── middleware/
└── routes/                    # HTTP adapters that call modules
```

### 7.3 File rules (enforced)

- **Hard limit: 150 lines per file.** No exceptions. Today's offenders must be split as they are touched: `VibeWizard` (738), `SandboxSection` (735), `BulkMessagingPanel` (607), `TokenStoreSection` (580), `DocsSection` (432), `ImportContactsModal` (352), `MessagesView` (351), `ApiKeysSection` (334), and ~12 more.
- **One component per file.** Sub-modals/co-editors live as siblings in the same feature folder, not nested in one file.
- **One concern per hook/util.** `useTokenBalance`, `useInbox`, `formatTime` — separate files.
- **Public API per feature:** each `features/<domain>/index.ts` exports only what other features may import. No reaching into a feature's internals.
- **Cross-feature imports** go through `index.ts` barrels or through the data layer — never deep into another feature's `components/`.

---

## 8. Icon & visual system (no emoji chrome)

### 8.1 Professional icon mandate

- **All UI iconography uses [`lucide-react`](https://lucide.dev).** It is already the de-facto icon set in the codebase.
- **No emoji as UI chrome.** Replace existing emoji chrome on contact: `admin/DashboardOverview` uses `📨 ✅ 📱 🟢`; `VibeWizard` uses `✓` step markers; `MessageDetail` uses `↓ ↑` direction glyphs; `dashboardData` uses `🟢` flags. All become lucide icons (`Mail`, `CheckCircle`, `Smartphone`, `Circle`/`CircleDot`, `ArrowDown`/`ArrowUp`).
- **Emoji are allowed only as *content*:** the constrained reaction set (`thumbsup`, `heart`, `laugh`, …) is message content, not chrome, and stays. Anywhere an emoji would decorate a button, badge, nav item, or empty state, use a lucide icon instead.

### 8.2 Shared primitives (`components/ui/`)

Build a small, branded primitive set so feature folders don't reinvent styling:

| Primitive | Purpose |
|---|---|
| `Icon` | Thin lucide wrapper enforcing size + brand color tokens |
| `Avatar` | Photo with initials fallback + group indicator |
| `Badge` / `Tag` | status, unread counts, customer tags |
| `Button`, `IconButton` | brand variants (forest-deep primary, yellow accent) |
| `Modal`, `Drawer` | right-side info drawer + centered modals |
| `EmptyState` | icon + heading + copy + action |
| `Skeleton` | loading states (no generic spinners in lists) |

### 8.3 Brand tokens (no green chat bubbles)

- Layout and interaction language: WhatsApp-familiar. Colors: **FIDScript only** — forest-deep primary, yellow accent, stone neutrals.
- Outgoing bubbles: deep forest tint. Incoming: white/stone. Read receipts: blue double-check (parity expectation).
- Zero "WhatsApp" or "Evolution" strings in the UI.

---

## 9. Product surfaces

Each surface = one `features/<domain>` folder + one backend `modules/<domain>` + a slice of the event catalog.

| Surface | One-line definition | Phase |
|---|---|---|
| **Inbox** | Unified, multi-instance conversation workspace with a Customer Intelligence drawer | 2 |
| **Customers** | CRM: profiles, tags, notes, assignments, timeline, AI summary | 3 |
| **Campaigns** | Marketing center: broadcast, scheduled, segmented, trigger, drip | 5 |
| **Automation** | Event-triggered rules (keyword, status, order, inactivity) | 4 |
| **AI Agents** | Agent registry: per-agent model, knowledge, triggers, permissions | 4 |
| **Knowledge Hub** | Sources agents can read (site, docs, PDFs, catalog, FAQ) | 4 |
| **Catalog / Orders** | Internal commerce abstraction fed by store connectors | 6 |
| **Media Library** | Reusable assets across chat, campaigns, status | 5 |
| **Status** | Schedule, cross-post, reuse, analyze status updates | 5 |
| **Developers** | API keys, webhooks, logs, usage, rate limits, playground (already partly built) | 7 |
| **Analytics** | Send/deliver/read, campaign performance, response time, AI usage | 7 |
| **Instances** | WhatsApp containers (multi-number = one workspace) | 2 |

### 9.1 Multi-instance as one workspace (a key differentiator)

A business runs Sales / Support / Marketing numbers. The Inbox treats them as **one workspace** with filters (`All · Sales · Support · Marketing`), not separate screens. Conversation rows carry their instance/channel; the customer record unifies identity across them. This is enabled by the customer model in §5.

---

## 10. The Inbox — Phase 2 chat rebuild

The first concrete build on the new foundation. Same WhatsApp-familiar feel, but every message now belongs to a customer + conversation, the drawer is a Customer Intelligence shell, and realtime flows through the centralized layer.

### 10.1 Three-pane layout

```
┌───────────────┬────────────────────────────┬──────────────────┐
│ Conversation  │  Conversation              │ Customer         │
│ list          │  header / messages /       │ Intelligence     │
│ (340px)       │  composer                   │ Drawer (320px)   │
│               │                             │                  │
│ unified inbox │  avatar·name·presence       │ THIS is where    │
│ All/Sales/    │  bubbles grouped by date    │ FIDScript beats  │
│ Support/      │  reply quote · reactions    │ WhatsApp:        │
│ Marketing     │  typing indicator           │ customer, tags,  │
│ Unread/Groups/│  blue read ticks            │ notes, assignee, │
│ Archived      │  composer (+/emoji/mic/send)│ AI summary,      │
│ + universal   │                             │ timeline, orders │
│   search      │                             │                  │
└───────────────┴────────────────────────────┴──────────────────┘
```

The right drawer is the strategic differentiator. In Phase 2 it is a **shell** wired to the customer record (identity, tags placeholder, "open in CRM"). Phases 3–4 fill it (notes, assignments, AI summary, orders, timeline).

### 10.2 Responsive

- ≥1024px: all three panes.
- 640–1023px: list + conversation; drawer slides over.
- <640px: one pane at a time with back navigation; BottomNav keeps top-level nav.

### 10.3 Endpoint → feature map (all already built)

**Sending** — `/api/v1/messages/{type}/:instance`
| UI | Endpoint |
|---|---|
| Text | `POST /messages/text` |
| Photo/Video/Doc | `POST /messages/media` (upload via Cloudinary) |
| Location | `POST /messages/location` (Google Maps picker) |
| Contact card | `POST /messages/contact` |
| Poll / List | `POST /messages/poll`, `POST /messages/list` |
| Voice note (PTT) | `POST /messages/audio` (hold-to-record) |
| Sticker | `POST /messages/sticker` |
| Reaction | `POST /messages/reaction` |
| Reply/quote | `text`/`media` with reply key |

**Chat actions** — `/api/v1/chats/*`: mark-read/unread, archive, block, presence (typing), delete-for-everyone, update-message (edit), profile-pic-url, find-status (last seen), is-whatsapp (new-chat validation).

**Group actions** — `/api/v1/groups/*`: create, find/find-members, update-participant, invite-code/revoke, leave.

**Profile/Settings** — `/api/v1/profile/*`, `/api/v1/settings/*`.

### 10.4 Backend prerequisites for the full feel (call out honestly)

The *actions* exist; the **real-time events** behind blue ticks and "typing…" do not. Phase 1's webhook handles only `messages.upsert` + `connection.update`. Required in Phase 2:

- Webhook handlers for `messages.receipt` (delivered/read) and `presence.update` (typing) → update `inbox_messages.status` + emit `message.delivered`/`message.read` + `presence` events.
- Two new SSE event channels (`receipt`, `presence`) mirroring the existing `newMessage` pattern.
- Profile-picture cache (so the list doesn't call `/chats/profile-pic-url` per row on every render).
- Group metadata lazy-fetch + cache (real group subject/participant count instead of JID fallback).

### 10.5 Real-time flow (post-§6)

```
Evolution → webhook → resolveConversation → store → events.emit(message.received)
   → SSE → useInstanceSSE → client EventBus → useInbox hook → all panes re-render
```

Outbound is optimistic: the composer appends a `status:'sent'` message immediately; `message.delivered` / `message.read` events flip the ticks later.

---

## 11. AI as a first-class system

### 11.1 Never inline AI in messaging

The inbound path is:

```
message.received (event)
   → AI Engine (subscriber)
   → Automations (subscriber)
   → Human agents (UI)
   → Integrations (subscribers)
```

AI is **one subscriber** on `message.received`, not code inside the webhook.

### 11.2 AI Agent Registry (not one agent)

Each client can enable multiple independent agents:

| Agent | Reads (knowledge) | Acts on |
|---|---|---|
| Sales | product catalog, inventory | product questions |
| Support | docs, FAQs | answers, creates tickets |
| Booking | calendar, availability | schedules |
| Lead Qualifier | CRM fields | qualifies, tags |
| Order Tracking | orders, deliveries | status answers |
| Custom | client-defined knowledge | client-defined |

Tables: `ai_agents` (per-client config) + `knowledge_sources` (what each may read). Agents run through the internal service seam only.

### 11.3 Knowledge Hub

Agents read from curated sources — website, PDFs, docs, product catalog, FAQs, CRM, inventory, custom text — exposed as **internal services**. Agents never call a third-party API or scrape at runtime; knowledge is ingested into the hub and served internally. This is a durable competitive advantage and a safety boundary.

### 11.4 The Phase 2 seam (ship now, fill later)

`server/src/modules/automation/inboundPipeline.ts`:
```
runInboundPipeline(event) → { handled, reply? }
  1. load client's automation + agent config
  2. evaluate rules / agents
  3. if reply → send via the channel service (same path as a human send)
```
Wired as a `message.received` subscriber. Phase 2 ships the **empty pipeline + a keyword→canned-reply rule + an "Automation: off" default**. Enabling real AI later = adding an evaluator inside the pipeline. UI and data model already expect it (auto-replies are ordinary outgoing messages).

---

## 12. Campaigns → Marketing Center

Today: bulk messaging. Target: marketing automation, reusing the **same** send services as 1:1 chat so the two never drift.

- **Types:** broadcast, scheduled, segmented (by tag/segment), trigger-based (`order.created`, `customer.inactive`), drip sequences (step + delay).
- **Audience:** pick from customers, customer segments, contact-groups, or paste — validated via `/chats/is-whatsapp` where useful.
- **Content:** text + optional media from the Media Library; `{{name}}` / `{{field}}` template variables resolved per recipient.
- **Progress:** per-recipient status streamed live from `campaign_recipients`; tokens charged per successful send through the shared `chargeAndEmit` path.
- **Drip/trigger** campaigns are **event subscribers** (`order.created` → wait 7d → send follow-up). Built on the §4 bus, not bespoke schedulers inside campaign code.

DB additions (Phase 5): `campaign_segments`, `campaign_steps` (drip), `campaign_triggers` (event→campaign). The existing `campaigns` + `campaign_recipients` tables extend.

---

## 13. Commerce & channels (future seams)

### 13.1 Channel abstraction

`server/src/channels/<channel>/` implements: `sendMessage`, `receiveWebhook`, `parseEvent`, `normalizeIdentifier`, `identityKind`. WhatsApp is first (the current `services/whatsapp/` migrates in). Adding SMS / email / Instagram = a new folder; the inbox, customer model, and event bus are channel-agnostic.

### 13.2 Commerce abstraction (internal services only)

`server/src/services/domain/catalog.ts` and `orders.ts` expose products, orders, inventory, coupons, categories. Connectors (Shopify, WooCommerce, custom) populate these internal tables/services. **AI and automations call these internal services, never a third-party API.** This lets "Do you have this in stock?" / "Where is my order?" work without the agent touching Shopify.

---

## 14. Migration path from current code

The restructure is incremental — no big-bang rewrite. Each slice keeps prod green.

**Frontend:**
1. Create `src/data/{api,hooks,providers,events.ts}`. Migrate `src/services/*.ts` → `src/data/api/*.ts` one domain at a time (re-export from old paths to avoid breaking imports, then flip).
2. Add `AppProviders`; mount in `Shell`/`ClientDashboard`.
3. Create `src/features/inbox/`; move chat components in; route `MessagesView` → `features/inbox/InboxPage`. Split every oversized file as it moves (MessagesView 351 → many <150-line files).
4. Repeat per surface, oldest/most-touched first. Retire `src/components/client` sprawl gradually.

**Backend:**
1. Create `server/src/events/` (bus + catalog). Wire `emit()` into the webhook send/receive paths as the Phase 2 inbox slice lands.
2. Add `server/src/modules/inbox/` with `resolveConversation`; route webhook + send through it.
3. Move `server/src/services/whatsapp/` → `server/src/channels/whatsapp/` (re-export shim during transition).
4. Add modules per surface as each phase ships.

**Data:** introduce `customers`, `customer_identifiers`, `conversations`, `domain_events` + `inbox_messages` extensions in guarded `ALTER TABLE`/`CREATE TABLE IF NOT EXISTS` migrations (existing pattern). Run the §5.3 backfill once.

---

## 15. Phased roadmap

Each phase = reviewable slices; each slice = build both → commit → push → `bash deploy.sh` → verify on prod (Kennedy / `swaysuite`).

| Phase | Theme | Builds |
|---|---|---|
| **2 (now)** | Foundations + Inbox | feature folders + centralized data layer; event bus skeleton; customer model + `resolveConversation`; professional icon system + ui primitives; Inbox rebuild (3-pane, BI drawer shell); receipt/typing/presence webhook + SSE |
| **3** | Customer Intelligence + Collaboration | tags, internal notes, assignments, AI-summary hook, universal-search foundation, customer timeline |
| **4** | Automation + AI Agents | event subscribers; AI Agent Registry v1; Knowledge Hub v1; rule + keyword automations; inbound pipeline evaluator |
| **5** | Marketing Center | campaign types (segmented, trigger, drip); media library; status management (schedule, cross-post, reuse) |
| **6** | Commerce + Channels | catalog/orders internal services; Shopify/Woo connectors; multi-channel inbox |
| **7** | Platform & Analytics | developer platform polish (webhooks, logs, rate limits, playground); analytics dashboards; outbound webhook fan-out from `domain_events` |

**Phase 2 internal slices (the immediate work):**
- **A — Foundations:** `data/` layer + `AppProviders` + client `EventBus`; backend `events/` skeleton + `resolveConversation` wired into webhook/send. *Verify: inbox still loads; messages push real-time; each message now has customer/conversation ids.*
- **B — Inbox UI:** new `features/inbox` three-pane shell reusing the data layer; ConversationList (unified multi-instance, filters); Customer Intelligence drawer shell. *Verify: same threads, multi-instance filter works, drawer opens.*
- **C — Messages & composer:** branded MessageBubble for all 11 types, date grouping, reply-quote, Composer (attachment sheet, mic, emoji-as-content). *Verify: every type renders + sends.*
- **D — Realtime feel:** webhook receipt/presence + SSE channels; blue ticks; typing; profile-pic cache; group metadata. *Verify: ticks + typing live.*
- **E — Icon & primitive sweep:** replace all emoji chrome with lucide; land `components/ui/` primitives; split the 150-line offenders touched along the way.

---

## 16. Conventions, guardrails & verification

**Code:**
- No `any`. API shape `{ success, data?, error? }`. Import types from the data layer / `types.ts`.
- Files ≤150 lines (hard). One component per file. One concern per hook/util.
- Feature folders only; cross-feature imports through barrels or the data layer.
- Components never call the API directly (P7) — go through `data/hooks`.

**Backend:**
- `encodeURIComponent` on all Evolution instance-name paths. `logApiRequest` on every op. `X-API-Version: v1` on all `/api/v1` responses.
- All domain mutations dispatch a catalog event. Subscribers never run inline in routes.
- Internal services are the only path to third-party systems (P6).

**Visual:**
- `lucide-react` for all iconography. No emoji as chrome (reactions-as-content are the only exception).
- FIDScript palette only. No "WhatsApp"/"Evolution" strings in UI.

**Per-slice verification (on prod):**
- Real-time push works without refresh (Phase 1 invariant holds).
- Send + reply land in the same thread (canonical `chatId`).
- New numbers auto-create customers/contacts.
- Tokens change only on successful sends.
- `npm run build` (frontend) + `cd server && npm run build` both clean.
- `grep -ri "evolution\|whatsapp" src/features/` → only intended brand copy, never "Evolution".
- No file >150 lines in the touched paths.

---

*This document is the single source of truth for FIDScript's evolution past Phase 1. Update it as decisions land; every phase and slice references the section it implements. The guiding test for any change remains Principle P8: will this still work when we add AI agents, automations, commerce, CRM, team collaboration, analytics, and developer APIs?*
