/**
 * instances.ts — WhatsApp instance lifecycle.
 * GET /api/v1/instance/qr/:instance, POST /api/v1/instance/restart/:instance, etc.
 */
import type { FidscriptClient } from './client.js';
import type { Instance, CreateInstance } from './types.js';

export class InstancesResource {
  constructor(private readonly client: FidscriptClient) {}

  /** Lists instances for the authenticated client (JWT). */
  list(): Promise<Instance[]> {
    return this.client.request<Instance[]>('GET', '/api/instance/client-instances', undefined, { auth: 'jwt' });
  }

  /** Create a new instance (JWT). */
  create(body: CreateInstance): Promise<Instance> {
    return this.client.request<Instance>('POST', '/api/instance/client-create', body, { auth: 'jwt' });
  }

  /** Delete an instance (JWT). */
  delete(name: string): Promise<{ success: boolean; message?: string }> {
    return this.client.request('DELETE', `/api/instance/delete/${encodeURIComponent(name)}`, undefined, { auth: 'jwt' });
  }

  /** Get a fresh QR for linking (API key + name from local registry). */
  qr(name: string): Promise<{ qrcode: { base64?: string; code?: string } }> {
    return this.client.request('GET', `/api/v1/instance/qr/${encodeURIComponent(name)}`, undefined, { auth: 'apikey' });
  }

  /** Connection state (API key). */
  state(name: string): Promise<{ instance: { state: string; phoneNumber?: string } }> {
    return this.client.request('GET', `/api/v1/instance/connection-state/${encodeURIComponent(name)}`, undefined, { auth: 'apikey' });
  }
}