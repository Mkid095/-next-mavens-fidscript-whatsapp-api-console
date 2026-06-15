# FIDScript WhatsApp API SDK

Generated 2026-06-15T11:47:25.185Z.
Base URL: https://whatsapp.fidscript.com/api/v1

## Authentication

All requests require your API key via the `X-API-Key` header:

```
X-API-Key: fidscript_live_your_key_here
```

## Quick Start

### JavaScript / TypeScript

```bash
npm install
# or just import fidscript.js directly
```

```js
import { Fidscript } from './fidscript.js';
const api = new Fidscript({ apiKey: 'fidscript_live_...' });
const result = await api.send_text('my-instance', { number: '254700000000', text: 'Hello!' });
```

### Python

```bash
pip install requests
```

```python
from fidscript import Fidscript
api = Fidscript(api_key='fidscript_live_...')
result = api.send_text('my-instance', number='254700000000', text='Hello!')
```

### PHP

```php
<?php
require_once 'fidscript.php';
$api = new Fidscript('fidscript_live_...');
$result = $api->sendText('my-instance', '254700000000', 'Hello!');
```

### Go

```go
package main
import "github.com/fidscript/sdk-go"
```

```go
client := fidscript.New("fidscript_live_...")
result, err := client.SendText("my-instance", "254700000000", "Hello!")
```

## Endpoints Coverage

| Category | Count |
|----------|-------|
| Platform | 3 |
| Messaging | 10 |
| Groups | 16 |
| Chats | 13 |
| Profile | 6 |
| Settings | 2 |
| Instance | 6 |

## Rate Limits

- Sends: per your plan's `clientRateLimit` (token-bucket, per-minute)
- Reads (V1_READ): 600/min
- Mutations (V1_MUTATE): 120/min
- Profile/restart (V1_STRICT): 30/min

## Idempotency

Send endpoints accept `Idempotency-Key: <uuid>` header — retries return the cached first result without re-charge.

## Webhooks

Configure your webhook URL in the dashboard. Events delivered:
- `messages.upsert` — inbound messages (stored with raw + normalized payload)
- `connection.update` — instance connection state changes
- `qrcode.updated` — new QR code generated

## SDK Methods

- `Validate Key` — Confirm an API key is active and resolve the owning client. No side effects — ideal for a connection test. (`GET /whoami`, free)
- `Usage Analytics` — Aggregate API usage for the authenticated client: requests today/this month, sends this month, token spend, and failed requests. (`GET /usage`, free)
- `OpenAPI Spec` — The machine-readable OpenAPI 3.0 document for the entire API. Import into Postman, Insomnia, or an AI agent. A YAML mirror is at /api/v1/openapi.yaml. (`GET /openapi.json`, free)
- `Send Text` — Send a plain-text WhatsApp message. (`POST /messages/text/{instanceName}`, 1 token(s))
- `Send Media` — Send an image, video, document or audio file by URL. (`POST /messages/media/{instanceName}`, 2 token(s))
- `Send Location` — Share a geographic location pin. (`POST /messages/location/{instanceName}`, 1 token(s))
- `Send Contact` — Share one or more contact cards. (`POST /messages/contact/{instanceName}`, 1 token(s))
- `Send Reaction` — React to an existing message (emoji). (`POST /messages/reaction/{instanceName}`, 1 token(s))
- `Send Poll` — Send an interactive poll. (`POST /messages/poll/{instanceName}`, 1 token(s))
- `Send List` — Send an interactive list message with selectable sections. (`POST /messages/list/{instanceName}`, 1 token(s))
- `Send Audio` — Send a native WhatsApp voice message (PTT) from an audio URL. (`POST /messages/audio/{instanceName}`, 2 token(s))
- `Send Sticker` — Send a WhatsApp sticker from an image URL. (`POST /messages/sticker/{instanceName}`, 2 token(s))
- `Send Status` — Post a status/story update (text, image, or audio). (`POST /messages/status/{instanceName}`, 2 token(s))
- `Create Group` — Create a new WhatsApp group with an initial participant list. (`POST /groups/create/{instanceName}`, free)
- `Update Subject` — Rename a group. (`POST /groups/update-subject/{instanceName}`, free)
- `Update Description` — Change the group description. (`POST /groups/update-description/{instanceName}`, free)
- `Update Picture` — Set the group picture from an image URL. (`POST /groups/update-picture/{instanceName}`, free)
- `Fetch All Groups` — List every group the instance belongs to. (`GET /groups/fetch-all/{instanceName}`, free)
- `Find Group` — Get info for a single group by JID. (`GET /groups/find/{instanceName}`, free)
- `Find Members` — List the members of a group. (`GET /groups/find-members/{instanceName}`, free)
- `Update Participant` — Add, remove, promote or demote members. (`POST /groups/update-participant/{instanceName}`, free)
- `Invite Code` — Fetch the group invite code. (`GET /groups/invite-code/{instanceName}`, free)
- `Revoke Invite` — Revoke and rotate the group invite code. (`POST /groups/revoke-invite/{instanceName}`, free)
- `Find By Invite` — Look up group metadata from an invite code. (`GET /groups/find-by-invite/{instanceName}`, free)
- `Accept Invite` — Join a group via its invite code. (`GET /groups/accept-invite/{instanceName}`, free)
- `Send Invite` — Send a group invite link to numbers (as a message). (`POST /groups/send-invite/{instanceName}`, free)
- `Leave Group` — Leave a group. (`DELETE /groups/leave/{instanceName}`, free)
- `Toggle Ephemeral` — Enable/disable disappearing messages. expiration = seconds (0 to disable). (`POST /groups/toggle-ephemeral/{instanceName}`, free)
- `Update Setting` — Toggle announcement / lock state. (`POST /groups/update-setting/{instanceName}`, free)
- `Mark Read` — Mark one or more messages as read. (`POST /chats/mark-read/{instanceName}`, free)
- `Mark Unread` — Mark a chat as unread. (`POST /chats/mark-unread/{instanceName}`, free)
- `Archive Chat` — Archive or unarchive a chat. (`POST /chats/archive/{instanceName}`, free)
- `Send Presence` — Broadcast a presence update (typing, online, etc.). (`POST /chats/presence/{instanceName}`, free)
- `Delete for Everyone` — Delete a message for everyone in the chat. (`DELETE /chats/delete-for-everyone/{instanceName}`, free)
- `Update Message` — Edit the text of a message you sent. (`POST /chats/update-message/{instanceName}`, free)
- `Find Chats` — List all open chats. (`POST /chats/find-chats/{instanceName}`, free)
- `Find Contacts` — Search contacts with optional filter. (`POST /chats/find-contacts/{instanceName}`, free)
- `Find Messages` — Search messages with optional filter. (`POST /chats/find-messages/{instanceName}`, free)
- `Find Status` — Search status updates. (`POST /chats/find-status/{instanceName}`, free)
- `Is WhatsApp` — Check which numbers are registered on WhatsApp. (`POST /chats/is-whatsapp/{instanceName}`, free)
- `Get Base64` — Retrieve media as base64 (for re-uploading or forwarding). (`POST /chats/base64/{instanceName}`, free)
- `Profile Pic URL` — Get the profile picture URL for a number. (`GET /chats/profile-pic-url/{instanceName}`, free)
- `Fetch Profile` — Fetch a contact's full profile by phone number. (`POST /profile/fetch/{instanceName}`, free)
- `Fetch Privacy` — Fetch the instance owner's privacy settings. (`GET /profile/fetch-privacy/{instanceName}`, free)
- `Update Name` — Update the display name shown to contacts. (`POST /profile/update-name/{instanceName}`, free)
- `Update Status` — Update your WhatsApp status (bio text). (`POST /profile/update-status/{instanceName}`, free)
- `Update Picture` — Set your profile picture from an image URL. (`POST /profile/update-picture/{instanceName}`, free)
- `Remove Picture` — Remove your profile picture. (`DELETE /profile/remove-picture/{instanceName}`, free)
- `Find Settings` — Fetch the current instance settings. (`GET /settings/find/{instanceName}`, free)
- `Set Settings` — Update instance settings (call rejection, online status, history sync, etc.). (`POST /settings/set/{instanceName}`, free)
- `Connection State` — Get the current connection state and phone number. (`GET /instance/connection-state/{instanceName}`, free)
- `Connect / QR` — Generate a new QR code and start the WhatsApp session. Use /instance/connection-state to poll until connected. (`GET /instance/connect/{instanceName}`, free)
- `Restart` — Restart the WhatsApp session. Requires {"confirm":true} in the body or X-Confirm-Restart: true header — 428 otherwise. (`POST /instance/restart/{instanceName}`, free)
- `Logout` — Disconnect and log out of the WhatsApp session. (`DELETE /instance/logout/{instanceName}`, free)
- `Set Presence` — Broadcast your presence (available or unavailable). (`POST /instance/set-presence/{instanceName}`, free)
- `Fetch QR` — Fetch the current QR code without triggering a new connection. Returns 204 if no QR is pending. (`GET /instance/qr/{instanceName}`, free)
