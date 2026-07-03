# FIDScript CLI

Manage your WhatsApp instances, send messages, and monitor usage — all from the terminal.

## Install

```bash
curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh
```

Requires Node.js 18+. The installer will bootstrap Node if missing on macOS/Linux.

Or manually:

```bash
npm install -g @fidscript/cli
```

## Quick Start

```bash
# Option A — Sign in (recommended, unlocks DB-backed list + SSE)
fidscript login --email you@example.com
#  → check your email for the 6-digit code, paste it back
#  → credentials stored in ~/.fidscript/credentials

# Option B — API key only (works for /api/v1/ endpoints)
export FIDSCRIPT_API_KEY=fidscript_live_your_key_here

# Verify authentication
fidscript whoami

# Create an instance (JWT auth)
fidscript instance create my-bot

# Generate QR code (scan with WhatsApp)
fidscript instance qr my-bot

# Watch live state via SSE
fidscript instance watch my-bot

# Create a chatbot (interactive wizard)
fidscript chatbot setup --instance my-bot
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--api-key <key>` | API key (or set `FIDSCRIPT_API_KEY` env var) |
| `--base-url <url>` | API base URL (default: `https://whatsapp.fidscript.com`) |
| `--json` | Output as JSON (for scripting / LLM pipelines) |
| `--yaml` | Output as YAML |
| `--no-color` | Disable ANSI colors |
| `--verbose` | Echo HTTP requests/responses |
| `-v, --version` | Show CLI version |

## Commands

### `fidscript whoami`

Show authenticated account info.

```bash
fidscript whoami
fidscript --json whoami
```

Output: name, email, phone, plan, token balance, API key prefix, instance count.

---

### `fidscript tokens`

Show token balance and usage stats.

```bash
fidscript tokens
```

Output: current token balance, sends today, sends this month, API requests today.

---

### `fidscript instance`

Manage WhatsApp instances.

#### `fidscript instance create <name>`

Register a new instance locally (no server call).

```bash
fidscript instance create my-bot
fidscript instance create notification-bot --number +254700000000
```

#### `fidscript instance list`

List all locally-registered instances and their live connection status.

```bash
fidscript instance list
```

Queries `/api/v1/instance/connection-state/:instance` for each registered instance.

#### `fidscript instance qr <name>`

Generate a QR code for linking an instance. Saves as PNG to `/tmp/` and prints the path.

```bash
fidscript instance qr my-bot
fidscript instance qr notification-bot --number +254700000000
```

QR expires in 60 seconds. Scan with WhatsApp > Linked Devices > Link a Device.

#### `fidscript instance connect <name>`

Full reconnect flow — logs out any existing WhatsApp session, then generates a fresh QR.

```bash
fidscript instance connect my-bot
```

#### `fidscript instance restart <name> --confirm`

Restart the WhatsApp session (requires `--confirm`).

```bash
fidscript instance restart my-bot --confirm
```

#### `fidscript instance logout <name>`

Disconnect the WhatsApp session (does not delete the instance).

```bash
fidscript instance logout my-bot
```

#### `fidscript instance delete <name> --confirm`

Remove instance from local registry. Permanent deletion requires the web dashboard.

```bash
fidscript instance delete my-bot --confirm
```

---

### `fidscript send text <instance>`

Send a plain text message.

```bash
fidscript send text my-bot --to +254700000000 --text "Hello!"
# or
fidscript message text my-bot --to +254700000000 --text "Hello!"
```

| Option | Required | Description |
|--------|----------|-------------|
| `--to` | Yes | Recipient phone number (E.164 format, e.g. `+254700000000`) |
| `--text` | Yes | Message body |

---

### `fidscript login` / `fidscript logout`

Magic-code sign-in (stores both API key + JWT in `~/.fidscript/credentials`).

```bash
fidscript login --email you@example.com
# → check email for 6-digit code, paste it back

fidscript logout    # clears stored credentials
```

After `login`, JWT-protected commands work: `instance list` (DB-backed), `chatbot list/create/setup/publish`, `instance watch` (SSE).

---

### `fidscript chatbot`

Full chatbot lifecycle (requires `fidscript login`).

#### `fidscript chatbot list`

List all chatbots in your workspace with status, instance, trigger count.

#### `fidscript chatbot create <name>`

Create a chatbot non-interactively.

```bash
fidscript chatbot create support-bot \
  --instance my-bot \
  --description "24/7 customer support" \
  --prompt "You are a helpful support agent. Always be polite."
```

#### `fidscript chatbot get <id>`

Print the full chatbot config (AI config, triggers, rules, policies, handoff rules).

#### `fidscript chatbot status <id>`

Health check — provider, model, knowledge count, tools, triggers, last test.

#### `fidscript chatbot delete <id> --confirm`

Delete a chatbot.

#### `fidscript chatbot publish <id> [--watch] [--draft <json-or-@file>]`

Run the publish pipeline. With `--watch`, streams live progress via SSE.

```bash
fidscript chatbot publish bot_123 --watch
#   [████░░░░░░░░░░░░░░░░]  20%  running  validating  Checking schema…
#   [██████████████░░░░░░]  70%  running  building  Compiling prompt…
#   [████████████████████] 100%  completed  live  Ready to serve
```

#### `fidscript chatbot setup [--instance <name>] [--name <name>]`

Interactive wizard — guides the user through:

1. Chatbot name
2. Pick an instance (from `fidscript instance list`)
3. Multi-line system prompt
4. AI provider (gemini/openai/anthropic/mistral)
5. Trigger type (always / keyword / regex / mention) + value
6. Confidence threshold + fallback reply
7. Handoff mode (auto / always / manual)
8. Confirm + create + configure (AI config, triggers, policies)

Use this when guiding an LLM agent to set up a chatbot end-to-end:

```
"Use fidscript chatbot setup --instance my-bot to walk me through chatbot creation."
```

---

## Authentication

The CLI supports two auth modes:

### API key (for `/api/v1/*` public integrator API)

Get your key from the [FIDScript dashboard](https://whatsapp.fidscript.com/client/api-keys).

Provide it (in priority order):

1. `--api-key` flag: `fidscript --api-key fidscript_live_xxx whoami`
2. `FIDSCRIPT_API_KEY` env var: `export FIDSCRIPT_API_KEY=fidscript_live_xxx`
3. `~/.fidscript/credentials` file (written automatically by `fidscript login`)

### Magic-code sign-in (for `/api/instance/*`, `/api/platform/*`, `/api/sse/*`)

```bash
fidscript login --email you@example.com
# → check your email for the 6-digit code, paste it back
```

This stores both your **API key** AND a **JWT Bearer token** in `~/.fidscript/credentials`. The JWT unlocks DB-backed instance listing, chatbot CRUD, and live SSE streaming.

### `fidscript logout`

Clears both the API key and JWT.

---

## Output Modes

Every command supports three output formats:

**Human (default):** colored, formatted for terminal
```bash
fidscript instance list
#   Name    Status
#   ──────  ───────
#   my-bot  connected
```

**JSON** (for scripting/LLM pipelines):
```bash
fidscript --json instance list
# {"success":true,"data":[{"name":"my-bot","status":"connected"}]}
```

**YAML** (for config files / LLM consumption):
```bash
fidscript --yaml tokens
```

---

## Headless & Agent Use

The CLI is designed to be driven by AI agents (Claude Code, custom scripts, cron jobs, CI pipelines). Every command works without a TTY when the right flags are supplied.

### Conventions

| Concern | Convention |
|---|---|
| Data output | stdout |
| Errors | stderr (default) OR structured JSON envelope on stdout (when `--json` or `--yaml` is set) |
| Exit code | 0 on success, 1 on any error, 2 on SSE timeout without terminal status |
| Required prompts | Errors with stable codes (`NON_INTERACTIVE`, `CODE_REQUIRED`, `MISSING_CONFIRM`, etc.) so agents can pattern-match |
| Auto-confirm | Destructive commands (`instance delete`, `instance restart`, `chatbot delete`) auto-confirm in `--json` / `--yaml` mode — no `--confirm` flag needed |

### Global flags for headless use

| Flag | Purpose |
|---|---|
| `--json` | Structured JSON output. Errors become `{success: false, error: {code, message, status_code?}}` |
| `--yaml` | Same as `--json` but YAML format |
| `--quiet` | Suppresses informational stderr (success messages, "next steps", "Generating QR…"). Errors still exit non-zero. |
| `--no-color` | Disable ANSI colors (already automatic when piped to a file) |
| `--verbose` | Echo every HTTP request/response to stderr — useful for debugging agent loops |

### Auth flow without a TTY

The CLI splits the magic-code login into two steps so an agent can drive it:

```bash
# Step 1 — request a code (server emails it; no TTY required)
fidscript --json --quiet login --email user@example.com
# exit 1, JSON envelope: { error: { code: "CODE_REQUIRED", message: "..." } }
# The user reads the code from their inbox.

# Step 2 — submit the code (no TTY required)
fidscript --json --quiet login --email user@example.com --code 123456
# exit 0, JWT + API key stored in ~/.fidscript/credentials

# Verify
fidscript --json whoami
```

The server returns a generic "If an account exists, a code was sent" message on the first step, so this is safe to script without leaking whether the email is registered.

### Headless chatbot creation

Skip the interactive wizard by passing a JSON config:

```bash
# Inline
fidscript --json chatbot setup --config '{
  "name": "support-bot",
  "instance": "my-bot",
  "system_prompt": "You are a polite support agent.",
  "provider": "gemini",
  "trigger": { "type": "keyword", "value": "help" },
  "policies": { "confidence_threshold": 0.6, "fallback_reply": "Let me connect you with a human." },
  "handoff": "auto",
  "publish": true
}'

# Or from a file
fidscript --json chatbot setup --config @./my-bot.json --publish
```

The config object accepts:
- `name` (required) — chatbot display name
- `instance` (required) — instance name (must already exist in your workspace)
- `system_prompt` or `prompt` — the system instruction
- `provider` — AI provider (gemini / openai / anthropic / mistral)
- `trigger` — `{ type: "always" | "keyword" | "regex" | "mention", value?: string }`
- `policies` — `{ confidence_threshold?: 0..1, fallback_reply?: string }`
- `handoff` — `"auto" | "always" | "manual"`
- `publish` — if true, also calls the publish pipeline at the end

### Live SSE with a finite window

`fidscript instance watch <name> --watch` (and `fidscript chatbot publish <id> --watch`) stream events until the instance reaches a terminal state OR you interrupt. For agent loops, use `--timeout`:

```bash
# Wait up to 30s for the instance to reach a stable state
fidscript instance watch my-bot --timeout 30
# exit 0 if a terminal state was reached
# exit 2 if timeout fired before that (e.g. still "connecting" after 30s)
```

### Pipe-friendly error handling

Errors in `--json` mode print to stdout so `fidscript ... | jq` works:

```bash
# Always succeeds, prints either {success:true, data:...} or {success:false, error:...}
result=$(fidscript --json whoami 2>/dev/null)
if echo "$result" | jq -e .success > /dev/null; then
  echo "$result" | jq .data
else
  echo "Auth failed: $(echo "$result" | jq -r .error.code)" >&2
  exit 1
fi
```

The process exit code is also a reliable signal — non-zero means the request failed.

### Recommended agent loop

```bash
# 1. Ensure authenticated (idempotent — does nothing if already logged in)
if ! fidscript --json whoami > /dev/null 2>&1; then
  echo "Run: fidscript login --email you@example.com" >&2
  exit 1
fi

# 2. Drive the API
fidscript --json instance list
fidscript --json chatbot list
fidscript --json chatbot setup --config @./my-bot.json
```

---

## Rate Limits

| Endpoint category | Limit |
|------------------|-------|
| Messaging sends | Plan-based (e.g. 10/min on Free, 60/min on Growth) |
| Instance lifecycle (QR, connect, restart) | 30/min |
| Chat/Group reads | 600/min |
| Profile/settings updates | 30/min |

---

## LLM Integration

The CLI is designed for use by LLM agents. Tips:

- Use `--json` for deterministic parsing
- Every error response includes a machine-readable `code` field (e.g. `UNAUTHORIZED`, `RATE_LIMITED`, `NOT_FOUND`)
- Use `--verbose` to see exact HTTP requests being made — copy as `curl` equivalents
- All endpoints documented in `API.md` with curl examples for every operation

## All Endpoints Reference

```
Public integrator API (/api/v1) — Auth: X-API-Key: fidscript_live_xxx

GET  /api/v1/whoami                          — validate API key
GET  /api/v1/usage                           — token balance + usage
GET  /api/v1/instance/connection-state/:name — connection status
GET  /api/v1/instance/qr/:name               — QR code (base64 PNG)
GET  /api/v1/instance/connect/:name          — connect + fresh QR
POST /api/v1/instance/restart/:name          — restart (body: {confirm:true})
DELETE /api/v1/instance/logout/:name         — logout WhatsApp
POST /api/v1/messages/text/:instance         — send text (body: {number, text})
GET  /api/v1/providers                       — available AI providers
GET  /api/v1/providers/:type/models          — models per provider

Client portal API (/api/*) — Auth: Bearer <jwt>  (fidscript login)

GET  /api/auth/client/me                       — current client profile
GET  /api/instance/client-instances             — list instances from DB
POST /api/instance/client-create               — create new instance
DELETE /api/instance/delete/:name               — delete instance
GET  /api/platform/chatbots                     — list chatbots
POST /api/platform/chatbots                     — create chatbot
GET  /api/platform/chatbots/:id                 — get chatbot config
DELETE /api/platform/chatbots/:id               — delete chatbot
GET  /api/platform/chatbots/:id/health          — chatbot health
POST /api/platform/chatbots/:id/ai-config       — set AI config
POST /api/platform/chatbots/:id/triggers        — add trigger
POST /api/platform/chatbots/:id/policies        — set policies
POST /api/platform/chatbots/:id/publish         — publish (returns jobId)

SSE (Server-Sent Events) — Auth: ?token=<jwt>

GET  /api/sse/instance/:name           — live state + new messages
GET  /api/sse/client                    — token updates
GET  /api/sse/dashboard                 — dashboard stats
GET  /api/sse/publish-jobs/:jobId       — publish pipeline progress
```

Full v1 endpoint documentation: `https://whatsapp.fidscript.com/api/v1/openapi.json`
