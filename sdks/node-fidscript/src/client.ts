/**
 * client.ts — base HTTP client for the FIDScript API.
 *
 * Handles auth (X-API-Key OR Bearer JWT), JSON encoding, error parsing, and retries.
 * All other modules (sends, instances, chatbots, …) build on this.
 */
import { FidscriptError } from './errors.js';

export interface FidscriptClientOptions {
  /** Base URL of the API. Default: https://whatsapp.fidscript.com */
  baseUrl?: string;
  /** API key (X-API-Key auth) — used for /api/v1/* endpoints */
  apiKey?: string;
  /** JWT Bearer token — used for /api/instance, /api/platform, /api/sse */
  jwt?: string;
  /** Request timeout in ms. Default: 30_000. */
  timeoutMs?: number;
  /** Number of retries on 429/5xx. Default: 2. */
  retries?: number;
  /** Optional fetch implementation (for tests/Node 18+). */
  fetchImpl?: typeof fetch;
}

export class FidscriptClient {
  public readonly baseUrl: string;
  public readonly timeoutMs: number;
  public readonly retries: number;
  private readonly fetchImpl: typeof fetch;
  private apiKey?: string;
  private jwt?: string;

  constructor(opts: FidscriptClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? 'https://whatsapp.fidscript.com').replace(/\/$/, '');
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.retries = opts.retries ?? 2;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.apiKey = opts.apiKey;
    this.jwt = opts.jwt;
  }

  setApiKey(key: string | undefined): void { this.apiKey = key; }
  setJwt(token: string | undefined): void { this.jwt = token; }

  /** True if either an API key or a JWT is set. */
  hasAuth(): boolean { return Boolean(this.apiKey) || Boolean(this.jwt); }

  /**
   * Build the URL for a path. Paths starting with /api/v1 use X-API-Key;
   * anything else uses Bearer JWT. Override with `auth`.
   */
  buildUrl(path: string): string {
    if (!path.startsWith('/')) path = `/${path}`;
    return `${this.baseUrl}${path}`;
  }

  /**
   * Low-level request. Most users should use the higher-level methods on
   * Fidscript (e.g. `fs.sends.text(...)`).
   */
  async request<T = unknown>(method: string, path: string, body?: unknown, opts: { auth?: 'apikey' | 'jwt'; raw?: boolean } = {}): Promise<T> {
    const inferred = path.startsWith('/api/v1') ? 'apikey' : 'jwt';
    const auth = opts.auth ?? inferred;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (auth === 'apikey') {
      if (!this.apiKey) throw new FidscriptError('X-API-Key required for this path', 'UNAUTHORIZED', 401);
      headers['X-API-Key'] = this.apiKey;
    } else {
      if (!this.jwt) throw new FidscriptError('Bearer JWT required for this path', 'UNAUTHORIZED', 401);
      headers['Authorization'] = `Bearer ${this.jwt}`;
    }
    if (body !== undefined && !opts.raw) {
      headers['Content-Type'] = 'application/json';
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), this.timeoutMs);
      try {
        const res = await this.fetchImpl(this.buildUrl(path), {
          method,
          headers,
          body: body === undefined ? undefined : (opts.raw ? String(body) : JSON.stringify(body)),
          signal: ac.signal,
        });
        clearTimeout(timer);

        if (res.status === 429 || res.status >= 500) {
          lastErr = await this.toError(res);
          if (attempt < this.retries) continue;
          throw lastErr;
        }

        const text = await res.text();
        const json = text ? safeJson(text) : null;

        if (!res.ok) {
          throw this.toError(res, json);
        }

        if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
          return (json as { data: T }).data;
        }
        return json as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof FidscriptError) throw err;
        lastErr = err;
        if (attempt >= this.retries) {
          throw new FidscriptError(
            err instanceof Error ? err.message : String(err),
            'NETWORK_ERROR',
            0,
          );
        }
      }
    }
    throw (lastErr instanceof Error ? lastErr : new Error(String(lastErr)));
  }

  private async toError(res: Response, body?: unknown): Promise<FidscriptError> {
    const status = res.status;
    const errBody = (body && typeof body === 'object') ? (body as { error?: string; code?: string }) : undefined;
    const message = errBody?.error ?? `${res.status} ${res.statusText}`;
    const code = errBody?.code ?? this.codeForStatus(status);
    return new FidscriptError(message, code, status, body);
  }

  private codeForStatus(status: number): string {
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 400) return 'BAD_REQUEST';
    if (status === 409) return 'CONFLICT';
    if (status === 402) return 'PAYMENT_REQUIRED';
    return 'INTERNAL_ERROR';
  }
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}