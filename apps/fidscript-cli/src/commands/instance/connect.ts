/**
 * instance/connect.ts - Initiate connection (logout old + fresh QR)
 * GET /api/v1/instance/connect/:instance
 */
import { ApiClient } from '../../lib/api-client.js';
import { flags } from '../../lib/api-client.js';
import { outputJson, outputFidscriptError, outputCliError } from '../../lib/api-client.js';
import { renderQr } from '../../lib/render.js';

interface ConnectResponse {
  qrcode?: { base64?: string; code?: string };
  instance?: { state?: string };
}

export async function connectInstance(name: string, opts: { number?: string }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }

  if (flags.mode === 'json') {
    const res = await client.get<ConnectResponse>(
      `/api/v1/instance/connect/${encodeURIComponent(name)}${opts.number ? `?number=${opts.number}` : ''}`
    );
    outputJson(res);
    return;
  }

  console.error(`Connecting '${name}'...`);
  try {
    const res = await client.get<ConnectResponse>(
      `/api/v1/instance/connect/${encodeURIComponent(name)}${opts.number ? `?number=${opts.number}` : ''}`
    );
    const qr = res?.data?.qrcode;
    if (qr?.base64 || qr?.code) {
      await renderQr(qr.base64 || qr.code!);
      console.error('Scan with WhatsApp > Linked Devices within 60s.');
    } else {
      console.error(`Connected. State: ${res?.data?.instance?.state ?? 'unknown'}`);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
