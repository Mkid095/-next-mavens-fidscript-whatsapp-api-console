# FIDScript WhatsApp API Server

Backend API server for FIDScript WhatsApp API platform by Next Mavens.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build TypeScript
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | production |
| JWT_SECRET | JWT signing secret | (change in production) |
| CORS_ORIGIN | Allowed CORS origin | * |
| PAYHERO_API_URL | Pay Hero API URL | https://backend.payhero.co.ke/api/v2 |
| PAYHERO_BASIC_AUTH | Pay Hero auth token | (from Pay Hero dashboard) |
| PAYHERO_CHANNEL_ID | Pay Hero channel ID | 7722 |
| PLATFORM_URL | Frontend URL | https://whatsapp.fidscript.com |

## Default Credentials

**Admin:**
- Email: admin@fidscript.io
- Password: admin123

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/register` | Register first admin |
| GET | `/api/auth/me` | Get current admin user |
| POST | `/api/auth/client-register` | Client signup |
| POST | `/api/auth/client-login` | Client portal login |
| GET | `/api/auth/client/me` | Get current client |
| GET | `/api/auth/client/tokens` | Get client token balance |

### Admin API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/instances` | List all instances |
| GET | `/api/admin/analytics` | Platform analytics |
| GET | `/api/admin/logs` | API request logs |
| GET | `/api/stats` | Public platform stats |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get client details |
| PATCH | `/api/clients/:id/toggle` | Enable/disable client |
| POST | `/api/clients/:id/reset-key` | Reset API key |
| DELETE | `/api/clients/:id` | Delete client |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | List plans |
| POST | `/api/plans` | Create plan |
| GET | `/api/plans/:id` | Get plan details |
| PUT | `/api/plans/:id` | Update plan |
| DELETE | `/api/plans/:id` | Delete plan |

### Token Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/packages` | List token packages |
| GET | `/api/payments/packages/:id` | Get package details |

### Payments (Pay Hero M-Pesa)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initiate` | Initiate M-Pesa STK Push |
| POST | `/api/payments/callback` | Pay Hero callback URL |
| GET | `/api/payments/status/:reference` | Check payment status |
| GET | `/api/payments/wallet-balance` | Get Pay Hero wallet balance |

### Instances

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/instance/create` | Create instance |
| GET | `/api/instance/credentials/:name` | Get credentials |
| GET | `/api/instance/settings/:name` | Get settings |
| POST | `/api/instance/settings/:name` | Update settings |
| GET | `/api/instance/webhook/:name` | Get webhook config |
| POST | `/api/instance/webhook/:name` | Set webhook config |
| GET | `/api/instance/connect/:name` | Generate QR code |
| GET | `/api/instance/connectionState/:name` | Get connection state |
| POST | `/api/instance/sendText/:name` | Send text message |
| POST | `/api/instance/sendMedia/:name` | Send media message |
| POST | `/api/instance/sendLocation/:name` | Send location |
| DELETE | `/api/instance/logout/:name` | Disconnect instance |
| DELETE | `/api/instance/delete/:name` | Delete instance |

## Token System

### Token Packages

| Package | Price | Tokens | Bonus |
|---------|-------|--------|-------|
| Starter | KSh 100 | 1,000 | — |
| Growth | KSh 900 | 10,000 | +1,000 |
| Scale | KSh 4,000 | 50,000 | +10,000 |

### Token Usage

| Action | Tokens |
|--------|--------|
| Send Text Message | 1 |
| Send Image | 2 |
| Send Document | 3 |
| Send Audio | 4 |
| Send Video | 4 |

## Pay Hero Integration

Payments are processed via Pay Hero M-Pesa STK Push.

**Flow:**
1. Client selects token package
2. Client enters M-Pesa phone number
3. Server calls Pay Hero API to initiate STK Push
4. Client receives M-Pesa prompt and enters PIN
5. Pay Hero sends callback to `/api/payments/callback`
6. Server credits tokens to client account

## Authentication

### Admin Authentication
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fidscript.io", "password": "admin123"}'
```

### Client API Authentication
```bash
curl -X POST http://localhost:3001/api/instance/sendText/my-instance \
  -H "X-API-Key: fidscript_live_..." \
  -H "Content-Type: application/json" \
  -d '{"to": "+254712345678", "message": "Hello!"}'
```

### Client Portal Authentication
```bash
curl -X POST http://localhost:3001/api/auth/client-login \
  -H "Content-Type: application/json" \
  -d '{"email": "client@example.com", "password": "password"}'
```

## Database

Uses SQLite by default. Database file: `fidscript.db`

Tables:
- `users` - Admin users
- `plans` - Subscription plans
- `clients` - Client accounts (includes token_balance)
- `instances` - WhatsApp instances
- `token_packages` - Token purchase packages
- `token_transactions` - Token purchase/usage history
- `payments` - Payment records
- `api_logs` - API request logs
- `audit_logs` - Admin audit logs
- `inbox_messages` - Incoming messages

## API Rate Limits

- Public endpoints: 100 requests per 15 minutes
- API endpoints: 60 requests per minute

## Support

For questions or issues, contact support@fidscript.io