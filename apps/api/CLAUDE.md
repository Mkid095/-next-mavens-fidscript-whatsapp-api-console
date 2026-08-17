# apps/api - Express API Server

## Purpose

The main HTTP API server. Single source of truth for all business logic, database operations, and Evolution API calls. All other services (frontend, CLI, SDK, webhooks) communicate exclusively through this API.

**NOT**: A chatbot processor (that's `apps/worker`), an HTTP proxy, or a queue.

---

## Key Files

```
src/
├── index.ts                    # Entry point - Express app setup, middleware, route registration
├── database.ts                 # sql.js init, schema, migration runner, seed data
├── database/
│   ├── index.ts                # Imports ALL phase migrations
│   ├── tables.ts               # Core table definitions (CREATE TABLE IF NOT EXISTS)
│   └── phase*.ts               # Sequential migrations (phase3 → phase31)
├── routes/
│   ├── index.ts                # Mounts all sub-routers
│   ├── webhook.ts               # Evolution API webhook receiver (415 lines - needs split)
│   ├── sse.ts                   # Server-Sent Events for real-time updates
│   ├── auth/                    # Admin + client JWT auth, magic code
│   ├── v1/                      # Public /api/v1/ endpoints (API key auth)
│   ├── platform/                # Workspace-scoped API (JWT auth)
│   ├── admin/                   # Admin-only routes (analytics, instances, keys)
│   ├── clients.ts               # Client CRUD
│   ├── contacts.ts              # Contact management (383 lines - needs split)
│   ├── campaigns.ts             # Campaign + drip flow management
│   └── instance/                # WhatsApp instance lifecycle
├── modules/
│   ├── ai/                      # Chatbot engine, LLM gateway, tool runner, context manager
│   ├── chatbot/                 # Publish pipeline, validation
│   ├── automation/               # Automation rules
│   ├── campaigns/               # Dispatch, drip, triggers, status scheduler
│   ├── customers/               # Contact/conversation resolution
│   └── platform/                # Analytics, audit, events, search, webhooks, workspace
├── middleware/
│   ├── auth/                    # jwt, clientJwt, clientApiKey, v1Limits, rateLimit
│   └── v1Version.ts             # X-API-Version: v1 header
├── services/whatsapp/
│   ├── shared.ts                # chargeAndEmit, wrapSend (idempotency), SendContext
│   ├── messaging.ts             # 10 send types via wrapSend
│   ├── groups.ts                 # 16 group ops
│   ├── chats.ts                  # 13 chat ops
│   ├── profile.ts                # 6 profile + 2 settings ops
│   └── instanceOps.ts           # connectionState, restart, logout, connect, setPresence
└── utils/
    ├── evolution.ts              # callEvolutionAPI, callEvolutionAPIChecked (URL-encodes instance names!)
    ├── audit.ts                  # logAuditAction, logApiRequest
    ├── messageParser.ts          # parseIncomingMessage (12 inbound types)
    └── errors.ts                 # Shared error helpers

public/
└── logo.png                     # Served statically

Dockerfile                        # Production Docker image (bakes in dist/)
deploy.sh                         # Smart deploy: commits, builds, Docker restart
```

---

## API Namespaces

| Namespace | Auth | Description |
|-----------|------|-------------|
| `/api/auth/*` | None/JWT | Admin + client login, magic code |
| `/api/v1/*` | API Key | Public integrator API (rate-limited) |
| `/api/platform/*` | Client JWT | Workspace-scoped API (contacts, conversations) |
| `/api/admin/*` | Admin JWT | Platform analytics, all instances |
| `/api/instance/*` | Mixed | WhatsApp instance lifecycle |
| `/api/clients/*` | Admin JWT | Client management |
| `/api/payments/*` | None | M-Pesa STK push |
| `/api/contacts` | Client JWT | Contact import/export |

---

## Dependencies

- **Incoming**: Evolution API webhooks (WhatsApp events), admin browsers (dashboard), client browsers (portal), CLI (via HTTP), SDK (via HTTP)
- **Outgoing**: SQLite (sql.js), Evolution API (WhatsApp gateway), NATS (message queue), Resend (email)

---

## Boundaries

**This does NOT:**
- Process chatbot messages (worker does via NATS)
- Run in a queue/worker loop
- Serve the React frontend (nginx does that)

**Worker and CLI communicate through:**
- `/api/v1/*` endpoints (same as external clients)
- NATS for inbound message queue (worker publishes to `chatbot.inbound.<workspace_id>`)

---

## Related

- [Root CLAUDE.md](../CLAUDE.md)
- [System Flow](../docs/architecture/system-flow.md)
- [Data Model](../docs/architecture/data-model.md)
- [apps/worker/CLAUDE.md](../worker/CLAUDE.md)
