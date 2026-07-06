/**
 * toolsDispatch.ts — `fidscript chatbot tools <chatbot-id> [list|attach|detach]`
 *
 * Subcommand dispatcher for chatbot tools.
 */
import {
  outputCliError,
} from '../../../lib/api-client.js';
import { listTools } from './toolsList.js';
import { generateTools } from './toolsGenerate.js';
import { inspectTools } from './toolsInspect.js';

export async function chatbotTools(
  chatbotId: string,
  action: string | undefined,
  opts: { toolId?: string },
): Promise<void> {
  if (!action || action === 'list') {
    await listTools(chatbotId);
    return;
  }

  if (action === 'attach') {
    if (!opts.toolId) {
      outputCliError('TOOL_ID_REQUIRED', 'Usage: fidscript chatbot tools <chatbot-id> attach <tool-id>');
      process.exit(1);
    }
    await generateTools(chatbotId, opts.toolId);
    return;
  }

  if (action === 'detach') {
    if (!opts.toolId) {
      outputCliError('TOOL_ID_REQUIRED', 'Usage: fidscript chatbot tools <chatbot-id> detach <tool-id>');
      process.exit(1);
    }
    await inspectTools(chatbotId, opts.toolId);
    return;
  }

  outputCliError('UNKNOWN_ACTION', `Unknown action '${action}'. Use: list | attach <tool-id> | detach <tool-id>`);
  process.exit(1);
}
