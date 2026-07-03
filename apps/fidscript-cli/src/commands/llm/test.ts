/**
 * llm/test.ts — test an LLM connection by sending a "Hi" prompt.
 * Auth: JWT. POST /api/platform/llm-connections/:id/test
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';

interface TestResp { success: boolean; message?: string; error?: string; }

export async function testConnection(id: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  try {
    const res = await client.jwtPostData<TestResp>(
      `/api/platform/llm-connections/${encodeURIComponent(id)}/test`,
      {},
    );

    if (flags.mode === 'json') {
      outputJson({ success: res.success, data: res });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: res.success, data: res });
      return;
    }

    if (res.success) {
      console.error(`✓ Connection '${id}' verified.`);
    } else {
      console.error(`✗ Connection '${id}' failed: ${res.error ?? res.message ?? 'unknown error'}`);
      process.exit(1);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}