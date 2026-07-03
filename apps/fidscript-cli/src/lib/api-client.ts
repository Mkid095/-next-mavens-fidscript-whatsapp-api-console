/**
 * api-client.ts — typed fetch wrapper for the FIDScript API
 *
 * Handles:
 * - Auth header (X-API-Key)
 * - Base URL resolution (flag → env → credentials file → default)
 * - JSON error parsing + user-friendly FidscriptError
 * - Output mode (normal / JSON / YAML)
 */
import { loadCredentials, saveCredentials, DEFAULT_BASE_URL, type Credentials } from './credentials.js';
import { FidscriptError, parseApiError } from './errors.js';
import { renderJson, renderYaml, renderError, renderSuccess } from './render.js';
import YAML from 'yaml';
import pc from 'picocolors';

export type OutputMode = 'default' | 'json' | 'yaml';

// ── Global flags (mutable object — safe to mutate properties) ─────────────────

export const flags = {
  mode: 'default' as OutputMode,
  noColor: false,
  quiet: false,
};

export function setJsonMode(): void { flags.mode = 'json'; }
export function setYamlMode(): void { flags.mode = 'yaml'; }
export function setNoColor(): void { flags.noColor = true; }

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiClient {
  private apiKey: string;
  private baseUrl: string;
  private jwt: string;
  private email: string;
  private verbose: boolean;

  constructor(
    private apiKeyOverride?: string,
    private baseUrlOverride?: string,
    private jwtOverride?: string,
    verbose = false,
  ) {
    // Priority: explicit → env var → credentials file → default
    const stored = loadCredentials();
    const envKey = process.env.FIDSCRIPT_API_KEY;
    const envJwt = process.env.FIDSCRIPT_JWT;

    this.apiKey = apiKeyOverride || envKey || stored?.apiKey || '';
    this.jwt = jwtOverride || envJwt || stored?.jwt || '';
    this.email = stored?.email || '';
    this.baseUrl = baseUrlOverride || process.env.FIDSCRIPT_BASE_URL || stored?.baseUrl || DEFAULT_BASE_URL;
    this.verbose = verbose;

    // If we resolved a key from env or got a new override, persist for future use
    if ((this.apiKey || this.jwt) && !stored) {
      this.persistCredentials();
    }
  }

  /** Persist current key + jwt to ~/.fidscript/credentials */
  persistCredentials(): void {
    if (!this.apiKey && !this.jwt) return;
    saveCredentials({
      apiKey: this.apiKey,
      jwt: this.jwt || undefined,
      email: this.email || undefined,
      baseUrl: this.baseUrl,
    } satisfies Credentials);
  }

  /** Replace stored JWT and persist */
  setJwt(jwt: string): void {
    this.jwt = jwt;
    this.persistCredentials();
  }

  /** Replace stored API key and persist */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.persistCredentials();
  }

  /** Set the email used for refresh (no-op for persisted state, just in-memory) */
  setEmail(email: string): void {
    this.email = email;
  }

  getEmail(): string {
    return this.email;
  }

  /** Headers for /api/v1/* routes (X-API-Key) */
  private get apiKeyHeaders(): Record<string, string> {
    return this.apiKey ? { 'X-API-Key': this.apiKey } : {};
  }

  /** Headers for /api/instance, /api/platform, /api/sse routes (Bearer JWT) */
  private get jwtHeaders(): Record<string, string> {
    return this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {};
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    auth: 'apiKey' | 'jwt' = 'apiKey',
  ): Promise<ApiResponse<T>> {
    const authHeaders = auth === 'jwt' ? this.jwtHeaders : this.apiKeyHeaders;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    if (this.verbose) {
      console.error(`${pc.dim('→')} ${method} ${this.url(path)} (${auth})`);
      if (body) console.error(`${pc.dim('  body:')} ${JSON.stringify(body)}`);
    }

    const res = await fetch(this.url(path), {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = { error: `HTTP ${res.status}: ${await res.text()}` };
    }

    if (this.verbose) {
      console.error(`${pc.dim('←')} ${res.status}`);
      console.error(`${pc.dim('  body:')} ${JSON.stringify(data)}`);
    }

    if (!res.ok) {
      throw parseApiError(data, res.status);
    }

    return data as ApiResponse<T>;
  }

  /** GET using X-API-Key auth (for /api/v1/*) */
  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, 'apiKey');
  }

  /** POST using X-API-Key auth (for /api/v1/*) */
  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, 'apiKey');
  }

  /** PUT using X-API-Key auth (for /api/v1/*) */
  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, 'apiKey');
  }

  /** DELETE using X-API-Key auth (for /api/v1/*) */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, 'apiKey');
  }

  // ── JWT-authenticated routes (/api/instance, /api/platform, /api/sse, etc.) ─

  /** GET using Bearer JWT */
  async jwtGet<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, 'jwt');
  }

  /** POST using Bearer JWT */
  async jwtPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, 'jwt');
  }

  /** PUT using Bearer JWT */
  async jwtPut<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, 'jwt');
  }

  /** DELETE using Bearer JWT */
  async jwtDelete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, 'jwt');
  }

  /** Convenience: GET and return data, throw on error */
  async getData<T>(path: string): Promise<T> {
    const res = await this.get<T>(path);
    if (!res.success || res.data === undefined) {
      throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    }
    return res.data;
  }

  /** Convenience: POST and return data, throw on error */
  async postData<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.post<T>(path, body);
    if (!res.success || res.data === undefined) {
      throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    }
    return res.data;
  }

  /** Convenience: JWT GET and return data, throw on error */
  async jwtGetData<T>(path: string): Promise<T> {
    const res = await this.jwtGet<T>(path);
    if (!res.success || res.data === undefined) {
      throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    }
    return res.data;
  }

  /** Convenience: JWT POST and return data, throw on error */
  async jwtPostData<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.jwtPost<T>(path, body);
    if (!res.success || res.data === undefined) {
      throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    }
    return res.data;
  }

  get hasCredentials(): boolean {
    return Boolean(this.apiKey);
  }

  get hasJwt(): boolean {
    return Boolean(this.jwt);
  }

  get configuredBaseUrl(): string {
    return this.baseUrl;
  }
}

// ── Output helpers ─────────────────────────────────────────────────────────────

export function outputJson(data: unknown): void {
  console.log(renderJson(data));
}

export function outputYaml(data: unknown): void {
  console.log(renderYaml(data));
}

/**
 * Print an error in the most useful format for the current mode:
 * - --json / --yaml: structured envelope to stdout so `fidscript ... | jq` works
 * - default: red human text to stderr
 * - --quiet: suppressed entirely (fidscript commands still exit non-zero)
 */
export function outputFidscriptError(err: unknown): void {
  const envelope = errToEnvelope(err);

  if (flags.mode === 'json') {
    console.log(JSON.stringify(envelope, null, 2));
    return;
  }
  if (flags.mode === 'yaml') {
    console.log(YAML.stringify(envelope));
    return;
  }
  if (flags.quiet) return;

  if (err instanceof FidscriptError) {
    const suffix = err.statusCode ? ` [${err.code} ${err.statusCode}]` : ` [${err.code}]`;
    console.error(`${pc.red('error:')} ${err.message}${pc.dim(suffix)}`);
  } else if (err instanceof Error) {
    console.error(`${pc.red('error:')} ${err.message}`);
  } else {
    console.error(`${pc.red('error:')} ${String(err)}`);
  }
}

function errToEnvelope(err: unknown): { success: false; error: { code: string; message: string; status_code?: number } } {
  if (err instanceof FidscriptError) {
    return {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.statusCode ? { status_code: err.statusCode } : {}),
      },
    };
  }
  if (err instanceof Error) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err.message } };
  }
  return { success: false, error: { code: 'INTERNAL_ERROR', message: String(err) } };
}

/**
 * Print a CLI-internal error (e.g. "Not signed in", "No API key"). Same envelope
 * shape as outputFidscriptError but with a stable CLI error code.
 */
export function outputCliError(code: string, message: string): void {
  outputFidscriptError(new FidscriptError(message, code));
}

export function outputMsg(msg: string): void {
  if (flags.quiet) return;
  if (flags.mode === 'json' || flags.mode === 'yaml') {
    // In structured mode, info messages are suppressed — they don't belong in the data stream.
    return;
  }
  console.error(renderSuccess(msg));
}
