/**
 * instance/qr.ts
 */
import { ApiClient } from '../../lib/api-client.js';
import { flags } from '../../lib/api-client.js';
import { outputJson, outputFidscriptError, outputCliError } from '../../lib/api-client.js';
import { renderQr } from '../../lib/render.js';

interface QrResponse { qrcode?: { base64?: string; code?: string }; }

export async function qrInstance(name: string, opts: { number?: string }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }

  const qs = opts.number ? '?number=' + opts.number : '';
  const url = '/api/v1/instance/qr/' + encodeURIComponent(name) + qs;

  if (flags.mode === 'json') {
    const res = await client.get<QrResponse>(url);
    outputJson(res);
    return;
  }

  console.error('Generating QR for ' + name + '...');
  console.error('Open WhatsApp > Linked Devices > Link a Device.');

  try {
    const res = await client.get<QrResponse>(url);
    const qr = res?.data?.qrcode;
    const base64 = qr?.base64 || qr?.code;
    if (!base64) { console.error('No QR returned.'); return; }
    await renderQr(base64);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
