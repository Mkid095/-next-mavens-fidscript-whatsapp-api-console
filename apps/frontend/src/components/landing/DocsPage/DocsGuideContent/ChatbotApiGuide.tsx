import React from 'react';
import { motion } from 'motion/react';
import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.js';
import { Callout } from '../shared.tsx';

export function ChatbotApiGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Chatbot API</h1>
      <p className="text-sm text-[#8a886a] mb-8">Full reference for the <code className="font-mono text-[#eab308]">/api/platform/chatbots</code> endpoints. All require a Bearer JWT.</p>
      <Callout type="info"><p>Looking for an end-to-end walkthrough? See the <a href="#byo-llm" className="text-yellow-500 underline">Bring Your Own LLM</a> guide.</p></Callout>
      <h2 className="text-lg font-bold text-white mt-6 mb-4">Chatbot CRUD</h2>
      <DocsCodeBlock lang="bash" code={`# List chatbots in your workspace\ncurl https://whatsapp.fidscript.com/api/platform/chatbots \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"\n\n# Get one chatbot\ncurl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"\n\n# Create\ncurl -X POST https://whatsapp.fidscript.com/api/platform/chatbots \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\\n  -d '{"instance_id":"inst_abc123","name":"support-bot","description":"24/7 customer support","priority":0,"enabled":true}'\n\n# Update\ncurl -X PUT https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\\n  -d '{"priority":5}'\n\n# Delete\ncurl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">AI behavior</h2>
      <DocsCodeBlock lang="bash" code={`curl -X PUT https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/ai-config \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\\n  -d '{"provider":"openai","model":"gpt-4o-mini","system_prompt":"You are a polite, concise support agent.","hallucination_policy":"strict","max_tokens":400,"temperature":0.3}'`} />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Publishing, versions, health, traces</h2>
      <DocsCodeBlock lang="bash" code={`# Publish a chatbot\ncurl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/publish \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\\n  -d '{"draft_json":"{...}"}'\n\n# Watch progress via SSE\ncurl -N "https://whatsapp.fidscript.com/api/sse/publish-jobs/job_abc?token=$FIDSCRIPT_JWT"\n\n# Health\ncurl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/health \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"\n\n# Token forecast\ncurl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/token-forecast \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />
    </motion.div>
  );
}
