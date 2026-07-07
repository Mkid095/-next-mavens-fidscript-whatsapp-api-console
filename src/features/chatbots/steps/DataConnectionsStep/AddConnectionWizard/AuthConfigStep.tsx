/**
 * AuthConfigStep — Step 2: enter credentials / auth configuration for the selected connection type.
 */
import React from 'react';
import type { ElementType } from 'react';
import type { DbType } from '../../../types';
import {
  Eye,
  EyeOff,
  Plug,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { ModalShell } from './AddConnectionWizardMain';

const FIELD_META: {
  value: DbType;
  icon: ElementType;
  label: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password' | 'number';
    defaultValue?: string;
  }[];
}[] = [
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    icon: Database,
    fields: [
      { key: 'host', label: 'Host', placeholder: 'db.example.com', type: 'text' },
      { key: 'port', label: 'Port', placeholder: '5432', type: 'number', defaultValue: '5432' },
      { key: 'database', label: 'Database', placeholder: 'mydb', type: 'text' },
      { key: 'username', label: 'Username', placeholder: 'postgres', type: 'text' },
      { key: 'password', label: 'Password', placeholder: '••••••', type: 'password' },
      { key: 'ssl', label: 'Use SSL', placeholder: 'true', type: 'text', defaultValue: 'true' },
    ],
  },
  {
    value: 'mysql',
    label: 'MySQL',
    icon: Store,
    fields: [
      { key: 'host', label: 'Host', placeholder: 'db.example.com', type: 'text' },
      { key: 'port', label: 'Port', placeholder: '3306', type: 'number', defaultValue: '3306' },
      { key: 'database', label: 'Database', placeholder: 'mydb', type: 'text' },
      { key: 'username', label: 'Username', placeholder: 'root', type: 'text' },
      { key: 'password', label: 'Password', placeholder: '••••••', type: 'password' },
    ],
  },
  {
    value: 'rest-api',
    label: 'REST API',
    icon: Link,
    fields: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://api.example.com', type: 'text' },
      { key: 'authType', label: 'Auth Type', placeholder: 'Bearer', type: 'text', defaultValue: 'Bearer' },
      { key: 'apiKey', label: 'API Key / Token', placeholder: 'Bearer eyJ...', type: 'password' },
      { key: 'headers', label: 'Extra Headers (JSON)', placeholder: '{"X-Custom": "value"}', type: 'text' },
    ],
  },
  {
    value: 'shopify',
    label: 'Shopify',
    icon: ShoppingCart,
    fields: [
      { key: 'shopUrl', label: 'Shop URL', placeholder: 'mystore.myshopify.com', type: 'text' },
      { key: 'apiKey', label: 'API Access Token', placeholder: 'shpat_...', type: 'password' },
      { key: 'apiVersion', label: 'API Version', placeholder: '2024-01', type: 'text', defaultValue: '2024-01' },
    ],
  },
  {
    value: 'woocommerce',
    label: 'WooCommerce',
    icon: Store,
    fields: [
      { key: 'storeUrl', label: 'Store URL', placeholder: 'https://store.example.com', type: 'text' },
      { key: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...', type: 'password' },
      { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', type: 'password' },
    ],
  },
  {
    value: 'custom',
    label: 'Custom',
    icon: Settings,
    fields: [
      { key: 'name', label: 'Handler Name', placeholder: 'my-integration', type: 'text' },
      { key: 'type', label: 'Connection Type', placeholder: 'http / webhook / function', type: 'text' },
      { key: 'config', label: 'Configuration (JSON)', placeholder: '{}', type: 'text' },
    ],
  },
];

// Icons imported at module level to avoid lazy-import issues in render
import {
  Database,
  Store,
  Link,
  ShoppingCart,
  Settings,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onTest: () => void;
  onNext: () => void;
  onBack: () => void;
  name: string;
  onNameChange: (v: string) => void;
  config: Record<string, string>;
  onConfigChange: (v: Record<string, string>) => void;
  showPasswords: Set<string>;
  onTogglePassword: (key: string) => void;
  testing: boolean;
  selectedType: DbType;
}

export function AuthConfigStep({
  onClose,
  onTest,
  onNext,
  onBack,
  name,
  onNameChange,
  config,
  onConfigChange,
  showPasswords,
  onTogglePassword,
  testing,
  selectedType,
}: Props) {
  const typeMeta = FIELD_META.find(t => t.value === selectedType);

  return (
    <ModalShell
      onClose={onClose}
      title={`Configure ${typeMeta?.label}`}
      step={1}
      totalSteps={4}
    >
      <div className="space-y-4">
        {/* Connection name */}
        <div>
          <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
            Connection Name <span className="text-yellow-400">*</span>
          </label>
          <input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="e.g. Production DB, Shopify Store"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50 transition"
            autoFocus
          />
        </div>

        {/* Auth fields */}
        <div className="space-y-3">
          {typeMeta?.fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
                {field.label}
              </label>
              <div className="relative">
                <input
                  value={config[field.key] ?? ''}
                  onChange={e =>
                    onConfigChange({ ...config, [field.key]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  type={
                    showPasswords.has(field.key)
                      ? 'text'
                      : field.type === 'number'
                      ? 'number'
                      : 'text'
                  }
                  className={`w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50 transition ${
                    field.type === 'password' ? 'pr-10 font-mono' : ''
                  } ${
                    field.key === 'headers' || field.key === 'config'
                      ? 'font-mono text-xs'
                      : ''
                  }`}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => onTogglePassword(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e684a] hover:text-white"
                  >
                    {showPasswords.has(field.key) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Shopify hint */}
        {selectedType === 'shopify' && (
          <div className="flex items-start gap-2 text-xs text-[#6e684a] bg-[#1a1915] p-3 rounded-xl border border-[#2d2813]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <span>
              Find your API credentials in Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an app → Configure Storefront API access.
            </span>
          </div>
        )}

        {/* WooCommerce hint */}
        {selectedType === 'woocommerce' && (
          <div className="flex items-start gap-2 text-xs text-[#6e684a] bg-[#1a1915] p-3 rounded-xl border border-[#2d2813]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
            <span>
              Find your keys in WooCommerce → Settings → Advanced → REST API → Create a key with Read access.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition"
        >
          Cancel
        </button>
        <button
          onClick={onTest}
          disabled={!name.trim() || testing}
          className="flex-1 py-3 bg-[#1a1915] border border-[#3d3823] hover:border-yellow-500/30 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plug className="w-4 h-4" />
          )}
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={onNext}
          disabled={!name.trim()}
          className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </ModalShell>
  );
}
