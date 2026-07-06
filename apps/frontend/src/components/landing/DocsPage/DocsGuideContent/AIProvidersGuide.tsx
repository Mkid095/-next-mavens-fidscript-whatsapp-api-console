import React from 'react';
import { motion } from 'motion/react';
import { Callout } from '../shared.tsx';

export function AIProvidersGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">AI Providers</h1>
      <p className="text-sm text-[#8a886a] mb-8">Connect any LLM provider to power your chatbot. FIDScript supports OpenAI, OpenRouter, Anthropic, Google Gemini, Azure OpenAI, Ollama, and any OpenAI-compatible endpoint.</p>
      <Callout type="info"><p><strong className="text-white">Bring Your Own Model (BYOM).</strong> You provide the API key — FIDScript encrypts it with AES-256-GCM and never stores plaintext keys.</p></Callout>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Supported Providers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {[
          { name: 'OpenRouter', desc: 'OpenAI-compatible gateway with 100+ free & paid models.', badge: 'Free tier', badgeColor: 'emerald' },
          { name: 'OpenAI', desc: 'Direct to GPT-4o, GPT-4o Mini, o1 models.', badge: 'Paid', badgeColor: 'stone' },
          { name: 'Anthropic Claude', desc: "Claude 3.5 Sonnet, Haiku via Anthropic's /messages endpoint.", badge: 'Paid', badgeColor: 'stone' },
          { name: 'Google Gemini', desc: 'Gemini 2.0 Flash, 1.5 Pro via Google AI API.', badge: 'Paid', badgeColor: 'stone' },
          { name: 'Azure OpenAI', desc: 'Enterprise-hosted GPT models via Azure AD auth.', badge: 'Enterprise', badgeColor: 'stone' },
          { name: 'Ollama', desc: 'Local LLM server (Llama 3, Mistral, etc.) on your infrastructure.', badge: 'Free', badgeColor: 'emerald' },
          { name: 'Custom API', desc: 'Any OpenAI-compatible endpoint — self-hosted models, proxies.', badge: 'Flexible', badgeColor: 'yellow' },
        ].map(({ name, desc, badge, badgeColor }) => (
          <div key={name} className="bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">{name}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : badgeColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-stone-700 text-stone-400'}`}>{badge}</span>
            </div>
            <p className="text-xs text-[#6a6c5d]">{desc}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-bold text-white mb-4">Key Management</h2>
      <p className="text-xs text-[#8a886a] mb-4">API keys are encrypted using AES-256-GCM. Each key has a unique IV and auth tag.</p>
      <div className="bg-[#1a1910] border border-[#262413] rounded-xl p-4 text-xs text-[#6a6c5d] space-y-2">
        <div className="flex items-center gap-2"><span className="text-yellow-400 font-mono">iv</span><span>Per-row initialization vector (unique per key)</span></div>
        <div className="flex items-center gap-2"><span className="text-yellow-400 font-mono">auth_tag</span><span>GCM authentication tag (verification on decrypt)</span></div>
        <div className="flex items-center gap-2"><span className="text-yellow-400 font-mono">key_version</span><span>Increments on key rotation</span></div>
      </div>
    </motion.div>
  );
}
