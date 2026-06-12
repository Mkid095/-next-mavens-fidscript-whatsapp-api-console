# FIDScript WhatsApp API — Vision & Architecture

> **Living Document** — This file serves as the single source of truth for the FIDScript WhatsApp API platform developed by **Next Mavens**. All implementation decisions, component designs, and feature additions should reference this document.

---

## 1. What This Platform Is

FIDScript WhatsApp API is a multi-tenant SaaS platform developed by Next Mavens that lets businesses and developers send and receive WhatsApp messages programmatically via a REST API. Businesses (clients) register on the platform, receive an API key, create WhatsApp instances linked to their account, connect those instances by scanning a QR code, and then send messages through the platform's API — with pricing measured per message.

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
- See their message usage and billing
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
- An associated billing entity

### 3.3 Plans

Plans define what a client can do and how much they pay. Example fields:

| Field | Description |
|-------|-------------|
| `max_instances` | How many WhatsApp lines they can have active simultaneously |
| `max_messages_per_month` | Message volume cap |
| `msg_per_min` | Rate limit (messages per minute to prevent spam) |
| `price_monthly` / `price_yearly` | Subscription price in KSh |

### 3.4 Message Billing

**Rate: 1 KSh per 8 messages**

Every outbound message sent through the API decrements a counter. The platform tracks:

- `msg_count_today` — messages sent today (resets at midnight)
- `total_messages` — cumulative lifetime count for the client
- Per-instance and per-client aggregation for billing

The billing model is volume-based on top of subscription: clients pay a base subscription fee (plan price) plus overage charges based on message volume at 1 KSh / 8 messages. High-volume clients might exceed their plan's included messages and pay per-usage.

---

## 4. API Endpoints (Core Platform API)

### 4.1 Admin API (`/api/admin/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/instances` | List all instances across all clients |
| GET | `/api/admin/analytics` | Aggregated stats: totals, daily trends, by-type, by-status, top clients/instances |
| GET | `/api/admin/logs` | Recent API request logs with instance, recipient, status, timestamp |
| GET | `/api/stats` | Platform-level counts: total_clients, active_clients, messages_today |

### 4.2 Client & Plan Management (`/api/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/clients` | List all client accounts |
| POST | `/api/clients` | Create a new client with plan assignment |
| PATCH | `/api/clients/:id/toggle` | Enable/disable a client account |
| DELETE | `/api/clients/:id` | Remove a client |
| POST | `/api/clients/:id/reset-key` | Rotate a client's API key |
| GET | `/api/plans` | List subscription plans |
| POST | `/api/plans` | Create a plan |
| PUT | `/api/plans/:id` | Update a plan |
| DELETE | `/api/plans/:id` | Delete a plan |

### 4.3 Instance Management (`/api/instance/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/instance/create` | Create a new WhatsApp instance for a client |
| GET | `/api/instance/credentials/:name` | Fetch API key, portal credentials, instance token |
| GET | `/api/instance/settings/:name` | Fetch instance settings (call rejection, group ignore, etc.) |
| POST | `/api/instance/settings/:name` | Update instance settings |
| GET | `/api/instance/webhook/:name` | Get webhook configuration |
| POST | `/api/instance/webhook/:name` | Set webhook URL and enabled state |
| GET | `/api/instance/connect/:name` | Generate QR code for linking WhatsApp |
| GET | `/api/instance/connectionState/:name` | Poll connection status (used during QR linking) |
| DELETE | `/api/evolution/instance/logout/:name` | Log out / disconnect the instance |
| DELETE | `/api/instance/delete/:name` | Delete the instance entirely |

### 4.4 Message Sending (`/api/instance/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/instance/sendText/:name` | Send a text message |
| POST | `/api/instance/sendMedia/:name` | Send image, audio, video, or document |
| POST | `/api/instance/sendWhatsAppAudio/:name` | Send audio file |
| POST | `/api/instance/sendLocation/:name` | Send a location pin |
| GET | `/api/instance/connectionState/:name` | Check if instance is connected |

### 4.5 Webhook Events

The platform sends webhook POST requests to the client's configured URL for events:

- `message` — incoming message received on the instance
- `connection` — instance connected/disconnected state change
- `qrcode` — new QR code generated

---

## 5. Dashboard Pages — Purpose

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Platform snapshot: client count, active clients, messages today, delivered rate, recent message log (live, 15s refresh), quick actions |
| `/instances` | Instances List | Every WhatsApp instance across all clients — search, create, delete |
| `/instances/:name` | Instance Detail | Full detail view of one instance — credentials, all API endpoints with examples, settings, send message panel, copy integration guide |
| `/clients` | Clients | Every client account — create, toggle active/inactive, reset API key, export data |
| `/clients/:id` | Client Detail | One client's full profile, instances, and usage |
| `/plans` | Plans | Subscription plan management — create/edit/delete tiers |
| `/analytics` | Analytics | Platform charts: daily trends, message types, delivery status pie, top clients/instances |
| `/logs` | Request Logs | Full API request log with filters |
| `/audit-logs` | Audit Logs | Who (which admin) did what and when |
| `/inbox` | Inbox | Aggregated incoming messages from all connected instances |
| `/security` | Security & Keys | Admin-level API security settings |
| `/api-console` | API Console | Interactive admin API testing interface |
| `/portal` | My Portal | The view given to regular (non-admin) clients |
| `/login` | Login | Admin authentication |

---

## 6. Pricing Logic

**Rate: 1 KSh per 8 messages**

This applies per-client and is tracked as:

- **Daily counter** (`msg_count_today`) — resets at midnight server time, used for rate limiting and daily burst detection
- **Monthly counter** — compared against `max_messages_per_month` from the plan; overage triggers billing
- **Lifetime counter** (`total_messages`) — for analytics, top-client rankings, and historical billing

**Rate limiting** (`msg_per_min` from plan) is enforced per-instance: if a client tries to send faster than their plan allows, the API returns a `429 Too Many Requests`. This protects the WhatsApp session from being rate-limited by WhatsApp's own servers.

---

## 7. Instance Connection Flow

```
1. Admin creates instance → platform generates a unique instanceName and instanceToken
2. Admin assigns instance to a client
3. Admin or client hits Connect → backend calls Baileys to generate a QR code (base64 image)
4. QR is displayed in a modal in the admin UI
5. The real WhatsApp phone scans the QR via WhatsApp → Settings → Linked Devices → Link a Device
6. Backend polls connectionState every 2 seconds; when state becomes open, the instance is Connected
7. From this point the instance can send and receive messages via API
8. Disconnect logs the phone out of WhatsApp (no QR needed to reconnect — just hit Connect again)
9. Delete removes the instance entirely, invalidating all its credentials
```

---

## 8. Multi-Tenancy Model

- Every API request is authenticated by the client's API key (passed as a header or query param)
- The platform is **fully multi-tenant**: Client A cannot see Client B's instances, messages, credentials, or API keys
- The admin dashboard bypasses client authentication entirely (authenticated via `adminToken` in localStorage)
- Instances are namespaced by `instanceName` — globally unique across the platform
- Each client has a `max_instances` cap from their plan — creating a 6th instance when the plan allows 5 returns an error

---

## 9. Technology Stack

### Frontend
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Animations**: Framer Motion (motion/react)
- **Fonts**: Google Fonts (Playfair Display, Inter, JetBrains Mono)

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

---

## 10. Design Language

### 10.1 Brand Identity

**Product Name**: FIDScript WhatsApp API

**Developer**: Next Mavens

**Logo Mark**: Three vertical bars of varying heights in yellow (`#facc15`), representing the brand's signature visual element.

### 10.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-forest-deep` | `#14130a` | Dark backgrounds |
| `--color-forest-medium` | `#262412` | Card backgrounds |
| `--color-forest-light` | `#facc15` | Primary accent (yellow) |
| `--color-forest-neon` | `#fef08a` | Highlight accent |
| `--color-eco-bg` | `#f9f9f2` | Light content areas |
| `--color-ink` | `#181711` | Dark text |
| `--color-pure-white` | `#ffffff` | White text |
| `--color-pale-slate` | `#eaebe4` | Borders, dividers |
| `--color-dove-gray` | `#a8a99e` | Muted text |
| `--color-iron` | `#525345` | Secondary text |
| `--color-graphite` | `#6a6c5d` | Body text |
| `--color-slate-mist` | `#7d8071` | Tertiary text |

**Semantic Colors**:
- Success: Emerald (`#10b981`, `#059669`)
- Warning: Amber (`#f59e0b`)
- Error: Rose (`#ef4444`)

### 10.3 Typography

| Font | Usage | Import |
|------|-------|--------|
| **Playfair Display** | Display headings | Google Fonts |
| **Inter** | Body text, UI elements | Google Fonts |
| **JetBrains Mono** | Code, API keys, technical | Google Fonts |

### 10.4 Elevation & Shadows

Custom shadow system for depth and hierarchy:
- `--shadow-subtle` — Subtle border shadow
- `--shadow-xl` — Card elevation
- `--shadow-sm` — Input fields
- `--shadow-nested-mockup` — Nested components

### 10.5 Border Radii

- `--radius-nav`: 6px
- `--radius-cards`: 6px
- `--radius-buttons`: 6px
- `--radius-tags`: 9999px (pills)
- `--radius-icons`: 9999px (circular)

### 10.6 Motion

- Pulse animations for live indicators
- Spring-based transitions for navigation
- Fade + slide for content transitions
- Hover scale effects on interactive elements

---

## 11. Implementation Phases

### Phase 1: Landing Page ✅
- [x] Marketing landing page (`/`)
- [x] Hero section with stats
- [x] Features showcase with code examples
- [x] Pricing tiers
- [x] How it works section
- [x] CTA section
- [x] Footer with navigation

### Phase 2: Admin Dashboard
- [ ] Dashboard overview
- [ ] Instances management
- [ ] Clients management
- [ ] API Console
- [ ] Logs & Analytics
- [ ] Inbox
- [ ] Security & Keys

### Phase 3: Client Portal
- [ ] Client self-service portal
- [ ] Instance connection (QR)
- [ ] Usage & billing view

### Phase 4: Backend API ✅
- [x] Database schema (SQLite)
- [x] Authentication (JWT, bcrypt)
- [x] Admin API routes
- [x] Client management API
- [x] Plan management API
- [x] Instance management API
- [x] Message sending API
- [x] Rate limiting
- [x] Audit logging
- [ ] Webhook handlers (in progress)
- [ ] Baileys WhatsApp integration

### Phase 5: Frontend-Backend Integration
- [ ] Connect frontend to backend API
- [ ] Real-time QR code polling
- [ ] Webhook event handling
- [ ] Billing calculations

---

*Last Updated: 2026-06-12*
