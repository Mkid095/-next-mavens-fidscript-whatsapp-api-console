# packages/types — Shared TypeScript Types

## Overview

`@fidscript/types` is the shared types package consumed by all monorepo packages (SDK, CLI, frontend, API). It exports type definitions for the WhatsApp API platform.

## Package Structure

```
packages/types/
├── src/
│   ├── index.ts        # Main exports
│   ├── whatsapp.ts     # WhatsApp-specific types (message, instance, etc.)
│   ├── api.ts          # API request/response types
│   ├── chatbot.ts      # Chatbot engine types
│   └── entities.ts     # Core entity types (Client, Workspace, etc.)
├── dist/                # Compiled output (generated on build)
├── package.json
└── tsconfig.json
```

## Exports

The package provides named exports under subpaths:

```typescript
import { WhatsAppMessage } from '@fidscript/types/whatsapp';
import { ApiResponse } from '@fidscript/types/api';
import { ChatbotConfig } from '@fidscript/types/chatbot';
import { Client, Workspace } from '@fidscript/types/entities';
```

## Build

```bash
npm run build    # Compiles src/ → dist/
npm run clean    # Removes dist/
```

## Dependencies

This package has **no runtime dependencies**. It should stay as pure TypeScript interfaces/types only.

## Rules

- No runtime dependencies (imports from other monorepo packages must be types only)
- No `any` — use proper generic types or `unknown` with type guards
- All types must be exported through the appropriate subpath entry
- Do not include implementation logic — types only

## Consumer Projects

| Project | Usage |
|---------|-------|
| `apps/api` | Server-side type safety for API responses |
| `apps/frontend` | Frontend API client types |
| `apps/worker` | NATS message types |
| `sdks/node-fidscript` | SDK type definitions |

## Related

- [Root CLAUDE.md](../../CLAUDE.md)
- [apps/api/CLAUDE.md](../../apps/api/CLAUDE.md)
