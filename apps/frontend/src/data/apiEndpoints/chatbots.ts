import type { ApiEndpoint } from './index';

/**
 * Chatbot platform endpoints — /api/platform/chatbots/*
 * These are internal dashboard endpoints authenticated via client JWT.
 * They are documented in the client's API docs and testable in the sandbox.
 */
export const chatbotEndpoints: ApiEndpoint[] = [
  // ── CRUD ────────────────────────────────────────────────────────────────────
  {
    id: 'chatbots.list', version: 'v1', method: 'GET',
    path: '/api/platform/chatbots', name: 'List Chatbots', category: 'Chatbots', auth: 'jwt',
    desc: 'Retrieve all chatbots for the authenticated workspace.',
    pathParams: [],
    bodyFields: [],
    response: { success: true, data: [{ id: 'bot_abc123', name: 'sales-bot', enabled: true, instance_name: 'my-instance' }] },
  },
  {
    id: 'chatbots.get', version: 'v1', method: 'GET',
    path: '/api/platform/chatbots/:id', name: 'Get Chatbot', category: 'Chatbots', auth: 'jwt',
    desc: 'Retrieve a single chatbot with full configuration including triggers, rules, and AI config.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID (e.g. bot_abc123)' }],
    bodyFields: [],
    response: { success: true, data: { id: 'bot_abc123', name: 'sales-bot', enabled: true, triggers: [], rules: [], ai_config: {} } },
  },
  {
    id: 'chatbots.create', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots', name: 'Create Chatbot', category: 'Chatbots', auth: 'jwt',
    desc: 'Create a new chatbot attached to a WhatsApp instance.',
    pathParams: [],
    bodyFields: [
      { key: 'name', label: 'Bot Name', type: 'string', placeholder: 'e.g. sales-bot', required: true, desc: 'Unique name for this chatbot within your workspace' },
      { key: 'instance_id', label: 'Instance ID', type: 'string', placeholder: 'instance_xxx', required: true, desc: 'WhatsApp instance to attach this chatbot to' },
      { key: 'description', label: 'Description', type: 'string', placeholder: 'Optional description', required: false, desc: 'Human-readable description' },
      { key: 'priority', label: 'Priority', type: 'number', placeholder: '0', required: false, default: 0, desc: 'Higher priority bots handle traffic first (0–100)' },
      { key: 'enabled', label: 'Enabled', type: 'boolean', required: false, default: true, desc: 'Whether the bot is active' },
    ],
    response: { success: true, data: { id: 'bot_abc123', name: 'sales-bot', enabled: true } },
  },
  {
    id: 'chatbots.update', version: 'v1', method: 'PUT',
    path: '/api/platform/chatbots/:id', name: 'Update Chatbot', category: 'Chatbots', auth: 'jwt',
    desc: 'Update chatbot name, description, priority, or enabled state.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'name', label: 'Bot Name', type: 'string', required: false },
      { key: 'description', label: 'Description', type: 'string', required: false },
      { key: 'priority', label: 'Priority', type: 'number', required: false },
      { key: 'enabled', label: 'Enabled', type: 'boolean', required: false },
    ],
    response: { success: true, data: { id: 'bot_abc123', name: 'updated-name' } },
  },
  {
    id: 'chatbots.delete', version: 'v1', method: 'DELETE',
    path: '/api/platform/chatbots/:id', name: 'Delete Chatbot', category: 'Chatbots', auth: 'jwt',
    desc: 'Permanently delete a chatbot and all its triggers, rules, and configurations.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [],
    response: { success: true, message: 'Chatbot deleted' },
  },
  {
    id: 'chatbots.toggle', version: 'v1', method: 'PATCH',
    path: '/api/platform/chatbots/:id/toggle', name: 'Toggle Chatbot', category: 'Chatbots', auth: 'jwt',
    desc: 'Enable or disable a chatbot without deleting it.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [],
    response: { success: true, data: { id: 'bot_abc123', enabled: false } },
  },

  // ── AI Config ──────────────────────────────────────────────────────────────
  {
    id: 'chatbots.ai-config', version: 'v1', method: 'PUT',
    path: '/api/platform/chatbots/:id/ai-config', name: 'Update AI Config', category: 'Chatbots', auth: 'jwt',
    desc: 'Configure the LLM provider, model, system prompt, temperature, and hallucination policy for a chatbot.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'llm_connection_id', label: 'LLM Connection ID', type: 'string', placeholder: 'conn_xxx or leave empty for default', required: false, desc: 'ID of a workspace LLM connection (from /api/platform/llm-connections). Leave empty to use workspace default.' },
      { key: 'model', label: 'Model', type: 'string', placeholder: 'gpt-4o', required: false, desc: 'Model name (e.g. gpt-4o, claude-sonnet-4, gemini-1.5-pro). Must be supported by the configured provider.' },
      { key: 'system_prompt', label: 'System Prompt', type: 'text', placeholder: 'You are a helpful sales assistant...', required: false, desc: 'Instructions that define the chatbot\'s personality and behavior' },
      { key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', required: false, default: 0.7, desc: 'Controls randomness: 0 = deterministic, 1 = very creative (0.0–1.0)' },
      { key: 'max_tokens', label: 'Max Tokens', type: 'number', placeholder: '1024', required: false, default: 1024, desc: 'Maximum response length in tokens' },
      { key: 'hallucination_policy', label: 'Hallucination Policy', type: 'string', required: false, enum: ['strict', 'relaxed'], default: 'relaxed', desc: '"strict" = refuse out-of-scope questions; "relaxed" = attempt best-effort' },
    ],
    response: { success: true, data: { llm_connection_id: 'conn_xxx', model: 'gpt-4o', temperature: 0.7 } },
  },

  // ── Triggers ───────────────────────────────────────────────────────────────
  {
    id: 'chatbots.triggers.add', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots/:id/triggers', name: 'Add Trigger', category: 'Chatbots', auth: 'jwt',
    desc: 'Add a keyword or pattern that activates this chatbot. Supports exact match and contains operators.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'keyword', label: 'Keyword', type: 'string', placeholder: 'prices', required: true, desc: 'The trigger keyword or phrase (case-insensitive)' },
      { key: 'match_type', label: 'Match Type', type: 'string', required: false, enum: ['contains', 'exact', 'regex'], default: 'contains', desc: '"contains" = anywhere in message; "exact" = whole message; "regex" = pattern match' },
      { key: 'description', label: 'Description', type: 'string', placeholder: 'Handles price enquiries', required: false, desc: 'Human-readable note about this trigger' },
    ],
    response: { success: true, data: { id: 'trig_xxx', keyword: 'prices', match_type: 'contains' } },
  },
  {
    id: 'chatbots.triggers.delete', version: 'v1', method: 'DELETE',
    path: '/api/platform/chatbots/:id/triggers/:triggerId', name: 'Delete Trigger', category: 'Chatbots', auth: 'jwt',
    desc: 'Remove a trigger from the chatbot.',
    pathParams: [
      { name: 'id', desc: 'Chatbot ID' },
      { name: 'triggerId', desc: 'Trigger ID (e.g. trig_xxx)' },
    ],
    bodyFields: [],
    response: { success: true, message: 'Trigger deleted' },
  },

  // ── Response Rules ─────────────────────────────────────────────────────────
  {
    id: 'chatbots.rules.add', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots/:id/rules', name: 'Add Response Rule', category: 'Chatbots', auth: 'jwt',
    desc: 'Add a conditional response rule: if a trigger matches and condition is met, respond with the configured message or action.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'name', label: 'Rule Name', type: 'string', placeholder: 'VIP discount', required: true, desc: 'Descriptive name for this rule' },
      { key: 'trigger_id', label: 'Trigger ID', type: 'string', placeholder: 'trig_xxx', required: true, desc: 'Which trigger activates this rule' },
      { key: 'condition', label: 'Condition', type: 'string', placeholder: 'contact.tag == "VIP"', required: false, desc: 'SpEL expression or leave empty for unconditional' },
      { key: 'response_type', label: 'Response Type', type: 'string', required: true, enum: ['text', 'image', 'template'], default: 'text', desc: 'Type of response to send' },
      { key: 'response_content', label: 'Response Content', type: 'text', placeholder: 'Here are our current prices...', required: true, desc: 'The response content (text, media URL, or template name)' },
    ],
    response: { success: true, data: { id: 'rule_xxx', name: 'VIP discount' } },
  },
  {
    id: 'chatbots.rules.update', version: 'v1', method: 'PUT',
    path: '/api/platform/chatbots/:id/rules/:ruleId', name: 'Update Rule', category: 'Chatbots', auth: 'jwt',
    desc: 'Update an existing response rule.',
    pathParams: [
      { name: 'id', desc: 'Chatbot ID' },
      { name: 'ruleId', desc: 'Rule ID (e.g. rule_xxx)' },
    ],
    bodyFields: [
      { key: 'name', label: 'Rule Name', type: 'string', required: false },
      { key: 'condition', label: 'Condition', type: 'string', required: false },
      { key: 'response_type', label: 'Response Type', type: 'string', required: false, enum: ['text', 'image', 'template'] },
      { key: 'response_content', label: 'Response Content', type: 'text', required: false },
    ],
    response: { success: true, data: { id: 'rule_xxx', name: 'updated name' } },
  },
  {
    id: 'chatbots.rules.delete', version: 'v1', method: 'DELETE',
    path: '/api/platform/chatbots/:id/rules/:ruleId', name: 'Delete Rule', category: 'Chatbots', auth: 'jwt',
    desc: 'Delete a response rule.',
    pathParams: [
      { name: 'id', desc: 'Chatbot ID' },
      { name: 'ruleId', desc: 'Rule ID' },
    ],
    bodyFields: [],
    response: { success: true, message: 'Rule deleted' },
  },

  // ── Handoff Rules ──────────────────────────────────────────────────────────
  {
    id: 'chatbots.handoff-rules.add', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots/:id/handoff-rules', name: 'Add Handoff Rule', category: 'Chatbots', auth: 'jwt',
    desc: 'Define when a conversation should be handed off to a human agent (e.g. escalation, business hours, specific keywords).',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'condition', label: 'Condition', type: 'string', placeholder: 'contact.tag == "escalate"', required: true, desc: 'SpEL expression that triggers the handoff' },
      { key: 'target_type', label: 'Target Type', type: 'string', required: true, enum: ['agent', 'team', 'email'], desc: 'Where to route the conversation' },
      { key: 'target_id', label: 'Target ID', type: 'string', placeholder: 'agent_xxx', required: true, desc: 'ID of the agent, team, or email address' },
      { key: 'priority', label: 'Priority', type: 'number', placeholder: '10', required: false, default: 0, desc: 'Handoff priority (higher = more urgent)' },
    ],
    response: { success: true, data: { id: 'handoff_xxx', condition: 'contact.tag == "escalate"' } },
  },

  // ── Response Policies ───────────────────────────────────────────────────────
  {
    id: 'chatbots.policies', version: 'v1', method: 'PUT',
    path: '/api/platform/chatbots/:id/policies', name: 'Update Response Policies', category: 'Chatbots', auth: 'jwt',
    desc: 'Set fallback behavior when no rule matches and the AI is uncertain.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'fallback_response', label: 'Fallback Response', type: 'text', placeholder: 'I\'m not sure I understand. Can you rephrase?', required: false, desc: 'Message sent when no rule matches and AI confidence is low' },
      { key: 'max_handlers', label: 'Max Handlers', type: 'number', placeholder: '3', required: false, default: 3, desc: 'Number of fallback attempts before handoff' },
      { key: 'handoff_on_low_confidence', label: 'Handoff on Low Confidence', type: 'boolean', required: false, default: true, desc: 'Automatically handoff when AI confidence score is below threshold' },
    ],
    response: { success: true, data: { fallback_response: '...', max_handlers: 3 } },
  },

  // ── Group Settings ─────────────────────────────────────────────────────────
  {
    id: 'chatbots.group-settings', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots/:id/group-settings', name: 'Set Group Settings', category: 'Chatbots', auth: 'jwt',
    desc: 'Configure chatbot behavior for WhatsApp groups (respond to group messages, admin-only restriction, etc.).',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'respond_to_groups', label: 'Respond to Groups', type: 'boolean', required: false, default: false, desc: 'Whether this bot responds in WhatsApp groups' },
      { key: 'admin_only', label: 'Admin Only', type: 'boolean', required: false, default: false, desc: 'Only respond when sent by a group admin' },
      { key: 'allowed_groups', label: 'Allowed Group JIDs', type: 'array', required: false, desc: 'Restrict bot to specific group JIDs (empty = all groups)', fields: [{ key: '', label: 'Group JID', type: 'string', placeholder: '群_123456@g.us' }] },
    ],
    response: { success: true, data: { respond_to_groups: false, admin_only: false } },
  },

  // ── Contact Assignments ─────────────────────────────────────────────────────
  {
    id: 'chatbots.contacts.assign', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots/:id/contacts/:contactId', name: 'Assign Contact', category: 'Chatbots', auth: 'jwt',
    desc: 'Assign a specific contact to this chatbot (contact will always be handled by this bot).',
    pathParams: [
      { name: 'id', desc: 'Chatbot ID' },
      { name: 'contactId', desc: 'Contact ID' },
    ],
    bodyFields: [],
    response: { success: true, message: 'Contact assigned to chatbot' },
  },
  {
    id: 'chatbots.contacts.unassign', version: 'v1', method: 'DELETE',
    path: '/api/platform/chatbots/:id/contacts/:contactId', name: 'Unassign Contact', category: 'Chatbots', auth: 'jwt',
    desc: 'Remove a contact assignment, returning the contact to normal routing.',
    pathParams: [
      { name: 'id', desc: 'Chatbot ID' },
      { name: 'contactId', desc: 'Contact ID' },
    ],
    bodyFields: [],
    response: { success: true, message: 'Contact unassigned' },
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  {
    id: 'chatbots.test-trigger', version: 'v1', method: 'POST',
    path: '/api/platform/chatbots/:id/test-trigger', name: 'Test Trigger', category: 'Chatbots', auth: 'jwt',
    desc: 'Simulate an incoming message to test which triggers and rules fire, and see the full AI response.',
    pathParams: [{ name: 'id', desc: 'Chatbot ID' }],
    bodyFields: [
      { key: 'message', label: 'Test Message', type: 'text', placeholder: 'what are your prices?', required: true, desc: 'The simulated incoming WhatsApp message text' },
    ],
    response: { success: true, data: { matched_trigger: 'prices', matched_rule: 'rule_xxx', ai_response: 'Here are our current prices...', tokens_used: 142 } },
  },
];
