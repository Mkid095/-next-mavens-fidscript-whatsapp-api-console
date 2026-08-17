# System Overview

**Purpose:** WhatsApp Business API platform for Kenyan businesses - multi-instance WhatsApp management, AI chatbot builder, campaign messaging, and token-based billing.

**Version:** 0.9.9

**Last Updated:** 2026-07-30

---

## Core Domains

- **Instances:** WhatsApp instance lifecycle - create, connect, disconnect, restart, webhook management
- **Chatbots:** AI chatbot builder - flow editor, LLM connections, tool definitions
- **Messages:** Real-time inbox - SSE streaming, message thread, media handling
- **Campaigns:** Broadcast campaigns - scheduled sends, drip flows, audience segmentation
- **Contacts:** Contact management - import, tags, group sync (Google Contacts)
- **Payments:** Token billing - M-Pesa STK push, token top-up, usage tracking
- **API Gateway:** Public REST API - API key auth, rate limiting, webhook delivery

---

## Critical Flows

### Inbound WhatsApp Message
```
WhatsApp → Evolution API webhook → /api/webhook
    → NATS publish (chatbot.inbound.<workspaceId>)
    → Worker (apps/worker) → AI Engine (LLM)
    → Evolution API (send response)
```

### Client JWT Auth
```
POST /api/auth/request-code → Resend email (6-digit code)
POST /api/auth/verify-code → JWT issued (type: admin | client)
```

### Token-Based Billing
```
Client → POST /api/payments/topup → M-Pesa STK push
M-Pesa callback → tokens credited → client balance updated
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React 18 + Vite SPA | 18.x / 6.x |
| Backend | Express.js + sql.js | 4.x / 0.24.x |
| Database | SQLite (sql.js) | - |
| WhatsApp Gateway | Evolution API | - |
| Message Queue | NATS | - |
| Email | Resend | - |
| Payments | M-Pesa | - |
| SDK | Node.js | - |
| Container | Docker | - |
| Reverse Proxy | Traefik + nginx | - |

---

## Monorepo Structure

```
fidscript-whatsapp/
├── apps/
│   ├── api/           # Express API server (migration target for server/)
│   ├── frontend/     # React SPA (migration target for src/)
│   ├── cli/          # CLI tools
│   └── whatsapp-api/  # WhatsApp-specific API helpers
├── packages/
│   └── types/         # Shared TypeScript types (@fidscript/types)
├── sdks/
│   └── node-fidscript/ # Node.js SDK
├── server/            # CURRENT Express + sql.js (migration target)
├── src/              # CURRENT React frontend (migration target)
├── docs/              # Architecture docs, OpenAPI spec
├── scripts/           # Build and deployment scripts
├── .ai/              # AI operating layer (ANPAS)
├── CLAUDE.md          # Root project identity
├── AGENTS.md          # AI agent rules
└── CHANGELOG.md       # Change log
```

---

## Restricted Areas

- **server/database.ts** - sql.js init, schema, migration runner; changes risk data loss
- **apps/api/src/database/** - sequential phase migrations (phase3 → phase31); ordering matters
- **apps/api/src/routes/webhook.ts** - 415 lines; handles all Evolution API webhook events
- **server/src/utils/authCodes.ts** - magic code generation, hashing, expiry; security-critical

---

## Entry Points

### For Humans
- Start here: `README.md`
- Architecture: `docs/PLATFORM_ARCHITECTURE.md`
- Decisions: `docs/decisions/`

### For AI Agents
- First read: `CLAUDE.md` (root)
- Coding rules: `.ai/coding-rules.md`
- Review checklist: `.ai/review-checklist.md`
- Feature details: `apps/api/CLAUDE.md`, `apps/frontend/CLAUDE.md`

---

## Quick Navigation

| If you need to... | Go to... |
|-------------------|----------|
| Understand the project | `CLAUDE.md` (root) |
| Add API feature | `apps/api/src/routes/` |
| Add frontend feature | `apps/frontend/src/features/` |
| Modify WhatsApp webhook | `apps/api/src/routes/webhook.ts` |
| Change auth flow | `server/src/utils/authCodes.ts` |
| See recent changes | `CHANGELOG.md` |
