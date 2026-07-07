/**
 * TestResults — barrel re-export.
 * Split into: TestResultsMain, MessageBubble, DebugSidebar.
 * @deprecated import from './TestResults' folder directly
 */
export {
  type TestMessage,
  type DebugPayload,
  EmptyConversation,
  ClearedConversation,
  MessageBubble,
  TypingBubble,
  DebugSidebar,
  DebugRow,
  Bot,
} from './TestResults/TestResultsMain';
