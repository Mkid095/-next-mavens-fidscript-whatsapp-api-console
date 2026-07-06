/**
 * Response Formatter — formats an LLM raw response for WhatsApp:
 *
 *  1. Strip <think>...
 *  2. Strip markdown formatting (preserve WhatsApp-native *bold* / _italic_)
 *  3. Truncate to ≤ 100 words
 *  4. Collapse multiple blank lines
 */

export function formatReplyForWhatsApp(raw: string): string {
  if (!raw) return raw;

  let text = raw;

  // 1. Strip <think>...
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*$/gi, '');

  // 2. Remove code fences (keep inline content but drop the fences)
  text = text.replace(/```[a-zA-Z0-9_-]*\n?/g, '');
  text = text.replace(/`([^`\n]+)`/g, '$1'); // inline code backticks

  // 3. Remove headings (lines starting with #)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 4. Convert bullet lists "- " or "* " to WhatsApp-friendly bullet "• "
  text = text.replace(/^[\s]*[-*]\s+/gm, '• ');

  // 4b. Strip **bold** markers (keep inner text) — WhatsApp uses *bold* not **bold**
  text = text.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  // 4c. Strip table pipes and dashes (markdown tables render badly in WA)
  const lines = text.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if (/^\s*\|.*\|\s*$/.test(line) && /[-=:]/.test(line)) {
      continue; // separator line
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length === 2) {
        out.push(`${cells[0]}: ${cells[1]}`);
      } else if (cells.length > 0) {
        out.push(cells.map((c) => `• ${c}`).join(' '));
      }
      continue;
    }
    out.push(line);
  }
  text = out.join('\n');

  // 5. Convert markdown links [text](url) → "text (url)"
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // 6. Remove blockquote markers but keep the text
  text = text.replace(/^\s*>\s?/gm, '');

  // 7. Collapse 3+ newlines into 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // 8. Trim each line
  text = text.split('\n').map((l) => l.trimEnd()).join('\n');

  text = text.trim();

  // 9. Truncate to 100 words
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 100) {
    text = words.slice(0, 100).join(' ') + '...';
  }

  // 10. Strip common LLM prefix patterns
  text = text.replace(/^\s*(?:\[[^\]]+\]\s*:|bot\s*:|assistant\s*:)\s*/i, '');

  return text;
}
