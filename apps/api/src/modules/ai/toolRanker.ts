/**
 * toolRanker.ts — intent-based tool ranking.
 *
 * Before sending tools to the LLM, score each tool's relevance to the
 * user's message. Only expose the top-N most relevant tools.
 *
 * This dramatically reduces:
 *   - Token usage (don't send 50 tools when 2 are relevant)
 *   - Hallucinations (LLM can't accidentally call an irrelevant tool)
 *   - Latency (shorter system prompt = faster generation)
 *   - Cost (fewer input tokens)
 *
 * Scoring is keyword-based (no LLM call needed — keeps it fast + free):
 *   - Tool name keywords matched against the message
 *   - Tool description keywords matched
 *   - Parameter names matched
 *   - All-caps boost for exact word matches
 */

import type { ChatbotTool } from './toolCallingEngine.js';

const MAX_TOOLS_PER_TURN = 8;
const MIN_SCORE_THRESHOLD = 0.05;

interface ScoredTool {
  tool: ChatbotTool;
  score: number;
}

/** Tokenize a string into lowercase keywords. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9_]+/)
      .filter((w) => w.length > 2),
  );
}

/** Score a single tool against the user's message tokens. */
function scoreTool(tool: ChatbotTool, messageTokens: Set<string>): number {
  let score = 0;

  // Score from tool name (highest weight — names are semantic)
  const nameTokens = tokenize(tool.name);
  for (const tok of nameTokens) {
    if (messageTokens.has(tok)) score += 0.5;
    // Partial match (e.g. "product" in message matches "search_products")
    for (const msgTok of messageTokens) {
      if (msgTok.includes(tok) || tok.includes(msgTok)) {
        score += 0.2;
        break;
      }
    }
  }

  // Score from description
  const descTokens = tokenize(tool.description);
  for (const tok of descTokens) {
    if (messageTokens.has(tok)) score += 0.15;
  }

  // Score from parameter names
  let params: Record<string, unknown> = {};
  try { params = JSON.parse(tool.parameters_json); } catch { /* ignore */ }
  const propNames = Object.keys((params as { properties?: Record<string, unknown> }).properties ?? {});
  for (const prop of propNames) {
    const propTokens = tokenize(prop);
    for (const tok of propTokens) {
      if (messageTokens.has(tok)) score += 0.1;
    }
  }

  return score;
}

/**
 * Rank tools by relevance to the user's message.
 * Returns the top-N tools above the threshold.
 *
 * If the user has ≤ MAX_TOOLS_PER_TURN tools attached, returns all of them
 * (ranking overhead isn't worth it for small tool sets).
 */
export function rankTools(tools: ChatbotTool[], userMessage: string): ChatbotTool[] {
  // Small tool sets — don't bother ranking
  if (tools.length <= MAX_TOOLS_PER_TURN) {
    return tools;
  }

  const messageTokens = tokenize(userMessage);

  const scored: ScoredTool[] = tools.map((tool) => ({
    tool,
    score: scoreTool(tool, messageTokens),
  }));

  // Sort by score descending, take top N above threshold
  const ranked = scored
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score >= MIN_SCORE_THRESHOLD)
    .slice(0, MAX_TOOLS_PER_TURN);

  // Fallback: if nothing scored above threshold, return the top N by score
  // (even if 0) so the LLM always has SOME tools to work with
  if (ranked.length === 0) {
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_TOOLS_PER_TURN)
      .map((s) => s.tool);
  }

  return ranked.map((s) => s.tool);
}