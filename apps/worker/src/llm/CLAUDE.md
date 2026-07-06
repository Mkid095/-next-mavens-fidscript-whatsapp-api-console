# apps/worker/src/llm — LLM Provider Adapters

## Purpose

One file per LLM provider adapter.

## Providers

- `anthropic.ts` — Anthropic Claude
- `gemini.ts` — Google Gemini
- `minimax.ts` — MiniMax
- `openrouter.ts` — OpenRouter
- `byollm.ts` — Bring Your Own LLM

## Conventions

- Max 150 lines per file
- Each adapter implements common interface
- API keys from environment variables

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
