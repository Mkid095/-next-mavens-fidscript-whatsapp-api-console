/**
 * api-client-core.ts — ApiClient class (transport layer)
 */
import { loadCredentials, saveCredentials, DEFAULT_BASE_URL, type Credentials } from './credentials.js';
import { FidscriptError, parseApiError } from './errors.js';
import pc from 'picocolors';

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
    const stored = loadCredentials();
    const envKey = process.env.FIDSCRIPT_API_KEY;
    const envJwt = process.env.FIDSCRIPT_JWT;

    this.apiKey = apiKeyOverride || envKey || stored?.apiKey || '';
    this.jwt = jwtOverride || envJwt || stored?.jwt || '';
    this.email = stored?.email || '';
    this.baseUrl = baseUrlOverride || process.env.FIDSCRIPT_BASE_URL || stored?.baseUrl || DEFAULT_BASE_URL;
    this.verbose = verbose;

    if ((this.apiKey || this.jwt) && !stored) {
      this.persistCredentials();
    }
  }

  persistCredentials(): void {
    if (!this.apiKey && !this.jwt) return;
    saveCredentials({
      apiKey: this.apiKey, jwt: this.jwt || undefined,
      email: this.email || undefined, baseUrl: this.baseUrl,
    } satisfies Credentials);
  }

  setJwt(jwt: string): void { this.jwt = jwt; this.persistCredentials(); }
  setApiKey(apiKey: string): void { this.apiKey = apiKey; this.persistCredentials(); }
  setEmail(email: string): void { this.email = email; }
  getEmail(): string { return this.email; }
  get hasCredentials(): boolean { return Boolean(this.apiKey); }
  get hasJwt(): boolean { return Boolean(this.jwt); }
  get configuredBaseUrl(): string { return this.baseUrl; }

  private get apiKeyHeaders(): Record<string, string> {
    return this.apiKey ? { 'X-API-Key': this.apiKey } : {};
  }

  private get jwtHeaders(): Record<string, string> {
    return this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {};
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`;
  }

  private async request<T>(
    method: string, path: string, body?: unknown, auth: 'apiKey' | 'jwt' = 'apiKey',
  ): Promise<ApiResponse<T>> {
    const authHeaders = auth === 'jwt' ? this.jwtHeaders : this.apiKeyHeaders;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...authHeaders };

    if (this.verbose) {
      console.error(`${pc.dim('→')} ${method} ${this.url(path)} (${auth})`);
      if (body) console.error(`${pc.dim('  body:')} ${JSON.stringify(body)}`);
    }

    const res = await fetch(this.url(path), { method, headers, body: body != null ? JSON.stringify(body) : undefined });

    let data: unknown;
    try { data = await res.json(); }
    catch { data = { error: `HTTP ${res.status}: ${await res.text()}` }; }

    if (this.verbose) {
      console.error(`${pc.dim('←')} ${res.status}`);
      console.error(`${pc.dim('  body:')} ${JSON.stringify(data)}`);
    }

    if (!res.ok) throw parseApiError(data, res.status);
    return data as ApiResponse<T>;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> { return this.request<T>('GET', path); }
  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> { return this.request<T>('POST', path, body); }
  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> { return this.request<T>('PUT', path, body); }
  async delete<T>(path: string): Promise<ApiResponse<T>> { return this.request<T>('DELETE', path); }

  async jwtGet<T>(path: string): Promise<ApiResponse<T>> { return this.request<T>('GET', path, undefined, 'jwt'); }
  async jwtPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> { return this.request<T>('POST', path, body, 'jwt'); }
  async jwtPut<T>(path: string, body?: unknown): Promise<ApiResponse<T>> { return this.request<T>('PUT', path, body, 'jwt'); }
  async jwtDelete<T>(path: string): Promise<ApiResponse<T>> { return this.request<T>('DELETE', path, undefined, 'jwt'); }

  async getData<T>(path: string): Promise<T> {
    const res = await this.get<T>(path);
    if (!res.success || res.data === undefined) throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    return res.data;
  }

  async postData<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.post<T>(path, body);
    if (!res.success || res.data === undefined) throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    return res.data;
  }

  async jwtGetData<T>(path: string): Promise<T> {
    const res = await this.jwtGet<T>(path);
    if (!res.success || res.data === undefined) throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    return res.data;
  }

  async jwtPostData<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.jwtPost<T>(path, body);
    if (!res.success || res.data === undefined) throw new FidscriptError(res.error || 'Request failed', 'REQUEST_FAILED');
    return res.data;
  }
}
