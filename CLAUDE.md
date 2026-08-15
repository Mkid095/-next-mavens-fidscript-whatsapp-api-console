# FIDScript WhatsApp API Platform

**WhatsApp Business API platform for Kenyan businesses — multi-instance WhatsApp management, AI chatbot builder, campaign messaging, and token-based billing.**

> **STRICT RULE — READ BEFORE ANY WORK:** This project follows ANPAS (AI-Native Project Architecture Standard). All AI agents doing development work in this codebase MUST follow the rules in `.ai/coding-rules.md` and verify their work against `.ai/review-checklist.md` BEFORE declaring done. Non-compliance is not optional.

---

## Non-Negotiable Development Rules

These rules are enforced on every task. No exceptions without documented approval.

| Rule | Limit | Enforcement |
|------|-------|-------------|
| Max file size | **150 lines** | Count before committing |
| File naming | `[domain]-[action]-[type].ts` | No `helpers.ts`, `common.ts`, `utils.ts` |
| Business logic | **NEVER** in React components | Always in services/hooks/lib |
| UI components | **NEVER** contain API calls, validation, or business logic | Only rendering + event emission |
| Generic utilities | **FORBIDDEN** | helpers.ts, common.ts, misc.ts, utils.ts do not exist |
| **No sparkle icon** | **Strictly forbidden** (✨, `<Sparkles>`, stars ★, magic wand, robot, brain, lightning bolt) — use Lucide or no icon |
| TypeScript | Strict — no `any`, no implicit `any` | tsc --noEmit must pass |
| Commit | **Always update CHANGELOG.md** | Every commit, every change |
| Documentation | **Docs-as-you-build** | Feature README created AT implementation time |
| No dead code | **Remove unused code** | Never comment out — delete |

---

## AI Agent Entry Order

Before touching any code, read in this exact order:

1. **`.ai/coding-rules.md`** — enforcement rules (non-negotiable)
2. **`.ai/project-manifest.md`** — system overview, domains, flows
3. **`.ai/review-checklist.md`** — must complete every item before declaring done
4. **`.ai/workflows.md`** — execution flow
5. This file (`CLAUDE.md`)
6. Then: `apps/api/CLAUDE.md` or `apps/frontend/CLAUDE.md` (whichever is relevant)
7. Then inspect the actual source files

---

## Monorepo Structure

```
fidscript-whatsapp/
├── apps/
│   ├── api/           # Express API server (migration target: server/)
│   ├── frontend/     # React SPA (migration target: src/)
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
├── .ai/              # AI OPERATING LAYER (ANPAS)
├── CLAUDE.md          # This file
├── AGENTS.md          # AI agent rules summary
└── CHANGELOG.md       # Change log — UPDATE ON EVERY COMMIT
```

---

## URLs & Ports

| Environment | URL | Port |
|-------------|-----|------|
| Dev Frontend | http://localhost:3000 | 3000 |
| Dev Backend | http://localhost:3099 | 3099 |
| Production | https://whatsapp.fidscript.com | 443 |
| Evolution API | http://localhost:8080 | 8080 |

---

## WhatsApp Message Flow

```
WhatsApp → Evolution API → Webhook (apps/api)
    → NATS (chatbot.inbound.<workspaceId>)
    → Worker (apps/worker) → AI Engine (LLM)
    → Evolution API (send response)
```

---

## Key File Locations

| Purpose | Location |
|---------|----------|
| Root doc | `CLAUDE.md` (this file) |
| API docs | `apps/api/CLAUDE.md` |
| Frontend docs | `apps/frontend/CLAUDE.md` |
| Shared types | `packages/types/src/` |
| OpenAPI spec | `docs/openapi.json` |
| Architecture | `docs/PLATFORM_ARCHITECTURE.md` |
| Deployment | `deploy.sh` (root) |

---

## Migration Note

The codebase is being restructured into a proper monorepo under `apps/`:
- `apps/api/src/` is the migration target for `server/`
- `apps/frontend/src/` is the migration target for `src/`
- `apps/worker/src/` is the migration target for `server/src/chatbot-worker/`

**Currently `server/` and `src/` remain canonical.** Do not migrate existing code without coordination.

---

## Authentication

**Passwordless magic-code authentication.** There are no passwords anywhere in the system.

| Step | File |
|------|------|
| Code generation | `server/src/utils/authCodes.ts` |
| Email delivery (Resend) | `server/src/utils/sendMagicCodeEmail.ts` |
| Admin login | `server/src/routes/auth/magicAuth.ts` |
| Client register/login | `server/src/routes/auth/clientMagicAuth.ts` |

---

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

---

## Verification Checklist (Run Before Every Commit)

- [ ] No file exceeds 150 lines (count with `wc -l`)
- [ ] No `helpers.ts`, `common.ts`, `misc.ts`, `utils.ts`, `tools.ts` files exist
- [ ] No business logic in React components (`src/components/*.tsx`, `apps/frontend/src/**/*.tsx`)
- [ ] No `any` types introduced
- [ ] No commented-out code — delete instead
- [ ] CHANGELOG.md updated with this change
- [ ] `tsc --noEmit` passes in the relevant app
- [ ] Feature README created if new feature added
