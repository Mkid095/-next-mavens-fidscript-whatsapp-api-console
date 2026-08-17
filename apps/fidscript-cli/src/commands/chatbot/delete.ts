/**
 * chatbot/delete.ts - delete a chatbot (requires --confirm).
 * Auth: JWT. DELETE /api/platform/chatbots/:id
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

/** Destructive commands auto-confirm when --json/--yaml is set (agent has stated intent). */
function isAutoConfirmed(opts: { confirm: boolean }): boolean {
  return Boolean(opts.confirm) || flags.mode === 'json' || flags.mode === 'yaml';
}

export async function deleteChatbot(id: string, opts: { confirm: boolean }): Promise<void> {
  if (!isAutoConfirmed(opts)) {
    outputCliError('MISSING_CONFIRM', `Deletion requires --confirm flag. fidscript chatbot delete ${id} --confirm`);
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const res = await client.jwtDelete<{ success: boolean; message?: string }>(
      `/api/platform/chatbots/${encodeURIComponent(id)}`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { deleted: id, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { deleted: id, ...res } });
      return;
    }

    console.error(`✓ Chatbot ${id} deleted.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}