# FIDScript CLI

Headless command-line interface for the FIDScript platform.

## Commands

```
fidscript <command>

Auth
  login          Interactive login (email + magic code)
  logout         Clear stored credentials
  whoami         Print current auth context
  refresh        Refresh access token

Account
  tier           Show current plan tier
  tokens         Token balance and history

Instance
  instance list   List workspace instances
  instance create Create a new WhatsApp instance
  instance qr     Print QR code for linking
  instance connect/live/reboot/restart/watch/logout/delete

Chatbot
  chatbot list    List workspace chatbots
  chatbot create  Create a new chatbot
  chatbot get     Get chatbot config
  chatbot status  Show deployment status
  chatbot publish Publish/update a chatbot
  chatbot setup   Guided chatbot configuration wizard
  chatbot ai-config   Configure AI brain
  chatbot tools   Manage chatbot tools
  chatbot delete  Delete a chatbot

LLM
  llm list       List LLM connections
  llm create     Create an LLM connection
  llm get/update/delete/test

Messages
  message send text/location/contact/poll/reaction
  message file   Send media file

Data Source
  data-source list/create/delete

Webhooks
  webhook list/create/delete

Platform (workspace-scoped)
  customers      List/create/get customers
  conversations List/get conversations
  analytics     Query analytics
```

## Auth Flow

1. `fidscript login` → email → magic 6-digit code (Resend email) → stores JWT in `~/.fidscript/credentials`
2. Token refresh is automatic on 401
3. Workspace resolved from token claims

## Config File

CLI reads `fidscript.config.ts` in project root when running `fidscript new` scaffold commands.

## Key Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | Commander root — registers all command families |
| `src/main.ts` | Entry point |
| `src/commands/index.ts` | Registers all command modules |
| `src/lib/api-client.ts` | REST client with retry + HMAC auth |
| `src/lib/api-client-core.ts` | Base fetch wrapper |
| `src/lib/credentials.ts` | File-based credential storage (`~/.fidscript/`) |
| `src/lib/render.ts` | Terminal output helpers |

## API Base URL

Configured via `FIDScript_API_URL` env var (default: `http://localhost:3099`).
