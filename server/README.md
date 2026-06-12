# FIDScript WhatsApp API Server

Backend API server for FIDScript WhatsApp API platform by Next Mavens.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Default Credentials

- **Email**: admin@fidscript.io
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Register first admin
- `GET /api/auth/me` - Get current user

### Admin API
- `GET /api/admin/instances` - List all instances
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/logs` - API request logs
- `GET /api/stats` - Public platform stats

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PATCH /api/clients/:id/toggle` - Enable/disable client
- `POST /api/clients/:id/reset-key` - Reset API key
- `DELETE /api/clients/:id` - Delete client

### Plans
- `GET /api/plans` - List plans
- `POST /api/plans` - Create plan
- `GET /api/plans/:id` - Get plan details
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Instances
- `POST /api/instance/create` - Create instance
- `GET /api/instance/credentials/:name` - Get credentials
- `GET /api/instance/settings/:name` - Get settings
- `POST /api/instance/settings/:name` - Update settings
- `GET /api/instance/webhook/:name` - Get webhook config
- `POST /api/instance/webhook/:name` - Set webhook config
- `GET /api/instance/connect/:name` - Generate QR code
- `GET /api/instance/connectionState/:name` - Get connection state
- `POST /api/instance/sendText/:name` - Send text message
- `POST /api/instance/sendMedia/:name` - Send media message
- `POST /api/instance/sendLocation/:name` - Send location
- `DELETE /api/instance/logout/:name` - Disconnect instance
- `DELETE /api/instance/delete/:name` - Delete instance

## Authentication

### Admin Authentication
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fidscript.io", "password": "admin123"}'
```

Use the returned token in subsequent requests:
```bash
curl -X GET http://localhost:3001/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Client API Authentication
Clients authenticate using their API key:
```bash
curl -X POST http://localhost:3001/api/instance/sendText/my-instance \
  -H "X-API-Key: fidscript_live_..." \
  -H "Content-Type: application/json" \
  -d '{"to": "+254712345678", "message": "Hello!"}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT signing secret | (change in production) |
| CORS_ORIGIN | Allowed CORS origin | * |

## Database

Uses SQLite by default. Database file: `fidscript.db`

Tables:
- `users` - Admin users
- `plans` - Subscription plans
- `clients` - Client accounts
- `instances` - WhatsApp instances
- `api_logs` - API request logs
- `audit_logs` - Admin audit logs
- `inbox_messages` - Incoming messages
