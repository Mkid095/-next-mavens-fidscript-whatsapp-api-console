# apps/api/src — Express API Server Source

**`server/` is a symlink to this directory.** All API source code lives here.
`apps/api/src/` is the single source of truth for the backend.

## Directory Structure

```
src/
├── index.ts                    # Entry point — Express bootstrap + /api/reference
├── serverStart.ts              # Middleware setup, route registration
├── middlewareSetup.ts          # CORS, Helmet, raw body capture, connector webhook mount
├── routesRegister.ts           # Mounts all sub-routers
├── database.ts                 # sql.js init + DatabaseWrapper export
├── types.ts                    # App-level types
├── global.d.ts                 # Global type declarations
├── sql.js.d.ts                 # sql.js type shims
│
├── database/                   # Migrations (phase3 → phase36)
│   ├── index.ts               # Imports + runs all phases
│   ├── schema.ts              # Core CREATE TABLE statements
│   ├── tables.ts              # Core table constants
│   ├── seed.ts                # Seed data
│   ├── indexes.ts              # Core indexes
│   └── phase*.ts             # Sequential migrations
│
├── kernel/                     # Core domain (event bus, automation, identity)
│   ├── audit/                  # Audit trail writer
│   ├── automation/             # Automation engine + chatbot engine
│   ├── campaigns/             # Campaign types
│   ├── entities/              # Contact/conversation resolution
│   ├── events/               # Event bus + catalog + dispatch
│   └── identity/             # Workspace context, can(), scope()
│
├── routes/                    # HTTP endpoints
│   ├── index.ts              # Mounts all sub-routers
│   ├── admin.ts              # /admin/* → adminRouter
│   ├── admin/                # Admin-only (analytics, instances, llm, billing, health)
│   ├── auth/                 # JWT + magic code auth
│   ├── v1/                   # Public API (API key auth)
│   ├── platform/             # Workspace-scoped (client JWT)
│   ├── contacts/             # Contact management
│   ├── conversations/        # Conversation handlers
│   ├── clients.ts            # Client CRUD
│   ├── campaigns.ts          # Campaign + drip
│   ├── webhook.ts            # Evolution API webhook receiver
│   ├── webhook/              # Webhook sub-handlers
│   ├── sse/                  # SSE real-time events
│   └── instance/             # WhatsApp instance lifecycle
│
├── modules/                   # Feature business logic
│   ├── ai/                   # LLM gateway, tool runner, context, memory
│   ├── automation/           # Automation rules + engine
│   ├── chatbot/              # Publish pipeline + validation
│   ├── campaigns/            # Drip, triggers, status scheduler
│   ├── customers/            # Contact/conversation resolution
│   ├── connectors/           # Shopify + WooCommerce connectors
│   └── platform/             # Analytics, audit, search, webhooks, workspace
│
├── services/                  # Shared services
│   ├── email/                 # Resend provider + templates
│   ├── paymentService.ts     # M-Pesa STK push
│   ├── pricingService.ts     # Token pricing
│   ├── contactResolver.ts    # Contact identity resolution
│   └── whatsapp/             # Evolution API HTTP calls (10 send types)
│
├── middleware/                 # Express middleware
│   ├── auth/                 # jwt, clientJwt, clientApiKey, rateLimit
│   └── v1Version.ts          # API version header
│
└── chatbot-worker/            # ⚠️ LEGACY — canonical worker is apps/worker/src/
    └── index.ts             # NATS subscriber (runs as separate process)
```

## Key Constraints

- **Max 150 lines per file** — split any file that exceeds this
- Route handlers go in `routes/` (one file per domain)
- Business logic in `modules/` or `services/`
- No direct Evolution API calls outside `services/whatsapp/`
- Database: use `db.prepare().get/all/run()` — NOT `db.exec()`
- Import paths must use `.js` extensions (moduleResolution: "bundler")

## API Namespaces

| Namespace | Auth | Description |
|-----------|------|-------------|
| `/api/auth/*` | None/JWT | Admin + client login, magic code |
| `/api/v1/*` | API Key | Public integrator API (rate-limited) |
| `/api/platform/*` | Client JWT | Workspace-scoped (contacts, conversations) |
| `/api/admin/*` | Admin JWT | Platform analytics, all instances |
| `/api/instance/*` | Mixed | WhatsApp instance lifecycle |
| `/api/payments/*` | None | M-Pesa STK push |
| `/api/contacts` | Client JWT | Contact import/export |

## Phase 36 — Connector Event Retry

| Column | Purpose |
|--------|---------|
| `status` | `pending` → `processing` → `completed` / `failed` |
| `retry_count` | Attempts made (max 5) |
| `last_error` | Error message from last failure |
| `next_retry_at` | ISO timestamp for next retry (NULL = permanent failure) |

Backoff schedule: 1m → 5m → 30m → 2h → 8h

Admin endpoints:
- `GET /admin/system/connector-events` — list with filter by status/workspace/connector
- `POST /admin/system/connector-events/retry/:id` — re-dispatch a failed event

## Phase 37 — Webhook Replay Protection

`webhook_delivery_ids` table: `(delivery_id PK, received_at)`

Inbound connector webhooks are protected by:
- **Shopify**: `X-Shopify-Notification-Id` + `X-Shopify-Triggered-At` (5-min age check)
- **WooCommerce**: `X-Wc-Webhook-Id` dedup (HMAC already makes each delivery unique)
- **SDK → `/api/webhook/evolution`**: `X-FIDScript-Delivery-ID` + `X-FIDScript-Delivery-Timestamp`

Helper: `kernel/webhooks/replayProtection.ts` → `markOrReject(deliveryId, timestamp)`.

SDK consumers use `new WebhookDeliveryTracker(maxAgeMs)` from `sdks/node-fidscript/src/webhooks.ts`.

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
- [apps/worker/CLAUDE.md](../worker/CLAUDE.md)
- [docs/PLATFORM_ARCHITECTURE.md](../../docs/PLATFORM_ARCHITECTURE.md)
