/**
 * chatbot/get.ts — fetch full chatbot config.
 * Auth: JWT. GET /api/platform/chatbots/:id
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

export async function getChatbot(id: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<unknown>(
      `/api/platform/chatbots/${encodeURIComponent(id)}`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data });
      return;
    }

    // Default: JSON pretty
    outputJson({ success: true, data });
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}