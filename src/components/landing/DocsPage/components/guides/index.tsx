import { motion } from 'framer-motion';
import { QuickstartGuide } from './QuickstartGuide';
import { AuthGuide } from './AuthGuide';
import { WebhooksGuide } from './WebhooksGuide';
import { CliGuide } from './CliGuide';
import { ToolsIntegrationsGuide } from './ToolsIntegrationsGuide';
import { ByoLlmGuide } from './ByoLlmGuide';
import { ChatbotApiGuide } from './ChatbotApiGuide';
import { MetaPolicyGuide } from './MetaPolicyGuide';
import { LlmApiGuide } from './LlmApiGuide';
import { RateLimitsGuide } from './RateLimitsGuide';
import { AiProvidersGuide } from './AiProvidersGuide';
import { SdksGuide } from './SdksGuide';

const GUIDE_MAP: Record<string, React.ComponentType> = {
  quickstart:           QuickstartGuide,
  authentication:       AuthGuide,
  webhooks:             WebhooksGuide,
  cli:                  CliGuide,
  'tools-integrations': ToolsIntegrationsGuide,
  'byo-llm':           ByoLlmGuide,
  'chatbot-api':        ChatbotApiGuide,
  'meta-policy':        MetaPolicyGuide,
  'llm-api':            LlmApiGuide,
  'rate-limits':        RateLimitsGuide,
  'ai-providers':       AiProvidersGuide,
  sdks:                 SdksGuide,
};

export function GuideContent({ id }: { id: string }) {
  const Guide = GUIDE_MAP[id];
  if (Guide) return <Guide />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-bold text-white capitalize">{id.replace(/-/g, ' ')}</h1>
      <p className="text-sm text-[#6a6c5d] mt-4">
        Documentation for this section coming soon.
      </p>
    </motion.div>
  );
}
