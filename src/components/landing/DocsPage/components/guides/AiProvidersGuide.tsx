import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';
import { Callout } from '../Callout';
import { PUBLIC_API_BASE } from '../../../../../data/apiEndpoints/index';

export function AiProvidersGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">AI Providers</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Connect any LLM provider to power your chatbot&rsquo;s AI responses. FIDScript
        supports OpenAI, OpenRouter, Anthropic, Google Gemini, Azure OpenAI, Ollama, and any
        OpenAI-compatible custom endpoint.
      </p>

      <Callout type="info">
        <p>
          <strong className="text-white">Bring Your Own Model (BYOM).</strong> You provide
          the API key — FIDScript encrypts it with AES-256-GCM and never stores plaintext
          keys. Works at the workspace level so your team shares connections safely.
        </p>
      </Callout>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Supported Providers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {[
          {
            name: 'OpenRouter',
            desc: 'OpenAI-compatible gateway with 100+ free & paid models. Best for variety.',
            badge: 'Free tier',
            badgeColor: 'emerald',
          },
          {
            name: 'OpenAI',
            desc: 'Direct to GPT-4o, GPT-4o Mini, o1 models via OpenAI API.',
            badge: 'Paid',
            badgeColor: 'stone',
          },
          {
            name: 'Anthropic Claude',
            desc: "Claude 3.5 Sonnet, Haiku via Anthropic's /messages endpoint.",
            badge: 'Paid',
            badgeColor: 'stone',
          },
          {
            name: 'Google Gemini',
            desc: 'Gemini 2.0 Flash, 1.5 Pro via Google AI API.',
            badge: 'Paid',
            badgeColor: 'stone',
          },
          {
            name: 'Azure OpenAI',
            desc: 'Enterprise-hosted GPT models via Azure AD auth.',
            badge: 'Enterprise',
            badgeColor: 'stone',
          },
          {
            name: 'Ollama',
            desc: 'Local LLM server (Llama 3, Mistral, etc.) on your infrastructure.',
            badge: 'Free',
            badgeColor: 'emerald',
          },
          {
            name: 'Custom API',
            desc: 'Any OpenAI-compatible endpoint — self-hosted models, proxies, etc.',
            badge: 'Flexible',
            badgeColor: 'yellow',
          },
        ].map(({ name, desc, badge, badgeColor }) => (
          <div
            key={name}
            className="bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">{name}</span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  badgeColor === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : badgeColor === 'yellow'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-stone-700 text-stone-400'
                }`}
              >
                {badge}
              </span>
            </div>
            <p className="text-xs text-[#6a6c5d]">{desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Discovery Endpoint</h2>
      <p className="text-xs text-[#8a886a] mb-4">
        List all available providers for your workspace without authentication complexity.
      </p>
      <DocsCodeBlock
        code={`curl -X GET ${PUBLIC_API_BASE}/providers \\\n  -H "X-API-Key: fidscript_live_your_key_here"`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Key Management</h2>
      <p className="text-xs text-[#8a886a] mb-4">
        API keys are encrypted server-side using AES-256-GCM before storage. Each key has a
        unique IV and auth tag — key rotation does not require re-encryption of all data.
      </p>
      <div className="bg-[#1a1910] border border-[#262413] rounded-xl p-4 text-xs text-[#6a6c5d] space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-mono">iv</span>
          <span>Per-row initialization vector (unique per key)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-mono">auth_tag</span>
          <span>GCM authentication tag (verification on decrypt)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-mono">key_version</span>
          <span>Increments on key rotation (supports future master key roll)</span>
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Fallback Chains</h2>
      <p className="text-xs text-[#8a886a] mb-4">
        Define an ordered failover chain so your chatbot stays responsive even if a provider
        goes down.
      </p>
      <DocsCodeBlock
        code={`{ "chain": [ { "provider": "openrouter", "model": "google/gemini-2.0-flash-free" }, { "provider": "openai", "model": "gpt-4o-mini" }, { "provider": "gemini", "model": "gemini-2.0-flash" } ] }`}
        lang="json"
      />
    </motion.div>
  );
}
