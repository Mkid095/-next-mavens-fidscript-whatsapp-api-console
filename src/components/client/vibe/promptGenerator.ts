import { type ApiEndpoint } from '../../../data/apiEndpoints/index';
import { buildCurl, buildCodeSnippet, type CodeLang } from '../../../utils/codegen';
import { flattenFields, buildExampleBody } from './promptBuilder.js';
import { installSnippet, requestHelperSnippet } from './promptSnippets.js';

/**
 * Render a complete integration-prompt markdown document for the chosen
 * endpoints. Sections: Project Context, API Credentials, Quick Reference,
 * Installation, Base Request Helper, Endpoint Reference, Integration Notes,
 * Webhook Integration. Used by Step3Prompt.
 */
export function generatePrompt(
  apiKey: string,
  clientName: string | undefined,
  selectedEps: ApiEndpoint[],
  lang: CodeLang,
  baseUrl: string,
  instanceName?: string,
): string {
  const lines: string[] = [];
  const nl = (s = '') => lines.push(s);
  const grouped = selectedEps.reduce<Record<string, ApiEndpoint[]>>((acc, ep) => {
    (acc[ep.category] ||= []).push(ep);
    return acc;
  }, {});

  // Project context + credentials + quick reference
  nl(`# FIDScript WhatsApp API — Integration Prompt`);
  nl('');
  nl(`> Generated for ${clientName ? `"${clientName}"` : 'your application'} at ${new Date().toLocaleString()}`);
  nl('');
  nl(`## Project Context`);
  nl('');
  nl(`You are integrating a WhatsApp Business API into a web or mobile application. The backend is a Node.js/Express server (or your chosen framework). The integration communicates with the **FIDScript WhatsApp API**, a white-label wrapper over the Evolution API v2 gateway.`);
  nl('');
  nl(`## API Credentials`);
  nl('');
  nl(`| Variable | Value |`);
  nl(`|---|---|`);
  nl(`| Base URL | \`${baseUrl}\` |`);
  if (apiKey) nl(`| API Key | \`${apiKey}\` |`);
  if (instanceName) nl(`| Instance | \`${instanceName}\` |`);
  nl('');
  if (apiKey) {
    nl(`**Auth header** required on every request:`);
    nl('```');
    nl(`X-API-Key: ${apiKey}`);
    nl('```');
    nl('');
  }
  nl(`## Quick Reference`);
  nl('');
  nl(`| What | Detail |`);
  nl(`|---|---|`);
  nl(`| Token cost | Text = 1 token; Media/Status/Audio/Sticker = 2 tokens; Management ops = free |`);
  nl(`| Rate limits | Sends = per-plan limit; Reads (V1_READ) = 600/min; Mutations (V1_MUTATE) = 120/min; Profile/restart (V1_STRICT) = 30/min |`);
  nl(`| Idempotency | Send endpoints accept \`Idempotency-Key: <uuid>\` header — retries return cached result, no re-charge |`);
  nl(`| Instance name | Your WhatsApp container name (e.g. \`my-shop\`) — passed as \`:instance\` path parameter |`);
  nl('');

  // Installation + base request helper
  nl(`## Installation`);
  nl('');
  nl(`Install the HTTP client for your language:`);
  nl('');
  for (const line of installSnippet(lang)) nl(line);
  nl('');
  nl(`## Base Request Helper`);
  nl('');
  for (const line of requestHelperSnippet(lang, baseUrl, apiKey)) nl(line);
  nl('');

  // Per-endpoint reference
  nl(`## Endpoint Reference`);
  nl('');
  for (const [catName, eps] of Object.entries(grouped)) {
    nl(`### ${catName}`);
    nl('');
    for (const ep of eps) {
      const pathDisplay = ep.path.replace('/api/v1', '').replace(':instance', '{instanceName}');
      const params = flattenFields(ep.bodyFields);
      const curlExample = buildCurl(ep, apiKey);

      nl(`#### \`${ep.method} ${pathDisplay}\` — ${ep.name}`);
      nl('');
      nl(ep.desc);
      nl('');
      if (ep.cost !== undefined) {
        nl(`**Cost:** ${ep.cost === 0 ? 'Free (management operation)' : `${ep.cost} token${ep.cost > 1 ? 's' : ''}`}`);
        nl('');
      }
      nl(`**Path parameters:**`);
      if (ep.pathParams.length) {
        for (const p of ep.pathParams) nl(`- \`${p.name}\` — ${p.desc || 'required path segment'}`);
      } else {
        nl(`- (none — uses query params or request body)`);
      }
      nl('');

      if (params.length) {
        nl(`**Request body fields:**`);
        nl(`| Field | Type | Required | Description |`);
        nl(`|---|---|---|---|`);
        for (const p of params) nl(`| \`${p.name}\` | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.desc} |`);
        nl('');
      }

      nl(`**Example cURL:**`);
      nl('```bash');
      nl(curlExample);
      nl('```');
      nl('');

      if (lang !== 'curl') {
        const codeExample = buildCodeSnippet(ep, apiKey, lang);
        const langLabel = lang === 'node' ? 'JavaScript' : lang === 'python' ? 'Python' : lang === 'php' ? 'PHP' : 'Go';
        nl(`**Example (${langLabel}):**`);
        nl('```' + (lang === 'node' ? 'javascript' : lang === 'python' ? 'python' : lang === 'php' ? 'php' : 'go'));
        nl(codeExample);
        nl('```');
        nl('');
      }

      nl(`**Success response:**`);
      nl('```json');
      nl(JSON.stringify(ep.response || { success: true, data: {} }, null, 2));
      nl('```');
      nl('');
      nl('---');
      nl('');
    }
  }

  // Integration notes + webhooks
  nl(`## Integration Notes`);
  nl('');
  for (const note of [
    `1. **Instance name** — Replace \`{instanceName}\` in the path with your actual WhatsApp container name (e.g. \`my-shop\`, \`prod-instance\`). Get your container name from the dashboard.`,
    `2. **Phone numbers** — Use international format without the \`+\` sign (e.g. \`254712345678\`, not \`+254712345678\`).`,
    `3. **Media URLs** — For \`sendMedia\`, the \`media_url\` must be a publicly accessible URL (e.g. from your CDN or object storage).`,
    `4. **Error handling** — Always check \`result.success\` before using \`result.data\`. On failure, \`result.error\` contains the error message.`,
    `5. **Token balance** — Monitor your token balance at the dashboard. Top up at the Token Store.`,
    `6. **Idempotency** — For send endpoints, pass \`Idempotency-Key: <uuid>\` header to prevent duplicate sends on retry.`,
  ]) nl(note);
  nl('');
  nl(`## Webhook Integration`);
  nl('');
  nl(`Configure your webhook URL in the dashboard (Settings → Instance → Webhook). Events you can receive:`);
  nl(`- \`messages.upsert\` — inbound messages (text, image, video, document, voice, etc.)`);
  nl(`- \`connection.update\` — connection state changes (connected/disconnected)`);
  nl(`- \`qrcode.updated\` — new QR code generated`);
  nl('');
  nl(`Example webhook handler (Node.js/Express):`);
  nl('```javascript');
  nl('app.post("/webhook/fidscript", express.json(), (req, res) => {');
  nl('  const { event, payload } = req.body;');
  nl('  if (event === "messages.upsert") {');
  nl('    const { key, pushName, message, messageType } = payload;');
  nl('    console.log(`From: ${pushName} (${key.remoteJid})`);');
  nl('    console.log(`Type: ${messageType}`);');
  nl('    console.log(`Message:`, message);');
  nl('  }');
  nl('  res.sendStatus(200);');
  nl('});');
  nl('```');
  nl('');
  nl(`---\n*Generated by FIDScript · ${new Date().toISOString()}*`);

  return lines.join('\n');
}
