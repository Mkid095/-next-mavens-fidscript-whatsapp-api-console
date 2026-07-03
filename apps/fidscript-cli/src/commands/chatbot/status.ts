/**
 * chatbot/status.ts — health check for a chatbot.
 * Auth: JWT. GET /api/platform/chatbots/:id/health
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

interface HealthResp {
  status: string;
  provider: string;
  model: string | null;
  knowledge: number;
  tools: number;
  triggers: number;
  last_test: string | null;
}

export async function statusChatbot(id: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<HealthResp>(
      `/api/platform/chatbots/${encodeURIComponent(id)}/health`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data });
      return;
    }

    console.error(`Chatbot ${id} health:`);
    console.error(`  status:   ${data.status}`);
    console.error(`  provider: ${data.provider}${data.model ? ` (${data.model})` : ''}`);
    console.error(`  knowledge sources: ${data.knowledge}`);
    console.error(`  tools:    ${data.tools}`);
    console.error(`  triggers: ${data.triggers}`);
    console.error(`  last test: ${data.last_test ?? '(never)'}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}