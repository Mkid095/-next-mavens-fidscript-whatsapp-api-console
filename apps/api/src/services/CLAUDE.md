# apps/api/src/services - Business Logic Services

## Purpose

Business logic services that are shared across route handlers.

## Structure

```
services/
├── whatsapp/       # WhatsApp/Evolution API integration
│   ├── messaging.ts    # 10 send types
│   ├── groups.ts       # Group operations
│   ├── chats.ts        # Chat operations
│   └── instanceOps.ts  # Instance lifecycle
└── contactResolver.ts  # Contact/conversation resolution
```

## Conventions

- Max 150 lines per file
- Evolution API calls go through `whatsapp/` only
- No direct HTTP calls to external services

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
