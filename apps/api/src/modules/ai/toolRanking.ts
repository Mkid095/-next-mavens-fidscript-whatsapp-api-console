/**
 * Tool ranking — rank tools by relevance to the user's query.
 * Only sends the top-N most relevant tools to the LLM to reduce tokens
 * and hallucinations. For small tool sets (≤8), returns all.
 */
import type { ChatbotTool } from './toolCallingEngine.js';

/**
 * Rank tools by relevance to a user query.
 * Simple keyword overlap scoring: count how many query words appear in
 * the tool's name and description.
 */
export function rankTools(tools: ChatbotTool[], query: string): ChatbotTool[] {
  if (tools.length <= 8) return tools;

  const words = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (words.length === 0) return tools;

  const scored = tools.map(tool => {
    const haystack = `${tool.name} ${tool.description}`.toLowerCase();
    const score = words.reduce((acc, word) => acc + (haystack.includes(word) ? 1 : 0), 0);
    return { tool, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map(s => s.tool);
}
