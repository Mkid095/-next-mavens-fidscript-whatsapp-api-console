import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { EnvConfig } from '../types.js';

export class HttpClient {
  private client: AxiosInstance;
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({ baseURL: baseUrl, timeout: 15_000 });
  }

  async get<T = unknown>(path: string): Promise<T> {
    const { data } = await this.client.get<T>(path);
    return data;
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const { data } = await this.client.post<T>(path, body);
    return data;
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const { data } = await this.client.put<T>(path, body);
    return data;
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const { data } = await this.client.delete<T>(path);
    return data;
  }

  async request<T = unknown>(opts: {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<{ data: T; latency: number }> {
    const start = Date.now();
    try {
      const { data } = await this.client.request<T>({
        method: opts.method,
        url: opts.path,
        data: opts.body,
        headers: opts.headers,
      });
      return { data, latency: Date.now() - start };
    } catch (err) {
      const latency = Date.now() - start;
      const error = err as AxiosError;
      // For failed responses (4xx/5xx), still return the response data
      if (error.response?.data !== undefined) {
        return { data: error.response.data as T, latency };
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
