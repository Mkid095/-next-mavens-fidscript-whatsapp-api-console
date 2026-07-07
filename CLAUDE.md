# FIDScript WhatsApp API Platform

## Project Overview

WhatsApp API platform for Kenyan businesses. A monorepo with React frontend, Express API server, NATS-based chatbot worker, CLI, and shared SDKs.

## Monorepo Structure

```
fidscript-whatsapp/
├── apps/
│   ├── api/         # Express API server (migration target: server/)
│   ├── frontend/    # React SPA (migration target: src/)
│   ├── worker/      # NATS chatbot processor
│   └── cli/         # CLI tools
├── packages/
│   └── types/       # Shared TypeScript types (@fidscript/types)
├── sdks/
│   └── node-fidscript/  # Node.js SDK
├── docs/            # Architecture docs, OpenAPI spec
├── scripts/         # Build and deployment scripts
├── server/          # Express + sql.js (CURRENT — see Migration below)
└── src/             # React frontend (CURRENT — see Migration below)
```

## URLs & Ports

| Environment | URL | Port |
|-------------|-----|------|
| Dev Frontend | http://localhost:3000 | 3000 |
| Dev Backend | http://localhost:3099 | 3099 |
| Production | https://whatsapp.fidscript.com | 443 |
| Evolution API | http://localhost:8080 | 8080 |

## Build Commands

```bash
# Frontend
cd apps/frontend && npm run build

# API server (apps/api is migration target, currently use server/)
cd server && npm run dev

# Worker
cd apps/worker && npm run dev

# All packages
npm run build --workspace=@fidscript/types
```

## Migration Note

The codebase is being restructured into a proper monorepo under `apps/`:
- `apps/api/src/` is the migration target for `server/`
- `apps/frontend/src/` is the migration target for `src/`
- `apps/worker/src/` is the migration target for `server/src/chatbot-worker/`

**Currently `server/` and `src/` remain canonical.** Do not migrate existing code without coordination.

## Key File Locations

| Purpose | Location |
|---------|----------|
| Root doc | `CLAUDE.md` (this file) |
| API docs | `apps/api/CLAUDE.md` |
| Frontend docs | `apps/frontend/CLAUDE.md` |
| Worker docs | `apps/worker/CLAUDE.md` |
| Shared types | `packages/types/src/` |
| OpenAPI spec | `docs/openapi.json` |
| Architecture | `docs/PLATFORM_ARCHITECTURE.md` |
| Deployment | `deploy.sh` (root) |

## WhatsApp Message Flow

```
WhatsApp → Evolution API → Webhook (apps/api)
    → NATS (chatbot.inbound.<workspace>)
    → Worker (apps/worker) → AI Engine (LLM)
    → Evolution API (send response)
```

## Code Quality Rules

### 150-Line Limit
No file should exceed 150 lines. Split files that grow beyond this:
- Components: co-locate modals in a folder (e.g., `whatsapp/WhatsAppContainers.tsx`)
- Hooks/utilities: one concern per file
- Backend routes: one route file per feature domain

### No `any` Type
Use proper interfaces. Import types from `@fidscript/types` or define new ones.

### No Dead Code
- Remove unused imports (build fails on them)
- No commented-out code — delete instead
- Share logic via utils/services, don't duplicate

## Database & Deployment

SQLite via sql.js (`server/fidscript.db`). Deploy via `bash deploy.sh` (Docker + Traefik + nginx).
