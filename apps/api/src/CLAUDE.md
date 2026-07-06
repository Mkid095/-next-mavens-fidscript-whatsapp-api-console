# apps/api/src — Express API Server Source

**NOTE: This directory will hold refactored API source code. Currently, the working code is in `server/src/`.**

## Purpose

Main HTTP API server source code. Single source of truth for all business logic, database operations, and Evolution API calls.

## Directory Structure (Target)

```
src/
├── index.ts           # Entry point — Express app setup
├── routes/           # Route handlers (grouped by domain)
├── services/         # Business logic services
├── modules/          # Feature modules (AI, chatbot, campaigns)
├── middleware/        # Express middleware (auth, rate limiting)
├── utils/           # Utility functions
└── database/         # Database migrations and schema
```

## Migration Plan

1. Split files in `server/src/` that exceed 150 lines
2. Move split files to `apps/api/src/`
3. Update import paths
4. Update `server/tsconfig.json` to point to `apps/api/src`

## Key Constraints

- **Max 150 lines per file**
- Route handlers go in `routes/` (one file per domain)
- Business logic in `services/` or `modules/`
- No direct Evolution API calls outside `services/whatsapp/`

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
- [apps/worker/src](../worker/src/CLAUDE.md)
- [apps/frontend/src](../frontend/src/CLAUDE.md)
