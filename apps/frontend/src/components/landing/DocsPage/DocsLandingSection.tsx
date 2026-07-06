/* DocsLandingSection — shared constants exported for use by sidebar/index */
import React from 'react';
import { Zap, MessageSquare, Settings, Users, Bell, Shield, Globe, Bot } from 'lucide-react';
import { API_ENDPOINTS, API_CATEGORIES } from '../../../data/apiEndpoints/index.js';
import type { ApiEndpoint, BodyField } from '../../../data/apiEndpoints/index.js';

/* ── Section icons ── */
export const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Getting Started': <Zap size={13} />,
  'Messaging':       <MessageSquare size={13} />,
  'Instances':       <Settings size={13} />,
  'Contacts':        <Users size={13} />,
  'Platform':        <Globe size={13} />,
  'Groups':          <Users size={13} />,
  'Settings':        <Settings size={13} />,
  'Payments':        <Bell size={13} />,
  'Security':        <Shield size={13} />,
  'AI Providers':    <Bot size={13} />,
};

/* ── Guide list ── */
export const GUIDES = [
  { id: 'quickstart',     label: 'Quick Start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'cli',            label: 'CLI' },
  { id: 'cli-coverage',   label: 'CLI Coverage' },
  { id: 'tools-integrations', label: 'Tools & Integrations' },
  { id: 'byo-llm',         label: 'Bring Your Own LLM' },
  { id: 'meta-policy',      label: 'WhatsApp Meta Policy' },
  { id: 'chatbot-api',    label: 'Chatbot API' },
  { id: 'llm-api',        label: 'LLM API' },
  { id: 'webhooks',       label: 'Webhooks' },
  { id: 'rate-limits',    label: 'Rate Limits' },
  { id: 'ai-providers',   label: 'AI Providers' },
  { id: 'sdks',           label: 'Direct HTTP (no SDK)' },
];

/* ── ParamRow type ── */
export interface DocParamRow { name: string; type: string; required: boolean; desc: string }

/* ── Doc groups (same logic as before, exported for sidebar/index use) ── */
function flattenFields(fields: BodyField[], prefix = ''): DocParamRow[] {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

export const DOC_GROUPS = API_CATEGORIES
  .filter(cat => cat.name !== 'Receiving')
  .map(cat => ({
    name: cat.name,
    icon: cat.icon,
    endpoints: API_ENDPOINTS
      .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
      .map((ep: ApiEndpoint) => ({
        method: ep.method,
        path: ep.path.replace('/api/v1', '').replace(':instance', ':instanceName'),
        name: ep.name,
        desc: ep.desc,
        params: flattenFields(ep.bodyFields),
        cost: ep.cost,
        category: ep.category,
      })),
  }))
  .filter(g => g.endpoints.length > 0);
