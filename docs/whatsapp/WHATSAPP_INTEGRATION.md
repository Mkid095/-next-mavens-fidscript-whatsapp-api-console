# WhatsApp Service Integration Guide

## Overview

The **Next Mavens Fidscript WhatsApp API** is a centralized WhatsApp messaging service integrated into the Fidscript Console platform. It provides enterprise-grade WhatsApp Business API capabilities with built-in anti-ban protection, campaign management, and comprehensive analytics.

**Version:** 1.0.0  
**Service Location:** `{project}/apps/whatsapp-api/`

---

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Authentication](#authentication)
8. [Instance Management](#instance-management)
9. [Contact Handling](#contact-handling)
10. [Message Sending](#message-sending)
11. [Webhook Integration](#webhook-integration)
12. [Anti-Ban System](#anti-ban-system)
13. [Campaign Management](#campaign-management)
14. [Chatwoot Integration](#chatwoot-integration)
15. [Analytics](#analytics)
16. [Error Handling](#error-handling)
17. [Testing](#testing)
18. [Next Steps](#next-steps)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fidscript Console                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Dashboard  │  │   API       │  │   WhatsApp Service       │ │
│  │             │◄─┤   Console   │◄─┤   (apps/whatsapp-api)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
              ┌─────▼─────┐           ┌───────▼───────┐         ┌──────▼──────┐
              │  Baileys  │           │  WhatsApp     │         │   Anti-Ban  │
              │  Channel  │           │  Business API │         │   Service   │
              └─────┬─────┘           └───────┬───────┘         └──────┬───────┘
                    │                         │                        │
                    └─────────────────────────┼────────────────────────┘
                                              │
                                      ┌───────▼───────┐
                                      │   WhatsApp    │
                                      │   Network     │
                                      └───────────────┘
```

### Key Components

| Component | Description |
|-----------|-------------|
| **Baileys Channel** | WhatsApp Web protocol implementation for personal WhatsApp |
| **WhatsApp Business API** | Official Meta Business API for business accounts |
| **Anti-Ban Service** | Rate limiting, quality monitoring, block tracking |
| **Campaign Service** | Bulk messaging with anti-ban safeguards |
| **Webhook Manager** | Real-time event notifications |
| **Chatwoot Integration** | Inbox management for conversations |

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-Instance Support** | Run multiple WhatsApp instances simultaneously |
| **Baileys Integration** | WhatsApp Web protocol implementation |
| **WhatsApp Business API** | Official Meta Business API integration |
| **Anti-Ban Protection** | Rate limiting, quality monitoring, block tracking |
| **Campaign Management** | Bulk messaging with anti-ban safeguards |
| **Analytics** | Comprehensive message and instance analytics |
| **Chatwoot Integration** | Inbox management for conversations |
| **Webhook Events** | Real-time event notifications |

### Supported Message Types

| Type | Endpoint | Description |
|------|----------|-------------|
| Text | `POST /message/sendText` | Simple text messages |
| Media | `POST /message/sendMedia` | Images, videos, documents |
| Audio | `POST /message/sendWhatsAppAudio` | Audio messages |
| Sticker | `POST /message/sendSticker` | Sticker messages |
| Location | `POST /message/sendLocation` | Location sharing |
| Contact | `POST /message/sendContact` | Contact card sharing |
| Reaction | `POST /message/sendReaction` | Emoji reactions |
| Poll | `POST /message/sendPoll` | Polls with selectable options |
| Buttons | `POST /message/sendButtons` | Interactive buttons |
| List | `POST /message/sendList` | Interactive list messages |
| Interactive Buttons | `POST /message/sendInteractiveButtons` | WhatsApp Business buttons |
| Product | `POST /message/sendProduct` | Product from catalog |
| Product Carousel | `POST /message/sendProductCarousel` | Product carousel |
| Flow | `POST /message/sendFlow` | WhatsApp Flow messages |
| Status | `POST /message/sendStatus` | Status updates |
| PTV | `POST /message/sendPtv` | Video messages |
| Template | `POST /message/sendTemplate` | Template messages |

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB SSD | 50+ GB SSD |
| OS | Ubuntu 20.04 | Ubuntu 22.04 LTS |

### Required Services

- **PostgreSQL** 14+ or **MySQL** 8+
- **Redis** 6+ (required for anti-ban system)
- **Node.js** 20 LTS

### Optional Services

- **S3-compatible storage** (MinIO, AWS S3)
- **RabbitMQ/NATS/SQS** for event queue processing

---

## Quick Start

### 1. Clone and Setup

```bash
cd apps/whatsapp-api
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings (see [Environment Configuration](#environment-configuration))

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev:win  # Windows
npm run db:migrate:dev      # Unix/Mac
```

### 5. Start the Service

```bash
# Development mode with hot reload
npm run dev:server

# Production mode
npm run build
npm run start:prod
```

### 6. Verify Service Health

```bash
curl http://localhost:8080/health
```

---

## Environment Configuration

### Complete Environment Variables

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PROTOCOL=http                 # http or https
PORT=8080                    # Server port
HOST=0.0.0.0                 # Bind address
URL=http://localhost:8080    # Public URL
CORS_ORIGIN=*                # CORS origins (comma-separated)

# ===========================================
# AUTHENTICATION
# ===========================================
AUTHENTICATION_API_KEY=true
API_KEY_NAME=apikey
API_KEY_SECRET=your-super-secret-key-here

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DATABASE_PROVIDER=postgresql  # postgresql or mysql
DATABASE_URL=postgresql://user:password@localhost:5432/fidscript_whatsapp

# ===========================================
# REDIS CONFIGURATION (Required for Anti-Ban)
# ===========================================
REDIS_URI=redis://localhost:6379

# ===========================================
# WHATSAPP CONFIGURATION
# ===========================================
WHATSAPP_SESSION_PATH=./.sessions
WHATSAPP_SESSION_TTL=604800    # 7 days in seconds
WHATSAPP_KEYS_MODE=plaintext   # or 'encrypted'

# ===========================================
# ANTI-BAN CONFIGURATION (Critical for Production)
# ===========================================
ANTI_BAN_ENABLED=true
RATE_LIMIT_CONTACT_MS=6000           # Min time between messages (6 sec)
RATE_LIMIT_CONTACT_HOURLY=600          # Max messages per hour
RATE_LIMIT_BURST=45                   # Max burst messages
RATE_LIMIT_GLOBAL_THROUGHPUT=100      # Max concurrent sends
BLOCK_THRESHOLD=5                     # Blocks before suppression
SUPPRESSION_TTL_DAYS=30               # Days to suppress blocked contacts
QUALITY_ALERT_THRESHOLD=YELLOW         # YELLOW or RED
AUTO_PAUSE_ON_RED_DAYS=2              # Auto-pause after consecutive RED days

# ===========================================
# CHATWOOT CONFIGURATION (Optional)
# ===========================================
CHATWOOT_ENABLED=false
CHATWOOT_URL=https://chat.example.com
CHATWOOT_TOKEN=your-chatwoot-token

# ===========================================
# WEBHOOK CONFIGURATION
# ===========================================
WEBHOOK_GLOBAL_URL=https://your-server.com/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false

# ===========================================
# EVENT QUEUES (Optional)
# ===========================================
RABBITMQ_ENABLED=false
NATS_ENABLED=false
SQS_ENABLED=false

# ===========================================
# STORAGE (Optional)
# ===========================================
STORAGE_TYPE=local    # local, s3, minio
S3_BUCKET=fidscript-media
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_REGION=us-east-1

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL=info
LOG_COLORIZE=false

# ===========================================
# SENTRY (Optional - Error Tracking)
# ===========================================
SENTRY_DSN=
```

---

## Database Setup

### PostgreSQL Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE fidscript_whatsapp;
CREATE USER fidscript WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE fidscript_whatsapp TO fidscript;
\c fidscript_whatsapp
GRANT ALL ON SCHEMA public TO fidscript;
```

### MySQL Setup

```sql
CREATE DATABASE fidscript_whatsapp;
CREATE USER 'fidscript'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON fidscript_whatsapp.* TO 'fidscript'@'localhost';
FLUSH PRIVILEGES;
```

### Run Migrations

```bash
# Set database provider
export DATABASE_PROVIDER=postgresql  # or mysql

# Generate Prisma client
npm run db:generate

# Development migrations
npm run db:migrate:dev

# Production migrations
npm run db:deploy
```

---

## Authentication

### API Key Authentication

All API requests require authentication via API key.

```bash
# Header authentication (recommended)
curl -H "apikey: your-api-key" http://localhost:8080/instance/find

# Query parameter authentication
curl http://localhost:8080/instance/find?apikey=your-api-key
```

### Generating API Keys

Generate a secure API key:

```bash
openssl rand -hex 32
```

---

## Instance Management

### Create a New Instance

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: your-api-key" \
  -d '{
    "instanceName": "my-whatsapp-instance",
    "integration": "WHATSAPP-BAILEY",
    "qrcode": true,
    "webhook": {
      "url": "https://your-server.com/webhook",
      "webhookByEvents": true,
      "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"]
    }
  }'
```

### Connect via QR Code

For Baileys instances, the QR code is returned during creation. To fetch a new QR code:

```bash
curl http://localhost:8080/instance/connect \
  -H "apikey: your-api-key"
```

### Instance Integration Types

| Type | Description |
|------|-------------|
| `WHATSAPP-BAILEY` | WhatsApp Web (personal account) |
| `WHATSAPP-BUSINESS` | Official WhatsApp Business API |

### Instance Response Structure

```json
{
  "instance": {
    "instanceName": "my-whatsapp-instance",
    "instanceId": "abc123-def456",
    "integration": "WHATSAPP-BAILEY",
    "status": "open"
  },
  "hash": {
    "watermark": "eyJ...",
    "certificate": "eyJ..."
  },
  "qrcode": {
    "code": "2@XYZ...",
    "base64": "data:image/png;base64,..."
  }
}
```

---

## Contact Handling

### How Contacts Work

The WhatsApp service uses JID (Jabber ID) for contact identification:

| Format | Description | Example |
|--------|-------------|---------|
| User | Personal chat | `5511999999999@s.whatsapp.net` |
| Group | Group chat | `5511999999999-987654321@g.us` |
| LID | Legacy ID | `abcdef123@lid` |

### JID Creation

The service automatically converts phone numbers to JIDs:

```typescript
// Input: 5511999999999
// Output: 5511999999999@s.whatsapp.net
```

### Phone Number Formats

| Format | Example |
|--------|---------|
| International | `5511999999999` |
| With + | `+5511999999999` |
| JID | `5511999999999@s.whatsapp.net` |

### WhatsApp Number Verification

Verify if a number is on WhatsApp:

```bash
curl -X POST http://localhost:8080/chat/whatsappNumbers/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers": ["5511888888888", "5511999999999"]
  }'
```

---

## Message Sending

### Send Text Message

```bash
curl -X POST http://localhost:8080/message/sendText/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888",
    "text": "Hello from Fidscript!"
  }'
```

### Send Media Message

```bash
curl -X POST http://localhost:8080/message/sendMedia/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888",
    "mediatype": "image",
    "media": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'
```

### Send with Quote/Reply

```bash
curl -X POST http://localhost:8080/message/sendText/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888",
    "text": "Replying to your message",
    "quoted": {
      "key": {
        "remoteJid": "5511888888888@s.whatsapp.net",
        "fromMe": false,
        "id": "BAE1234567890ABCD"
      }
    }
  }'
```

### Send with Mentions

```bash
curl -X POST http://localhost:8080/message/sendText/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888",
    "text": "Hello @5511999999999 and @5511777777777!",
    "mentioned": ["5511999999999@s.whatsapp.net", "5511777777777@s.whatsapp.net"]
  }'
```

---

## Webhook Integration

### Configure Webhook

```bash
curl -X POST http://localhost:8080/webhook/set/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-fidscript-server.com/webhook",
    "webhookByEvents": true,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE"
    ]
  }'
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `MESSAGES_UPSERT` | New message received |
| `MESSAGES_UPDATE` | Message status updated |
| `MESSAGES_EDITED` | Message was edited |
| `MESSAGES_DELETE` | Message was deleted |
| `SEND_MESSAGE` | Outbound message sent |
| `CONNECTION_UPDATE` | Connection state changed |
| `CONTACTS_UPSERT` | New contact added |
| `CHATS_SET` | Chat list synced |
| `QRCODE_UPDATED` | QR code generated |

### Webhook Payload Structure

```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "my-instance",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE1234567890ABCD"
    },
    "pushName": "John Doe",
    "message": {
      "conversation": "Hello!"
    },
    "messageType": "conversation",
    "messageTimestamp": "1700000000",
    "status": "PENDING"
  },
  "date_time": "2024-01-01T12:00:00.000Z"
}
```

---

## Anti-Ban System

The Anti-Ban system protects your WhatsApp account from being banned by implementing rate limiting and quality monitoring.

### How Anti-Ban Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Anti-Ban System                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Rate Limiter │→ │   Quality    │→ │    Block     │    │
│  │              │  │   Monitor    │  │   Tracker    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ↓                 ↓                 ↓              │
│    6 sec delay      GREEN/YELLOW/RED      Suppress          │
│    Max 600/hr      Block detection       contacts          │
└─────────────────────────────────────────────────────────────┘
```

### Anti-Ban Configuration

```env
ANTI_BAN_ENABLED=true
RATE_LIMIT_CONTACT_MS=6000           # 6 seconds between messages
RATE_LIMIT_CONTACT_HOURLY=600        # Max 600 messages per hour
RATE_LIMIT_BURST=45                 # Max burst messages
BLOCK_THRESHOLD=5                    # Blocks before suppression
QUALITY_ALERT_THRESHOLD=YELLOW       # Alert threshold
AUTO_PAUSE_ON_RED_DAYS=2            # Auto-pause after 2 RED days
```

### Check Anti-Ban Status

```bash
curl http://localhost:8080/anti-ban/status/my-instance \
  -H "apikey: your-api-key"
```

### Response

```json
{
  "instanceName": "my-instance",
  "antiBan": {
    "enabled": true,
    "rateLimiter": {
      "contactLimitMs": 6000,
      "contactHourlyLimit": 600,
      "burstLimit": 45,
      "globalThroughput": 100
    },
    "qualityMonitor": {
      "currentQuality": "GREEN",
      "messageCount": 150,
      "blockCount": 0,
      "lastBlockDate": null
    },
    "blockTracker": {
      "currentBlockedCount": 0,
      "suppressedContacts": []
    }
  }
}
```

### Check if Can Send Message

```bash
curl -X POST http://localhost:8080/anti-ban/can-send/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888"
  }'
```

### Unsubscribe/Resubscribe Contact

```bash
# Unsubscribe (opt-out from messages)
curl -X POST http://localhost:8080/anti-ban/unsubscribe \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "my-instance",
    "phone": "5511888888888"
  }'

# Resubscribe
curl -X POST http://localhost:8080/anti-ban/resubscribe \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "my-instance",
    "phone": "5511888888888"
  }'
```

---

## Campaign Management

Campaigns allow you to send bulk messages with automatic anti-ban protection.

### Create Campaign

```bash
curl -X POST http://localhost:8080/campaign/create \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Campaign 2024",
    "instanceName": "my-instance",
    "scheduledAt": "2024-01-15T10:00:00.000Z"
  }'
```

### Add Recipients

```bash
curl -X POST http://localhost:8080/campaign/addRecipients \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-123",
    "numbers": [
      "5511888888888",
      "5511999999999",
      "5511777777777"
    ]
  }'
```

### Send Campaign

```bash
curl -X POST http://localhost:8080/campaign/send \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "campaign-123",
    "message": {
      "text": "Hello! Check out our new products."
    }
  }'
```

### Campaign Features

- **Anti-ban integration**: Checks before each message
- **Rate limiting**: Automatic delays between messages
- **Quality monitoring**: Pauses on quality degradation
- **Status tracking**: Real-time campaign status
- **Pause/Resume/Cancel**: Full campaign control

### Campaign Status Flow

```
CREATED → SCHEDULED → RUNNING → COMPLETED
                  ↓         ↓
                PAUSED   CANCELLED
                  ↓
               RESUMED → RUNNING
```

---

## Chatwoot Integration

Chatwoot provides inbox management for handling WhatsApp conversations.

### Configure Chatwoot

```bash
curl -X POST http://localhost:8080/chatwoot/set/my-instance \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "123",
    "token": "your-chatwoot-token",
    "url": "https://chat.example.com",
    "signMsg": true,
    "nameInbox": "WhatsApp Support"
  }'
```

### Chatwoot Events Flow

```
WhatsApp User → Message → WhatsApp API → Chatwoot → Fidscript Dashboard
                                    ↓
                              Webhook also sent
```

### Chatwoot Features

- Sync WhatsApp messages to Chatwoot conversations
- Create contacts automatically
- Import message history
- Real-time message sync
- Sign messages with agent name

---

## Analytics

### Get Instance Analytics

```bash
curl http://localhost:8080/analytics/instance/my-instance \
  -H "apikey: your-api-key"
```

### Get Message Analytics

```bash
curl -X POST http://localhost:8080/analytics/messages \
  -H "apikey: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "my-instance",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

### Get Real-time Metrics

```bash
curl http://localhost:8080/analytics/realtime/my-instance \
  -H "apikey: your-api-key"
```

### Analytics Response

```json
{
  "instanceName": "my-instance",
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "messages": {
    "sent": 1250,
    "delivered": 1200,
    "read": 1100,
    "failed": 5
  },
  "contacts": {
    "total": 350,
    "active": 280
  },
  "quality": {
    "current": "GREEN",
    "blocks": 0,
    "hourlyAverage": 45
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "status": 400,
  "message": "Invalid phone number format",
  "error": "Bad Request"
}
```

### Common Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 404 | Not Found | Instance or resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Rate Limit Handling

When rate limited, wait for the specified time:

```json
{
  "status": 429,
  "message": "Rate limit exceeded. Wait 6 seconds.",
  "retryAfter": 6000
}
```

---

## Testing

### Run Tests

```bash
cd apps/whatsapp-api
npm test
```

### Test Webhook Endpoint

Use ngrok for local testing:

```bash
ngrok http 8080
```

Then configure your webhook URL to the ngrok URL.

### Test Instance Creation

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: test-api-key" \
  -d '{
    "instanceName": "test-instance",
    "integration": "WHATSAPP-BAILEY"
  }'
```

### Test Message Sending

```bash
curl -X POST http://localhost:8080/message/sendText/test-instance \
  -H "apikey: test-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888",
    "text": "Test message"
  }'
```

---

## Next Steps

1. Read the [Deployment Guide](./WHATSAPP_DEPLOYMENT.md) for production setup
2. Review the [API Reference](./WHATSAPP_API_REFERENCE.md) for complete endpoint documentation
3. See [Webhook Guide](./WHATSAPP_WEBHOOK_GUIDE.md) for detailed webhook integration
4. Configure anti-ban settings for your use case
5. Set up monitoring and alerting

---

## Support

For issues and questions:
- **Documentation:** https://nextmavens.com/docs
- **Email:** support@nextmavens.com
