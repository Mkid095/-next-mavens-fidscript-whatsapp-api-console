import React from 'react';
import { motion } from 'motion/react';
import { CliComparison } from '../shared.js';
import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.js';
import { PUBLIC_API_BASE } from '../../../../data/apiEndpoints/index.js';

/* ── Bring Your Own LLM ── */
export function BYOllmGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Bring Your Own LLM</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Wire any LLM provider into your chatbot  -  OpenAI, Anthropic, Google Gemini, OpenRouter,
        Azure, or your own self-hosted endpoint. Your API key is encrypted at rest and never
        leaves the FIDScript backend.
      </p>
      <h2 className="text-lg font-bold text-white mb-4">1. See what's available</h2>
      <p className="text-xs text-[#8a886a] mb-3">List the providers your admin has registered:</p>
      <DocsCodeBlock code={`curl -X GET ${PUBLIC_API_BASE.replace('/api/v1','')}/api/platform/llm-connections/available-providers \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"\n# or\nfidscript --json llm providers`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">2. Create a connection (with your API key)</h2>
      <CliComparison op="Create a connection (BYO API key)"
        curl={`curl -X POST ${PUBLIC_API_BASE.replace('/api/v1','')}/api/platform/llm-connections \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "provider": "openai",\n    "model": "gpt-4o-mini",\n    "api_key": "sk-...",\n    "is_default": true\n  }'`}
        cli={`fidscript llm create openai-prod \\\n  --provider openai \\\n  --model gpt-4o-mini \\\n  --api-key "$OPENAI_API_KEY" \\\n  --default`} />
      <p className="text-xs text-[#6a6c5d] mt-3">The CLI also accepts <code className="font-mono text-[#eab308]">--api-key @key.txt</code> for files. The key is encrypted with AES-GCM before being stored; only the last 4 characters are ever shown back to you.</p>
      <h3 className="text-sm font-bold text-[#cbd3cf] mt-6 mb-3">Self-hosted / Ollama / custom endpoint</h3>
      <DocsCodeBlock code={`fidscript llm create ollama-llama3 \\\n  --provider custom \\\n  --model llama3.1 \\\n  --endpoint http://localhost:11434 \\\n  --default\n\n# Or a hosted proxy (vLLM, LM Studio, OpenRouter free, etc.):\nfidscript llm create openrouter-free \\\n  --provider openai \\\n  --model "meta-llama/llama-3.1-8b-instruct:free" \\\n  --endpoint https://openrouter.ai/api/v1 \\\n  --api-key "$OPENROUTER_API_KEY"`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">3. Verify it works</h2>
      <DocsCodeBlock code={`fidscript --json llm test llmc_abc123\n# → { "success": true, "message": "Connection verified successfully" }\n\n# Or get the full record (key masked):\nfidscript llm get llmc_abc123`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">4. Attach the connection to a chatbot</h2>
      <p className="text-xs text-[#8a886a] mb-3">When creating a chatbot, set <code className="font-mono text-[#eab308]">llm_connection</code> in the setup config.</p>
      <DocsCodeBlock code={`# Headless create with a fully customized chatbot\nfidscript chatbot setup --config '{\n  "name": "support-bot",\n  "instance": "my-bot",\n  "system_prompt": "You are a polite, concise support agent. Never promise refunds without a manager.",\n  "provider": "openai",\n  "model": "gpt-4o-mini",\n  "llm_connection": "llmc_abc123",\n  "hallucination_policy": "strict",\n  "max_tokens": 400,\n  "temperature": 0.3,\n  "max_history_messages": 20,\n  "trigger": { "type": "keyword", "value": "help" },\n  "policies": {\n    "confidence_threshold": 0.7,\n    "fallback_reply": "Let me connect you with a human colleague."\n  },\n  "handoff": "auto",\n  "publish": true\n}'\n\n# Or update an existing chatbot in place\nfidscript chatbot ai-config bot_xyz789 \\\n  --llm-connection llmc_abc123 \\\n  --model gpt-4o-mini \\\n  --system-prompt "..." \\\n  --hallucination-policy strict`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">5. Tune generation</h2>
      <p className="text-xs text-[#8a886a] mb-3">Every AI config field is exposed via the CLI. Combine them to shape the bot's behavior.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1910]">
            <tr>{['Field', 'Type', 'Effect'].map(h => <th key={h} className="text-left px-4 py-2 font-bold text-[#8a886a]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#262413]">
            <tr><td className="px-4 py-2 font-mono text-yellow-500">system_prompt</td><td className="px-4 py-2 font-mono text-[#8a886a]">string</td><td className="px-4 py-2 text-[#a8a594]">Your custom instructions: tone, persona, hard rules.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">model</td><td className="px-4 py-2 font-mono text-[#8a886a]">string</td><td className="px-4 py-2 text-[#a8a594]">Model name passed to the provider.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">temperature</td><td className="px-4 py-2 font-mono text-[#8a886a]">0–2</td><td className="px-4 py-2 text-[#a8a594]">Lower = more deterministic, higher = more creative.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">top_p</td><td className="px-4 py-2 font-mono text-[#8a886a]">0–1</td><td className="px-4 py-2 text-[#a8a594]">Nucleus sampling. 1.0 = no filter.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">max_tokens</td><td className="px-4 py-2 font-mono text-[#8a886a]">int</td><td className="px-4 py-2 text-[#a8a594]">Hard cap on response length.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">max_history_messages</td><td className="px-4 py-2 font-mono text-[#8a886a]">int</td><td className="px-4 py-2 text-[#a8a594]">Past N messages included in context.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">hallucination_policy</td><td className="px-4 py-2 font-mono text-[#8a886a]">enum</td><td className="px-4 py-2 text-[#a8a594]">strict refuses on low confidence; balanced (default); creative allows; disabled passes through.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">llm_connection_id</td><td className="px-4 py-2 font-mono text-[#8a886a]">id</td><td className="px-4 py-2 text-[#a8a594]">Wires a workspace LLM connection (BYO key).</td></tr>
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">6. Failover chains</h2>
      <p className="text-xs text-[#8a886a] mb-3">Register multiple connections, set priorities, and FIDScript will fall over if your primary provider hits a rate limit or goes down.</p>
      <DocsCodeBlock code={`# Set up primary + backup\nfidscript llm create openai-prod --provider openai --model gpt-4o-mini --api-key $OPENAI_KEY --priority 100\nfidscript llm create openrouter-fallback --provider openai --model "openai/gpt-4o-mini" --api-key $OR_KEY --priority 50\nfidscript llm create ollama-last --provider custom --model llama3.1 --endpoint http://localhost:11434 --priority 10\n\n# Higher priority is tried first; the next one takes over on failure.`} lang="bash" />
    </motion.div>
  );
}
