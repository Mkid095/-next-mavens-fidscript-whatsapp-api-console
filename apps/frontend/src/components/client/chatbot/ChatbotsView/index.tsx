/**
 * ChatbotsView — chatbot list page.
 *
 * Shows all chatbots for the workspace. Click a bot to open the
 * ChatbotBuilderShell (the single editor). No inline detail panel.
 */
import React from 'react';
import type { Instance } from '../../../../services/api';
import ChatbotsViewMain from './ChatbotsViewMain';

interface ChatbotsViewProps {
  clientToken: string;
  instances: Instance[];
}

export default function ChatbotsView({ clientToken, instances }: ChatbotsViewProps) {
  return <ChatbotsViewMain clientToken={clientToken} instances={instances} />;
}
