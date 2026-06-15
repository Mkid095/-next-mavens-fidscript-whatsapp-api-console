/**
 * Single source of truth for the public API surface.
 *
 * Every consumer — Docs, Sandbox, ApiReference, the OpenAPI generator, and
 * (by contract) the backend route handlers — derives from this registry.
 * Append per-category files as new endpoint categories ship; never hand-code
 * a second endpoint list anywhere.
 *
 * Pure data + types only (no React/Vite imports) so it is importable by both
 * the frontend and the `scripts/gen-openapi.ts` build step.
 */
import { messagingEndpoints } from './messaging';
import { platformEndpoints } from './platform';
import { receivingEndpoints } from './receiving';
import { groupEndpoints } from './groups';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type FieldType = 'string' | 'number' | 'boolean' | 'text' | 'array' | 'object';
/** Which rate limiter applies (see server middleware/v1Limits). */
export type RateLimit = 'send' | 'read' | 'mutate' | 'strict';

export interface BodyField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  enum?: string[];
  default?: string | number | boolean;
  desc?: string;
  /** Nested fields for array/object types (docs + sandbox rendering). */
  fields?: BodyField[];
}

export interface PathParam {
  name: string;
  desc: string;
  required?: boolean;
}

export interface ApiEndpoint {
  id: string;
  version: 'v1';
  method: HttpMethod;
  /** Full path including /api/v1, with :param tokens. */
  path: string;
  name: string;
  desc: string;
  category: string;
  /** Token cost; omit/0 for free (management/read) ops. */
  cost?: number;
  rateLimit?: RateLimit;
  pathParams: PathParam[];
  bodyFields: BodyField[];
  /** Example success response. */
  response?: Record<string, unknown>;
  auth?: 'apikey' | 'none';
  /** Internal Evolution path — NEVER rendered publicly; reference only. */
  evolutionPath?: string;
}

export interface ApiCategory {
  name: string;
  icon: string;
  desc?: string;
}

export const API_CATEGORIES: ApiCategory[] = [
  { name: 'Platform', icon: 'Compass', desc: 'Auth, usage & the OpenAPI spec' },
  { name: 'Messaging', icon: 'Send', desc: 'Send WhatsApp messages of every type' },
  { name: 'Groups', icon: 'Users', desc: 'Create & manage WhatsApp groups' },
  { name: 'Chats', icon: 'MessageSquare', desc: 'Chat operations & presence' },
  { name: 'Profile', icon: 'UserCircle', desc: 'Profile, privacy & business' },
  { name: 'Settings', icon: 'Settings', desc: 'Instance settings' },
  { name: 'Instance', icon: 'Smartphone', desc: 'Connection lifecycle & QR' },
  { name: 'Receiving', icon: 'Inbox', desc: 'Inbound webhook events' },
];

/** Public base URL for the integrator API. */
export const PUBLIC_API_BASE = 'https://whatsapp.fidscript.com/api/v1';

export const API_ENDPOINTS: ApiEndpoint[] = [
  ...platformEndpoints,
  ...messagingEndpoints,
  ...groupEndpoints,
  ...receivingEndpoints,
];

/** All distinct :param tokens used across pathParams (for the sandbox form). */
export function pathTokens(path: string): string[] {
  return (path.match(/:[a-zA-Z]+/g) || []).map((t) => t.slice(1));
}
