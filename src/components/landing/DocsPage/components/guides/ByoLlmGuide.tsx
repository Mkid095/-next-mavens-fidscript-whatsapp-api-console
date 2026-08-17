import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';
import { CliComparison } from '../CliComparison';
import { Callout } from '../Callout';
import { PUBLIC_API_BASE } from '../../../../../data/apiEndpoints/index';

export function ByoLlmGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Bring Your Own LLM</h1>
      <p className="text-sm text-[#525252] mb-8">
        Wire any LLM provider into your chatbot — OpenAI, Anthropic, Google Gemini,
        OpenRouter, Azure, or your own self-hosted endpoint. Your API key is encrypted at
        rest and never leaves the FIDScript backend.
      </p>

      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">1. See what's available</h2>
      <p className="text-xs text-[#525252] mb-3">
        List the providers your admin has registered (custom providers, free-tier OpenRouter, etc.):
      </p>
      <DocsCodeBlock
        code={`curl -X GET ${PUBLIC_API_BASE.replace('/api/v1', '')}/api/platform/llm-connections/available-providers \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"
# or
fidscript --json llm providers`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">2. Create a connection (with your API key)</h2>
      <CliComparison
        op="Create a connection (BYO API key)"
        curl={`curl -X POST ${PUBLIC_API_BASE.replace('/api/v1', '')}/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "api_key": "sk-...",
    "is_default": true
  }'`}
        cli={`fidscript llm create openai-prod \\
  --provider openai \\
  --model gpt-4o-mini \\
  --api-key "$OPENAI_API_KEY" \\
  --default`}
      />

      <p className="text-xs text-[#525252] mt-3">
        The CLI also accepts <code className="font-mono text-[#f97316]">--api-key @key.txt</code>{' '}
        for files. The key is encrypted with AES-GCM before being stored; only the last 4
        characters are ever shown back to you.
      </p>

      <h3 className="text-sm font-bold text-[#1a1a1a] mt-6 mb-3">
        Self-hosted / Ollama / custom endpoint
      </h3>
      <DocsCodeBlock
        code={`fidscript llm create ollama-llama3 \\
  --provider custom \\
  --model llama3.1 \\
  --endpoint http://localhost:11434 \\
  --default

# Or a hosted proxy (vLLM, LM Studio, OpenRouter free, etc.):
fidscript llm create openrouter-free \\
  --provider openai \\
  --model "meta-llama/llama-3.1-8b-instruct:free" \\
  --endpoint https://openrouter.ai/api/v1 \\
  --api-key "$OPENROUTER_API_KEY"`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">3. Verify it works</h2>
      <DocsCodeBlock
        code={`fidscript --json llm test llmc_abc123
# → { "success": true, "message": "Connection verified successfully" }

# Or get the full record (key masked):
fidscript llm get llmc_abc123`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">4. Attach the connection to a chatbot</h2>
      <p className="text-xs text-[#525252] mb-3">
        When creating a chatbot, set{' '}
        <code className="font-mono text-[#f97316]">llm_connection</code> in the setup config.
        You can also swap it on an existing chatbot at any time.
      </p>
      <DocsCodeBlock
        code={`# Headless create with a fully customized chatbot
fidscript chatbot setup --config '{
  "name": "support-bot",
  "instance": "my-bot",
  "system_prompt": "You are a polite, concise support agent. Never promise refunds without a manager.",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "llm_connection": "llmc_abc123",
  "hallucination_policy": "strict",
  "max_tokens": 400,
  "temperature": 0.3,
  "max_history_messages": 20,
  "trigger": { "type": "keyword", "value": "help" },
  "policies": {
    "confidence_threshold": 0.7,
    "fallback_reply": "Let me connect you with a human colleague."
  },
  "handoff": "auto",
  "publish": true
}'

# Or update an existing chatbot in place
fidscript chatbot ai-config bot_xyz789 \\
  --llm-connection llmc_abc123 \\
  --model gpt-4o-mini \\
  --system-prompt "..." \\
  --hallucination-policy strict`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">5. Tune generation</h2>
      <p className="text-xs text-[#525252] mb-3">
        Every AI config field is exposed via the CLI. Combine them to shape the bot's behavior.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#f8f8f8]">
            <tr>
              {['Field', 'Type', 'Effect'].map(h => (
                <th key={h} className="text-left px-4 py-2 font-bold text-[#525252]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">system_prompt</td>
              <td className="px-4 py-2 font-mono text-[#525252]">string</td>
              <td className="px-4 py-2 text-[#525252]">Your custom instructions: tone, persona, hard rules.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">model</td>
              <td className="px-4 py-2 font-mono text-[#525252]">string</td>
              <td className="px-4 py-2 text-[#525252]">Model name passed to the provider.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">temperature</td>
              <td className="px-4 py-2 font-mono text-[#525252]">0–2</td>
              <td className="px-4 py-2 text-[#525252]">Lower = more deterministic, higher = more creative.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">top_p</td>
              <td className="px-4 py-2 font-mono text-[#525252]">0–1</td>
              <td className="px-4 py-2 text-[#525252]">Nucleus sampling. 1.0 = no filter.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">max_tokens</td>
              <td className="px-4 py-2 font-mono text-[#525252]">int</td>
              <td className="px-4 py-2 text-[#525252]">Hard cap on response length.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">max_history_messages</td>
              <td className="px-4 py-2 font-mono text-[#525252]">int</td>
              <td className="px-4 py-2 text-[#525252]">Past N messages included in context.</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">hallucination_policy</td>
              <td className="px-4 py-2 font-mono text-[#525252]">enum</td>
              <td className="px-4 py-2 text-[#525252]">
                strict refuses on low confidence; balanced (default); creative allows; disabled passes through.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-[#f97316]">llm_connection_id</td>
              <td className="px-4 py-2 font-mono text-[#525252]">id</td>
              <td className="px-4 py-2 text-[#525252]">Wires a workspace LLM connection (BYO key).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">6. Failover chains</h2>
      <p className="text-xs text-[#525252] mb-3">
        Register multiple connections, set priorities, and FIDScript will fall over if your
        primary provider hits a rate limit or goes down.
      </p>
      <DocsCodeBlock
        code={`# Set up primary + backup
fidscript llm create openai-prod --provider openai --model gpt-4o-mini --api-key $OPENAI_KEY --priority 100
fidscript llm create openrouter-fallback --provider openai --model "openai/gpt-4o-mini" --api-key $OR_KEY --priority 50
fidscript llm create ollama-last --provider custom --model llama3.1 --endpoint http://localhost:11434 --priority 10

# Higher priority is tried first; the next one takes over on failure.`}
        lang="bash"
      />
    </motion.div>
  );
}
