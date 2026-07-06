# apps/worker/src/handlers — Message Handlers

## Purpose

NATS message handlers for inbound, outbound, and events.

## Message Flow

```
NATS → handler → LLM → tools → response → NATS publish
```

## Conventions

- Max 150 lines per file
- One handler per message type
- No direct Evolution API calls

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
