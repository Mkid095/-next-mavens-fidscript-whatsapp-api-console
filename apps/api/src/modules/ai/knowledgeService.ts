/**
 * Knowledge Retrieval Service — JSON / text / FAQ sources.
 *
 * Supports types:
 *   - json   : structured key-value data (e.g. product catalog slice)
 *   - text   : free-form text chunks
 *   - faq    : Q&A pairs matched by question keyword
 *
 * The LLM never sees raw SQL — knowledge is pre-indexed into chunks
 * with optional keyword metadata for fast retrieval.
 */
import db from '../../database.js';

export interface KnowledgeChunk {
  id: string;
  knowledgeId: string;
  contentText: string;
  tokenCount: number;
}

export interface KnowledgeResult {
  knowledgeId: string;
  name: string;
  type: string;
  content: string;
  score: number;
  chunks: KnowledgeChunk[];
}

/**
 * Retrieve relevant knowledge for a given query.
 * Returns top-N results with content for context injection.
 */
export async function retrieveKnowledge(
  chatbotId: string,
  query: string,
  topK = 3
): Promise<KnowledgeResult[]> {
  const lowerQuery = query.toLowerCase();

  // Load all active knowledge sources for this bot
  const sources = db.prepare(`
    SELECT id, name, type, content, ref
    FROM chatbot_knowledge
    WHERE chatbot_id = ? AND status = 'active'
  `).all(chatbotId) as Array<{
    id: string;
    name: string;
    type: string;
    content: string;
    ref: string;
  }>;

  const results: KnowledgeResult[] = [];

  for (const source of sources) {
    let score = 0;
    let content = '';

    if (source.type === 'faq') {
      // Match by question keyword
      const lines = source.content.split('\n').filter(Boolean);
      const qaPairs: Array<{ q: string; a: string }> = [];

      for (const line of lines) {
        if (line.startsWith('Q:') || line.startsWith('Q：')) {
          const q = line.replace(/^Q:?\s*/, '').trim();
          // Next non-empty line is the answer
          const idx = lines.indexOf(line);
          const nextLine = lines[idx + 1];
          if (nextLine && (nextLine.startsWith('A:') || nextLine.startsWith('A：'))) {
            const a = nextLine.replace(/^A:?\s*/, '').trim();
            qaPairs.push({ q, a });
          }
        }
      }

      for (const { q, a } of qaPairs) {
        const qWords = q.toLowerCase().split(/\s+/);
        const matchCount = qWords.filter(w => w.length > 2 && lowerQuery.includes(w)).length;
        if (matchCount > 0) {
          const pairScore = matchCount / qWords.length;
          if (pairScore > score) {
            score = pairScore;
            content = `Q: ${q}\nA: ${a}`;
          }
        }
      }
    } else if (source.type === 'json') {
      // Match by keyword in key names or values
      try {
        const json = JSON.parse(source.content);
        const jsonText = JSON.stringify(json).toLowerCase();
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 3);
        const matchCount = queryWords.filter(w => jsonText.includes(w)).length;
        score = matchCount / queryWords.length;
        // Return a readable excerpt
        content = JSON.stringify(json, null, 2).slice(0, 1000);
      } catch {
        score = 0;
        content = source.content.slice(0, 500);
      }
    } else {
      // text — simple keyword overlap
      const words = source.content.toLowerCase().split(/\s+/);
      const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 3);
      const matchCount = words.filter(w => queryWords.some(q => w.includes(q) || q.includes(w))).length;
      score = queryWords.length > 0 ? matchCount / queryWords.length : 0;
      content = source.content.slice(0, 1000);
    }

    if (score > 0.1) {
      // Load chunks if available
      const chunks = db.prepare(`
        SELECT id, knowledge_id, content_text, token_count
        FROM chatbot_knowledge_chunks
        WHERE knowledge_id = ?
        LIMIT 5
      `).all(source.id) as unknown as KnowledgeChunk[];

      results.push({
        knowledgeId: source.id,
        name: source.name,
        type: source.type,
        content,
        score,
        chunks,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Format knowledge results into a context string for LLM injection.
 */
export function formatKnowledgeContext(results: KnowledgeResult[]): string {
  if (results.length === 0) return '';

  const sections = results.map(r => {
    const typeLabel = r.type.toUpperCase();
    return `[${typeLabel}: ${r.name}]\n${r.content}`;
  });

  return `--- KNOWLEDGE BASE ---\n${sections.join('\n\n')}\n--- END KNOWLEDGE ---`;
}
