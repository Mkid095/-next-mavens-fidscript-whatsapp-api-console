# apps/frontend/src/features — Feature Modules

## Purpose

Self-contained feature modules (chatbots, campaigns, messages).

## Structure

```
features/
├── chatbots/       # Chatbot builder UI
├── campaigns/      # Campaign management UI
├── messages/       # Chat/messaging UI
└── ...
```

## Conventions

- Max 150 lines per file
- Each feature has own folder with internal structure
- Share state via Zustand stores in `../stores/`

## Related

- [Parent CLAUDE.md](../CLAUDE.md)
