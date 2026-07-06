# apps/worker — Chatbot Worker

## Purpose

NATS subscriber that processes inbound WhatsApp messages through the AI engine. Runs as its own process (separate from the API server). Receives messages via NATS `chatbot.inbound.<workspace_id>` subject, executes the chatbot AI pipeline, and sends responses via Evolution API.

**NOT**: An HTTP server, a queue producer, or a database writer.

---

## Key Files

```
src/
├── index.ts                    # Entry — NATS connection, subscription to chatbot.inbound.*
├── chatbotRuntimeCache.ts      # In-memory cache of published chatbots
├── circuitBreaker.ts           # Per-conversation tool call circuit breaker
├── billing.ts                  # Token deduction after successful AI response
├── tools.ts                    # Tool registry and definitions
└── tracing.ts                  # Correlation ID propagation from NATS messages

Dockerfile                      # Builds worker image from dist/
```

Worker code currently lives at `server/src/chatbot-worker/` and is wrapped by `apps/chatbot-worker/Dockerfile`. Move planned.

---

## Message Flow

```
NATS — chatbot.inbound.<workspace_id>
    │
    │ Message payload:
    │ { correlationId, instanceId, workspaceId, contactJid,
    │   messageId, messageType, content, timestamp }
    ▼
index.ts — onMessage()
    │ Load chatbot from runtime cache (or DB)
    │ Check circuit breaker for conversation
    ▼
chatbotEngine.ts
    │ contextManager — loads conversation history from DB
    │ intentRouter — classifies intent
    │ promptService — builds system prompt
    │ llmGateway — calls LLM (anthropic/gemini/minimax/openrouter/byollm)
    │ toolCallingEngine — ranks and executes tools (max 5/conversation)
    ▼
responseFormatter — formats WhatsApp-compatible message
    │
    │ Call Evolution API directly (outbound)
    │ or publish to NATS for API to send
    ▼
billing.ts — deduct tokens from workspace balance
```

---

## Tool Execution

Tools are defined in `tools.ts` and called via `toolRunner.ts`. Available tools:
- Shopify (get product, search products)
- HTTP (make arbitrary GET/POST requests)
- Database (query workspace data)
- (extensible — add tools without modifying engine)

Tool calls are ranked by `toolRanker.ts` before execution. Max 5 tools per conversation (circuit breaker prevents abuse).

---

## Boundaries

**This does NOT:**
- Receive HTTP requests (webhooks go to API)
- Write to DB directly (API does all DB writes)
- Manage instance lifecycle
- Handle authentication (handled by API before publishing to NATS)

**API publishes to NATS; worker consumes and processes.**

---

## Related

- [Root CLAUDE.md](../CLAUDE.md)
- [System Flow](../docs/architecture/system-flow.md)
- [apps/api/CLAUDE.md](../api/CLAUDE.md)
