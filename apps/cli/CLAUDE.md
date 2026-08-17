# apps/cli - FIDScript CLI

## Purpose

Developer-facing command-line tool for managing instances, chatbots, and sending messages. Authenticate via magic code, then call the API for all operations. Zero business logic - purely an API client with TTY output.

---

## Command Tree

```
fidscript login                       # Magic code auth → JWT stored in ~/.fidscript/credentials
fidscript logout                      # Clear credentials

fidscript whoami                      # Show authenticated account

fidscript instance list               # List workspace instances
fidscript instance create --phone N   # Create + connect instance
fidscript instance status <name>      # Connection state
fidscript instance qr <name>           # Show QR code
fidscript instance restart <name>     # Restart instance

fidscript chatbot list                # List chatbots
fidscript chatbot create <name>       # Create chatbot
fidscript chatbot setup <name>        # Interactive setup wizard
fidscript chatbot publish <name>      # Publish draft chatbot
fidscript chatbot status <name>       # Publish status

fidscript message send --to <phone> <text>   # Send text message
fidscript message send --to <phone> --media <url> <caption>  # Send media

fidscript llm list                   # List LLM providers
fidscript llm providers              # Show available providers
fidscript llm test --provider <name> --prompt <text>  # Test LLM

fidscript tool list                  # List available tools
fidscript tool generate <name>       # Generate new tool from spec

fidscript tokens                     # Show token balance
fidscript tier                       # Show plan tier and limits

fidscript openapi                    # Download OpenAPI spec JSON
fidscript refresh                   # Refresh JWT token
```

---

## Key Files

```
src/
├── cli.ts                   # Commander root - global flags, help, version
├── main.ts                  # Entry point - calls cli.parse()
├── version.ts               # Version constant
├── lib/
│   ├── api-client.ts        # HTTP client - auth headers, retries, output modes (316 lines)
│   ├── credentials.ts       # ~/.fidscript/credentials INI read/write
│   ├── errors.ts            # FidscriptError class
│   └── render.ts            # JSON/YAML/table output helpers
└── commands/
    ├── login.ts             # Magic code auth (request + verify)
    ├── logout.ts
    ├── whoami.ts
    ├── setup.ts             # Onboarding summary (431 lines - needs split)
    ├── init.ts              # First-run orchestrator
    ├── refresh.ts           # JWT refresh
    ├── openapi.ts           # OpenAPI spec export
    ├── tier.ts              # Plan tier info
    ├── api.ts               # Generic API escape hatch
    ├── instance/            # instance list, create, status, qr, restart, watch, connect, delete
    ├── chatbot/             # chatbot list, create, setup, status, publish, ai-config, tools, delete
    │   ├── setup.ts        # Interactive wizard (431 lines - needs split)
    │   └── steps/          # Wizard sub-steps (extract from setup.ts)
    ├── messages/
    │   └── send.ts          # Send message commands
    ├── tool/                # tool list, generate, exec
    ├── data-source/         # data-source list, create, delete
    └── llm/                 # llm list, providers, test, create, update, delete

package.json
tsconfig.json
```

---

## Auth Flow

```
fidscript login
  → POST /api/auth/request-code  (sends magic code to email)
  → Prompt user for code
  → POST /api/auth/verify-code   (returns JWT)
  → Store JWT + refresh token in ~/.fidscript/credentials (INI)
```

On every command, `api-client.ts` reads credentials, attaches `Authorization: Bearer <jwt>` header, and auto-refreshes expired tokens.

---

## Boundaries

**CLI does NOT:**
- Implement business logic (all calls go to API)
- Store state locally (stateless - API is the source of truth)
- Build or deploy chatbots (API does that via publish pipeline)
- Manage token balances directly (read-only via API)

**CLI is a thin transport + TTY layer over the API.**

---

## Related

- [Root CLAUDE.md](../CLAUDE.md)
- [apps/api/CLAUDE.md](../api/CLAUDE.md)
- [packages/sdk/CLAUDE.md](../sdk/CLAUDE.md)
