/**
 * Intent Router — cheap classification before LLM call.
 *
 * Goal: decide which capabilities are needed for this turn, so we only call
 * expensive resources (LLM, knowledge search, dataset queries) when necessary.
 *
 * Decision tree:
 *   1. Is this a greeting / small talk?  → minimal, no tools needed
 *   2. Does it match a known FAQ keyword? → knowledge only
 *   3. Does it reference a known dataset field? → dataset query
 *   4. Does it look like an API/tool call request? → tools
 *   5. Does it need conversation history? → memory
 *   6. Otherwise → general AI
 *
 * This is intentionally cheap — regex + keyword matching, no LLM call.
 * Replace with a fast classifier (or second, smaller LLM) for v2.
 */
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

const GREETING_PATTERNS = [
  /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo|sup|hi there)/i,
  /^(thank|thanks)/i,
  /^(bye|goodbye|see you|later|goodnight)/i,
  /^(ok|okay|got it|understood|cool|nice|great)/i,
];

const HANDOFF_PATTERNS = [
  /talk to (a |an )?(human|agent|real person|live|person)/i,
  /connect me (to |with )(a |an )?(human|agent|someone|live support)/i,
  /I need (a |an )?(human|agent|real person)/i,
  /is there (a |an )?(real |live )?(person|human|agent)/i,
  /speak to (someone|somebody|support|team)/i,
];

const TOOL_REQUEST_PATTERNS = [
  /^(show|get|fetch|find|search|lookup|check|call|invoke|run|execute|list)/i,
  /can you (\w+)/i,
  /please (\w+)/i,
  /I want to (\w+)/i,
];

export function routeIntent(
  message: string,
  chatbotId: string,
  context: {
    conversationId?: string;
    contactId?: string;
    previousBotReply?: string;
  }
): IntentDecision {
  const lower = message.toLowerCase().trim();
  const workspaceId = ''; // resolved by caller

  // 1. Check handoff patterns first (highest priority)
  for (const pattern of HANDOFF_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        intent: 'handoff',
        confidence: 0.95,
        reasoning: `Handoff pattern matched: "${pattern}"`,
        capabilities: [],
        suggestedMaxTokens: 50,
        knowledgeIds: [],
        datasetIds: [],
        toolIds: [],
      };
    }
  }

  // 2. Check greeting patterns
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        reasoning: 'Greeting pattern matched',
        capabilities: [],
        suggestedMaxTokens: 100,
        knowledgeIds: [],
        datasetIds: [],
        toolIds: [],
      };
    }
  }

  // 3. Check FAQ / knowledge keywords
  const knowledgeIds: string[] = [];
  const knowledgeRows = db.prepare(`
    SELECT id, name, type, content FROM chatbot_knowledge
    WHERE chatbot_id = ? AND status = 'active' AND type IN ('faq','text','json')
    LIMIT 10
  `).all(chatbotId) as Array<{ id: string; name: string; content: string }>;

  for (const k of knowledgeRows) {
    const keywords = k.name.toLowerCase().split(/[,\s]+/);
    const contentWords = k.content.slice(0, 200).toLowerCase().split(/[,\s]+/).slice(0, 20);
    const allWords = [...keywords, ...contentWords];
    if (allWords.some(w => w.length > 3 && lower.includes(w))) {
      knowledgeIds.push(k.id);
    }
  }

  if (knowledgeIds.length > 0) {
    return {
      intent: 'faq',
      confidence: 0.75,
      reasoning: `Matched ${knowledgeIds.length} knowledge source(s) by keyword`,
      capabilities: ['knowledge'],
      suggestedMaxTokens: 300,
      knowledgeIds,
      datasetIds: [],
      toolIds: [],
    };
  }

  // 4. Check dataset field references
  const datasetQuery = extractDatasetQuery(lower);
  if (datasetQuery) {
    return {
      intent: 'dataset_query',
      confidence: 0.7,
      reasoning: `Dataset query extracted: "${datasetQuery}"`,
      capabilities: ['datasets'],
      suggestedMaxTokens: 200,
      knowledgeIds: [],
      datasetIds: [],
      toolIds: [],
      datasetQuery,
    };
  }

  // 5. Check tool request patterns
  for (const pattern of TOOL_REQUEST_PATTERNS) {
    if (pattern.test(lower)) {
      // Find tools for this bot
      const toolRows = db.prepare(`
        SELECT id, name FROM chatbot_tools WHERE chatbot_id = ? AND enabled = 1
      `).all(chatbotId) as Array<{ id: string; name: string }>;

      return {
        intent: 'tool_request',
        confidence: 0.65,
        reasoning: 'Tool request pattern matched',
        capabilities: ['tools'],
        suggestedMaxTokens: 150,
        knowledgeIds: [],
        datasetIds: [],
        toolIds: toolRows.map(t => t.id),
      };
    }
  }

  // 6. Check if memory recall is needed (follow-up conversation)
  if (context.previousBotReply) {
    const memoryKeywords = ['remember', 'forget', 'previously', 'earlier', 'before', 'last time', 'you said'];
    const needsMemory = memoryKeywords.some(k => lower.includes(k));
    if (needsMemory) {
      return {
        intent: 'memory_recall',
        confidence: 0.6,
        reasoning: 'Memory recall keywords detected',
        capabilities: ['memory', 'knowledge'],
        suggestedMaxTokens: 500,
        knowledgeIds: [],
        datasetIds: [],
        toolIds: [],
      };
    }
  }

  // 7. Default: general AI
  return {
    intent: 'general',
    confidence: 0.5,
    reasoning: 'No specific intent matched — general AI',
    capabilities: ['memory', 'knowledge'],
    suggestedMaxTokens: 500,
    knowledgeIds: [],
    datasetIds: [],
    toolIds: [],
  };
}

/**
 * Extract a dataset search query from natural language.
 * E.g. "do you have iphone in stock" → "iphone"
 */
function extractDatasetQuery(message: string): string | undefined {
  const patterns = [
    /(?:search|find|lookup|check|do you have|is there|in stock|available)(?: for |: ?)?(.+)/i,
    /(?:show|list|get)(?: me | all | the )?(.+?)(?:\s+(?:in stock|available|price| cost))?$/i,
    /price of (.+)/i,
    /cost of (.+)/i,
    /how much (?:is |does |are )?(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[1].length > 1) {
      return match[1].trim();
    }
  }
  return undefined;
}

/**
 * Check if a contact has VIP status — used by rules engine.
 */
export function isContactVip(contactId: string): boolean {
  const row = db.prepare(
    'SELECT vip FROM customers WHERE id = ?'
  ).get(contactId) as { vip: number } | undefined;
  return (row?.vip ?? 0) === 1;
}
