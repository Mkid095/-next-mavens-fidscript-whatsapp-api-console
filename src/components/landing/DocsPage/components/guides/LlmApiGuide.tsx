import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';

export function LlmApiGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">LLM Connection API</h1>
      <p className="text-sm text-[#525252] mb-8">
        Reference for the{' '}
        <code className="font-mono text-[#f97316]">/api/platform/llm-connections</code> endpoints.
        Use these to register BYO API keys (encrypted at rest), manage failover priorities, and
        test connections. All require a Bearer JWT.
      </p>

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-6 mb-4">Discovery</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# List workspace-scoped connections (with masked key suffix)
curl https://whatsapp.fidscript.com/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Providers available in your workspace registry
curl https://whatsapp.fidscript.com/api/platform/llm-connections/available-providers \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">Create / update / delete</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Create (API key encrypted with AES-GCM before storage; only last4 is ever returned)
curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "api_key": "sk-...",
    "is_default": true,
    "monthly_limit": 0,
    "priority": 100
  }'

# Self-hosted / Ollama / LM Studio / OpenRouter free
curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "provider": "custom",
    "model": "llama3.1",
    "endpoint": "http://localhost:11434",
    "priority": 10
  }'

# Update any subset (model, endpoint, api_key, is_default, monthly_limit, priority, enabled)
curl -X PUT https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "is_default": true,
    "monthly_limit": 5000000
  }'

# Rotate the API key (replaces existing)
curl -X PUT https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"api_key": "sk-NEW..."}'

# Delete
curl -X DELETE https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Test (verifies the key by sending a "Hi" prompt)
curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc/test \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">Response shapes</h2>
      <p className="text-xs text-[#525252] mb-3">A connection row looks like:</p>
      <DocsCodeBlock
        lang="json"
        code={`{\n  "success": true,\n  "data": [\n    {\n      "id": "llmc_1740000000_xyz",\n      "workspace_id": "cli_abcdef",\n      "provider": "openai",\n      "provider_name": "OpenAI",\n      "provider_type": "openai",\n      "provider_registry_id": "reg_openai",\n      "model": "gpt-4o-mini",\n      "endpoint": "",\n      "is_default": 1,\n      "enabled": 1,\n      "api_key_last4": "AbCd",\n      "monthly_limit": 0,\n      "priority": 100,\n      "created_at": "2026-07-03T12:34:56.000Z"\n    }\n  ]\n}`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">Failover chain</h2>
      <p className="text-xs text-[#525252] mb-3">
        Set <code className="font-mono text-[#f97316]">priority</code> on each connection.
        Higher is preferred; if it fails the next-highest takes over. The chatbot's{' '}
        <code className="font-mono text-[#f97316]">llm_connection_id</code> can also be updated
        via{' '}
        <code className="font-mono text-[#f97316]">
          PUT /api/platform/chatbots/:id/ai-config
        </code>{' '}
        at any time to swap providers without redeploying.
      </p>
    </motion.div>
  );
}
