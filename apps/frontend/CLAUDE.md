# apps/frontend - React SPA

## Purpose

Admin and client dashboard for the FIDScript WAAP platform. React 18 + Vite SPA. Two portals in one app: admin (platform management) and client (workspace management). All data fetched via REST API - no WebSocket subscriptions except for real-time message updates (SSE).

---

## Routing

```
/                      → LandingPage (marketing)
/login                 → LoginView
/register              → LoginView (register mode)
/docs                  → DocsPage
/pricing               → PricingPage
/changelog             → ChangelogList

/admin                 → AdminLayout (protected, admin JWT)
/admin/dashboard       → DashboardOverview
/admin/instances       → InstancesView
/admin/clients         → ClientsView
/admin/chatbots        → ChatbotListPage
/admin/analytics       → LogsAndAnalyticsView
/admin/audit           → AuditLogView

/client/:workspaceId   → ClientDashboard (protected, client JWT)
/client/:workspaceId/whatsapp    → WhatsAppContainers
/client/:workspaceId/chatbots    → ChatbotBuilderShell
/client/:workspaceId/inbox        → MessagesPage
/client/:workspaceId/contacts     → ContactsSection
/client/:workspaceId/keys         → ApiKeysSection
/client/:workspaceId/llm          → LLMConnectionsSection
/client/:workspaceId/campaigns    → MarketingCenter
/client/:workspaceId/developers   → DevelopersSection
/client/:workspaceId/settings     → SettingsSection
```

---

## Key Files

```
src/
├── App.tsx                      # Root - auth state, routing, sidebar (13.7K - needs split)
├── main.tsx                     # Entry point
├── types.ts                     # Shared UI types (InboxMessage, SystemLog, etc.)
├── index.css                    # Global styles
│
├── components/
│   ├── admin/                   # Admin portal components
│   │   ├── AdminLayout.tsx      # Admin shell with sidebar
│   │   ├── AdminSidebar.tsx
│   │   ├── adminNavItems.ts
│   │   ├── adminRoutes.tsx
│   │   ├── dashboard/           # Dashboard charts and stats
│   │   ├── instances/           # Instance management
│   │   ├── providers/           # LLM provider config (LLMProvidersView - 1541 lines)
│   │   └── api-console/         # ApiConsoleView (live REST tester)
│   ├── client/                  # Client portal components
│   │   ├── ClientDashboard.tsx  # Client shell (~120 lines)
│   │   ├── ClientContent.tsx
│   │   ├── whatsapp/            # WhatsApp instance cards, modals
│   │   ├── contacts/            # Contact management
│   │   ├── tokenStore/          # Token purchase UI
│   │   └── vibe/               # AI prompt builder
│   ├── landing/                 # Marketing site components
│   │   ├── LandingPage.tsx
│   │   ├── DocsPage.tsx        # API docs (1729 lines - needs split)
│   │   ├── PricingPage.tsx
│   │   └── features/            # Feature sections
│   └── shared/                  # Shared UI primitives
│       ├── SidebarNav.tsx
│       ├── BottomNav.tsx
│       ├── CopyButton.tsx
│       └── LoadingScreen.tsx
│
├── features/                    # Feature-based modules
│   ├── chatbots/                # Bot builder (ChatbotBuilderShell 764 lines - needs split)
│   │   ├── ChatbotBuilderShell.tsx
│   │   ├── ConversationInspector.tsx  # 609 lines - needs split
│   │   ├── steps/
│   │   │   ├── AIBrainStep.tsx   # 402 lines - needs split
│   │   │   ├── AudienceStep.tsx
│   │   │   ├── SetupStep.tsx
│   │   │   └── TestDeployStep.tsx
│   │   └── store/
│   │       └── chatbotBuilderStore.ts  # Zustand store
│   ├── messages/                # Inbox + message thread
│   │   ├── ChatThread.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageComposer.tsx
│   │   └── ChatListPane.tsx
│   ├── campaigns/              # Campaign builder + drip
│   ├── automation/             # Automation rules + SLA
│   ├── customers/             # Contact assignment, tags, notes
│   ├── developers/           # Webhooks, audit log, dev logs
│   ├── flows/                # Drip flow editor
│   ├── media/               # Media library + upload
│   ├── search/              # Command palette
│   ├── segments/           # Segment builder
│   └── statuses/           # Status broadcast
│
├── data/
│   ├── api/
│   │   ├── client.ts        # fetch wrapper for frontend → API
│   │   └── platform.ts      # Typed platform API calls (710 lines)
│   ├── hooks/               # 30+ custom React hooks
│   ├── providers/           # AppProviders (React Context)
│   └── events.ts            # Internal event system
│
└── services/
    ├── api.ts               # Main API client
    ├── auth.ts              # Auth helpers
    ├── instances.ts         # Instance API calls
    ├── contacts.ts          # Contact API calls
    └── ...

package.json
vite.config.ts
tsconfig.json
```

---

## State Management

- **App.tsx**: owns `currentUser`, `clientData`, `clientInstances`, `tokenBalance`, `tokenPackages`, `dailyUsage`
- **Section components**: own their UI state (modals, forms, local flags)
- **No prop drilling beyond 2 levels** - use React Context for deeper state
- **Session restore on refresh**: `useEffect` in App.tsx checks `localStorage` for admin/client tokens

---

## Boundaries

**Frontend does NOT:**
- Run business logic (API is authoritative)
- Connect directly to Evolution API (all calls go through our API)
- Manage chatbots (API + worker do that)
- Store sensitive credentials (JWT in memory, API key in localStorage)

---

## Related

- [Root CLAUDE.md](../CLAUDE.md)
- [apps/api/CLAUDE.md](../api/CLAUDE.md)
