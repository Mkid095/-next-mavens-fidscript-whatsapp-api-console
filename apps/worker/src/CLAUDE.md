# apps/worker/src — Chatbot Worker Source

**NOTE: Currently, the working code is in `server/src/chatbot-worker/`.**

## Purpose

NATS subscriber that processes inbound WhatsApp messages through the AI chatbot engine.

## Directory Structure (Target)

```
src/
├── index.ts           # Entry point, NATS connection, subscription
├── handlers/          # Message handlers (inbound, outbound, events)
├── llm/              # LLM provider adapters (anthropic, gemini, minimax, openrouter, byollm)
├── tools/            # Tool definitions and executor
└── billing/          # Token usage tracking
```

## Migration Plan

1. Move `server/src/chatbot-worker/` to `apps/worker/src/`
2. Split files that exceed 150 lines
3. Update import paths

## Message Flow

```
Webhook → NATS (chatbot.inbound.<workspace_id>) → Worker → AI → Response
```

## Key Constraints

- **Max 150 lines per file**
- Never make direct HTTP calls to Evolution API
- All outbound goes through API's NATS publisher

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
- [apps/api/src](../api/src/CLAUDE.md)
