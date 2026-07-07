# FIDScript WhatsApp API

A WhatsApp Business API platform for Kenyan businesses. Send and receive WhatsApp messages programmatically, manage multiple instances per client, bill by a token system (M-Pesa top-ups), and expose a clean REST API + API-key gateway for integrations.

**Production:** https://whatsapp.fidscript.com

---

## Table of contents

- [How authentication works](#how-authentication-works)
- [Security model](#security-model)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [API reference](#api-reference)
- [Database](#database)
- [Deployment](#deployment)

---

## How authentication works

FIDScript uses **passwordless magic-code authentication**. There are no passwords anywhere in the system. A user signs in or registers by receiving a one-time 6-digit code over email and entering it.

### The flow

1. **Frontend sends an email** to `POST /api/auth/request-code` (sign in) or `POST /api/auth/client/request-code` (create account). That is the *only* thing the frontend sends — `{ email }` (plus name + phone for registration).
2. **Backend generates the code** server-side using Node's cryptographically-secure `crypto.randomInt`. The frontend never generates, sees, or handles the code — it only fires the request.
3. **Backend emails the code** to the user via [Resend](https://resend.com), from `FIDScript <noreply@whatsapp.fidscript.com>`.
4. **The user reads the code from their inbox** and types it into the 6-digit input.
5. **Frontend sends `{ email, code }`** to `POST /api/auth/verify-code`. The backend compares it against the stored code and, on a match, issues a JWT.
6. **Role is resolved by the server**: if the email belongs to the `users` table the user is an **admin**; if it belongs to the `clients` table they are a **client**. The matching JWT (`type: 'admin' | 'client'`) is returned and stored in `localStorage` (`fidscript_admin_token` or `fidscript_client_token`).

> **The code is never on the client.** It exists only in server memory (briefly), in the user's email inbox, and — bcrypt-hashed — in the database. There is nothing on the frontend to inspect, reverse-engineer, or tamper with. Tampering with the client can at most submit a wrong code, which the server rejects.

### Where each piece lives

| Concern | File | Runs on |
| --- | --- | --- |
| Code generation (`crypto.randomInt`) | `server/src/utils/authCodes.ts` → `generateCode()` | **Server** |
| Hashing, storage, expiry, attempts | `server/src/utils/authCodes.ts` → `createAuthCode` / `consumeAuthCode` | **Server** |
| Email delivery (Resend) | `server/src/utils/sendMagicCodeEmail.ts` | **Server** |
| Branded email HTML | `server/src/utils/emailTemplates.ts` | **Server** |
| `request-code` / `verify-code` (login) | `server/src/routes/auth/magicAuth.ts` | **Server** |
| `client/request-code` / `client/verify-code` (register) | `server/src/routes/auth/clientMagicAuth.ts` | **Server** |
| Frontend form (email → 6-digit input → verify) | `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx` | Client (UI only) |
| Frontend API calls | `src/services/auth.ts` → `requestCode` / `verifyCode` | Client (HTTP only) |

---

## Security model

The magic-code system is designed so the client is never trusted with anything sensitive.

- **Codes are generated on the server** with `crypto.randomInt(0, 1_000_000)` — never on the client. The client only ever sends an email address and a code the user typed.
- **Codes are stored bcrypt-hashed** (`cost = 10`) in the `auth_codes` table, never in plaintext. A database compromise does **not** reveal usable codes.
- **Codes are one-time.** A successful verification marks the code `consumed_at`; it cannot be replayed.
- **Codes expire** after **10 minutes**.
- **Per-code attempt limit:** a code is invalidated after **5 failed verification attempts**, capping brute-force at 5 guesses in 1,000,000.
- **Per-email request limit:** at most **3 codes per email per 15 minutes**.
- **Per-IP rate limit:** the magic-code endpoints are throttled to **20 requests / 15 min / IP** (`magicLimiter` in `server/src/routes/auth/index.ts`) on top of the per-email and per-code limits, to stop request-spam (Resend cost / inbox abuse) and verify brute-force across emails.
- **Anti-enumeration:** the login `request-code` endpoint **always returns the same success response** whether or not the email exists, so an attacker cannot probe which emails have accounts. (No code is emailed if the account doesn't exist.)
- **JWT** tokens are signed with `JWT_SECRET`, expire in 24h, and carry a `type` discriminator so an admin token can't be used where a client token is required (and vice-versa).
- **No code is ever logged or returned** in any API response. `request-code` returns only `{ message }`; `verify-code` returns only `{ token, role, ... }`.

> **Why codes are hashed, not stored plaintext:** a 6-digit code is short, so storing it in plaintext would let anyone with DB read access (a leak, a backup, an insider) immediately log in as any user with an active code. Hashing makes the stored value useless to an attacker while still letting the server verify a submitted code with `bcrypt.compare`. This is the same approach used for passwords and OTPs.

---

## Tech stack

- **Frontend:** React 18 + Vite 6, TypeScript, Tailwind CSS v4, React Router v7, `motion` (Framer Motion), `lucide-react`, `recharts`.
- **Backend:** Node.js + Express 4, TypeScript (ESM), `sql.js` (SQLite compiled to WASM, persisted to disk).
- **Auth:** `jsonwebtoken` (JWT), `bcryptjs` (magic-code hashing), **Resend** (transactional email).
- **Integrations:** Evolution API (WhatsApp gateway, port 8080), PayHero (M-Pesa STK push), Cloudinary (media storage).
- **Process management:** PM2 (backend), Nginx (frontend + reverse proxy).

---

## Project structure

```
fidscript-whatsapp/
├── apps/
│   ├── whatsapp-api/           # WhatsApp Business API Service (Evolution API)
│   │   ├── src/
│   │   │   ├── api/            # Controllers, Services, Routes
│   │   │   ├── config/         # Environment configuration
│   │   │   └── prisma/         # Database schemas
│   │   ├── docs/               # Service documentation
│   │   └── package.json
│   ├── frontend/               # React frontend
│   ├── api/                    # Backend API
│   ├── worker/                 # Background workers
│   ├── cli/                    # CLI tools
│   └── fidscript-cli/          # Fidscript CLI
├── docs/
│   └── whatsapp/               # WhatsApp documentation
│       ├── WHATSAPP_INTEGRATION.md
│       ├── WHATSAPP_DEPLOYMENT.md
│       ├── WHATSAPP_API_REFERENCE.md
│       └── WHATSAPP_WEBHOOK_GUIDE.md
├── src/                         # Legacy frontend (React + Vite)
│   ├── App.tsx                  # Root: routing + session restore
│   ├── components/
│   │   ├── auth/                # Magic-code login & register forms
│   │   │   ├── LoginForm.tsx         # 2-step: email → 6-digit code
│   │   │   ├── RegisterForm.tsx      # 2-step: details → 6-digit code
│   │   │   ├── CodeInput.tsx         # 6-box code input
│   │   │   └── useResendCountdown.ts # resend timer hook
│   │   ├── client/              # Client portal (dashboard, whatsapp, contacts…)
│   │   ├── admin/               # Admin portal (dashboard, instances, clients…)
│   │   └── shared/              # Sidebar, nav, toasts, loading
│   └── services/                # API client (auth.ts, api.ts, …)
└── server/                      # Backend (Express + sql.js)
    └── src/
        ├── index.ts             # Server bootstrap (dotenv, middleware, routes)
        ├── database/            # schema, tables, indexes, seed (sql.js)
        ├── middleware/auth/     # JWT verify, client JWT, API-key, rate limit
        ├── routes/auth/         # adminAuth, clientAuth, magicAuth, clientMagicAuth
        ├── utils/               # resend, authCodes, emailTemplates, evolution, audit
        └── types/               # shared TS interfaces
```

---

## Prerequisites

- **Node.js** 20+
- **npm**
- A running **Evolution API** instance (WhatsApp gateway) on port 8080
- A **Resend** account with the sending domain (`whatsapp.fidscript.com`) verified

---

## Environment variables

Backend config lives in `server/.env` (gitignored). Copy `server/.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port (dev `3001`, prod `3099`) |
| `JWT_SECRET` | JWT signing secret |
| `CORS_ORIGIN` | Allowed CORS origin (`*` or your frontend URL) |
| `DB_PATH` | SQLite file path (default `./fidscript.db`) |
| `RESEND_API_KEY` | Resend API key — **required for magic-code emails** |
| `MAIL_FROM` | Sender address, e.g. `FIDScript <noreply@whatsapp.fidscript.com>` |
| `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` | WhatsApp gateway |
| `PAYHERO_*` | M-Pesa STK push credentials |
| `CLOUDINARY_*` | Media storage |

Frontend config lives in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL (e.g. `https://whatsapp.fidscript.com`) |

> **Production note:** the backend runs under PM2 from `server/ecosystem.config.cjs` (gitignored). Add `RESEND_API_KEY` and `MAIL_FROM` there too. The backend loads `.env` via `import 'dotenv/config'`, so values in `.env` are picked up automatically. Remember that `pm2 restart <name>` does **not** reload ecosystem env vars — use `pm2 restart ecosystem.config.cjs --update-env` (or rely on the dotenv loader, which always runs).

---

## Running locally

**Frontend** (port 3000):
```bash
npm install
npm run dev
```

**Backend** (port 3001, hot reload):
```bash
cd server
npm install
npm run dev
```

The dev frontend talks to whatever `VITE_API_URL` points at (`.env.local`). For local backend development, set `VITE_API_URL=http://localhost:3001`.

---

## API reference

All responses use `{ success: boolean; data?: T; error?: string }`.

### Authentication (passwordless magic code)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/request-code` | None | Email a 6-digit sign-in code. Anti-enumeration: always returns success. |
| `POST` | `/api/auth/verify-code` | None | Verify the code → returns `{ token, role, user \| client }`. |
| `POST` | `/api/auth/client/request-code` | None | Email a registration code (requires name + email + phone). |
| `POST` | `/api/auth/client/verify-code` | None | Verify the registration code → creates client + returns `{ token, client }`. |
| `GET` | `/api/auth/me` | Bearer (admin) | Current admin profile. |
| `GET` | `/api/auth/client/me` | Bearer (client) | Current client profile. |
| `GET` | `/api/auth/client/tokens` | Bearer (client) | Token balance + history. |
| `GET` | `/api/stats` | None | Public platform stats (landing page). |

### Admin resources

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/admin/instances` | Admin | List all instances. |
| `GET` | `/api/admin/analytics` | Admin | Platform analytics. |
| `GET` | `/api/admin/logs` | Admin | API request logs. |

### Clients

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/clients` | Admin | List clients. |
| `POST` | `/api/clients` | Admin | Create client. |
| `PATCH` | `/api/clients/:id/toggle` | Admin | Enable/disable. |
| `POST` | `/api/clients/:id/reset-key` | Admin | Reset API key. |
| `DELETE` | `/api/clients/:id` | Admin | Delete client. |

### Instances (WhatsApp)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/instance/client-create` | Client JWT | Create instance. |
| `GET` | `/api/instance/client-instances` | Client JWT | Client's instances. |
| `GET` | `/api/instance/connect/:name` | Client JWT | Generate QR code. |
| `GET` | `/api/instance/connectionState/:name` | None | Connection status. |
| `DELETE` | `/api/instance/logout/:name` | Client JWT | Disconnect. |
| `POST` | `/api/instance/sendText/:name` | API Key | Send a text message. |
| `POST` | `/api/instance/sendMedia/:name` | API Key | Send media. |

### Payments, contacts, messages, keys

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/payments/packages` | None | List token packages. |
| `POST` | `/api/payments/initiate` | Client JWT | Start M-Pesa STK push. |
| `GET` / `POST` / `DELETE` | `/api/contacts` | Client JWT | Manage contacts. |
| `GET` | `/api/client/messages` | Client JWT | Inbox messages. |
| `GET` / `POST` / `DELETE` | `/api/client/keys` | Client JWT | Manage API keys. |

---

## Database

SQLite via `sql.js` (in-memory, auto-persisted to `server/fidscript.db` on every write). Schema is created idempotently on boot (`server/src/database/tables.ts`).

**Tables:** `users`, `clients`, `instances`, `plans`, `api_logs`, `audit_logs`, `token_packages`, `token_transactions`, `payments`, `inbox_messages`, `contacts`, `client_api_keys`, `auth_codes`, `deploy_versions`.

**`auth_codes`** (the magic-code store):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT PK | UUID |
| `email` | TEXT | Lowercased |
| `code_hash` | TEXT | bcrypt hash — never the plaintext code |
| `purpose` | TEXT | `'login'` \| `'register'` |
| `attempts` | INTEGER | Failed verify count (max 5) |
| `consumed_at` | TEXT NULL | Set on success → one-time use |
| `expires_at` | TEXT | now + 10 min |
| `created_at` | TEXT | Timestamp |

On first boot, `seedData` creates default plans, token packages, and an admin user if the tables are empty.

---

## Deployment

Production is served from this single host:

- **Frontend** → built (`npm run build`) and synced to `/var/www/whatsapp.nextmavens.cloud`, served by **Nginx**. `index.html` is served with `Cache-Control: no-cache` so new deploys (hashed bundles) are picked up immediately; `/assets/*` are cached immutably for 1 year. Nginx proxies `/api/` → `127.0.0.1:3099` (and `/api/sse/` with buffering disabled for the instance-connection streams).
- **Backend** → compiled (`tsc` → `server/dist`) and run under **PM2** (process name `fidscript-api`).
- **Evolution API** runs separately on port 8080.

### Smart deploy script

```bash
bash deploy.sh
```

Full workflow: **prerequisites check → `git pull` → detect changed services (frontend / backend / both) → clean rebuild → sync frontend → restart PM2 → record deploy version**. Refuses to run with uncommitted changes. Logs to `deploy.log`.

**Prerequisites:** commit all changes first (the script refuses on a dirty tree), and ensure `RESEND_API_KEY` + `MAIL_FROM` are set in both `server/.env` and `server/ecosystem.config.cjs`.

### Version tracking

```bash
# Latest deploy (public)
curl https://whatsapp.fidscript.com/api/versions/latest

# Deploy history (admin)
curl -H "Authorization: Bearer <token>" https://whatsapp.fidscript.com/api/versions/history
```
