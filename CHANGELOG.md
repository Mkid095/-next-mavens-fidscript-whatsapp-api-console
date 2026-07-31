# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- ANPAS project structure initialized (`.ai/` layer, docs/, CHANGELOG.md)
- `docs/decisions/ADR-template.md` added
- Landing page rebuilt in light mode with premium editorial design (white bg, Playfair Display typography, yellow accent)
- New `Footer.tsx` component for landing page
- Message categorization: 3-tab UI (Contacts / Groups / Outbox) for WhatsApp dashboard
- `useLandingStats.ts` hook for landing page stats
- `usePricingPlans.ts` hook for pricing section
- `useMarkRead.ts` and `useSyncPhonebook.ts` hooks for message page
- `TrustBrandsSection`, `UseCasesSection`, `StatsSection`, `ProductIntroSection` landing page components
- `InstanceSwitcher` component for multi-instance switching

### Changed

- Landing page (LandingPage.tsx) refactored from 235 lines to 106 lines — extracted API calls to hooks
- PricingSection.tsx refactored to use `usePricingPlans` hook — no business logic in component
- FeaturesSection.tsx split into `features-data.ts`, `useCases-data.ts`, `stats-data.ts`, `brands-data.ts`, `testimonials-data.ts`
- ChatList.tsx refactored from 159 lines to 130 lines — extracted InstanceSwitcher to own file
- MessagesPageMain.tsx refactored from 175 lines to 131 lines — extracted hooks
- Landing page light mode: replaced dark forest theme with white backgrounds, dark text, yellow accent
- `helpers.ts` renamed to `import-contacts-country.utils.ts` (ANPAS naming compliance)

### Removed

- All chatbot/AI features from backend (apps/worker/, modules/ai/, modules/chatbot/, modules/automation/, modules/connectors/, chatbot-worker/)
- All chatbot database phases (phases 9-31, 33-36)
- NATS publisher, publish job emitter, chatbot SSE routes
- All chatbot frontend components (src/features/chatbots/, admin chatbot views, client chatbot views)
- Chatbot routes and API endpoints from frontend and backend
- CliInstallSection from landing page
- `autoTakeoverForAgentReply`, `emitAiOverrideChanged`, `publishChatbotInbound` from backend
- LID column added to inbox_messages (phase38) for outbox tracking

### Fixed

- ANPAS compliance violations: 4 files over 150 lines, 1 forbidden filename (helpers.ts), 2 business logic in UI components
- `featuresData.ts` (199 lines) split into domain-specific data files
