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

### Frontend Build
```bash
npm run build   # Outputs to dist/
```

### Backend Start
```bash
cd server && npm run dev  # Uses tsx loader
```

### Production
- Frontend built and served by backend or CDN
- Backend runs on PM2 with ecosystem.config.cjs
- Evolution API (WhatsApp gateway) runs separately

### Smart Deployment Script
```bash
# Main deployment script (smart - detects changes and rebuilds only what changed)
./deploy.sh

# Server-only deployment (can be called by main script or run independently)
./server/deploy.sh
```

The deploy script:
1. Pulls from GitHub (git pull origin main)
2. Detects changes using `git diff --name-only HEAD~1`
3. Only rebuilds changed components (frontend, backend, or both)
4. Records deployments to `deploy_versions` table in the DB
5. Logs all operations to `/home/ken/fidscript-whatsapp/deploy.log`

### Version Tracking
```bash
# Get latest deploy version (public)
curl https://whatsapp.fidscript.com/api/versions/latest

# Get deploy history (admin only)
curl -H "Authorization: Bearer <admin_token>" https://whatsapp.fidscript.com/api/versions/history
```

The deploy script automatically records each deployment with:
- `version` - from package.json
- `commit_hash` - from git rev-parse --short HEAD
- `changes_summary` - from git diff --stat HEAD~1
- `service` - which service was deployed (frontend, backend, or both)


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

### Simulated (NOT connected to backend)
- `ApiConsoleView` - Demo REST tester UI
- `DashboardOverview` charts - Static UI mockups
- `LogsAndAnalyticsView` telemetry charts - Mocked metrics

### Real (connected)
- All instance operations
- Client CRUD
- Token purchases
- Contact imports
- Message sending
- API key management

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
│   ├── clients.ts
│   ├── plans.ts
│   └── uploads.ts
├── middleware/
│   └── auth.ts             # JWT + API key middleware
├── utils/
│   ├── evolution.ts        # Shared Evolution API caller (URL-encode instance names!)
│   ├── audit.ts            # Shared logAuditAction
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
