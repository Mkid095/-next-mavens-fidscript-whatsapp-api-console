/**
 * api.ts - `fidscript api call <METHOD> <PATH>`
 *
 * Generic escape hatch that lets the CLI reach ANY endpoint the API exposes.
 * Useful for endpoints we haven't wrapped as first-class commands yet
 * (groups/*, chats/*, profile/*, settings/*, etc.) and for one-off scripted
 * flows.
 *
 * Usage:
 *   fidscript api POST /api/v1/messages/media/my-bot \
 *     -d '{"number":"+254700000000","media_url":"https://x/y.jpg"}'
 *
 *   fidscript api call GET /api/auth/client/me --auth jwt
 *
 *   fidscript api GET /api/v1/instance/connection-state/my-bot
 *
 *   fidscript api POST /api/platform/chatbots/bot_123/publish \
 *     -d @./draft.json --auth jwt
 *
 *   fidscript api DELETE /api/instance/delete/my-bot --confirm --auth jwt
 *
 * Path defaults to API root. Authentication:
 *   - X-API-Key (default for /api/v1/*) - used unless --auth=jwt is given
 *   - Bearer JWT (default for /api/instance/*, /api/platform/*, /api/sse/*) - used if --auth=jwt
 *
 * Body (-d / --data) is JSON. Pass @file to load from disk. GET/DELETE ignore body.
 * For raw text bodies, use --raw '<text>'.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../lib/api-client.js';

async function loadBody(value: string, raw: boolean): Promise<unknown> {
  const fs = await import('node:fs');
  const body = value.startsWith('@') ? fs.readFileSync(value.slice(1), 'utf-8') : value;
  if (raw) return body;
  try {
    return JSON.parse(body);
  } catch (err) {
    outputCliError('INVALID_JSON', `-d body must be valid JSON (or pass --raw for text): ${(err as Error).message}`);
    process.exit(1);
  }
}

export interface ApiCallOpts {
  method: string;
  path: string;
  data?: string;
  raw?: boolean;
  auth?: 'apikey' | 'jwt';
  /** For DELETE without body - pass --confirm to auto-acknowledge the destructive intent. */
  confirm?: boolean;
}

export async function apiCall(opts: ApiCallOpts): Promise<void> {
  const client = new ApiClient();

  if (!client.hasCredentials && !client.hasJwt) {
    outputCliError('NOT_AUTHENTICATED', 'No credentials. Set FIDSCRIPT_API_KEY or run `fidscript login`.');
    process.exit(1);
  }

  const method = opts.method.toUpperCase();
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    outputCliError('UNSUPPORTED_METHOD', `Unsupported method '${opts.method}'. Use GET / POST / PUT / PATCH / DELETE.`);
    process.exit(1);
  }

  // Auto-pick auth: if path starts with /api/v1, use API key unless overridden.
  // Otherwise, use JWT unless overridden.
  let auth: 'apikey' | 'jwt';
  if (opts.auth) {
    auth = opts.auth;
  } else if (opts.path.startsWith('/api/v1')) {
    auth = 'apikey';
  } else {
    auth = 'jwt';
  }

  if (auth === 'apikey' && !client.hasCredentials) {
    outputCliError('NO_API_KEY', 'This path uses X-API-Key auth but no API key is set.');
    process.exit(1);
  }
  if (auth === 'jwt' && !client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'This path uses Bearer JWT auth but you are not signed in. Run `fidscript login`.');
    process.exit(1);
  }

  // For destructive methods, require --confirm (or auto-confirm in --json/--yaml)
  if ((method === 'DELETE' || method === 'PATCH') && !opts.confirm && flags.mode === 'default') {
    outputCliError('MISSING_CONFIRM', `${method} ${opts.path} is destructive. Pass --confirm to proceed.`);
    process.exit(1);
  }

  // Load body
  let body: unknown;
  if (opts.data) {
    if (method === 'GET' || method === 'DELETE') {
      console.error(`(note: ignoring -d on ${method} request)`);
    } else {
      body = await loadBody(opts.data, Boolean(opts.raw));
    }
  }

  try {
    let res;
    if (auth === 'jwt') {
      switch (method) {
        case 'GET':    res = await client.jwtGet(opts.path); break;
        case 'POST':   res = await client.jwtPost(opts.path, body); break;
        case 'PUT':    res = await client.jwtPut(opts.path, body); break;
        case 'DELETE': res = await client.jwtDelete(opts.path); break;
        default: throw new Error(`Unreachable: method ${method}`);
      }
    } else {
      switch (method) {
        case 'GET':    res = await client.get(opts.path); break;
        case 'POST':   res = await client.post(opts.path, body); break;
        case 'PUT':    res = await client.put(opts.path, body); break;
        case 'DELETE': res = await client.delete(opts.path); break;
        default: throw new Error(`Unreachable: method ${method}`);
      }
    }

    if (flags.mode === 'json') {
      outputJson(res);
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml(res);
      return;
    }
    if (res.success) {
      console.log(JSON.stringify(res.data, null, 2));
    } else {
      console.error(`error: ${res.error}`);
      process.exit(1);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}