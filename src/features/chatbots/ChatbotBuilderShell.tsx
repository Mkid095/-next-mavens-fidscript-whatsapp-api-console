// Backward-compatible barrel: re-export the main component as the default export
// so imports from 'features/chatbots/ChatbotBuilderShell' (no .tsx) keep working.
export { default } from './ChatbotBuilderShell/ChatbotBuilderShellMain';
