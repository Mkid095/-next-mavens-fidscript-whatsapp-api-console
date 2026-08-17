# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- ANPAS project structure initialized (`.ai/` layer, docs/, CHANGELOG.md)
- `docs/decisions/ADR-template.md` added
- Landing page rebuilt in light mode with premium editorial design (white bg, Playfair Display typography, orange accent)
- New `Footer.tsx` component for landing page
- Message categorization: 3-tab UI (Contacts / Groups / Outbox) for WhatsApp dashboard
- `useLandingStats.ts` hook for landing page stats
- `usePricingPlans.ts` hook for pricing section
- `useMarkRead.ts` and `useSyncPhonebook.ts` hooks for message page
- `TrustBrandsSection`, `UseCasesSection`, `StatsSection`, `ProductIntroSection` landing page components
- `InstanceSwitcher` component for multi-instance switching
- `LoginLeftPanel.tsx` extracted marketing panel for the auth view
- `whatsapp-api-report.md` Evolution API system reference

### Changed

- Landing page (LandingPage.tsx) refactored from 235 lines to 106 lines - extracted API calls to hooks
- PricingSection.tsx refactored to use `usePricingPlans` hook - no business logic in component
- FeaturesSection.tsx split into `features-data.ts`, `useCases-data.ts`, `stats-data.ts`, `brands-data.ts`, `testimonials-data.ts`
- ChatList.tsx refactored from 159 lines to 130 lines - extracted InstanceSwitcher to own file
- MessagesPageMain.tsx refactored from 175 lines to 131 lines - extracted hooks
- Landing page light mode: replaced dark forest theme with white backgrounds, dark text, orange accent
- `helpers.ts` renamed to `import-contacts-country.utils.ts` (ANPAS naming compliance)
- Login page redesigned with two-column editorial layout: marketing panel left (100vh, no scroll), form panel right with own scroll area on desktop
- Login page is fully responsive: mobile shows only the form and lets the page scroll naturally; desktop constrains the marketing panel to 100vh with `overflow-hidden`
- Login page header now includes a Help link on the right (was empty space)
- All docs page guides (AuthGuide, ByoLlmGuide, ChatbotApiGuide, CliGuide, LlmApiGuide, MetaPolicyGuide, QuickstartGuide, RateLimitsGuide, SdksGuide, ToolsIntegrationsGuide, WebhooksGuide, AiProvidersGuide), ApiRefContent, Callout, CliComparison, LangTabs, ParamTable, MobileSidebar converted from dark theme to light editorial design
- DocsPage header: removed duplicate internal Changelog tab, kept the external /changelog link
- ChangelogPage, ChangelogVersionPage, PricingPage, ContactPage, FeaturesPage now use the shared Header component
- ChangelogPage content padding adjusted to `pt-[72px]` to clear the fixed nav

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
- Tailwind v4 `@theme {}` block contained an invalid `.animate-marquee` class declaration; converted to a `--animate-marquee` custom property so the utility is auto-generated
- Docs page text contrast (dark text on dark backgrounds) corrected to light editorial design
- ChangelogPage and ChangelogVersionPage no longer render their own header alongside the shared nav (duplicate-header issue)
- LoginView.tsx trimmed from 188 lines to 138 lines by extracting LoginLeftPanel
- Login page right-side form panel now properly centered (was floating to the left of a wide empty container)
