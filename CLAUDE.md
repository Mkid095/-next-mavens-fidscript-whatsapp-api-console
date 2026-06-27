# FIDScript WhatsApp API - Project Claude

## Project Overview
WhatsApp API platform for Kenyan businesses. Frontend on React + Vite, Backend on Express + SQLite (sql.js).

## URLs & Ports

| Environment | URL | Port |
|-------------|-----|-------|
| Development Frontend | http://localhost:3000 | 3000 |
| Development Backend | http://localhost:3099 | 3099 |
| Production Frontend | https://whatsapp.fidscript.com | 443 |
| Production API | https://whatsapp.fidscript.com/api | 443 |
| Evolution API | http://localhost:8080 | 8080 |

## Project Structure

```
fidscript-whatsapp/
├── src/                    # Frontend React app
│   ├── App.tsx             # Root component with routing
│   ├── components/         # All page components
│   │   ├── ClientDashboard.tsx   # Client portal (state-based routing)
│   │   ├── DashboardOverview.tsx  # Admin dashboard
│   │   ├── InstancesView.tsx     # Admin instances page
│   │   ├── ClientsView.tsx      # Admin clients page
│   │   ├── LogsAndAnalyticsView.tsx
│   │   ├── InboxView.tsx
│   │   ├── SecurityKeysView.tsx
│   │   ├── LandingPage.tsx       # Marketing landing page
│   │   ├── LoginView.tsx        # Auth page (login/register)
│   │   └── Sidebar.tsx          # Client sidebar + BottomNav
│   ├── services/
│   │   └── api.ts              # All API calls (frontend → backend)
│   └── types.ts                 # Shared type definitions
├── server/                   # Express backend
│   └── src/
│       ├── index.ts            # Server entry + route registration
│       ├── database.ts         # SQLite schema + seed data
│       ├── middleware/
│       │   └── auth.ts        # JWT + API key authentication
│       └── routes/            # Feature-based route modules
│           ├── auth.ts         # Admin auth
│           ├── clientAuth.ts    # Client JWT auth
│           ├── admin.ts        # Admin analytics/logs
│           ├── clients.ts      # Client CRUD
│           ├── instances.ts     # WhatsApp instances
│           ├── payments.ts      # M-Pesa integration
│           ├── plans.ts        # Subscription plans
│           ├── uploads.ts       # Media uploads
│           ├── contacts.ts      # Client contacts
│           ├── clientMessages.ts # Inbox messages
│           └── clientKeys.ts   # API key management
└── public/                  # Static assets
```

## Deployment

### Production Paths
| Path | Purpose |
|------|---------|
| `/home/ken/fidscript-deploy/installer/docker/whatsapp-frontend.dist` | **Live frontend root** — bind-mounted into the `fidscript_whatsapp_frontend` nginx container (`/usr/share/nginx/html`). Run `deploy.sh` to sync here. Do NOT use `/var/www/whatsapp.nextmavens.cloud` (unused). |
| `/home/ken/fidscript-deploy/installer/docker/whatsapp-frontend.conf` | Live nginx config (SPA routing + cache headers). Single-file bind-mount — after editing, restart the container to pick up changes (new inode). |
| `/home/ken/fidscript-deploy/installer/docker/docker-compose.yml` | Docker stack for Traefik + frontend nginx + backend containers |
| `/home/ken/fidscript-whatsapp/server` | PM2 working dir |
| `/home/ken/fidscript-whatsapp/server/dist` | Compiled backend (server/) |
| `/home/ken/fidscript-whatsapp/server/fidscript.db` | Runtime SQLite DB (gitignored) |
| `/home/ken/fidscript-whatsapp/server/ecosystem.config.cjs` | PM2 config (gitignored, modified at deploy time) |

### Production Architecture
- **Traefik** (`fidscript_traefik`) owns ports 80/443, terminates TLS (Let's Encrypt), and routes via file provider (`/etc/traefik/dynamic.yml`):
  - `whatsapp.fidscript.com/` → `fidscript_whatsapp_frontend` (nginx, static SPA + `/api/` proxy)
  - `whatsapp.fidscript.com/api/` + `api.whatsapp.fidscript.com` → `fidscript-whatsapp-api:3099` (Express)
- **Frontend nginx** (`fidscript_whatsapp_frontend`) serves the built SPA from the bind-mounted `.dist` dir; it also proxies `/api/` to the backend. Conf is a single-file bind mount (restart container after editing).
- After a frontend deploy, browsers must fetch the new `index.html` — it's served `no-cache` so stale bundle hashes can't strand users on a blank page.

### Production Frontend Build
```bash
npm run build   # Outputs to dist/, then synced to whatsapp-frontend.dist by deploy.sh
```

### Backend Start
```bash
cd server && npm run dev  # Uses tsx loader (local dev only)
```

### Production
- Frontend served by the **`fidscript_whatsapp_frontend` nginx container** from the bind-mounted `whatsapp-frontend.dist` dir
- Backend runs in **Docker** (`fidscript-whatsapp-api`, port 3099 internal) — reached via Traefik/nginx, not bound on the host. PM2 is **no longer used**.
- **Traefik** (`fidscript_traefik`) owns host ports 80/443, terminates TLS, and routes by Host header
- Evolution API (`nextmavens_evolution`, WhatsApp gateway) runs on 127.0.0.1:8080
- **fidscript.db and ecosystem.config.cjs are gitignored** — do not commit them

### Smart Deployment Script
```bash
bash deploy.sh   # Full workflow: pull → detect → build → sync → restart → record
```

**Prerequisites:** All local changes must be committed before running.

**What it does:**
1. Refuses to run if uncommitted changes exist (`git status --porcelain`)
2. Pulls from GitHub (`git pull origin main`)
3. Detects changes using `git diff --name-only HEAD~1`
4. Rebuilds changed components (frontend, backend, or both) — **always cleans dist/ before rebuild**
5. Syncs frontend `dist/` to the docker nginx root (`whatsapp-frontend.dist`) and reloads nginx
6. Rebuilds backend and restarts the `fidscript-whatsapp-api` Docker container
7. Records deployment to `deploy_versions` DB table
8. Logs everything to `deploy.log`

**If "no relevant changes" detected:** still forces a clean rebuild to eliminate stale artifacts.

### Version Tracking
```bash
# Get latest deploy version (public)
curl https://whatsapp.fidscript.com/api/versions/latest

# Get deploy history (admin only)
curl -H "Authorization: Bearer <admin_token>" https://whatsapp.fidscript.com/api/versions/history
```

The deploy script automatically records each deployment with:
- `version` — from `git describe --tags` (or `1.0.0` fallback)
- `commit_hash` — from `git rev-parse --short HEAD`
- `changes_summary` — from `git diff --stat HEAD~1`
- `service` — which service was deployed (frontend, backend, or both)


## Type Safety Rules

### DO NOT USE `any` TYPE
- All API responses must use proper interfaces
- Import types from `src/services/api.ts` for API shapes
- Import types from `src/types.ts` for component props
- If types don't match, update the interface, don't use `any`

### Type Ownership
- `src/services/api.ts` → defines API response types (Instance, Client, etc.)
- `src/types.ts` → defines UI-specific types (InboxMessage, SystemLog, etc.)
- Never import from sql.js/better-sqlite3 types directly into components

## API Endpoints

### Public Integrator API (`/api/v1`)

**Base URL:** `https://whatsapp.fidscript.com/api/v1`
**Auth:** `X-API-Key: fidscript_live_…` header on every request. All responses carry `X-API-Version: v1`. Response shape: `{ success, data?, error? }`.

Token model: **sends cost tokens; management/read ops are free.** Rate limits per category: sends = plan `clientRateLimit` (per-client msg/min); reads `V1_READ` = 600/min; mutations `V1_MUTATE` = 120/min; profile/restart `V1_STRICT` = 30/min. Idempotency: send endpoints accept `Idempotency-Key: <uuid>` header — retries return cached result with no re-charge.

Webhook storage: inbound `messages.upsert` events store both `extra` (normalized JSON: `{messageType, content, mediaUrl, mediaMimetype}`) and the full `raw_payload` (Evolution's complete event JSON) in `inbox_messages`.

| Category | Ops | Cost | Rate Limit |
|---|---|---|---|
| Messaging (10 sends) | text/media/location/contact/reaction/poll/list/audio/sticker/status | tokens | clientRateLimit (plan-based) |
| Groups | 16 ops | free | V1_MUTATE |
| Chats | 13 ops | free | V1_READ / V1_MUTATE |
| Profile/Privacy | 6 ops | free | V1_READ / V1_STRICT |
| Settings | 2 ops | free | V1_READ / V1_STRICT |
| Instance | 6 ops (connection-state, connect/QR, restart [confirm-guarded], logout, set-presence, qr) | free | V1_MUTATE / V1_STRICT |
| Platform | whoami, usage, openapi.json/yaml | free | V1_READ |

Full OpenAPI spec at `GET /api/v1/openapi.json`. Registry-driven: `src/data/apiEndpoints/index.ts` is the single source of truth for Docs, Sandbox, ApiReference, and OpenAPI generation (`npm run gen:openapi` from server/).

### Admin Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | None | Admin login |
| GET | `/api/auth/me` | Bearer | Get admin user |
| POST | `/api/auth/register` | None | Register first admin |

### Client Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/client-register` | None | Client signup |
| POST | `/api/auth/client-login` | None | Client portal login |
| GET | `/api/auth/client/me` | Bearer | Get client profile |
| GET | `/api/auth/client/tokens` | Bearer | Token balance + history |

### Admin Resources
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/instances` | Admin | List all instances |
| GET | `/api/admin/analytics` | Admin | Platform analytics |
| GET | `/api/admin/logs` | Admin | API request logs |
| GET | `/api/stats` | None | Public stats for landing page |

### Clients
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/clients` | Admin | List all clients |
| POST | `/api/clients` | Admin | Create client |
| GET | `/api/clients/:id` | Admin | Get client |
| PATCH | `/api/clients/:id/toggle` | Admin | Enable/disable |
| POST | `/api/clients/:id/reset-key` | Admin | Reset API key |
| DELETE | `/api/clients/:id` | Admin | Delete client |

### Instances
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/instance/create` | Admin | Create instance |
| GET | `/api/instance/credentials/:name` | Admin | Get credentials |
| POST | `/api/instance/client-create` | Client JWT | Create for client |
| GET | `/api/instance/client-instances` | Client JWT | Client's instances |
| GET | `/api/instance/connect/:name` | Client JWT | Generate QR code |
| GET | `/api/instance/connectionState/:name` | None | Connection status |
| DELETE | `/api/instance/logout/:name` | Client JWT | Disconnect |
| DELETE | `/api/instance/delete/:name` | Admin | Delete instance |
| POST | `/api/instance/sendText/:name` | API Key | Send message |
| POST | `/api/instance/sendMedia/:name` | API Key | Send media |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payments/packages` | None | List token packages |
| POST | `/api/payments/initiate` | None | Start M-Pesa STK push |

### Client Resources
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/contacts` | Client JWT | List contacts |
| POST | `/api/contacts` | Client JWT | Batch import contacts |
| DELETE | `/api/contacts/:id` | Client JWT | Delete contact |
| GET | `/api/client/messages` | Client JWT | Inbox messages |
| PATCH | `/api/client/messages/:id/read` | Client JWT | Mark read |
| GET | `/api/client/keys` | Client JWT | List API keys |
| POST | `/api/client/keys` | Client JWT | Create API key |
| DELETE | `/api/client/keys/:id` | Client JWT | Revoke key |

## Database Schema

### Tables
- `users` - Admin accounts
- `clients` - API clients
- `instances` - WhatsApp instances
- `api_logs` - Request logs
- `audit_logs` - Admin actions
- `token_packages` - Token bundles
- `token_transactions` - Token ledger
- `payments` - M-Pesa payments
- `inbox_messages` - Received WhatsApp messages
- `contacts` - Client contact lists
- `client_api_keys` - Client API keys

## Simulated vs Real

### Simulated
- `ApiConsoleView` — Demo REST tester UI (uses raw Evolution proxy, not `/api/v1`)
- `DashboardOverview` charts — Static UI mockups
- `LogsAndAnalyticsView` telemetry charts — Mocked metrics

### Real (connected)
- All instance operations
- Client CRUD
- Token purchases
- Contact imports
- Message sending + API-key sends
- API key management
- **DocsSection, SandboxSection, ApiKeysSection** — all read from the live registry and execute real `/api/v1` calls

## Conventions

### File Naming
- PascalCase for components: `ClientDashboard.tsx`
- camelCase for hooks/utilities: `useAuth.ts`
- kebab-case for routes/middleware folders

### No State-Based Routing
- All navigation must use `react-router-dom`
- Use `<Link>` for internal links
- Use `useNavigate()` for programmatic navigation
- No callback props for page changes

### API Response Shape
All API calls return `{ success: boolean; data?: T; error?: string }`

## Code Quality Rules

### File Size Limits
- **No file above 150 lines.** If a file grows beyond 150 lines, it must be split into smaller, feature-specific files.
- Components: one component per file, co-locate its sub-modals within a folder (e.g., `whatsapp/WhatsAppContainers.tsx` + `whatsapp/CreateInstanceModal.tsx`)
- Hooks/utilities: one concern per file (e.g., `useTokenBalance.ts`, `useInstances.ts`)
- Backend routes: one route file per feature domain (e.g., `contacts.ts`, `clientMessages.ts`)

### Feature-Based Folder Structure

**Frontend (`src/`):**
```
src/
├── components/
│   ├── client/              # Client portal (max 150 lines per file)
│   │   ├── ClientDashboard.tsx   # Thin shell only (~120 lines)
│   │   ├── types.ts              # Shared client interfaces
│   │   ├── DashboardHome.tsx
│   │   ├── whatsapp/
│   │   │   ├── WhatsAppContainers.tsx
│   │   │   ├── CreateInstanceModal.tsx
│   │   │   └── QRPairingModal.tsx
│   │   ├── ApiKeysSection.tsx
│   │   ├── SandboxSection.tsx
│   │   ├── MessagesSection.tsx
│   │   ├── contacts/
│   │   │   ├── ContactsSection.tsx
│   │   │   └── ImportContactsModal.tsx
│   │   ├── TokenStoreSection.tsx
│   │   └── SettingsSection.tsx
│   └── admin/              # Admin portal (max 150 lines per file)
├── services/
│   └── api.ts             # All API calls + shared types
└── types.ts               # Shared UI types
```

**Backend (`server/src/`):**
```
server/src/
├── routes/
│   ├── auth/
│   │   ├── adminAuth.ts    # Admin login/register/me
│   │   └── clientAuth.ts  # Client login/register/me/tokens
│   ├── instance/
│   │   ├── adminInstances.ts  # Admin instance management
│   │   ├── clientInstances.ts # Client instance CRUD
│   │   └── messaging.ts       # sendText/sendMedia (real Evolution API calls)
│   ├── client/
│   │   ├── contacts.ts
│   │   ├── messages.ts
│   │   └── keys.ts
│   ├── payments/
│   │   └── packages.ts
│   ├── admin/
│   │   ├── analytics.ts
│   │   └── logs.ts
│   ├── v1/
│   │   ├── index.ts          # Mounts all /api/v1 routers
│   │   ├── messages.ts       # 10 send types
│   │   ├── groups.ts         # 16 group ops
│   │   ├── chats.ts          # 13 chat ops
│   │   ├── profile.ts        # 6 profile ops
│   │   ├── settings.ts       # 2 settings ops
│   │   ├── instance.ts       # lifecycle + QR
│   │   ├── usage.ts          # API usage analytics
│   │   └── openapi.ts       # Serves openapi.json/yaml
│   ├── clients.ts
│   ├── plans.ts
│   └── uploads.ts
├── services/whatsapp/
│   ├── shared.ts      # evolutionNameOf, chargeAndEmit, wrapSend (idempotency), SendContext/Result types
│   ├── messaging.ts   # 10 send wrappers (wrapSend)
│   ├── groups.ts     # 16 group ops via run()
│   ├── chats.ts      # 13 chat ops via run()
│   ├── profile.ts    # 6 profile + 2 settings ops via run()
│   ├── instanceOps.ts # connectionState, restart, logout, connect, setPresence
│   └── http.ts      # buildSendCtx, respondSendResult (shared by all v1 routes)
├── middleware/
│   ├── auth/
│   │   ├── jwt.ts         # Admin JWT
│   │   ├── clientJwt.ts    # Client JWT
│   │   ├── clientApiKey.ts # API-key auth for /api/v1
│   │   └── v1Limits.ts   # V1_READ/MUTATE/STRICT limiters
│   └── v1Version.ts  # X-API-Version: v1 header
├── utils/
│   ├── evolution.ts        # callEvolutionAPI + callEvolutionAPIChecked (URL-encode instance names!)
│   ├── audit.ts            # logAuditAction + logApiRequest
│   ├── messageParser.ts    # parseIncomingMessage (12 inbound types)
│   └── errors.ts           # Shared error helpers
└── database.ts
```

### No Dead Code / Duplication
- **Remove unused imports** on every commit (run `npm run build` — unused import errors fail the build)
- **No commented-out code** — if code is not used, delete it
- **No duplicate logic** — if JWT verification is needed, use `middleware/auth.ts` functions, don't re-implement
- **Share Evolution API calls** — create `utils/evolution.ts` with a typed `callEvolutionAPI` helper that:
  - Uses correct base URL from env
  - URL-encodes instance names in paths
  - Returns typed responses
  - Handles errors consistently
- **Share audit logging** — create `utils/audit.ts` with `logAuditAction(req, action, entityType, entityId, details?)`

### State Management Rules
- **State lives at the highest level that needs it.** If only one component uses a state, keep it there. If parent and children need it, lift to parent.
- **App.tsx owns:** `currentUser`, `clientData`, `clientInstances`, `tokenBalance`, `tokenPackages`, `dailyUsage`
- **Section components own:** their own UI state (modals, forms, local flags)
- **No prop drilling beyond 2 levels** — if a deep descendant needs App-level state, use React Context
- **On page refresh:** session must be restored from `localStorage` token. App-level `useEffect` checks both admin and client tokens on mount.

### Frontend Component Conventions
- One component per file (no multiple named exports)
- Props interface defined at top of file
- No `any` type — use interfaces from `services/api.ts` or `types.ts`
- All navigation uses `react-router-dom` — no `window.location` except in `handleClientLogin` for post-login redirect
- Local state uses `useState<T>()` with explicit type
- API calls go through `services/api.ts` — no direct `fetch` in components

### Backend Conventions
- All Evolution API instance name path parameters must be `encodeURIComponent(instanceName)`
- All client-facing routes must use `clientJwtAuth` middleware
- All payment routes must verify `client_id` matches `req.client.id`
- JWT secret must use `process.env.JWT_SECRET` — never hardcode different secrets in different files
- API response shape: `{ success: boolean; data?: T; error?: string }`
