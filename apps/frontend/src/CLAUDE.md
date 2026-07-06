# apps/frontend/src — React SPA Source

**NOTE: Currently, the working code is in `src/`.**

## Purpose

React single-page application for the FIDScript WhatsApp platform.

## Directory Structure (Target)

```
src/
├── App.tsx           # Router setup only
├── pages/           # Route-level page components
├── components/       # Shared UI components
├── features/        # Feature modules (chatbots, campaigns, messages)
├── hooks/           # Custom React hooks
├── services/        # API client layer
└── stores/          # Zustand state stores
```

## Migration Plan

1. Split files in `src/` that exceed 150 lines
2. Move split files to `apps/frontend/src/`
3. Update import paths
4. Update `tsconfig.json` paths

## Key Constraints

- **Max 150 lines per file**
- One component per file
- API calls go through `services/` only
- No direct `fetch` in components

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
