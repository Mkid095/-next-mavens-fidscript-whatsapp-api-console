# WhatsApp Service API Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:8080` (dev) or `https://whatsapp-api.your-domain.com` (prod)

---

## Authentication

All endpoints require authentication using the `apikey` header or query parameter.

```bash
# Header authentication (recommended)
curl -H "apikey: your-api-key" https://whatsapp-api.example.com/instance/find

# Query parameter authentication
curl https://whatsapp-api.example.com/instance/find?apikey=your-api-key
```

---

## Table of Contents

1. [Instance Endpoints](#instance-endpoints)
2. [Message Endpoints](#message-endpoints)
3. [Chat Endpoints](#chat-endpoints)
4. [Group Endpoints](#group-endpoints)
5. [Webhook Endpoints](#webhook-endpoints)
6. [Anti-Ban Endpoints](#anti-ban-endpoints)
7. [Campaign Endpoints](#campaign-endpoints)
8. [Analytics Endpoints](#analytics-endpoints)
9. [Business Endpoints](#business-endpoints)
10. [Template Endpoints](#template-endpoints)
11. [Settings Endpoints](#settings-endpoints)
12. [Label Endpoints](#label-endpoints)
13. [Proxy Endpoints](#proxy-endpoints)
14. [Call Endpoints](#call-endpoints)
15. [Health Endpoints](#health-endpoints)

---

## Instance Endpoints

### Create Instance

**Endpoint:** `POST /instance/create`

```json
{
  "instanceName": "my-instance",
  "integration": "WHATSAPP-BAILEY",
  "qrcode": true,
  "webhook": {
    "url": "https://your-server.com/webhook",
    "webhookByEvents": false,
    "webhookHeaders": {},
    "base64": false
  },
  "websocket": { "enabled": true },
  "rabbitmq": { "enabled": false, "events": [] },
  "nats": { "enabled": false, "events": [] },
  "sqs": { "enabled": false, "events": [] }
}
```

**Response (201):**
```json
{
  "instance": {
    "instanceName": "my-instance",
    "instanceId": "abc123",
    "integration": "WHATSAPP-BAILEY",
    "status": "open"
  },
  "qrcode": {
    "code": "2@XYZ...",
    "base64": "data:image/png;base64,..."
  }
}
```

---

### Connect Instance (Get QR Code)

**Endpoint:** `GET /instance/connect`

**Response (200):**
```json
{
  "qrcode": {
    "code": "2@XYZ...",
    "base64": "data:image/png;base64,..."
  }
}
```

---

### Get Connection State

**Endpoint:** `GET /instance/connectionState`

**Response (200):**
```json
{
  "instance": "my-instance",
  "state": "open",
  "qrcode": null
}
```

---

### Fetch All Instances

**Endpoint:** `GET /instance/fetchInstances`

**Response (200):**
```json
{
  "instances": [
    {
      "instanceName": "my-instance",
      "instanceId": "abc123",
      "status": "open"
    }
  ]
}
```

---

### Set Presence

**Endpoint:** `POST /instance/setPresence`

```json
{
  "instanceName": "my-instance",
  "presence": "available"
}
```

---

### Restart Instance

**Endpoint:** `POST /instance/restart`

```json
{
  "instanceName": "my-instance"
}
```

**Response (200):**
```json
{
  "instance": {
    "instanceName": "my-instance",
    "status": "restarting"
  }
}
```

---

### Logout Instance

**Endpoint:** `DELETE /instance/logout`

```json
{
  "instanceName": "my-instance"
}
```

---

### Delete Instance

**Endpoint:** `DELETE /instance/delete`

```json
{
  "instanceName": "my-instance"
}
```

---

## Message Endpoints

All message endpoints follow the pattern: `POST /message/send{Type}/{instanceName}`

### Send Text Message

**Endpoint:** `POST /message/sendText/{instanceName}`

```json
{
  "number": "5511888888888",
  "text": "Hello, World!",
  "quoted": {},
  "mentioned": [],
  "everyOne": false,
  "linkPreview": true
}
```

---

### Send Media Message

**Endpoint:** `POST /message/sendMedia/{instanceName}`

```json
{
  "number": "5511888888888",
  "mediatype": "image",
  "media": "https://example.com/image.jpg",
  "caption": "Image caption",
  "fileName": "image.jpg",
  "mimetype": "image/jpeg",
  "quoted": {},
  "mentioned": [],
  "everyOne": false
}
```

**Media Types:** `image`, `video`, `audio`, `document`, `ptv`

---

### Send Audio Message

**Endpoint:** `POST /message/sendWhatsAppAudio/{instanceName}`

```json
{
  "number": "5511888888888",
  "audio": "https://example.com/audio.mp3"
}
```

---

### Send Sticker

**Endpoint:** `POST /message/sendSticker/{instanceName}`

```json
{
  "number": "5511888888888",
  "sticker": "https://example.com/sticker.webp"
}
```

---

### Send Location

**Endpoint:** `POST /message/sendLocation/{instanceName}`

```json
{
  "number": "5511888888888",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "name": "São Paulo",
  "address": "São Paulo, SP, Brazil"
}
```

---

### Send Contact

**Endpoint:** `POST /message/sendContact/{instanceName}`

```json
{
  "number": "5511888888888",
  "contact": [
    {
      "fullName": "John Doe",
      "wuid": "5511999999999@s.whatsapp.net",
      "phoneNumber": "5511999999999",
      "organization": "Acme Inc",
      "email": "john@example.com",
      "url": "https://example.com"
    }
  ]
}
```

---

### Send Reaction

**Endpoint:** `POST /message/sendReaction/{instanceName}`

```json
{
  "key": {
    "remoteJid": "5511888888888@s.whatsapp.net",
    "id": "BAE1234567890ABCD",
    "fromMe": false
  },
  "reaction": "👍"
}
```

---

### Send Poll

**Endpoint:** `POST /message/sendPoll/{instanceName}`

```json
{
  "number": "5511888888888",
  "poll": {
    "name": "Favorite Color",
    "selectableCount": 1,
    "values": ["Red", "Blue", "Green"],
    "messageSecret": "optional-secret"
  }
}
```

---

### Send Buttons

**Endpoint:** `POST /message/sendButtons/{instanceName}`

```json
{
  "number": "5511888888888",
  "title": "Choose an option",
  "description": "Select one of the following",
  "footerText": "Powered by Fidscript",
  "buttons": [
    { "type": "reply", "id": "btn1", "title": "Option 1" },
    { "type": "url", "title": "Visit Website", "url": "https://example.com" },
    { "type": "call", "title": "Call Us", "phoneNumber": "+1234567890" }
  ]
}
```

---

### Send List Message

**Endpoint:** `POST /message/sendList/{instanceName}`

```json
{
  "number": "5511888888888",
  "title": "Menu",
  "description": "Select an item",
  "buttonText": "View Menu",
  "sections": [
    {
      "title": "Food",
      "rows": [
        { "title": "Pizza", "description": "$15", "rowId": "pizza" },
        { "title": "Burger", "description": "$10", "rowId": "burger" }
      ]
    }
  ]
}
```

---

### Send Interactive Buttons (WhatsApp Business)

**Endpoint:** `POST /message/sendInteractiveButtons/{instanceName}`

```json
{
  "number": "5511888888888",
  "header": { "type": "text", "text": "Header Text" },
  "body": { "text": "Body text content" },
  "footer": { "text": "Footer text" },
  "action": {
    "buttons": [
      { "type": "reply", "reply": { "id": "btn1", "title": "Yes" } },
      { "type": "reply", "reply": { "id": "btn2", "title": "No" } }
    ]
  }
}
```

---

### Send Product Message

**Endpoint:** `POST /message/sendProduct/{instanceName}`

```json
{
  "number": "5511888888888",
  "product": {
    "catalogId": "CATALOG123",
    "productId": "PROD456",
    "storefrontName": "My Store"
  },
  "sections": [
    {
      "title": "Products",
      "productItems": [{ "productId": "PROD456" }]
    }
  ]
}
```

---

### Send Product Carousel

**Endpoint:** `POST /message/sendProductCarousel/{instanceName}`

```json
{
  "number": "5511888888888",
  "header": { "type": "text", "text": "Shop Our Products" },
  "body": { "text": "Browse our catalog" },
  "footer": { "text": "Powered by Fidscript" },
  "catalogId": "CATALOG123",
  "productItems": [
    { "productId": "PROD1" },
    { "productId": "PROD2" }
  ]
}
```

---

### Send Flow Message

**Endpoint:** `POST /message/sendFlow/{instanceName}`

```json
{
  "number": "5511888888888",
  "flowId": "FLOW123",
  "flowToken": "token123",
  "screen": "initial_screen",
  "action": "navigate",
  "data": {}
}
```

---

### Send Status

**Endpoint:** `POST /message/sendStatus/{instanceName}`

```json
{
  "status": {
    "type": "image",
    "content": "https://example.com/image.jpg",
    "caption": "My status",
    "backgroundColor": "#FFFFFF",
    "font": 1,
    "statusJidList": ["5511888888888@g.us"],
    "allContacts": false
  }
}
```

**Status Types:** `image`, `video`, `text`

---

### Send PTV (Video Message)

**Endpoint:** `POST /message/sendPtv/{instanceName}`

```json
{
  "number": "5511888888888",
  "ptv": "https://example.com/video.mp4"
}
```

---

### Send Template Message

**Endpoint:** `POST /message/sendTemplate/{instanceName}`

```json
{
  "number": "5511888888888",
  "template": {
    "name": "hello_world",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "John" }
        ]
      }
    ]
  }
}
```

---

## Chat Endpoints

### Check WhatsApp Numbers

**Endpoint:** `POST /chat/whatsappNumbers/{instanceName}`

```json
{
  "numbers": ["5511888888888", "5511999999999"]
}
```

**Response (200):**
```json
{
  "exists": [
    { "wuid": "5511888888888@s.whatsapp.net", "exists": true },
    { "wuid": "5511999999999@s.whatsapp.net", "exists": false }
  ]
}
```

---

### Mark Message as Read

**Endpoint:** `POST /chat/markMessageAsRead/{instanceName}`

```json
{
  "lastMessage": {
    "remoteJid": "5511888888888@s.whatsapp.net",
    "fromMe": false,
    "id": "BAE1234567890ABCD"
  }
}
```

---

### Send Presence

**Endpoint:** `POST /chat/sendPresence/{instanceName}`

```json
{
  "number": "5511888888888",
  "presence": "composing"
}
```

**Presence Types:** `available`, `composing`, `recording`, `paused`

---

### Update Block Status

**Endpoint:** `POST /chat/updateBlockStatus/{instanceName}`

```json
{
  "number": "5511888888888",
  "action": "block"
}
```

**Actions:** `block`, `unblock`

---

### Archive Chat

**Endpoint:** `POST /chat/archiveChat/{instanceName}`

```json
{
  "chatId": "5511888888888@s.whatsapp.net",
  "archive": true
}
```

---

### Mark Chat Unread

**Endpoint:** `POST /chat/markChatUnread/{instanceName}`

```json
{
  "chatId": "5511888888888@s.whatsapp.net"
}
```

---

### Delete Message for Everyone

**Endpoint:** `DELETE /chat/deleteMessageForEveryone/{instanceName}`

```json
{
  "key": {
    "remoteJid": "5511888888888@s.whatsapp.net",
    "fromMe": true,
    "id": "BAE1234567890ABCD"
  }
}
```

---

### Fetch Profile Picture URL

**Endpoint:** `POST /chat/fetchProfilePictureUrl/{instanceName}`

```json
{
  "number": "5511888888888"
}
```

---

### Get Base64 from Media Message

**Endpoint:** `POST /chat/getBase64FromMediaMessage/{instanceName}`

```json
{
  "key": {
    "remoteJid": "5511888888888@s.whatsapp.net",
    "id": "BAE1234567890ABCD"
  }
}
```

---

### Update Message

**Endpoint:** `POST /chat/updateMessage/{instanceName}`

```json
{
  "key": {
    "remoteJid": "5511888888888@s.whatsapp.net",
    "fromMe": true,
    "id": "BAE1234567890ABCD"
  },
  "text": "Updated message text"
}
```

---

### Find Contacts

**Endpoint:** `POST /chat/findContacts/{instanceName}`

```json
{
  "where": {}
}
```

---

### Find Messages

**Endpoint:** `POST /chat/findMessages/{instanceName}`

```json
{
  "where": {}
}
```

---

### Find Chats

**Endpoint:** `POST /chat/findChats/{instanceName}`

```json
{
  "where": {}
}
```

---

### Find Chat by Remote JID

**Endpoint:** `GET /chat/findChatByRemoteJid/{instanceName}`

**Query:** `?remoteJid=5511888888888@s.whatsapp.net`

---

### Fetch Business Profile

**Endpoint:** `POST /chat/fetchBusinessProfile/{instanceName}`

```json
{
  "number": "5511888888888"
}
```

---

### Fetch Profile

**Endpoint:** `POST /chat/fetchProfile/{instanceName}`

```json
{
  "number": "5511888888888"
}
```

---

### Update Profile Name

**Endpoint:** `POST /chat/updateProfileName/{instanceName}`

```json
{
  "name": "My Business"
}
```

---

### Update Profile Status

**Endpoint:** `POST /chat/updateProfileStatus/{instanceName}`

```json
{
  "status": "Hello! I am available on WhatsApp"
}
```

---

### Update Profile Picture

**Endpoint:** `POST /chat/updateProfilePicture/{instanceName}`

```json
{
  "number": "5511888888888",
  "url": "https://example.com/photo.jpg"
}
```

---

### Remove Profile Picture

**Endpoint:** `DELETE /chat/removeProfilePicture/{instanceName}`

```json
{
  "number": "5511888888888"
}
```

---

### Fetch Privacy Settings

**Endpoint:** `GET /chat/fetchPrivacySettings/{instanceName}`

---

### Update Privacy Settings

**Endpoint:** `POST /chat/updatePrivacySettings/{instanceName}`

```json
{
  "privacySetting": "all"
}
```

---

## Group Endpoints

### Create Group

**Endpoint:** `POST /group/create/{instanceName}`

```json
{
  "subject": "Group Name",
  "participants": ["5511888888888", "5511999999999"],
  "messageSecret": false
}
```

---

### Update Group Subject

**Endpoint:** `POST /group/updateGroupSubject/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "subject": "New Group Name"
}
```

---

### Update Group Picture

**Endpoint:** `POST /group/updateGroupPicture/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "url": "https://example.com/group-photo.jpg"
}
```

---

### Update Group Description

**Endpoint:** `POST /group/updateGroupDescription/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "description": "Group description text"
}
```

---

### Find Group Info

**Endpoint:** `GET /group/findGroupInfos`

**Query:** `?groupJid=5511999999999-123456@g.us`

---

### Fetch All Groups

**Endpoint:** `GET /group/fetchAllGroups/{instanceName}`

---

### Get Group Participants

**Endpoint:** `GET /group/participants/{instanceName}`

**Query:** `?groupJid=5511999999999-123456@g.us`

---

### Get Invite Code

**Endpoint:** `GET /group/inviteCode/{instanceName}`

**Query:** `?groupJid=5511999999999-123456@g.us`

---

### Get Invite Info

**Endpoint:** `GET /group/inviteInfo/{instanceName}`

**Query:** `?inviteCode=ABC123XYZ`

---

### Accept Invite Code

**Endpoint:** `GET /group/acceptInviteCode/{instanceName}`

**Query:** `?inviteCode=ABC123XYZ`

---

### Send Invite

**Endpoint:** `POST /group/sendInvite/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "participants": ["5511888888888"]
}
```

---

### Revoke Invite Code

**Endpoint:** `POST /group/revokeInviteCode/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us"
}
```

---

### Update Participant

**Endpoint:** `POST /group/updateParticipant/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "participants": ["5511888888888"],
  "action": "add"
}
```

**Actions:** `add`, `remove`, `promote`, `demote`

---

### Update Group Setting

**Endpoint:** `POST /group/updateSetting/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "setting": "announce",
  "value": true
}
```

---

### Toggle Ephemeral

**Endpoint:** `POST /group/toggleEphemeral/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us",
  "duration": 86400
}
```

**Duration:** `0` (disables), `86400` (24 hours), `604800` (7 days), `7776000` (90 days)

---

### Leave Group

**Endpoint:** `DELETE /group/leaveGroup/{instanceName}`

```json
{
  "groupJid": "5511999999999-123456@g.us"
}
```

---

## Webhook Endpoints

### Set Webhook

**Endpoint:** `POST /webhook/set/{instanceName}`

```json
{
  "url": "https://your-server.com/webhook",
  "webhookByEvents": false,
  "webhookHeaders": {
    "Authorization": "Bearer your-token"
  },
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ],
  "base64": false
}
```

---

### Find Webhook

**Endpoint:** `GET /webhook/find/{instanceName}`

---

## Anti-Ban Endpoints

### Get Anti-Ban Health

**Endpoint:** `GET /anti-ban/health`

**Response (200):**
```json
{
  "status": "healthy",
  "instanceName": "my-instance",
  "antiBan": {
    "enabled": true,
    "rateLimiter": {
      "contactLimitMs": 6000,
      "contactHourlyLimit": 600,
      "burstLimit": 45
    }
  }
}
```

---

### Get Anti-Ban Status

**Endpoint:** `GET /anti-ban/status/{instanceName}`

**Response (200):**
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
      "blockCount": 0
    },
    "blockTracker": {
      "currentBlockedCount": 0,
      "suppressedContacts": []
    }
  }
}
```

---

### Get Rate Limit for Contact

**Endpoint:** `GET /anti-ban/rate-limit/{instanceName}/{phone}`

---

### Get Contact Block Stats

**Endpoint:** `GET /anti-ban/contact/{instanceName}/{phone}`

---

### Get Template Status

**Endpoint:** `GET /anti-ban/template/{templateName}`

---

### Pause Template

**Endpoint:** `POST /anti-ban/pause-template`

```json
{
  "instanceName": "my-instance",
  "templateName": "hello_world"
}
```

---

### Resume Template

**Endpoint:** `POST /anti-ban/resume-template`

```json
{
  "instanceName": "my-instance",
  "templateName": "hello_world"
}
```

---

### Unsubscribe Contact

**Endpoint:** `POST /anti-ban/unsubscribe`

```json
{
  "instanceName": "my-instance",
  "phone": "5511888888888"
}
```

---

### Resubscribe Contact

**Endpoint:** `POST /anti-ban/resubscribe`

```json
{
  "instanceName": "my-instance",
  "phone": "5511888888888"
}
```

---

### Get Suppressed Contacts

**Endpoint:** `GET /anti-ban/suppressed/{instanceName}`

---

## Campaign Endpoints

### Create Campaign

**Endpoint:** `POST /campaign/create`

```json
{
  "name": "Marketing Campaign",
  "instanceName": "my-instance",
  "scheduledAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Schedule Campaign

**Endpoint:** `POST /campaign/schedule`

```json
{
  "campaignId": "campaign-123",
  "scheduledAt": "2024-01-15T10:00:00.000Z"
}
```

---

### Send Campaign

**Endpoint:** `POST /campaign/send`

```json
{
  "campaignId": "campaign-123",
  "message": {
    "text": "Hello! Check our new products."
  }
}
```

---

### Get Campaign Status

**Endpoint:** `GET /campaign/status/{campaignId}`

---

### List Campaigns

**Endpoint:** `GET /campaign/list`

---

### Pause Campaign

**Endpoint:** `POST /campaign/pause/{campaignId}`

---

### Resume Campaign

**Endpoint:** `POST /campaign/resume/{campaignId}`

---

### Cancel Campaign

**Endpoint:** `POST /campaign/cancel/{campaignId}`

---

### Delete Campaign

**Endpoint:** `DELETE /campaign/delete/{campaignId}`

---

## Analytics Endpoints

### Get Instance Analytics

**Endpoint:** `GET /analytics/instance/{instanceName}`

---

### Get Platform Analytics

**Endpoint:** `GET /analytics/platform`

---

### Get Real-time Metrics

**Endpoint:** `GET /analytics/realtime/{instanceName}`

---

## Business Endpoints

### Get Catalog

**Endpoint:** `POST /business/getCatalog`

```json
{
  "instanceName": "my-instance",
  "catalogId": "CATALOG123"
}
```

---

### Get Collections

**Endpoint:** `POST /business/getCollections`

```json
{
  "instanceName": "my-instance",
  "catalogId": "CATALOG123"
}
```

---

## Template Endpoints

### Create Template

**Endpoint:** `POST /template/create/{instanceName}`

```json
{
  "name": "hello_world",
  "language": "en_US",
  "category": "MARKETING",
  "components": [
    {
      "type": "body",
      "text": "Hello {{1}}, welcome to our service!"
    }
  ]
}
```

---

### Edit Template

**Endpoint:** `POST /template/edit/{instanceName}`

```json
{
  "name": "hello_world",
  "language": "en_US",
  "components": [...]
}
```

---

### Delete Template

**Endpoint:** `DELETE /template/delete/{instanceName}`

```json
{
  "name": "hello_world"
}
```

---

### Find Templates

**Endpoint:** `GET /template/find/{instanceName}`

---

## Settings Endpoints

### Set Settings

**Endpoint:** `POST /settings/set/{instanceName}`

```json
{
  "settings": {
    "rejectCalls": false,
    "groupsAdd": true
  }
}
```

---

### Find Settings

**Endpoint:** `GET /settings/find/{instanceName}`

---

## Label Endpoints

### Find Labels

**Endpoint:** `GET /label/findLabels/{instanceName}`

---

### Handle Label

**Endpoint:** `POST /label/handleLabel/{instanceName}`

```json
{
  "labelId": "123",
  "action": "add",
  "chatId": "5511888888888@s.whatsapp.net"
}
```

---

## Proxy Endpoints

### Set Proxy

**Endpoint:** `POST /proxy/set/{instanceName}`

```json
{
  "proxy": {
    "host": "proxy.example.com",
    "port": 8080,
    "username": "user",
    "password": "pass"
  }
}
```

---

### Find Proxy

**Endpoint:** `GET /proxy/find/{instanceName}`

---

## Call Endpoints

### Offer Call

**Endpoint:** `POST /call/offer/{instanceName}`

```json
{
  "number": "5511888888888",
  "isVideo": false
}
```

---

## Health Endpoints

### Health Check

**Endpoint:** `GET /health`

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected"
}
```

---

## Error Responses

### Error Format

```json
{
  "status": 400,
  "message": "Human-readable error message",
  "error": "Error type"
}
```

### Status Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Message Sending | 1 per 6 seconds (configurable) |
| Instance Creation | 10 per minute |
| Webhook Configuration | 10 per minute |
| Instance Query | 100 per minute |
