/**
 * toolsGenerate.ts — `fidscript chatbot tools <chatbot-id> attach <tool-id>`
 *
 * Attaches a tool to a chatbot.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../../lib/api-client.js';

export async function generateTools(
  chatbotId: string,
  toolId: string,
): Promise<void> {
  const client = new ApiClient();
  const base = `/api/platform/chatbots/${encodeURIComponent(chatbotId)}/tools`;

  try {
    const res = await client.jwtPostData<{ message?: string }>(base, { tool_ids: [toolId] });

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { chatbot_id: chatbotId, tool_id: toolId, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { chatbot_id: chatbotId, tool_id: toolId, ...res } });
      return;
    }
    console.error(`✓ Tool ${toolId} attached to chatbot ${chatbotId}.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
