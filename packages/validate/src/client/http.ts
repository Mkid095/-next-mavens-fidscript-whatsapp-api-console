import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { EnvConfig } from '../types.js';

export interface ApiResponse<T> {
  data: T;
  latency: number;
  status?: number;
  statusText?: string;
  /** One-line error summary, e.g. "500 Internal Server Error (ECONNREFUSED)" */
  error?: string;
  /** Raw response body on 4xx/5xx */
  errorBody?: unknown;
  /** Node error code, e.g. ECONNREFUSED */
  errorCode?: string;
}

export class HttpClient {
  private client: AxiosInstance;
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({ baseURL: baseUrl, timeout: 15_000 });
  }

  async request<T = unknown>(opts: {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<ApiResponse<T>> {
    const start = Date.now();
    try {
      const response = await this.client.request<T>({
        method: opts.method,
        url: opts.path,
        data: opts.body,
        headers: opts.headers,
      });
      return {
        data: response.data,
        latency: Date.now() - start,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (err) {
      const latency = Date.now() - start;
      const error = err as AxiosError;
      const status = error.response?.status;
      const statusText = error.response?.statusText ?? '';

      let errorSummary: string;
      let errorCode: string | undefined;

      if (error.code) {
        errorCode = error.code;
        errorSummary = `${status ?? 'ERR'} ${statusText} (${error.code})`;
      } else if (status) {
        errorSummary = `${status} ${statusText}`;
      } else {
        errorSummary = error.message ?? String(err);
      }

      // Return response data if available (4xx/5xx), otherwise throw
      if (error.response?.data !== undefined || error.code) {
        return {
          data: (error.response?.data ?? null) as T,
          latency,
          status,
          statusText,
          error: errorSummary,
          errorBody: error.response?.data,
          errorCode: error.code,
        };
      }
      throw err;
    }
  }
}

export function createClients(env: EnvConfig) {
  return {
    platform: new HttpClient(env.platformApiUrl),
    whatsapp: new HttpClient(env.whatsappApiUrl),
  };
}
