import React from 'react';
import { motion } from 'motion/react';
import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.js';

export function LlmConnectionGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">LLM Connection API</h1>
      <p className="text-sm text-[#8a886a] mb-8">Reference for <code className="font-mono text-[#eab308]">/api/platform/llm-connections</code>. Register BYO API keys, manage failover priorities, and test connections.</p>
      <h2 className="text-lg font-bold text-white mt-6 mb-4">Discovery</h2>
      <DocsCodeBlock lang="bash" code={`curl https://whatsapp.fidscript.com/api/platform/llm-connections \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"\n\ncurl https://whatsapp.fidscript.com/api/platform/llm-connections/available-providers \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Create / update / delete</h2>
      <DocsCodeBlock lang="bash" code={`curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\\n  -d '{"provider":"openai","model":"gpt-4o-mini","api_key":"sk-...","is_default":true,"priority":100}'\n\n# Self-hosted / Ollama\ncurl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\\n  -d '{"provider":"custom","model":"llama3.1","endpoint":"http://localhost:11434","priority":10}'\n\n# Delete\ncurl -X DELETE https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Response shape</h2>
      <DocsCodeBlock lang="json" code={`{\n  "success": true,\n  "data": [{\n    "id": "llmc_1740000000_xyz",\n    "workspace_id": "cli_abcdef",\n    "provider": "openai",\n    "provider_name": "OpenAI",\n    "model": "gpt-4o-mini",\n    "is_default": 1,\n    "enabled": 1,\n    "api_key_last4": "AbCd",\n    "priority": 100,\n    "created_at": "2026-07-03T12:34:56.000Z"\n  }]\n}`} />
    </motion.div>
  );
}
