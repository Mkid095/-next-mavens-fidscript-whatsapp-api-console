import React from 'react';
import { motion } from 'motion/react';
import { DocsGettingStarted } from '../DocsGettingStarted.js';
import { DocsSDK } from '../DocsSDK.js';
import { DocsCLIGuide } from '../DocsCLIGuide/index.js';
import { ChatbotApiGuide } from './ChatbotApiGuide.js';
import { LlmConnectionGuide } from './LlmConnectionGuide.js';
import { MetaPolicyGuide } from './MetaPolicyGuide.js';
import { RateLimitsGuide } from './RateLimitsGuide.js';
import { AIProvidersGuide } from './AIProvidersGuide.js';
import { CLICoverageGuide } from './CLICoverageGuide.js';

export interface DocsGuideContentProps { id: string; }

export function DocsGuideContent({ id }: DocsGuideContentProps) {
  if (id === 'quickstart' || id === 'authentication' || id === 'webhooks') {
    return <DocsGettingStarted id={id} />;
  }
  if (id === 'cli' || id === 'tools-integrations' || id === 'byo-llm') {
    return <DocsCLIGuide id={id} />;
  }
  if (id === 'sdks') return <DocsSDK />;
  if (id === 'chatbot-api') return <ChatbotApiGuide />;
  if (id === 'llm-api') return <LlmConnectionGuide />;
  if (id === 'meta-policy') return <MetaPolicyGuide />;
  if (id === 'rate-limits') return <RateLimitsGuide />;
  if (id === 'ai-providers') return <AIProvidersGuide />;
  if (id === 'cli-coverage') return <CLICoverageGuide />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-bold text-white capitalize">{id.replace(/-/g, ' ')}</h1>
      <p className="text-sm text-[#6a6c5d] mt-4">Documentation for this section coming soon.</p>
    </motion.div>
  );
}
