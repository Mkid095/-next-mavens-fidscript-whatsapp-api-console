# @fidscript/cli

FIDScript WhatsApp CLI - manage instances, send messages, and more from your terminal.

## Install

```bash
curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh
```

Or manually:

```bash
npm install -g @fidscript/cli
```

## Get Started

```bash
# Option A - magic-code sign-in (recommended)
fidscript login --email you@example.com
# → check email for code, paste it back

# Option B - API key only
export FIDSCRIPT_API_KEY=fidscript_live_xxx
fidscript whoami
```

## Commands

```
fidscript login [--email <email>]     # Magic-code sign-in (stores JWT)
fidscript logout                       # Clear stored credentials
fidscript whoami                       # Authenticated account info
fidscript tokens                       # Token balance + usage

# Instances (DB-backed list requires `fidscript login`)
fidscript instance list                # List instances from server DB
fidscript instance create <name>       # Register a new instance (JWT)
fidscript instance qr <name>           # Generate QR code (PNG → /tmp/)
fidscript instance watch <name>        # Live state via SSE (JWT)
fidscript instance connect <name>      # Reconnect + fresh QR
fidscript instance restart <name> --confirm
fidscript instance logout <name>
fidscript instance delete <name> --confirm

# Chatbots (requires `fidscript login`)
fidscript chatbot list                 # List workspace chatbots
fidscript chatbot create <name> --instance <name>
fidscript chatbot setup                # Interactive wizard (LLM-friendly)
fidscript chatbot get <id>
fidscript chatbot status <id>          # Health check
fidscript chatbot publish <id> --watch # Publish + live SSE progress
fidscript chatbot delete <id> --confirm

# Messaging
fidscript send text <instance> --to +254700000000 --text "Hello"
```

## Global Flags

```
--api-key <key>   API key (or FIDSCRIPT_API_KEY env var)
--base-url <url>  API base URL (default: https://whatsapp.fidscript.com)
--json             JSON output (for scripting)
--yaml             YAML output
--no-color         Disable ANSI colors
--verbose           Echo HTTP requests/responses
-v, --version      Show CLI version
```

## Documentation

Full docs: [docs/CLI.md](../../docs/CLI.md)
OpenAPI spec: `GET /api/v1/openapi.json`
