# FIDScript WhatsApp API — Vision & Architecture

> **Living Document** — This file serves as the single source of truth for the FIDScript WhatsApp API platform developed by **Next Mavens**. All implementation decisions, component designs, and feature additions should reference this document.

---

## 1. What This Platform Is

FIDScript WhatsApp API is a multi-tenant SaaS platform developed by Next Mavens that lets businesses and developers send and receive WhatsApp messages programmatically via a REST API. Businesses (clients) register on the platform, receive an API key, create WhatsApp instances linked to their account, connect those instances by scanning a QR code, and then send messages through the platform's API — with pricing measured per token.

**Think of it as Twilio for WhatsApp in Kenya/East Africa:** a managed infrastructure layer that abstracts away the complexity of maintaining a live WhatsApp session (Baileys protocol), while giving clients a clean HTTP API to integrate into their own applications — CRMs, ERPs, marketing tools, notification systems, customer support bots.

---

## 2. The Two User Layers

### 2.1 Platform Admin (`/admin`)

The admin dashboard. Controls the entire platform:

| Feature | Description |
|---------|-------------|
| **Clients** | Creates client accounts, assigns plans, sets rate limits, issues/resets API keys |
| **Instances** | Monitors every WhatsApp instance across all clients, can connect/disconnect/delete any instance |
| **Plans** | Defines subscription tiers (message limits, instance caps, rate limits, pricing) |
| **Analytics** | Platform-wide message volumes, delivery rates, top clients/instances |
| **Logs** | Every API request ever made across the platform |
| **Audit Logs** | Who did what and when |
| **Security** | API key management, IP allowlisting |
| **Inbox** | Aggregated incoming messages from all instances |

### 2.2 Client Portal (`/portal`)

A separate interface given to each client. They can:

- View their own instances and their status
- Generate their own API keys (within plan limits)
- See their token balance and usage
- Purchase more tokens via M-Pesa (Pay Hero)
- Connect/disconnect their own WhatsApp instances via QR scan

---

## 3. Core Concepts

### 3.1 Instances

An **Instance** is a single WhatsApp session — one phone number linked to one device. It is the fundamental billing and operational unit. Each instance belongs to one client, has its own connection state (connected/disconnected/connecting), and exposes its own set of API endpoints.

> **Important:** An instance is not a phone — it is a virtual WhatsApp line managed through the Baileys protocol. The admin creates it, the client's business scans a QR code to link their actual WhatsApp phone, and from that point the instance is live and can send/receive messages via API.

### 3.2 Clients

A **Client** is a company or developer account. Each client has:

- An API key that authenticates their API requests
- A subscription plan determining how many instances they can create, how many messages per minute they can send, and how many per month
- A token balance for pay-as-you-go messaging
- An associated billing entity

### 3.3 Plans

Plans define what a client can do and how much they pay. Example fields:

| Field | Description |
|-------|-------------|
| `max_instances` | How many WhatsApp lines they can have active simultaneously |
| `max_messages_per_month` | Message volume cap (deprecated - now token-based) |
| `msg_per_min` | Rate limit (messages per minute to prevent spam) |
| `price_monthly` / `price_yearly` | Subscription price in KSh |
| `included_tokens` | Free tokens included per month |

### 3.4 Token System

**Token-based pricing** — Simple, predictable, memorable.

#### Token Packages (Buy Credits)

| Package | Price | Tokens | Bonus |
|---------|-------|--------|-------|
| Starter | KSh 100 | 1,000 | — |
| Growth | KSh 900 | 10,000 | +1,000 (10% bonus) |
| Scale | KSh 4,000 | 50,000 | +10,000 (20% bonus) |

#### Token Usage (What you can do)

| Action | Tokens |
|--------|--------|
| Send Text Message | 1 |
| Send Image | 2 |
| Send Document | 3 |
| Send Audio | 4 |
| Send Video | 4 |
| Bulk Campaign (per recipient) | 1 |
| OTP Message | 1 |
| AI Auto-Reply | 10 |
| Number Verification | 1 |
| Contact Import | 1 per 100 contacts |
| Receive Message | Free |
| Webhook Event | Free |

#### Subscription Plans

| Plan | Price | Included Tokens | Instances | Rate Limit |
|------|-------|-----------------|-----------|------------|
| **Free** | KSh 0 | 500/month | 1 | 5/min |
| **Starter** | KSh 299/month | 5,000/month | 3 | 10/min |
| **Growth** | KSh 999/month | 25,000/month | 10 | 30/min |
| **Enterprise** | Custom | Custom | Unlimited | Custom |

---

## 4. Payment Integration — Pay Hero

### 4.1 Overview

Payments are processed via **Pay Hero** (https://payhero.co.ke), a Kenyan payment gateway that supports M-Pesa STK Push, Paybill, Till, and Bank transfers.

**Pay Hero Credentials (Next Mavens Account):**
- API Username: `dxiIFNIz9AHMyHMOmUSS`
- API Password: `DDyCiSRV7NlGesyyAgQZp0dwQgFFNIVWRjYw18Hu`
- Account ID: `7722`
- Basic Auth Token: `Basic ZHhpSUZOSXo5QUhNeUhNT21VU1M6RER5Q2lTUlY3TmxHZXN5eUFnUVpwMGR3UWdGRk5JVldSall3MThIdQ==`

### 4.2 Pay Hero API Endpoints

**Base URL:** `https://backend.payhero.co.ke/api/v2`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments` | Initiate M-Pesa STK Push |
| `GET` | `/payment_channels` | Get registered payment channels |
| `GET` | `/transaction-status` | Check transaction status |
| `GET` | `/account_transactions` | List all transactions |
| `GET` | `/payments_wallet_balance` | Get wallet balance |

### 4.3 Initiate Payment Flow

```
1. Client selects token package → clicks "Buy Tokens"
2. Frontend calls POST /api/payments/initiate with:
   - amount: KSh amount
   - phone_number: Client's M-Pesa number
   - package_id: Selected token package
   - client_id: Current client
3. Backend creates pending payment record
4. Backend calls Pay Hero API → returns CheckoutRequestID
5. Client receives M-Pesa prompt on phone
6. Client enters PIN to confirm
7. Pay Hero sends callback to /api/payments/callback
8. Backend verifies payment, credits tokens to client account
9. Frontend polls /api/payments/status until confirmed
```

### 4.4 Payment Callback

Pay Hero sends POST to our callback URL with:

```json
{
  "response": {
    "Amount": 100,
    "CheckoutRequestID": "ws_CO_...",
    "ExternalReference": "TOKEN_BUY_cli_xxx_REF_xxx",
    "MpesaReceiptNumber": "SAE3YULR0Y",
    "Phone": "+2547...",
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "Status": "Success"
  },
  "status": true
}
```

### 4.5 Payment Database Schema

```sql
-- Token packages (admin-defined)
CREATE TABLE token_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price_kes REAL NOT NULL,
  bonus_tokens INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- Token transactions (purchases, usage)
CREATE TABLE token_transactions (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
  amount INTEGER NOT NULL, -- tokens (positive for credit, negative for debit)
  reference TEXT, -- Pay Hero reference or reason
  mpesa_receipt TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Payment requests
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id),
  package_id TEXT REFERENCES token_packages(id),
  amount_kes REAL NOT NULL,
  phone_number TEXT NOT NULL,
  payhero_reference TEXT,
  checkout_request_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Client Signup Flow

```
1. Client visits /register
2. Fills form: name, email, phone, password
3. Frontend calls POST /api/auth/register with:
   - name, email, phone, password
4. Backend:
   - Creates user account
   - Creates client account with Free plan
   - Generates API key
   - Returns JWT token + client data
5. Client redirected to dashboard
```

---

## 6. API Endpoints

### 6.1 Authentication (`/api/auth/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/register` | Client signup |
| POST | `/auth/client-login` | Client portal login |
| GET | `/auth/me` | Get current user |

### 6.2 Admin API (`/api/admin/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/instances` | List all instances |
| GET | `/admin/analytics` | Aggregated stats |
| GET | `/admin/logs` | API request logs |
| GET | `/stats` | Public platform stats |

### 6.3 Client Management (`/api/clients/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/clients` | List all clients |
| POST | `/clients` | Create client |
| GET | `/clients/:id` | Get client details |
| PATCH | `/clients/:id/toggle` | Enable/disable |
| POST | `/clients/:id/reset-key` | Reset API key |
| DELETE | `/clients/:id` | Delete client |

### 6.4 Client Self-Service (`/api/client/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/client/profile` | Get own profile |
| PATCH | `/client/profile` | Update profile |
| GET | `/client/tokens` | Get token balance |
| GET | `/client/token-history` | Get token transaction history |
| GET | `/client/packages` | List token packages |

### 6.5 Payments (`/api/payments/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/payments/initiate` | Initiate M-Pesa payment |
| POST | `/payments/callback` | Pay Hero callback URL |
| GET | `/payments/status/:reference` | Check payment status |

### 6.6 Plans (`/api/plans/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/plans` | List subscription plans |
| POST | `/plans` | Create plan (admin) |
| PUT | `/plans/:id` | Update plan (admin) |
| DELETE | `/plans/:id` | Delete plan (admin) |

### 6.7 Instance Management (`/api/instance/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/instance/create` | Create WhatsApp instance |
| GET | `/instance/credentials/:name` | Get API credentials |
| GET | `/instance/settings/:name` | Get instance settings |
| POST | `/instance/settings/:name` | Update settings |
| GET | `/instance/webhook/:name` | Get webhook config |
| POST | `/instance/webhook/:name` | Set webhook |
| GET | `/instance/connect/:name` | Generate QR code |
| GET | `/instance/connectionState/:name` | Poll connection status |
| DELETE | `/instance/logout/:name` | Disconnect instance |
| DELETE | `/instance/delete/:name` | Delete instance |

### 6.8 Message Sending (`/api/instance/`)

| Method | Endpoint | Purpose | Tokens |
|--------|----------|---------|--------|
| POST | `/instance/sendText/:name` | Send text | 1 |
| POST | `/instance/sendMedia/:name` | Send image/video/doc | 2-4 |
| POST | `/instance/sendWhatsAppAudio/:name` | Send audio | 4 |
| POST | `/instance/sendLocation/:name` | Send location | 2 |

---

## 7. Technology Stack

### Frontend
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **Payments**: Pay Hero M-Pesa API
- **Security**: Helmet, CORS, Rate Limiting

### Infrastructure
- **Containers**: Docker (nginx reverse proxy, admin API, Evolution API)
- **DNS**: Cloudflare (API and frontend subdomains)
- **SSL**: Let's Encrypt via Certbot
- **Payment**: Pay Hero (M-Pesa STK Push)

---

## 8. Domain & Routing

| Domain | Purpose | Proxy Target |
|--------|---------|--------------|
| `whatsapp.fidscript.com` | Client dashboard + API | `172.18.0.6:3001` (admin API) |
| `apiwhatsapp.fidscript.com` | Direct API access | `172.18.0.6:3001` (admin API) |

---

## 9. Implementation Phases

### Phase 1: Infrastructure ✅
- [x] Nginx reverse proxy setup
- [x] SSL certificates via Let's Encrypt
- [x] Evolution API Docker container
- [x] Admin API Docker container
- [x] DNS configuration (Cloudflare)

### Phase 2: Core Backend ✅
- [x] Database schema (SQLite)
- [x] Admin authentication (JWT)
- [x] Client management API
- [x] Plan management API
- [x] Instance management API
- [x] Rate limiting

### Phase 3: Pay Hero Integration
- [x] Pay Hero API credentials configured
- [ ] Token packages table
- [ ] Payment initiation endpoint
- [ ] Payment callback endpoint
- [ ] Token credit logic
- [ ] Transaction history

### Phase 4: Client Signup & Portal
- [ ] Client registration endpoint
- [ ] Client login endpoint
- [ ] Token purchase flow (frontend)
- [ ] Client dashboard
- [ ] Token balance display

### Phase 5: Frontend Integration
- [ ] Connect frontend to backend API
- [ ] Real-time QR code polling
- [ ] Payment UI
- [ ] Client portal pages

---

## 10. Design Language

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Forest Deep | `#11110a` | Dark backgrounds |
| Forest Medium | `#1b1910` | Card backgrounds |
| Forest Light | `#262412` | Borders |
| Yellow Primary | `#facc15` | Primary accent |
| Yellow Light | `#fef08a` | Highlights |
| Emerald | `#10b981` | Success |
| Rose | `#ef4444` | Error |
| Amber | `#f59e0b` | Warning |

---

*Last Updated: 2026-06-13*