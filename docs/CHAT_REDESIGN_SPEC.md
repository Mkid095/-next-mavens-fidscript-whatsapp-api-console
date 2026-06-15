# Chat Interface Redesign Spec — Phase 2

> Status: **DRAFT for review** (2026-06-15). Phase 1 (backend correctness) is done & deployed (`74eb0fe`). This document drives the Phase 2 UI rebuild.
>
> Goal: a WhatsApp-grade chat experience with FIDScript branding, consuming the endpoints already built under `/api/v1` (API-key) and `/api/client/*` (JWT), with a clean seam for future AI/chatbot auto-reply.

---

## 1. Vision & non-goals

**Build:** a three-pane WhatsApp-Web-style inbox — conversation list / chat / contact-info drawer — that unifies DMs and groups, renders every message type we can send/receive, pushes everything in real time, and lets the user start bulk campaigns and manage contacts without leaving the flow.

**Non-goals (Phase 2):**
- The AI/chatbot responder itself — only the inbound pipeline **hook** is wired; the responder plugs in later.
- Voice/video calls, status/stories composer UI (status *send* exists; a stories viewer is out of scope).
- Replacing the admin console or the Docs/Sandbox/API-keys pages.
- WebSocket migration — we keep SSE (fixed in Phase 1).

**Invariants (carry forward from Phase 1):**
- Conversation identity = canonical `chatId` = `normalizePhone(phone)` for DMs, the `…@g.us` JID for groups. **Every** grouping, filter, and lookup keys off `msg.chat_id`.
- API shape `{ success, data?, error? }`; no `any`; files ≤ 150 lines; one component per file.
- Frontend never references "Evolution" anywhere user-visible.

---

## 2. Data model

### Message row (extends current `inbox_messages`)
Phase 1 added `chat_id`, `is_group`, `extra`, `raw_payload`, `direction`. Phase 2 adds status tracking:

| Column | Purpose | New? |
|---|---|---|
| `chat_id` | canonical thread key | Phase 1 |
| `is_group` | 1 = group thread | Phase 1 |
| `direction` | incoming / outgoing | exists |
| `status` | `sent` / `delivered` / `read` / `failed` (outgoing only) | **NEW** |
| `reply_to_id` | quoted message id (reply/quote UI) | **NEW** |
| `reactions` | JSON `{ emoji: [fromJid,…] }` | **NEW** |

### ClientMessage type (frontend)
```ts
interface ClientMessage {
  id: string;
  chat_id: string;          // canonical thread key
  from_number: string;      // canonical phone (DM) or sender phone (group)
  from_name: string;
  message_type: string;     // text|image|video|document|audio|sticker|location|contact|reaction|poll|list|buttons
  content: string;
  media_url: string | null;
  media_mimetype?: string;
  is_read: number;
  status?: 'sent'|'delivered'|'read'|'failed';
  reactions?: Record<string, string[]>;
  reply_to_id?: string;
  timestamp: string;
  direction: 'incoming'|'outgoing';
  instance_name: string;
  is_group?: number;
  extra?: Record<string, unknown>;  // parsed payload per type
}
```

---

## 3. Backend additions required for the full UX

The endpoints exist, but **the real-time events for receipts/typing/presence are not yet wired** (Phase 1 webhook only handles `messages.upsert` + `connection.update`). These are prerequisites for blue ticks and "typing…".

### 3.1 New webhook event handlers (`routes/webhook.ts`)
Enable in Evolution via `webhook.by_event` config, then handle:
- **`messages.receipt`** — update `inbox_messages.status` (delivered/read) for the referenced message id; broadcast a `receipt` SSE event.
- **`presence.update`** — broadcast a `presence` SSE event (typing/stopped, `composing`/`paused`).
- **(optional)** `messages.edit`, `messages.delete` — sync edit/delete into our store.

### 3.2 New SSE channels (`routes/sse.ts` + `utils/evolution.ts`)
Add emitters + wire events (mirrors the existing `newMessage`/`stateChange` pattern):
- `receipt` → `{ chatId, messageId, status }`
- `presence` → `{ chatId, presence: 'composing'|'paused', participant? }`

The `useInstanceSSE` hook (Phase 1) gains two more `addEventListener` branches dispatching `sse-receipt` / `sse-presence` onto `window`.

### 3.3 Profile picture cache
`GET /api/v1/chats/profile-pic-url/:instance?number=…` exists. Add a tiny server cache (`profile_pics` table or in-memory Map w/ TTL) so the conversation list doesn't hammer Evolution for 50 avatars on load.

### 3.4 Group metadata
On first group message, lazily fetch `GET /api/v1/groups/find/:instance?groupJid=…` to store the real group **subject** + participant count (current UI falls back to the JID). Cache in a `groups_cache` table.

### 3.5 Receipt-status write-back on send
`saveSentMessage` (Phase 1) stores outgoing with `status='sent'`; receipt events flip it to delivered/read. (Already implied by 3.1.)

---

## 4. Endpoint → feature map

Everything below is **already built**. The right column is the UI behavior to implement.

### Sending (in the composer) — `/api/v1/messages/{type}/:instance`
| Feature | Endpoint | UI element |
|---|---|---|
| Text | `POST /messages/text` | main textarea + Enter-to-send |
| Photo / Video / Doc | `POST /messages/media` | `+` attachment sheet → upload to Cloudinary → preview → send |
| Location | `POST /messages/location` | attachment sheet → Google Maps picker |
| Contact card | `POST /messages/contact` | attachment sheet → pick from saved contacts |
| Poll | `POST /messages/poll` | attachment sheet → poll builder |
| List | `POST /messages/list` | attachment sheet → list builder |
| Voice note | `POST /messages/audio` | hold-to-record mic button (PTT) |
| Sticker | `POST /messages/sticker` | emoji/sticker picker |
| Reaction | `POST /messages/reaction` | long-press bubble → emoji row |
| Reply / quote | (uses `text`/`media` with reply key) | swipe-right or context → quote preview above composer |

### Chat actions — `/api/v1/chats/*`
| Feature | Endpoint | UI element |
|---|---|---|
| Mark read | `POST /chats/mark-read` | on open conversation |
| Mark unread | `POST /chats/mark-unread` | context menu on conversation |
| Archive | `POST /chats/archive` | context menu → archived filter |
| Block | `POST /chats/block` | contact-info drawer → "Block" |
| Typing indicator | `POST /chats/presence` (send) | emit when user types |
| Delete for everyone | `POST /chats/delete-for-everyone` | long-press bubble → "Unsend" |
| Edit message | `POST /chats/update-message` | long-press own bubble → "Edit" |
| Profile photo | `GET /chats/profile-pic-url` | avatar in list + drawer + group |
| "Last seen" / online | `GET /chats/find-status` | contact-info drawer header |
| Is-WhatsApp check | `GET /chats/is-whatsapp` | new-chat: validate number before send |

### Group actions — `/api/v1/groups/*`
| Feature | Endpoint | UI element |
|---|---|---|
| Group subject/members | `GET /groups/find` + `GET /groups/find-members` | group-info drawer |
| Create group | `POST /groups/create` | "New group" from chat list header |
| Add/remove/promote/demote | `POST /groups/update-participant` | group-info drawer → members list |
| Invite link | `GET /groups/invite-code` / `POST /revoke-invite` | group-info drawer → invite link box |
| Leave | `POST /groups/leave` | group-info drawer → "Leave group" |

### Profile / settings — `/api/v1/profile/*`, `/api/v1/settings/*`
| Feature | Endpoint | UI element |
|---|---|---|
| Your display name | `POST /profile/update-name` | Settings |
| Your about/status text | `POST /profile/update-status` | Settings |
| Your photo | `POST /profile/update-picture` | Settings |
| Privacy (last seen, etc.) | `GET/POST /profile/{fetch,update}-privacy` | Settings → Privacy |

### Client portal (JWT) — already built
- `GET/POST /api/contacts`, `DELETE /api/contacts/:id` — contacts CRUD
- `GET /api/client/messages` — inbox (now returns `chat_id`, `status`, etc.)
- Campaigns: `GET/POST /api/campaigns`, `POST /api/campaigns/:id/send`, duplicate, delete
- Contact groups: `/api/groups` (client contact-groups, distinct from WhatsApp groups)

---

## 5. UI architecture

### 5.1 Three-pane layout (desktop ≥ 1024px)
```
┌──────────────┬───────────────────────────────┬──────────────┐
│ Conversation │  Chat panel                    │ Contact info │
│ list (340px) │  header / messages / composer  │ drawer (320) │
│              │                                │ (slide-in)   │
│ - search     │  - avatar + name + presence    │ - avatar     │
│ - new chat ▾ │  - call/info icons             │ - phone      │
│ - filter     │  - bubbles (grouped by date)   │ - tags       │
│   (all/unread│  - reply quote, reactions      │ - media grid │
│    /archived │  - typing indicator            │ - block/mute │
│    /groups)  │  - composer (+/emoji/mic/send) │              │
└──────────────┴───────────────────────────────┴──────────────┘
```

### 5.2 Responsive behavior
- **≥1024px:** all three panes; info drawer toggles.
- **640–1023px:** list + chat; tapping header slides the info drawer over.
- **<640px:** one pane at a time — list → chat → info — with back buttons (current BottomNav stays for top-level nav).

### 5.3 Conversation list tabs
`All | Unread | Groups | Archived` — filters over the same canonical-chatId-keyed map. Group rows show a 👥 avatar + participant count; DM rows show the contact's photo (or initial fallback).

---

## 6. Component tree (≤150 lines each)

Consolidate today's sprawl (`MessagesView` + `ChatPanel` + `ChatList` + ~10 siblings) into a feature folder. Proposed:

```
src/components/client/chat/
├── ChatView.tsx              # thin shell: owns selection + realtime listeners (~120)
├── chatStore.ts              # useReducer-based store: messages, convos, presence (no prop drilling)
├── realtime/
│   └── useChatRealtime.ts    # subscribes to sse-new-message/receipt/presence → dispatch
├── conversationList/
│   ├── ConversationList.tsx
│   ├── ConversationRow.tsx
│   ├── ConversationFilters.tsx
│   └── NewChatMenu.tsx       # new DM / new group / new campaign entry
├── chatPanel/
│   ├── ChatPanel.tsx
│   ├── ChatHeader.tsx        # avatar, name, presence/typing, back, info
│   ├── MessageStream.tsx     # date separators + grouping
│   ├── MessageBubble.tsx     # renders all 11 message types
│   ├── MessageReactions.tsx
│   ├── ReplyPreview.tsx
│   ├── TypingIndicator.tsx
│   └── Composer.tsx          # text + attachment sheet + mic + emoji + reply quote
├── attachments/
│   ├── AttachmentSheet.tsx   # media/location/contact/poll/list/sticker launchers
│   ├── MediaUploader.tsx
│   ├── LocationPicker.tsx
│   ├── PollBuilder.tsx
│   └── ListBuilder.tsx
├── infoDrawer/
│   ├── ContactInfoDrawer.tsx # DM: phone, tags, media grid, block/mute, save-contact
│   └── GroupInfoDrawer.tsx   # subject, participants, invite link, leave
├── contacts/
│   ├── SaveContactInline.tsx # "Not saved → Save" affordance for auto-provisioned numbers
│   └── ContactAvatar.tsx     # photo w/ initials fallback + cache
└── types.ts                  # Conversation, ChatMessage, Presence local interfaces
```

`MessagesView.tsx` becomes a one-line redirect to `<ChatView />` (keeps the route stable), then is removed once routes point at `ChatView` directly.

**State:** lift into `chatStore` (a `useReducer` + Context) so the list, panel, and drawer share messages/conversations/presence without 3-level prop drilling (matches CLAUDE.md state rules).

---

## 7. Real-time event flow

```
Evolution → webhook.ts → store write → instanceEmitter.emit
   → SSE (/api/sse/instance/:name) → useInstanceSSE (ClientDashboard, always-on)
   → window events: sse-new-message | sse-receipt | sse-presence | sse-state-change | sse-token-update
   → useChatRealtime → chatStore.dispatch → all panes re-render
```

Outbound is **optimistic**: composer dispatches a `status:'sent'` message immediately, then the real send call; `sse-receipt` later flips `status` to delivered/read (blue ticks).

---

## 8. Chatbot seam (inbound pipeline)

A single hook so an AI/rule responder can be added without touching the UI.

```
server/src/services/automation/inboundPipeline.ts
  runInboundPipeline({ client, instance, message }) → { handled: boolean, reply?: SendArgs }
    1. [future] load client's automation config (rules / AI agent)
    2. [future] evaluate → produce optional auto-reply
    3. if reply: call the shared send service (same path as a human send) → saves outgoing
```

Wired from `webhook.ts` right after the incoming message INSERT + SSE broadcast:
```ts
const auto = await runInboundPipeline({ client, instance, message: parsed });
if (auto.handled && auto.reply) { /* send via services/whatsapp/messaging */ }
```

Phase 2 ships the **empty pipeline + a "auto-reply off" default + a DB table `automation_rules`** (keyword → canned response) and a Settings toggle, but no AI. Flipping AI on later = one new evaluator inside `runInboundPipeline`. The UI and message store are already designed around it (auto-replies are just normal outgoing rows).

---

## 9. Campaigns redesign

Replace `CampaignsView` with a campaign **composer** that reuses the same send services and contact groups:

- **Audience:** pick from saved contacts, a contact-group, or paste numbers → validated via `/chats/is-whatsapp` (optional).
- **Message:** text + optional media (reuse `attachments/MediaUploader`); support `{{name}}` template variables resolved per-recipient.
- **Schedule:** send now or pick datetime (existing `scheduled_at`).
- **Live progress:** per-recipient status from `campaign_recipients` (pending→sent→delivered→failed) streamed as it runs; tokens deducted per successful send (same `chargeAndEmit` path).
- **Reuse:** the send loop calls `services/whatsapp/messaging.sendText/sendMedia` — the *same* code as 1:1 chat — so campaigns and chat never drift.

---

## 10. Contacts redesign

- **List view:** search, tag chips, bulk-select → add to group / start campaign / delete.
- **Auto-provisioned** contacts (Phase 1 webhook) show an "auto" tag and an inline **Save / edit name** affordance.
- **Profile photos** fetched + cached (3.3).
- **Import:** CSV paste + the country-code picker already in `NewChatPanelInline`.
- **Dedup** on import using `normalizePhone` (currently missing — manual import can create dupes).

---

## 11. Branding & theming

- WhatsApp layout & interaction language; **FIDScript palette** only — forest-deep (`#1f2410`-ish), yellow accent, stone neutrals. No green chat bubbles; outgoing bubbles use a deep forest tint, incoming use white/stone.
- Bubble tails, grouping, date pills, blue double-tick — all WhatsApp-familiar.
- Zero "WhatsApp"/"Evolution" strings in the UI (Phase 1 already scrubbed most; verify during build).
- Empty/loading/error states all branded (no generic spinners).

---

## 12. Phase 2 slicing (build + deploy + verify per slice)

Each slice: `npm run build` (both) → commit → push → `bash deploy.sh` → verify on prod.

1. **Slice A — Foundations:** `chatStore` + `useChatRealtime`; refactor current `MessagesView` onto the new store (no visual change yet, but real-time now drives everything). *Verify: messages still load + push real-time.*
2. **Slice B — Conversation list v2:** new `ConversationList` with All/Unread/Groups/Archived filters, group rows, avatar component + photo cache (3.3). *Verify: groups distinct, photos appear.*
3. **Slice C — Bubbles & composer v2:** new `MessageBubble` rendering all 11 types, date grouping, reply-quote, `Composer` with attachment sheet + mic + emoji. *Verify: every send type renders; reply quotes.*
4. **Slice D — Receipts, typing, presence:** backend 3.1/3.2 (webhook receipt/presence + SSE), blue ticks, "typing…", online/last-seen. *Verify: blue ticks appear after read; typing shows live.*
5. **Slice E — Info drawers + context actions:** contact/group drawers, block/archive/mark-unread, delete-for-everyone, edit, reactions row. *Verify: each action hits its endpoint and updates UI.*
6. **Slice F — Campaigns v2:** composer + live progress reusing send services. *Verify: a 3-recipient campaign sends + tracks.*
7. **Slice G — Chatbot seam:** `inboundPipeline` (empty) + `automation_rules` table + Settings toggle + keyword auto-reply. *Verify: keyword → canned reply fires end-to-end.*

---

## 13. Verification checklist (per slice, on prod — Kennedy / swaysuite)

- Real-time push works with no manual refresh (Phase 1 invariant holds).
- Send + reply land in the **same thread** (canonical chatId).
- New numbers auto-save as contacts.
- Token balance only changes on successful sends.
- No `any` types; `npm run build` (frontend) + `cd server && npm run build` clean.
- `grep -ri "evolution\|whatsapp" src/components/client/chat/` → only "WhatsApp" in user-facing brand copy where intended, never "Evolution".

---

*This spec is the single source of truth for Phase 2. Update it as decisions land; each slice references the section it implements.*
