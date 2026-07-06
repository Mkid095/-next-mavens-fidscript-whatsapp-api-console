import db from '../../database.js';

export interface IntentDecision {
  intent: 'greeting' | 'faq' | 'dataset_query' | 'tool_request' | 'memory_recall' | 'general' | 'handoff';
  confidence: number;
  reasoning: string;
  capabilities: Array<'memory' | 'knowledge' | 'tools' | 'datasets'>;
  suggestedMaxTokens: number;
  knowledgeIds: string[];
  datasetIds: string[];
  toolIds: string[];
  datasetQuery?: string;
}

// [pattern, intent, confidence, reasoning]
const PRIORITY_PATTERNS: Array<[RegExp, IntentDecision['intent'], number, string]> = [
  [/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo|sup|hi there)/i, 'greeting', 0.9, 'Greeting pattern matched'],
  [/^(thank|thanks)/i, 'greeting', 0.9, 'Greeting pattern matched'],
  [/^(bye|goodbye|see you|later|goodnight)/i, 'greeting', 0.9, 'Greeting pattern matched'],
  [/^(ok|okay|got it|understood|cool|nice|great)/i, 'greeting', 0.9, 'Greeting pattern matched'],
  [/talk to (a |an )?(human|agent|real person|live|person)/i, 'handoff', 0.95, 'Handoff pattern matched'],
  [/connect me (to |with )(a |an )?(human|agent|someone|live support)/i, 'handoff', 0.95, 'Handoff pattern matched'],
  [/I need (a |an )?(human|agent|real person)/i, 'handoff', 0.95, 'Handoff pattern matched'],
  [/is there (a |an )?(real |live )?(person|human|agent)/i, 'handoff', 0.95, 'Handoff pattern matched'],
  [/speak to (someone|somebody|support|team)/i, 'handoff', 0.95, 'Handoff pattern matched'],
  [/^(show|get|fetch|find|search|lookup|check|call|invoke|run|execute|list)/i, 'tool_request', 0.65, 'Tool request pattern matched'],
  [/can you (\w+)/i, 'tool_request', 0.65, 'Tool request pattern matched'],
  [/please (\w+)/i, 'tool_request', 0.65, 'Tool request pattern matched'],
  [/I want to (\w+)/i, 'tool_request', 0.65, 'Tool request pattern matched'],
];

const DATASET_PATTERNS = [
  /(?:search|find|lookup|check|do you have|is there|in stock|available)(?: for |: ?)?(.+)/i,
  /(?:show|list|get)(?: me | all | the )?(.+?)(?:\s+(?:in stock|available|price| cost))?$/i,
  /price of (.+)/i, /cost of (.+)/i, /how much (?:is |does |are )?(.+)/i,
];

const MEMORY_KEYWORDS = ['remember', 'forget', 'previously', 'earlier', 'before', 'last time', 'you said'];

export function routeIntent(
  message: string,
  chatbotId: string,
  context: { conversationId?: string; contactId?: string; previousBotReply?: string }
): IntentDecision {
  const lower = message.toLowerCase().trim();

  // Priority patterns (greeting, handoff, tool_request)
  for (const [pattern, intent, confidence, reasoning] of PRIORITY_PATTERNS) {
    if (pattern.test(lower)) {
      return { intent, confidence, reasoning, capabilities: [], suggestedMaxTokens: intent === 'greeting' ? 100 : intent === 'handoff' ? 50 : 150, knowledgeIds: [], datasetIds: [], toolIds: [] };
    }
  }

  // FAQ / knowledge keywords
  const knowledgeIds: string[] = [];
  const knowledgeRows = db.prepare(`
    SELECT id, name, type, content FROM chatbot_knowledge
    WHERE chatbot_id = ? AND status = 'active' AND type IN ('faq','text','json') LIMIT 10
  `).all(chatbotId) as Array<{ id: string; name: string; content: string }>;

  for (const k of knowledgeRows) {
    const allWords = [...k.name.toLowerCase().split(/[,\s]+/), ...k.content.slice(0, 200).toLowerCase().split(/[,\s]+/).slice(0, 20)];
    if (allWords.some(w => w.length > 3 && lower.includes(w))) knowledgeIds.push(k.id);
  }
  if (knowledgeIds.length > 0) {
    return { intent: 'faq', confidence: 0.75, reasoning: `Matched ${knowledgeIds.length} knowledge source(s)`, capabilities: ['knowledge'], suggestedMaxTokens: 300, knowledgeIds, datasetIds: [], toolIds: [] };
  }

  // Dataset query
  for (const pattern of DATASET_PATTERNS) {
    const match = lower.match(pattern);
    if (match?.[1]?.length > 1) {
      return { intent: 'dataset_query', confidence: 0.7, reasoning: `Dataset query: "${match[1].trim()}"`, capabilities: ['datasets'], suggestedMaxTokens: 200, knowledgeIds: [], datasetIds: [], toolIds: [], datasetQuery: match[1].trim() };
    }
  }

  // Tool request (already handled above, but we need to look up tools)
  const toolRows = db.prepare('SELECT id, name FROM chatbot_tools WHERE chatbot_id = ? AND enabled = 1').all(chatbotId) as Array<{ id: string }>;
  if (toolRows.length > 0) {
    return { intent: 'tool_request', confidence: 0.65, reasoning: 'Tool request pattern matched', capabilities: ['tools'], suggestedMaxTokens: 150, knowledgeIds: [], datasetIds: [], toolIds: toolRows.map(t => t.id) };
  }

  // Memory recall
  if (context.previousBotReply && MEMORY_KEYWORDS.some(k => lower.includes(k))) {
    return { intent: 'memory_recall', confidence: 0.6, reasoning: 'Memory recall keywords detected', capabilities: ['memory', 'knowledge'], suggestedMaxTokens: 500, knowledgeIds: [], datasetIds: [], toolIds: [] };
  }

  return { intent: 'general', confidence: 0.5, reasoning: 'No specific intent matched', capabilities: ['memory', 'knowledge'], suggestedMaxTokens: 500, knowledgeIds: [], datasetIds: [], toolIds: [] };
}

export function isContactVip(contactId: string): boolean {
  const row = db.prepare('SELECT vip FROM customers WHERE id = ?').get(contactId) as { vip: number } | undefined;
  return (row?.vip ?? 0) === 1;
}
