import type { EndpointDef, SandboxField, CategoryGroup } from '../sandboxHelpers.js';

export type { EndpointDef, SandboxField, CategoryGroup };

export interface SandboxContactItem {
  fullName: string;
  phoneNumber: string;
  wuid?: string;
  organization?: string;
}

export interface SandboxContact {
  id: string;
  name: string;
  phone: string;
}

export interface SandboxApiKey {
  id: string;
  name: string;
  key_prefix?: string;
  status: string;
}

export interface SandboxHistoryEntry {
  ep: EndpointDef;
  status: number;
  ts: string;
}
