import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';
import { Callout } from '../Callout';
import { PUBLIC_API_BASE } from '../../../../../data/apiEndpoints/index';

export function ChatbotApiGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Chatbot API</h1>
      <p className="text-sm text-[#525252] mb-8">
        Full reference for the{' '}
        <code className="font-mono text-[#f97316]">/api/platform/chatbots</code> endpoints. All
        require a Bearer JWT (run <code className="font-mono text-[#f97316]">fidscript login</code>{' '}
        once to store one). Each request costs{' '}
        <code className="font-mono text-[#f97316]">1 token</code> for AI processing; reads and
        configs are free.
      </p>

      <Callout type="info">
        <p>
          Looking for an end-to-end walkthrough? See the{' '}
          <a href="#byo-llm" className="text-[#f97316] underline">Bring Your Own LLM</a> guide.
          The sections below are a dry reference for each endpoint + request body.
        </p>
      </Callout>

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-6 mb-4">Chatbot CRUD</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# List chatbots in your workspace
curl https://whatsapp.fidscript.com/api/platform/chatbots \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Get one chatbot (full config: aiConfig, triggers, rules, policies, handoffRules, groupSettings)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Create
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "instance_id": "inst_abc123",
    "name": "support-bot",
    "description": "24/7 customer support",
    "priority": 0,
    "enabled": true
  }'

# Update (any subset of name/description/priority/enabled/instance_id)
curl -X PUT https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"priority": 5}'

# Delete
curl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Toggle enabled/disabled
curl -X PATCH https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/toggle \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"enabled": false}'`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">AI behavior</h2>
      <p className="text-xs text-[#525252] mb-3">
        The full AI config endpoint - model, provider, system prompt, hallucination policy,
        generation params, history window, and BYO LLM connection.
      </p>
      <DocsCodeBlock
        lang="bash"
        code={`# Update AI behavior (PUT - partial updates supported)
curl -X PUT https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/ai-config \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "system_prompt": "You are a polite, concise support agent.",
    "hallucination_policy": "strict",
    "max_tokens": 400,
    "temperature": 0.3,
    "top_p": 1.0,
    "max_history_messages": 20,
    "llm_connection_id": "llmc_abc"
  }'`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">Triggers, response rules, handoff</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Add a trigger (keyword / regex / mention / always)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/triggers \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "trigger_type": "keyword",
    "trigger_value": "help",
    "keyword_mode": "contains",
    "require_previous_bot_reply": 0,
    "enabled": true,
    "priority": 0
  }'

# Delete a trigger
curl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/triggers/trig_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Add a response rule (conditions_json and an action)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/rules \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "name": "Refund handoff",
    "conditions_json": "[{\\"type\\":\\"intent\\",\\"op\\":\\"matches\\",\\"value\\":\\"refund\\"}]",
    "action": "ai",
    "action_config_json": "{\\"reply\\":\\"Let me connect you with a manager.\\"}",
    "priority": 10,
    "enabled": true
  }'

# Add a handoff rule (route to a human team under conditions)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/handoff-rules \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "name": "Low confidence → human",
    "conditions_json": "[{\\"type\\":\\"confidence\\",\\"op\\":\\"lt\\",\\"value\\":0.6}]",
    "target_team_id": "team_support",
    "target_team_name": "Support",
    "priority": 0,
    "enabled": true
  }'`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">
        Group settings, contact assignments, test
      </h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Group-specific behavior (per JID)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/group-settings \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "group_jid": "120363@g.us",
    "respond_when_mentioned": true,
    "respond_to_all": false,
    "silence_on_bot_reply": true
  }'

# Assign a contact to the bot
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/contacts/contact_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Unassign
curl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/contacts/contact_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Test a trigger against a message
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/test-trigger \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "message": "I need help with my order",
    "contact_id": "contact_abc",
    "conversation_id": "conv_xyz"
  }'`}
      />

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">
        Publishing, versions, health, traces
      </h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Publish a chatbot (runs the validation + build pipeline)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/publish \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"draft_json": "{...}"}'
# → { "success": true, "data": { "jobId": "job_abc" } }

# Watch progress via SSE
curl -N "https://whatsapp.fidscript.com/api/sse/publish-jobs/job_abc?token=$FIDSCRIPT_JWT"

# Most recent publish job
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/publish-job \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Health (provider, model, knowledge count, triggers, last test)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/health \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Validate a draft before publishing (catches issues early)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/test-config \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"draft_json": "{...}"}'

# List version snapshots (for rollback)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/versions \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Roll back to a specific version
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/rollback \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"version_id": "ver_xyz"}'

# Duplicate (clone) a chatbot
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/duplicate \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Token forecast (next 30 days at current pace)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/token-forecast \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Recent runtime traces (token usage, prompts/responses)
curl "https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/traces?limit=50" \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"`}
      />
    </motion.div>
  );
}
