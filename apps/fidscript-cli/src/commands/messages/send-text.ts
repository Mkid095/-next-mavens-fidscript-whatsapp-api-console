/**
 * messages/send-text.ts — Send a plain text message
 * POST /api/v1/messages/text/:instance
 *
 * Usage:
 *   fidscript send text my-instance --to +254700000000 --text "Hello!"
 *   fidscript message text my-instance --to +254700000000 --text "Hello!"
 */
import { ApiClient } from '../../lib/api-client.js';
import { flags } from '../../lib/api-client.js';
import { outputJson, outputFidscriptError, outputCliError } from '../../lib/api-client.js';
import { renderSuccess } from '../../lib/render.js';

interface SendTextResponse { key?: { id?: string }; message?: string; timestamp?: string; }

export async function sendText(instance: string, opts: { to: string; text: string }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }
  if (!opts.to || !opts.text) {
    outputCliError('CLI_ERROR', '--to and --text are required.');
    process.exit(1);
  }

  if (flags.mode === 'json') {
    const res = await client.post<SendTextResponse>(
      `/api/v1/messages/text/${encodeURIComponent(instance)}`,
      { number: opts.to, text: opts.text }
    );
    outputJson(res);
    return;
  }

  console.error(`Sending to ${opts.to} from ${instance}...`);
  try {
    const res = await client.post<SendTextResponse>(
      `/api/v1/messages/text/${encodeURIComponent(instance)}`,
      { number: opts.to, text: opts.text }
    );
    if (res.success) {
      renderSuccess(`Message sent${res.data?.key?.id ? ` (ID: ${res.data.key.id})` : ''}`);
    } else {
      console.error(`Failed: ${res.error}`);
      process.exit(1);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
