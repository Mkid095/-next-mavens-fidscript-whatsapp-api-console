import React from 'react';
import {
  Send, MessageSquare, UserCircle, Smartphone, Inbox, Compass,
  Megaphone, Users, MessageCircle, User, Settings, Bot, Cog,
  Image as ImageIcon, Webhook, BarChart3, Radio,
} from 'lucide-react';
import { type ApiEndpoint } from '../../data/apiEndpoints/index';
import { API_ENDPOINTS, API_CATEGORIES } from '../../data/apiEndpoints/index';

export interface SandboxField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
  desc?: string;
  fields?: SandboxField[];
}

export interface EndpointDef {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  path: string;
  desc: string;
  category: string;
  cost?: number;
  bodyFields: SandboxField[];
  pathParams: { name: string; desc?: string }[];
}

export interface CategoryGroup { name: string; icon: string; endpoints: EndpointDef[]; }

// Map icon name -> rendered JSX element (NOT a raw forwardRef component reference).
// Storing the raw reference (e.g. `Megaphone`) and rendering it as `{ICON_MAP[k]}`
// causes React error #31 because lucide-react icons are forwardRef components whose
// `{$$typeof, render, displayName}` shape is not a valid ReactNode child.
const ic = (C: React.ComponentType<{ className?: string }>) => <C className="w-3.5 h-3.5" />;
export const ICON_MAP: Record<string, React.ReactNode> = {
  Send: ic(Send),
  MessageSquare: ic(MessageSquare),
  UserCircle: ic(UserCircle),
  Smartphone: ic(Smartphone),
  Inbox: ic(Inbox),
  Compass: ic(Compass),
  Megaphone: ic(Megaphone),
  Users: ic(Users),
  MessageCircle: ic(MessageCircle),
  User: ic(User),
  Settings: ic(Settings),
  Bot: ic(Bot),
  Cog: ic(Cog),
  ImageIcon: ic(ImageIcon),
  Webhook: ic(Webhook),
  BarChart3: ic(BarChart3),
  Radio: ic(Radio),
};

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH: 'bg-orange-500 text-white',
  PUT: 'bg-purple-600 text-white',
};

export const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🙌', '👏', '🔥', '💯'];
export const STATUS_MEDIA_TYPES = ['text', 'image', 'audio'];

/** Convert a registry ApiEndpoint to the Sandbox's flatter EndpointDef shape. */
export function toSandboxEndpoint(ep: ApiEndpoint): EndpointDef {
  return {
    id: ep.id,
    name: ep.name,
    method: ep.method,
    path: ep.path,
    desc: ep.desc,
    category: ep.category,
    cost: ep.cost,
    bodyFields: ep.bodyFields as unknown as SandboxField[],
    pathParams: ep.pathParams,
  };
}

/** Derive category groups from the live registry, filtered to /api/v1. */
export const ENDPOINT_GROUPS: CategoryGroup[] = API_CATEGORIES
  .filter(cat => cat.name !== 'Receiving')
  .map(cat => ({
    name: cat.name,
    icon: cat.icon,
    endpoints: API_ENDPOINTS
      .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
      .map((ep: ApiEndpoint) => toSandboxEndpoint(ep)),
  }))
  .filter(g => g.endpoints.length > 0);

/** Field-type helpers for the request form. */
export const isMediaField = (key: string) => ['media_url', 'url', 'image', 'audio', 'video', 'sticker', 'content']
  .some(k => key.toLowerCase().includes(k));
export const isLocationField = (key: string) => key.toLowerCase().includes('latitude') || key.toLowerCase().includes('longitude');
export const isContactField = (key: string) => key.toLowerCase().includes('contact') || key.toLowerCase().includes('vcard');
export const isPollOptions = (key: string) => key.toLowerCase().includes('option') || key.toLowerCase().includes('list');
export const isStatusType = (key: string) => (ep?: EndpointDef) => !!ep && key.toLowerCase().includes('type') && ep.path.includes('status');
