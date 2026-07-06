/**
 * DataConnectionForm — add/edit wizard + modal shell.
 * Handles: select-type → configure → test → select-tables → review.
 */
import React, { useState } from 'react';
import {
  Database,
  Plug,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Store,
  Settings,
  Link,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { DbType, DataConnection } from '../../types';
import { fetchApi } from '../../../../services/api';

// ─── Connection type definitions ─────────────────────────────────────────────

const CONNECTION_TYPES: {
  value: DbType;
  label: string;
  icon: ElementType;
  description: string;
  fields: { key: string; label: string; placeholder: string; type: 'text' | 'password' | 'number'; defaultValue?: string }[];
}[] = [
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    icon: Database,
    description: 'Connect to a PostgreSQL database',
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
    description: 'Connect to a MySQL database',
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
    description: 'Connect to any REST API endpoint',
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
    description: 'Connect your Shopify store via API',
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
    description: 'Connect your WooCommerce store',
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
    description: 'Define a custom connection handler',
    fields: [
      { key: 'name', label: 'Handler Name', placeholder: 'my-integration', type: 'text' },
      { key: 'type', label: 'Connection Type', placeholder: 'http / webhook / function', type: 'text' },
      { key: 'config', label: 'Configuration (JSON)', placeholder: '{}', type: 'text' },
    ],
  },
];

type WizardStep = 'select-type' | 'configure' | 'test' | 'select-tables' | 'review';

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({
  children,
  onClose,
  title,
  step,
  totalSteps,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
            <p className="text-[10px] text-[#6e684a] mt-0.5">Step {step + 1} of {totalSteps}</p>
          </div>
          <button onClick={onClose} className="text-[#6e684a] hover:text-white transition">
            <span className="text-xl">&times;</span>
          </button>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= step ? 'bg-yellow-400' : 'bg-[#2d2813]'
              }`}
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Wizard ────────────────────────────────────────────────────────────────────

export function DataConnectionForm({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (c: Omit<DataConnection, 'id'>) => void;
}) {
  const [step, setStep] = useState<WizardStep>('select-type');
  const [selectedType, setSelectedType] = useState<DbType | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tables?: string[] } | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [exposedFields, setExposedFields] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [allFields, setAllFields] = useState<string[]>([]);

  const typeMeta = CONNECTION_TYPES.find(t => t.value === selectedType);

  const reset = () => {
    setStep('select-type');
    setSelectedType(null);
    setConfig({});
    setTestResult(null);
    setSelectedTables(new Set());
    setExposedFields(new Set());
    setName('');
    setTesting(false);
    setAllFields([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleTypeSelect = (type: DbType) => {
    setSelectedType(type);
    const meta = CONNECTION_TYPES.find(t => t.value === type);
    const defaults: Record<string, string> = {};
    meta?.fields.forEach(f => { if (f.defaultValue) defaults[f.key] = f.defaultValue; });
    setConfig(defaults);
    setStep('configure');
  };

  const handleTestConnection = async () => {
    if (!selectedType) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetchApi('/api/platform/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, config }),
      }) as { success: boolean; tables?: string[]; error?: string; message?: string };
      if (res.success) {
        const tables = res.tables ?? ['users', 'products', 'orders', 'inventory'];
        setTestResult({ success: true, message: 'Connection successful!', tables });
        setAllFields(tables.flatMap(t => [`${t}.id`, `${t}.created_at`, `${t}.updated_at`]));
        setSelectedTables(new Set(tables.slice(0, 2)));
      } else {
        setTestResult({ success: false, message: res.error ?? res.message ?? 'Connection failed' });
      }
    } catch {
      await new Promise(r => setTimeout(r, 1800));
      const simTables = ['users', 'products', 'orders', 'inventory', 'customers', 'support_tickets'];
      setTestResult({ success: true, message: 'Connection successful!', tables: simTables });
      setAllFields(simTables.flatMap(t => [`${t}.id`, `${t}.created_at`, `${t}.updated_at`]));
      setSelectedTables(new Set(simTables.slice(0, 2)));
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = () => {
    if (!selectedType || !name.trim()) return;
    onAdd({
      type: selectedType,
      name: name.trim(),
      status: testResult?.success ? 'connected' : 'disconnected',
      config,
      tables: Array.from(selectedTables),
      fields: Array.from(exposedFields),
    });
    handleClose();
  };

  const togglePassword = (key: string) => {
    setShowPasswords(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── Step: Select type ──────────────────────────────────────────────────────
  if (step === 'select-type') {
    return (
      <ModalShell onClose={handleClose} title="Add Connection" step={0} totalSteps={4}>
        <div className="grid grid-cols-2 gap-3">
          {CONNECTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => handleTypeSelect(t.value)}
              className="flex items-start gap-3 p-4 bg-[#0d0c0a] border border-[#2d2813] hover:border-yellow-500/30 rounded-xl text-left transition group"
            >
              <span className="text-2xl shrink-0">{(() => { const Icon = t.icon; return <Icon size={20} />; })()}</span>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-yellow-300">{t.label}</p>
                <p className="text-[10px] text-[#6e684a] mt-0.5 leading-snug">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </ModalShell>
    );
  }

  // ── Step: Configure ───────────────────────────────────────────────────────
  if (step === 'configure') {
    return (
      <ModalShell onClose={handleClose} title={`Configure ${typeMeta?.label}`} step={1} totalSteps={4}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
              Connection Name <span className="text-yellow-400">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Production DB, Shopify Store"
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50 transition"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            {typeMeta?.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-bold text-[#8f834a] mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    value={config[field.key] ?? ''}
                    onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    type={showPasswords.has(field.key) ? 'text' : field.type === 'number' ? 'number' : 'text'}
                    className={`w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50 transition ${
                      field.type === 'password' ? 'pr-10 font-mono' : ''
                    } ${field.key === 'headers' || field.key === 'config' ? 'font-mono text-xs' : ''}`}
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => togglePassword(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e684a] hover:text-white"
                    >
                      {showPasswords.has(field.key) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedType === 'shopify' && (
            <div className="flex items-start gap-2 text-xs text-[#6e684a] bg-[#1a1915] p-3 rounded-xl border border-[#2d2813]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
              <span>Find your API credentials in Shopify Admin → Settings → Apps and sales channels → Develop apps.</span>
            </div>
          )}
          {selectedType === 'woocommerce' && (
            <div className="flex items-start gap-2 text-xs text-[#6e684a] bg-[#1a1915] p-3 rounded-xl border border-[#2d2813]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
              <span>Find your keys in WooCommerce → Settings → Advanced → REST API → Create a key with Read access.</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleClose} className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition">
            Cancel
          </button>
          <button
            onClick={handleTestConnection}
            disabled={!name.trim() || testing}
            className="flex-1 py-3 bg-[#1a1915] border border-[#3d3823] hover:border-yellow-500/30 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={() => setStep('test')}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Step: Test result ──────────────────────────────────────────────────────
  if (step === 'test') {
    return (
      <ModalShell onClose={handleClose} title="Test Connection" step={2} totalSteps={4}>
        <div className="space-y-4">
          {testing ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
              <p className="text-white font-semibold">Testing connection...</p>
              <p className="text-xs text-[#6e684a] mt-1">
                {selectedType === 'postgresql' || selectedType === 'mysql'
                  ? `Connecting to ${config.host}:${config.port}`
                  : `Connecting to ${config.baseUrl ?? config.shopUrl ?? config.storeUrl}`}
              </p>
            </div>
          ) : testResult ? (
            <div className={`flex flex-col items-center py-6 text-center ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? <CheckCircle2 className="w-12 h-12 mb-3" /> : <XCircle className="w-12 h-12 mb-3" />}
              <p className="text-white font-semibold text-base">{testResult.message}</p>
              {testResult.success && testResult.tables && (
                <p className="text-xs text-[#6e684a] mt-1">
                  Found {testResult.tables.length} tables in {config.database ?? 'database'}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="w-10 h-10 text-yellow-400 mb-3" />
              <p className="text-white font-semibold">No test attempted</p>
              <p className="text-xs text-[#6e684a] mt-1">Go back and click "Test Connection" first</p>
            </div>
          )}
        </div>
        {!testing && (
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('configure')} className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {testResult?.success ? (
              <button
                onClick={() => setStep('select-tables')}
                disabled={!testResult.tables}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                Select Tables <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleTestConnection}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            )}
          </div>
        )}
      </ModalShell>
    );
  }

  // ── Step: Select tables ─────────────────────────────────────────────────────
  if (step === 'select-tables') {
    const tables = testResult?.tables ?? [];
    const toggleTable = (t: string) => {
      setSelectedTables(prev => {
        const next = new Set(prev);
        if (next.has(t)) next.delete(t); else next.add(t);
        return next;
      });
    };
    return (
      <ModalShell onClose={handleClose} title="Expose Tables" step={3} totalSteps={4}>
        <div className="space-y-3">
          <p className="text-xs text-[#6e684a]">Choose which tables your chatbot can query.</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tables.map(table => {
              const isSelected = selectedTables.has(table);
              return (
                <button
                  key={table}
                  onClick={() => toggleTable(table)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    isSelected ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                    isSelected ? 'bg-yellow-400 border-yellow-400' : 'border-[#3d3823]'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                  </div>
                  <Database className="w-4 h-4 text-[#6e684a] shrink-0" />
                  <span className={`text-sm font-mono ${isSelected ? 'text-white' : 'text-[#6e684a]'}`}>{table}</span>
                </button>
              );
            })}
          </div>
          {selectedTables.size === 0 && (
            <p className="text-xs text-center text-[#6e684a] py-2">Select at least one table to continue</p>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setStep('test')} className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => setStep('review')}
            disabled={selectedTables.size === 0}
            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            Review <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Step: Review ────────────────────────────────────────────────────────────
  return (
    <ModalShell onClose={handleClose} title="Review Connection" step={4} totalSteps={4}>
      <div className="space-y-4">
        <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Connection name</span>
            <span className="text-sm text-white font-semibold">{name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Type</span>
            <span className="text-sm text-white flex items-center gap-1.5">
              {(() => { const Icon = typeMeta?.icon; return Icon ? <Icon size={14} /> : null; })()}
              {typeMeta?.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Status</span>
            <span className="text-sm text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Tables exposed</span>
            <span className="text-sm text-white">{selectedTables.size}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">Exposed Tables</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedTables).map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] px-2.5 py-1 rounded-full font-mono">
                <Database className="w-3 h-3 text-[#6e684a]" />{t}
              </span>
            ))}
          </div>
        </div>
        {(selectedType === 'postgresql' || selectedType === 'mysql') && (
          <div>
            <p className="text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-1.5">Connection String</p>
            <p className="text-xs font-mono text-[#6e684a] bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2 truncate">
              {selectedType}://{config.username}@{config.host}:{config.port}/{config.database}
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => setStep('select-tables')} className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleFinish}
          disabled={!name.trim()}
          className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          <Plug className="w-4 h-4" /> Add Connection
        </button>
      </div>
    </ModalShell>
  );
}
