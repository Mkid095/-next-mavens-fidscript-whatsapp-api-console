# FIDScript CLI — comprehensive guide

> The `fidscript` command-line interface is the fastest way to integrate with the FIDScript WhatsApp Business API from any shell, script, or AI agent. It wraps every public endpoint in a small, predictable surface and is designed to be driven by tools as much as by humans.

This guide walks you from "I just installed it" to "I have a chatbot running on a cron schedule." It is structured so you can read it linearly the first time, then jump back to specific sections as needed.

---

## Table of contents

1. [What this is](#1-what-this-is)
2. [Install](#2-install)
3. [First-time setup](#3-first-time-setup)
4. [Mental model: API key vs JWT](#4-mental-model-api-key-vs-jwt)
5. [Auth scenarios](#5-auth-scenarios)
6. [Sending messages — all 10 types](#6-sending-messages--all-10-types)
7. [Managing WhatsApp instances](#7-managing-whatsapp-instances)
8. [Real-time events (SSE)](#8-real-time-events-sse)
9. [Chatbots — full lifecycle](#9-chatbots--full-lifecycle)
10. [Bring Your Own LLM](#10-bring-your-own-llm)
11. [Sandbox vs production](#11-sandbox-vs-production)
12. [OpenAPI & direct HTTP from any language](#12-openapi--direct-http-from-any-language)
13. [Headless & AI agent use](#13-headless--ai-agent-use)
14. [Real-world scenarios](#14-real-world-scenarios)
15. [CI integration](#15-ci-integration)
16. [Exit codes](#16-exit-codes)
17. [Environment variables](#17-environment-variables)
18. [Troubleshooting](#18-troubleshooting)
19. [Glossary](#19-glossary)

---

## 1. What this is

The `fidscript` CLI is a thin, well-typed wrapper around two API surfaces:

- **Public integrator API** at `/api/v1/*` — used by external services. Authenticated with an `X-API-Key` header. Plan-based rate limits. This is what you call from your app, your CRM, your ecommerce backend.
- **Client portal API** at `/api/instance/*`, `/api/platform/*`, `/api/sse/*` — used by the workspace owner (you, in the dashboard). Authenticated with a short-lived JWT issued via magic-code email sign-in. This is what you call when you want to *configure* a workspace — create instances, build chatbots, manage LLM connections, watch live state.

The CLI exposes both, with one ergonomic twist: it auto-picks the right auth based on the path you call. `/api/v1/*` gets `X-API-Key`, everything else gets `Bearer JWT`. You can override with `--auth apikey|jwt`.

**Mental model**: the CLI is a Swiss Army knife. The `whoami`/`tokens`/`login`/`setup`/`init` commands are your admin tools. The `send` and `instance` commands are your day-to-day tools. The `chatbot` and `llm` commands are your build tools. The `api` command is your escape hatch — it reaches any endpoint we haven't wrapped as a first-class command.

There is also a published npm SDK at `@fidscript/sdk` for Node.js / TypeScript. The two share the same backend; the SDK is for programs, the CLI is for shells and agents. Pick the right tool for the job — or use both.

---

## 2. Install

### One-liner (macOS / Linux)

```bash
curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh
```

The installer auto-installs Node.js 18+ if you don't have it, then runs `npm install -g @fidscript/cli`. After it finishes, `fidscript --version` should print something like `1.0.0`.

### Manual install

```bash
# Requires Node 18+
npm install -g @fidscript/cli
```

### Verify

```bash
fidscript --version
fidscript --help
```

If `fidscript` isn't on your PATH after install, add `$(npm config get prefix)/bin` to your shell config.

### Update later

```bash
npm update -g @fidscript/cli
```

---

## 3. First-time setup

The fastest path from zero to "I sent my first WhatsApp message." Run these in order.

```bash
# 1. Sign in — you'll get a 6-digit code by email
fidscript login --email you@example.com

# 2. Confirm auth + see your API key (masked; --reveal shows full)
fidscript setup

# 3. List or create a WhatsApp instance
fidscript instance list
#   if empty:
fidscript instance create my-bot

# 4. Connect WhatsApp — scan the QR with your phone
fidscript instance qr my-bot
#   QR is saved as PNG to /tmp/fidscript-qr-<timestamp>.png; open it

# 5. Send a message
fidscript send text my-bot --to +254700000000 --text "Hello from the CLI!"
```

That's it. The whole thing takes about 60 seconds. If you want to drive this from a script (no TTY), see [Section 5](#5-auth-scenarios) — every prompt has a `--code` / `--email` flag for non-interactive use.

---

## 4. Mental model: API key vs JWT

You have two credentials:

### `FIDSCRIPT_API_KEY` (X-API-Key)
- Format: `fidscript_live_xxx...`
- Lifetime: until you revoke it
- Scopes: your whole workspace
- Used by: `/api/v1/*` endpoints (the public integrator API)
- Generation: dashboard → Settings → API Keys, or `fidscript setup --reveal`

### JWT (Bearer token)
- Format: `eyJhbGc...` (a JSON Web Token)
- Lifetime: 24 hours, then you need to log in again
- Storage: `~/.fidscript/credentials` after `fidscript login`
- Used by: `/api/instance/*`, `/api/platform/*`, `/api/sse/*`
- Generation: `fidscript login --email you@example.com --code 123456`

**When to use which:**
- You're sending messages from your app → API key
- You're configuring a workspace (creating instances, building chatbots, managing LLMs) → JWT
- You're watching live state / SSE → JWT (passed as `?token=` query param)

The CLI auto-picks based on the URL, so you usually don't have to think about it.

---

## 5. Auth scenarios

### A. Local scripting (you, at your terminal)

```bash
fidscript login --email you@example.com
# enter the 6-digit code from your inbox
# now ~/.fidscript/credentials has both your API key AND a JWT
```

### B. CI / cron (no TTY)

```bash
# Step 1: request a code
fidscript --json login --email bot@example.com
# exit 1, JSON: {"error":{"code":"CODE_REQUIRED","message":"..."}}

# (someone reads the email, sends the code to the agent)

# Step 2: submit the code
fidscript --json login --email bot@example.com --code 123456
# exit 0, JWT + API key stored
```

### C. AI agent loop (fully headless)

```bash
# Idempotent — does nothing if already logged in
if ! fidscript --json --quiet whoami > /dev/null 2>&1; then
  echo "Run: fidscript login --email you@example.com" >&2
  exit 1
fi

# Now safe to call anything
fidscript --json instance list
fidscript --json chatbot list
```

### D. Multiple workspaces

`~/.fidscript/credentials` is one slot. For multi-workspace work, use environment variables:

```bash
# Switch workspaces by overriding env vars
FIDSCRIPT_API_KEY=fidscript_live_workspace_a_... fidscript --json whoami
FIDSCRIPT_API_KEY=fidscript_live_workspace_b_... fidscript --json whoami
```

Or pass `--api-key <key>` per command. There is currently one JWT slot — for multiple logged-in workspaces, run a separate shell per JWT.

### E. Checking what's stored

```bash
cat ~/.fidscript/credentials
# Should show:
#   [default]
#   api_key = fidscript_live_xxx...
#   jwt = eyJhbGc...
#   base_url = https://whatsapp.fidscript.com
```

Or use `fidscript setup --reveal` for a human-readable summary.

### F. Logging out

```bash
fidscript logout
# Wipes ~/.fidscript/credentials, unsets FIDSCRIPT_API_KEY and FIDSCRIPT_JWT
```

---

## 6. Sending messages — all 10 types

The CLI exposes `fidscript send <type>` (and the alias `fidscript message <type>`). All send commands take `--to <E.164-number>` as required.

### Text

```bash
fidscript send text my-bot --to +254700000000 --text "Hello!"
```

### Media (image, video, document, audio)

```bash
fidscript send media my-bot \
  --to +254700000000 \
  --media-url https://example.com/photo.jpg \
  --media-type image \
  --caption "Look at this"
```

For documents, set `--media-type document`. WhatsApp will show a download button.

### Location

```bash
fidscript send location my-bot \
  --to +254700000000 \
  --lat -1.2921 --lng 36.8219 \
  --name "Nairobi CBD" \
  --address "Kenya"
```

### Contact card

```bash
fidscript send contact my-bot --to +254700000000 --contacts @./contact.json
```

`contact.json`:
```json
[{
  "fullName": "Jane Doe",
  "wuid": "254712345678",
  "phoneNumber": "+254712345678",
  "organization": "Acme Corp"
}]
```

### Reaction (emoji on an existing message)

```bash
fidscript send reaction my-bot \
  --to +254700000000 \
  --message-key '{"remoteJid":"254712345678@s.whatsapp.net","fromMe":false,"id":"ABC123"}' \
  --reaction "👍"
```

The `message-key` comes from a previous `send text` response. Empty `--reaction ""` removes a reaction.

### Poll

```bash
fidscript send poll my-bot \
  --to +254700000000 \
  --name "Where shall we meet?" \
  --selectable-count 1 \
  --options '["Cafe Java","The Office","Zoom"]'
```

### Interactive list

```bash
fidscript send list my-bot \
  --to +254700000000 \
  --title "Our Menu" \
  --button-text "View Menu" \
  --sections @./sections.json
```

`sections.json`:
```json
[{
  "title": "Drinks",
  "rows": [
    {"title": "Espresso", "description": "Single shot", "rowId": "espresso"},
    {"title": "Cappuccino", "rowId": "cappuccino"}
  ]
}]
```

### Audio (voice note / PTT)

```bash
fidscript send audio my-bot \
  --to +254700000000 \
  --audio https://example.com/voice.ogg
```

For best results, host `.ogg`/opus-encoded audio. WhatsApp will play it as a PTT.

### Sticker

```bash
fidscript send sticker my-bot \
  --to +254700000000 \
  --sticker https://example.com/sticker.webp
```

Stickers must be `.webp` and 512×512.

### Status / Story

```bash
fidscript send status my-bot \
  --type text \
  --content "On vacation this week 🌴" \
  --all-contacts
```

For an image status: `--type image --content <image-url>`. For audio: `--type audio --content <audio-url>`.

### Cost

Every send costs 1–2 tokens depending on type (media and audio are 2, the rest are 1). Your token balance is shown in `fidscript tokens`.

---

## 7. Managing WhatsApp instances

An "instance" is one phone number linked to your workspace. You can have many.

### Lifecycle

```bash
# Create (registers with Evolution API + persists in our DB)
fidscript instance create my-bot

# Generate QR — open the PNG, scan with WhatsApp > Linked Devices
fidscript instance qr my-bot

# Force a fresh QR (if the old one expired)
fidscript instance connect my-bot

# Restart the WhatsApp session
fidscript instance restart my-bot --confirm

# Log out of WhatsApp (keeps the instance row)
fidscript instance logout my-bot

# Delete the instance entirely
fidscript instance delete my-bot --confirm
```

### Watching live state

`fidscript instance watch my-bot` opens a long-lived SSE stream and prints state changes + new inbound messages in real time. It exits when the instance reaches `open`/`connected` (or any terminal state), or after `--timeout N` seconds, or on Ctrl+C.

```bash
# Wait up to 60s for the instance to reach "open"
fidscript instance watch my-bot --timeout 60
# exit 0 if connected, exit 2 if timeout fired
```

This is useful in shell loops — wait for the WhatsApp session to be ready before sending messages.

### Listing

```bash
# DB-backed list (requires JWT)
fidscript --json instance list

# Single instance state
fidscript --json instance state my-bot
```

---

## 8. Real-time events (SSE)

The CLI streams Server-Sent Events for three use cases:

| Stream | URL | Use |
|---|---|---|
| Instance state + new messages | `GET /api/sse/instance/:name?token=<jwt>` | Watch a single WhatsApp instance |
| Publish-job progress | `GET /api/sse/publish-jobs/:jobId?token=<jwt>` | Stream chatbot publish pipeline updates |

The CLI wraps both:

```bash
# Instance — prints state changes + new inbound messages, exits when terminal
fidscript instance watch my-bot

# Publish — prints a progress bar, exits when status = completed/failed/cancelled
fidscript chatbot publish bot_xyz --watch
```

**Underlying SSE wire format** (for non-CLI consumers):

```
event: stateChange
data: {"name":"my-bot","state":"open","phoneNumber":"+254..."}

event: newMessage
data: {"name":"my-bot","from_number":"+254...","from_name":"Jane","content":"Hi!"}

event: presence
data: {"name":"my-bot","chatId":"...","presence":"composing","fromName":"Jane"}
```

You can hit the raw endpoint with `curl -N "..." ` from any SSE-compatible client. The CLI itself is a convenient wrapper.

---

## 9. Chatbots — full lifecycle

A chatbot has:
- An instance it's attached to (its "phone")
- AI config (model, system prompt, hallucination policy, generation params)
- A trigger (what makes it respond: keyword, regex, mention, always)
- Policies (confidence threshold + fallback reply)
- Optional handoff rules (route to a human team under conditions)
- A publish pipeline that compiles and activates the chatbot

### Quickstart (interactive wizard)

```bash
fidscript chatbot setup --instance my-bot
# Walks you through 8 prompts: name → instance → prompt → provider →
# trigger → threshold → handoff → confirm → publish
```

### Headless (full config in one shot)

```bash
fidscript chatbot setup --config @./support-bot.json --publish
```

`support-bot.json`:
```json
{
  "name": "support-bot",
  "instance": "my-bot",
  "system_prompt": "You are a polite, concise support agent.",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "llm_connection": "llmc_abc123",
  "hallucination_policy": "strict",
  "max_tokens": 400,
  "temperature": 0.3,
  "max_history_messages": 20,
  "trigger": { "type": "keyword", "value": "help" },
  "policies": {
    "confidence_threshold": 0.7,
    "fallback_reply": "Let me connect you with a human colleague."
  },
  "handoff": "auto",
  "publish": true
}
```

### CRUD

```bash
fidscript chatbot list
fidscript chatbot get <id>
fidscript chatbot status <id>           # health: provider, model, counts, last test
fidscript chatbot ai-config <id> --show-current
fidscript chatbot ai-config <id> \
  --model gpt-4o-mini \
  --system-prompt "..." \
  --hallucination-policy strict \
  --llm-connection llmc_abc
fidscript chatbot delete <id> --confirm
```

### Publishing

`publish` runs a multi-step pipeline (validate → build prompt → register triggers → activate). It's async — the call returns immediately with a `jobId`, then you watch progress:

```bash
# Kick off + watch in one command (prints progress bar)
fidscript chatbot publish bot_xyz --watch --timeout 120

# Or kick off, then watch separately
JOB=$(fidscript --json chatbot publish bot_xyz | jq -r .data.jobId)
# ... later, in another shell:
fidscript --json api GET /api/sse/publish-jobs/$JOB
```

Exit codes from `--watch`: 0 if completed, 2 if timeout fired, 1 on error.

### Response shape (after a successful send from the bot)

Every bot reply is a WhatsApp message — the underlying call uses the same `/api/v1/messages/*` endpoints. The bot picks the message type based on context (text by default, image when the LLM returns an image URL, etc.).

---

## 10. Bring Your Own LLM

FIDScript can use any OpenAI-compatible LLM endpoint. Your API key is encrypted at rest.

### See what's available

```bash
fidscript --json llm providers
# Shows: openai, anthropic, gemini, openrouter, azure, custom, ...
```

### Create a connection

```bash
# OpenAI
fidscript llm create openai-prod \
  --provider openai \
  --model gpt-4o-mini \
  --api-key "$OPENAI_API_KEY" \
  --default

# Anthropic
fidscript llm create claude-prod \
  --provider anthropic \
  --model claude-3-5-sonnet-latest \
  --api-key "$ANTHROPIC_API_KEY"

# Self-hosted Ollama
fidscript llm create ollama-llama3 \
  --provider custom \
  --model llama3.1 \
  --endpoint http://localhost:11434 \
  --default

# OpenRouter (free tier models)
fidscript llm create or-free \
  --provider openai \
  --model "meta-llama/llama-3.1-8b-instruct:free" \
  --endpoint https://openrouter.ai/api/v1 \
  --api-key "$OPENROUTER_API_KEY"

# From a key file (avoid leaking in shell history)
fidscript llm create secure \
  --provider openai \
  --model gpt-4o-mini \
  --api-key @./key.txt
```

### Test

```bash
fidscript llm test llmc_abc
# → "Connection verified successfully" or an error message
```

### Manage

```bash
fidscript llm list
fidscript llm get llmc_abc              # masked key
fidscript llm update llmc_abc --model gpt-4o-mini --default
fidscript llm update llmc_abc --api-key "$ROTATED_KEY"   # rotate without recreating
fidscript llm delete llmc_abc --confirm
```

### Failover chains

Set `priority` (higher = preferred). If your primary provider fails or rate-limits, the next-highest takes over.

```bash
fidscript llm create openai-primary --provider openai --model gpt-4o-mini --priority 100 --default
fidscript llm create openai-backup   --provider openai --model "openai/gpt-4o-mini" --endpoint https://openrouter.ai/api/v1 --priority 50
fidscript llm create ollama-last    --provider custom --model llama3.1 --endpoint http://localhost:11434 --priority 10
```

### Wire a connection into a chatbot

```bash
fidscript chatbot ai-config <chatbot-id> --llm-connection llmc_abc
# Or at creation time, via chatbot setup --config
```

---

## 11. Sandbox vs production

The in-app "API Sandbox" at `/client/sandbox` is a click-and-try interface for every endpoint. It now includes:
- 10 message types
- All group operations
- All chat operations
- Profile, settings, instance
- **Chatbot operations** — list, create, get, set-ai-config, publish
- **LLM operations** — list, create, get, update, test

Use it to prototype without writing code. Once you have a working request, copy the curl from the response panel and use it in your service.

The CLI's `fidscript api call` is the shell equivalent of the sandbox:

```bash
# Equivalent of a sandbox request
fidscript api POST /api/v1/messages/media/my-bot \
  -d '{"number":"+254700000000","media_url":"https://x/y.jpg","media_type":"image"}'
```

---

## 12. OpenAPI & direct HTTP from any language

The public API is fully described by an OpenAPI 3.1 spec, regenerated from the source-of-truth registry on every build.

```bash
# Pull the live spec
fidscript openapi > schema.json

# Generate a typed client for any language
npx @openapitools/openapi-generator-cli generate \
  -i schema.json -g kotlin -o ./fidscript-kotlin
npx @openapitools/openapi-generator-cli generate \
  -i schema.json -g swift5 -o ./fidscript-swift
npx @openapitools/openapi-generator-cli generate \
  -i schema.json -g rust -o ./fidscript-rust

# Node (typescript-fetch)
npx openapi-typescript schema.json -o ./fidscript-types.ts

# Python
pip install openapi-python-client
openapi-python-client generate --path schema.json
```

For languages that don't need a full SDK (PHP, Ruby, shell scripts), just hit the API directly with your language's HTTP client. See [Section 14](#14-real-world-scenarios) for examples.

The official Node.js SDK lives at [@fidscript/sdk](https://www.npmjs.com/package/@fidscript/sdk) — full type hints, retry logic, and a clean DX.

---

## 13. Headless & AI agent use

The CLI is built for autonomous agents. Three principles:

1. **stdout is data, stderr is chatter.** In `--json` / `--yaml` mode, the data stream on stdout is always parseable. Information messages go to stderr (suppressed with `--quiet`).
2. **Exit codes are reliable.** 0 = success, non-zero = failure (1 = generic, 2 = SSE timeout without terminal status).
3. **Errors carry stable codes.** Every error has a `code` field: `UNAUTHORIZED`, `RATE_LIMITED`, `NOT_FOUND`, `NOT_SIGNED_IN`, `MISSING_CONFIRM`, `INVALID_JSON`, etc.

### Conventions at a glance

| Concern | Convention |
|---|---|
| Data output | stdout |
| Errors (default) | stderr, red human text |
| Errors (`--json`/`--yaml`) | stdout, JSON envelope `{success:false, error:{code, message, status_code?}}` |
| Exit code | 0 success, 1 generic, 2 SSE timeout |
| Prompts | Errors with stable codes (`NON_INTERACTIVE`, `CODE_REQUIRED`, ...) |
| Destructive ops | `--confirm` required; auto-set in `--json`/`--yaml` mode |

### Global flags for headless use

| Flag | Purpose |
|---|---|
| `--json` | JSON output; errors become structured envelopes on stdout |
| `--yaml` | Same as `--json` but YAML |
| `--quiet` | Suppress informational stderr |
| `--no-color` | Disable ANSI colors |
| `--verbose` | Echo every HTTP request/response to stderr (great for debugging) |

### Auth flow without a TTY

The CLI splits magic-code login into two steps so an agent can drive it:

```bash
# Step 1 — request a code (server emails it; no TTY required)
fidscript --json --quiet login --email user@example.com
# exit 1, JSON: { error: { code: "CODE_REQUIRED", message: "..." } }
# The user reads the code from their inbox.

# Step 2 — submit the code (no TTY required)
fidscript --json --quiet login --email user@example.com --code 123456
# exit 0, JWT + API key stored in ~/.fidscript/credentials

# Verify
fidscript --json whoami
```

The server returns a generic "If an account exists, a code was sent" message on step 1, so this is safe to script without leaking whether the email is registered.

### Auto-confirm destructive commands

`instance delete`, `instance restart`, `chatbot delete` — all require `--confirm`. **In `--json` or `--yaml` mode, `--confirm` is auto-set.** So:

```bash
# In a default-mode terminal — needs --confirm:
fidscript instance delete my-bot --confirm

# In an agent script with --json — auto-confirms:
fidscript --json instance delete my-bot
```

### Recommended agent loop

```bash
# 1. Ensure authenticated (idempotent — does nothing if already logged in)
if ! fidscript --json --quiet whoami > /dev/null 2>&1; then
  echo "Run: fidscript login --email you@example.com" >&2
  exit 1
fi

# 2. Drive the API (all responses are JSON envelopes)
fidscript --json instance list
fidscript --json chatbot list
fidscript --json chatbot setup --config @./my-bot.json

# 3. Pipe-friendly error check
result=$(fidscript --json send text my-bot --to +254700000000 --text "Hi" 2>/dev/null)
if echo "$result" | jq -e .success > /dev/null; then
  echo "Sent: $(echo "$result" | jq -r .data.key.id)"
else
  echo "Send failed: $(echo "$result" | jq -r .error.code)" >&2
  exit 1
fi
```

### Live SSE with a finite window

For agent loops, use `--timeout` on the two stream commands:

```bash
# Wait up to 30s for the instance to reach a stable state
fidscript instance watch my-bot --timeout 30
# exit 0 if a terminal state was reached
# exit 2 if timeout fired before that

# Same for publish
fidscript chatbot publish <id> --watch --timeout 120
```

---

## 14. Real-world scenarios

### Scenario 1 — Spin up a new chatbot from scratch

```bash
# 1. Sign in once (or reuse existing credentials)
fidscript login --email ops@example.com

# 2. Make sure you have an instance ready
fidscript instance list
fidscript instance create support-bot --display "Support Bot"

# 3. Bring your own LLM key
fidscript llm create prod-openai --provider openai --model gpt-4o-mini \
  --api-key "$OPENAI_API_KEY" --default

# 4. Define the chatbot via JSON config
cat > /tmp/bot.json <<'EOF'
{
  "name": "support-bot",
  "instance": "support-bot",
  "system_prompt": "You are a polite, concise support agent for Acme. Never promise refunds — escalate to a human.",
  "llm_connection": "$(fidscript --json llm list | jq -r '.data[] | select(.is_default==1) | .id')",
  "hallucination_policy": "strict",
  "temperature": 0.2,
  "max_history_messages": 30,
  "trigger": { "type": "always" },
  "policies": {
    "confidence_threshold": 0.7,
    "fallback_reply": "Let me connect you with a human colleague."
  },
  "handoff": "auto",
  "publish": true
}
EOF

# 5. Create + publish in one go
fidscript chatbot setup --config /tmp/bot.json
```

### Scenario 2 — Campaign: send a batch of templated messages

```bash
# Build a CSV of phone numbers (one per line)
cat > /tmp/phones.csv <<'EOF'
+254700000001
+254700000002
+254700000003
EOF

# Send to each (with rate limiting — the server-side clientRateLimit will queue if you exceed)
while IFS= read -r phone; do
  fidscript --json send text my-bot \
    --to "$phone" \
    --text "Hi! This is a broadcast from Acme — reply STOP to unsubscribe." || break
  sleep 6   # stay under the 10 MPS WhatsApp ceiling
done < /tmp/phones.csv
```

For larger campaigns, use the bulk campaigns API directly:

```bash
# Create a campaign + recipients via /api/campaigns
fidscript api POST /api/campaigns \
  -d '{"name":"july-newsletter","instance":"my-bot","message_template":{"text":"..."}}' --auth apikey
# ... add recipients via /api/campaigns/:id/recipients
```

### Scenario 3 — Inbound-to-CRM pipeline

Watch for new messages, push them to your CRM:

```bash
#!/bin/bash
# watch-and-pipe.sh — run forever, forward new messages to webhook
fidscript instance watch my-bot --timeout 0 \
  | while IFS= read -r line; do
      if [[ "$line" == *'"event":"newMessage"'* ]]; then
        curl -X POST "$CRM_WEBHOOK_URL" -H "Content-Type: application/json" -d "$line"
      fi
    done
```

(For real production, use the proper webhook integration: configure your `webhook_url` in instance settings to point at your service. The CLI is good for ad-hoc testing; webhooks are good for production.)

### Scenario 4 — Rotating LLM API keys without downtime

```bash
# Add the new key (without --default)
fidscript llm create openai-rotated --provider openai --model gpt-4o-mini \
  --api-key "$NEW_OPENAI_API_KEY" --priority 150

# Test it
fidscript llm test $(fidscript --json llm list | jq -r '.data[] | select(.provider_name=="OpenAI") | .id' | head -1)

# Mark the new one as default (and clear default on the old one in the same call)
fidscript llm update $(fidscript --json llm list | jq -r '.data[] | select(.provider_name=="OpenAI") | .id' | head -1) --default

# Verify the chatbot picks it up (it does — it reads llm_connection_id at request time)
fidscript --json chatbot status <chatbot-id>

# Once you're confident, delete the old connection
fidscript --json llm delete <old-connection-id>
```

### Scenario 5 — Cross-workspace dashboard view

```bash
# Print a one-line summary of every workspace (uses different API keys)
for ws in personal work client-a client-b; do
  echo "=== $ws ==="
  FIDSCRIPT_API_KEY=fidscript_live_${ws}_... fidscript --json whoami | \
    jq -r '"  name=\(.name)  balance=\(.token_balance)  plan=\(.plan.name // "Free")"'
done
```

### Scenario 6 — Debug a failing chatbot

```bash
# 1. Check overall health
fidscript chatbot status <id>
# → if status != "healthy", see provider/model

# 2. Inspect full config
fidscript chatbot get <id> | jq '.aiConfig[0]'

# 3. Test the trigger manually
fidscript api POST /api/platform/chatbots/<id>/test-trigger \
  -d '{"message":"help me","contact_id":"<contact>"}' --auth jwt

# 4. Recent runtime traces
fidscript api GET /api/platform/chatbots/<id>/traces?limit=5 --auth jwt
```

---

## 15. CI integration

### GitHub Actions: nightly health check

```yaml
# .github/workflows/fidscript-health.yml
name: Nightly FIDScript health check
on:
  schedule: [{ cron: '0 6 * * *' }]
  workflow_dispatch:

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install CLI
        run: npm install -g @fidscript/cli
      - name: Sign in
        env:
          FIDSCRIPT_EMAIL: ${{ secrets.FIDSCRIPT_EMAIL }}
          FIDSCRIPT_CODE: ${{ secrets.FIDSCRIPT_NIGHTLY_CODE }}
        run: |
          # Pre-shared rotating code (rotate daily)
          fidscript --json --quiet login --email "$FIDSCRIPT_EMAIL" --code "$FIDSCRIPT_CODE"
      - name: Check tokens
        run: |
          balance=$(fidscript --json --quiet tokens | jq -r .data.token_balance)
          if [ "$balance" -lt 1000 ]; then
            echo "::warning::Token balance low: $balance"
            exit 1
          fi
      - name: Check instance state
        run: |
          fidscript --json instance list | jq -e '.data[] | select(.status=="connected")'
```

### Cron: refresh token-forecast daily

```cron
0 9 * * * /usr/local/bin/fidscript --json --quiet chatbot token-forecast <id> | curl -X POST -H "Content-Type: application/json" -d @- https://ops.example.com/api/usage-snapshot
```

### Pre-deploy smoke test

```bash
#!/bin/bash
set -e
echo ":: Verifying FIDScript auth + instance + a send ::"
fidscript --json whoami > /dev/null
fidscript --json instance list | jq -e '.data | length > 0'
fidscript --json send text smoke-test --to +254700000000 --text "Pre-deploy smoke test" > /dev/null
echo ":: All smoke checks passed ::"
```

---

## 16. Exit codes

| Code | Meaning | When |
|---|---|---|
| 0 | Success | Command completed |
| 1 | Generic error | Any failure (auth, network, validation, server error) |
| 2 | SSE timeout without terminal state | `--timeout` fired before `open`/`close` on `instance watch` or `chatbot publish --watch` |

Non-zero is always a failure. In a script, you can rely on `set -e` or check `$?`.

---

## 17. Environment variables

| Var | Purpose | Default |
|---|---|---|
| `FIDSCRIPT_API_KEY` | X-API-Key for `/api/v1/*` | (read from `~/.fidscript/credentials` if set) |
| `FIDSCRIPT_JWT` | Bearer JWT for `/api/*` and `/api/sse/*` | (read from `~/.fidscript/credentials` if set) |
| `FIDSCRIPT_BASE_URL` | Override the API base URL | `https://whatsapp.fidscript.com` |
| `FIDSCRIPT_VERBOSE` | Set to `1` to echo every HTTP request/response to stderr | unset (off) |
| `NO_COLOR` | Auto-respected: disables ANSI colors | unset |
| `PATH` | Must include `$(npm config get prefix)/bin` for `fidscript` to be found | system default |

Precedence: CLI flag > env var > `~/.fidscript/credentials` > default.

---

## 18. Troubleshooting

### `login` keeps failing with `INVALID_CODE`

Codes are 4–8 digits, expire after 10 minutes, and can be used at most 5 times. Request a fresh one:

```bash
fidscript login --email you@example.com
# Then enter the new code immediately.
```

If you're running headless:

```bash
# Step 1 — get a code sent
fidscript --json login --email you@example.com
# (wait for email)
# Step 2 — submit immediately
fidscript --json login --email you@example.com --code <code>
```

### `fidscript instance list` returns `NOT_SIGNED_IN`

You need a JWT, not just an API key. The API key unlocks `/api/v1/*` (sends, queries); JWT unlocks `/api/instance/*` and `/api/platform/*` (workspace management).

```bash
fidscript login --email you@example.com
# or, headless:
fidscript --json login --email you@example.com
fidscript --json login --email you@example.com --code 123456
```

### `RATE_LIMITED` from the server

You're hitting your plan's per-minute limit. Either:
- Wait and retry (the server returned a `Retry-After` header — `fidscript --verbose` shows it)
- Upgrade your plan (`fidscript tokens` shows your current tier)
- Bulk-send via the campaigns API, which has a higher limit (30 MPS) and queues cleanly

### Sandbox request fails with `INVALID_JSON`

For complex nested bodies (contacts, sections, message-key), pass `@file.json` instead of inline JSON:

```bash
# Inline — error-prone with quotes:
fidscript --json send contact my-bot --to ... --contacts '[{"fullName":"Jane","phoneNumber":"+254"}]'

# File — much cleaner:
fidscript --json send contact my-bot --to ... --contacts @./contacts.json
```

### `MODULE_NOT_FOUND` after running install

The npm global bin directory isn't on your PATH. Fix once:

```bash
# macOS — add to ~/.zshrc:
export PATH="$(npm config get prefix)/bin:$PATH"

# Linux — add to ~/.bashrc:
export PATH="$(npm config get prefix)/bin:$PATH"
```

Then `hash -r` (or open a new shell) and `fidscript --version`.

### Command hangs forever

You probably hit a SSE stream that's waiting for a terminal state. Either:
- Ctrl+C to exit
- Add `--timeout N` next time

```bash
fidscript instance watch my-bot --timeout 30
```

### `JWT_SECRET mismatch` or `INVALID_TOKEN`

Your stored JWT has expired (24h TTL) or the server was restarted with a new secret.

```bash
fidscript logout
fidscript login --email you@example.com
```

In CI, log in at the start of each run; the JWT will outlive the run.

### Sending succeeds but recipient doesn't receive

Common causes, in order of likelihood:

1. **Recipient hasn't messaged you first** (WhatsApp restriction for utility templates — they need to opt-in)
2. **Recipient has you blocked** (check via `fidscript api POST /api/v1/chats/is-whatsapp/<instance> -d '{"number":"+..."}'`)
3. **Wrong instance name** — confirm via `fidscript instance list`
4. **WhatsApp is throttling your account** — wait 24h, reduce send rate

### `Cannot find module 'tslib'` or similar runtime error

Your Node.js is too old. The CLI requires Node 18+.

```bash
node --version
# If <18, upgrade via nvm or your system package manager
```

---

## 19. Glossary

- **API key** — long-lived secret (X-API-Key header) for `/api/v1/*`. Format: `fidscript_live_xxx`.
- **Chatbot** — an AI agent that responds to inbound WhatsApp messages based on triggers + policies + an LLM.
- **CLI** — the `fidscript` command-line interface (this tool).
- **Connection state** — `connecting` / `open` / `close` / `disconnected`. Watch via `instance watch`.
- **Conversation** — an ongoing exchange between a user and your chatbot. Stored server-side; we include the last N messages as context.
- **E.164** — the international phone format: `+[country code][number]`. Always use this in `--to`.
- **Endpoint** — a single API URL+method combo (e.g. `POST /api/v1/messages/text/:instance`).
- **Evolution API** — the open-source WhatsApp gateway we run. All instance/send operations proxy through it.
- **Hallucination policy** — how strict the chatbot is about uncertain answers. `strict` = refuse on low confidence. `balanced` (default) = hedge. `creative` = improvise. `disabled` = pass through.
- **Handoff** — when a chatbot routes a conversation to a human team.
- **Instance** — one WhatsApp phone number, linked to your workspace.
- **JWT** — short-lived token (Bearer header) for `/api/*` and `/api/sse/*`. 24h TTL.
- **LLM** — large language model. FIDScript supports any OpenAI-compatible endpoint.
- **MPS** — messages per second. WhatsApp's hard ceiling is ~80 MPS; we pace to 10–30.
- **PTT** — push-to-talk. WhatsApp voice notes are PTT-style audio, requires `.ogg`/opus.
- **Sandbox** — the in-app click-and-try interface for every endpoint, at `/client/sandbox`.
- **SSE** — server-sent events. Long-lived HTTP stream for live updates.
- **Tier** — your WhatsApp Business quality rating (0 = new, 4 = unlimited). Determines daily unique-customer volume.
- **Trigger** — the rule that decides when a chatbot responds. `always` / `keyword` / `regex` / `mention`.
- **Workspace** — your FIDScript account. One API key, one JWT, many instances and chatbots.

---

## 20. Semver + changelog discipline

Every change visible to a user lands in `src/data/changelog.json` and bumps the version. The discipline:

| Bump type | When | CLI flag |
|---|---|---|
| **PATCH** (`v0.4.0 → v0.4.1`) | Bug fixes, small UI tweaks, perf improvements, dark-mode fixes, copy edits | `BUMP_TYPE=patch bash scripts/update-changelog.sh` |
| **MINOR** (`v0.4.x → v0.5.0`) | New features, new endpoints, new CLI subcommands, new guides — anything that doesn't break the API contract | `BUMP_TYPE=minor bash scripts/update-changelog.sh` |
| **MAJOR** (`v0.x.y → v1.0.0`) | Breaking API changes, auth-model changes, schema redesigns | `BUMP_TYPE=major bash scripts/update-changelog.sh` |

If a commit changes user-facing files (`src/`, `server/`, `apps/`, `sdks/`) without bumping the changelog, **`bash scripts/check-version-bump.sh` exits 1** and `bash deploy.sh` aborts.

### Auto-bump workflow

```bash
# Made some user-facing changes? Bump first, then commit:
BUMP_TYPE=minor  bash scripts/update-changelog.sh
# Opens the new entry in your $EDITOR with HIGHLIGHTS/FIXES/TAGS env vars
# already pre-filled from your commit message.

# Then:
git add src/data/changelog.json
git commit -m "feat: your feature here"
git push origin main
bash deploy.sh
```

### For AI agents

Every time you (an AI agent) make a change the user can see, you **must** append to `src/data/changelog.json` before committing. Run:

```bash
# after editing code, before git commit:
bash scripts/check-version-bump.sh HEAD
```

If it exits non-zero, your commit would be rejected by CI. Run `BUMP_TYPE=... bash scripts/update-changelog.sh` first.

---

*This document lives at `docs/CLI.md` in the repo. If you spot something wrong, edit and PR — it's the single source of truth for the CLI's behavior.*