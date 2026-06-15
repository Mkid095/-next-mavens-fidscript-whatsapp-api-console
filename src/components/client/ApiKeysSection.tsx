import React, { useState, useEffect } from 'react';
import { Plus, Key, Copy, X, Eye, EyeOff, Trash2, Lock, Check, RefreshCw, CheckCircle, XCircle, Terminal, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clientKeysApi, instancesApi } from '../../services/api';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';
import type { ClientApiKey } from './types';
import type { Instance } from '../../services/types';
import VibeWizard from './VibeWizard';

interface ApiKeysSectionProps {
  clientToken?: string;
}

interface KeyWithStats extends ClientApiKey {
  request_count?: number;
}

/** Public surface for external integrators (always the production URL, regardless of where the dashboard runs). */

export default function ApiKeysSection({ clientToken }: ApiKeysSectionProps) {
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<KeyWithStats[]>([]);
  const [showKeyValue, setShowKeyValue] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'keys' | 'vibe'>('keys');
  const [clientInstances, setClientInstances] = useState<Instance[]>([]);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateKeyId, setRegenerateKeyId] = useState<string | null>(null);
  const [regenerateKeyName, setRegenerateKeyName] = useState('');

  const fetchKeys = async () => {
    if (!clientToken) return;
    const res = await clientKeysApi.getAll();
    if (res.success && res.data) {
      setApiKeys(res.data.map((k) => ({ ...k, last_used: k.last_used || 'Never' })));
    }
  };

  useEffect(() => {
    fetchKeys();
    if (clientToken) {
      instancesApi.getClientInstances().then(res => {
        if (res.success && res.data) setClientInstances(res.data);
      });
    }
  }, [clientToken]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !clientToken) return;
    const res = await clientKeysApi.create(newKeyName.trim());
    if (res.success && res.data) {
      const created = { ...res.data, last_used: 'Just now' } as KeyWithStats;
      setApiKeys((prev) => [created, ...prev]);
      // Reveal the full secret once so the owner can copy it before it's masked forever.
      setShowKeyValue((prev) => new Set(prev).add(created.id));
      setNewKeyName('');
      setShowNewKeyModal(false);
    }
  };

  const handleCopyKey = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2050);
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (confirm(`Revoke key "${name}"? This cannot be undone.`)) {
      await clientKeysApi.revoke(id);
      setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'Revoked' as const } : k));
    }
  };

  const handleTestKey = async (k: KeyWithStats) => {
    if (!k.key) return;
    setTestingKeyId(k.id);
    setTestResult(null);
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/whoami`, {
        method: 'GET',
        headers: { 'X-API-Key': k.key },
      });
      const data = await res.json().catch(() => ({}));
      setTestResult({ id: k.id, ok: res.ok, msg: res.ok ? 'Key is valid and active!' : (data?.error || `HTTP ${res.status}`) });
    } catch (err: unknown) {
      setTestResult({ id: k.id, ok: false, msg: err instanceof Error ? err.message : 'Connection failed' });
    }
    setTestingKeyId(null);
  };

  const handleRegenerateKey = async () => {
    if (!regenerateKeyId) return;
    setRegeneratingKeyId(regenerateKeyId);
    try {
      const res = await clientKeysApi.regenerate(regenerateKeyId);
      if (res.success && res.data) {
        const newKey = res.data.key;
        setApiKeys((prev) => prev.map((k) => k.id === regenerateKeyId
          ? { ...k, key: newKey, key_prefix: newKey.substring(0, 20), last_used: 'Just now' }
          : k));
        setShowKeyValue((prev) => new Set(prev).add(regenerateKeyId));
        setShowRegenerateModal(false);
        setRegenerateKeyId(null);
        setRegenerateKeyName('');
      }
    } finally {
      setRegeneratingKeyId(null);
    }
  };

  const openRegenerateModal = (k: KeyWithStats) => {
    setRegenerateKeyId(k.id);
    setRegenerateKeyName(k.name);
    setShowRegenerateModal(true);
  };

  const toggleShowKey = (id: string) => {
    setShowKeyValue((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-1.5 p-1.5 bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl">
          {(['keys', 'vibe'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab ? 'bg-forest-deep text-white' : 'text-stone-600 hover:text-black hover:bg-stone-100'
              }`}
            >
              {tab === 'keys' ? 'My API Keys' : <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Vibe Coding</span>}
            </button>
          ))}
        </div>
        </div>

        {activeTab === 'keys' && (
          <div className="p-6 space-y-4">
            {/* Base URL banner */}
            <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-forest-deep mb-2">FidScript API Base URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-white border border-[#eaebe4] px-3 py-2 rounded-xl text-forest-deep">{PUBLIC_API_BASE}</code>
                <button onClick={() => navigator.clipboard.writeText(PUBLIC_API_BASE)}
                  className="p-2 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-xl transition-colors" title="Copy URL">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><Key className="w-4 h-4 text-yellow-700" /> FidScript API Credentials</h3>
                <p className="text-xs text-graphite mt-0.5">Manage API keys for integrating with FidScript endpoints.</p>
              </div>
              <button onClick={() => setShowNewKeyModal(true)} className="bg-forest-deep hover:bg-[#33301a] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Generate Key
              </button>
            </div>

            {/* Key list */}
            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="py-12 text-center text-graphite space-y-3">
                  <Key className="w-10 h-10 text-yellow-200 mx-auto" />
                  <p className="font-bold text-forest-deep text-sm">No API keys yet</p>
                  <p className="text-xs text-graphite">Generate a key to start integrating with FidScript.</p>
                  <button onClick={() => setShowNewKeyModal(true)} className="px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl mt-2">
                    Generate Your First Key
                  </button>
                </div>
              ) : apiKeys.map((k) => {
                const isRevoked = k.status === 'Revoked';
                const hasSecret = !!k.key;
                const revealed = showKeyValue.has(k.id) && hasSecret && !isRevoked;
                const masked = `${k.key_prefix || k.key?.substring(0, 20) || 'fidscript_live_'}••••••••••••`;
                return (
                  <div key={k.id} className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#eaebe4] rounded-2xl ${isRevoked ? 'opacity-50 bg-stone-50' : ''}`}>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-xs font-bold font-mono ${isRevoked ? 'line-through text-gray-400' : 'text-forest-deep'}`}>{k.name}</p>
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${isRevoked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-800'}`}>{k.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] font-mono bg-stone-100 px-2 py-1.5 rounded text-stone-700 select-all truncate max-w-lg">
                          {revealed ? k.key : masked}
                        </code>
                        {!isRevoked && hasSecret && (
                          <>
                            <button onClick={() => toggleShowKey(k.id)} className="p-1.5 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-lg transition-colors" title={revealed ? 'Hide' : 'Reveal'}>
                              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleCopyKey(k.id, k.key || '')} className="p-1.5 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-lg transition-colors" title="Copy full key">
                              {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-stone-500">
                        <span>Created {k.created_at}</span>
                        <span>·</span>
                        <span>Last used {k.last_used}</span>
                      </div>
                      {testResult && testResult.id === k.id && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${testResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                          {testResult.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {testResult.msg}
                        </div>
                      )}
                    </div>
                    {!isRevoked ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTestKey(k)}
                          disabled={testingKeyId === k.id || !hasSecret}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title={hasSecret ? 'Test this key against the live API' : 'Secret not in memory — regenerate to test'}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          {testingKeyId === k.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => openRegenerateModal(k)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition-all"
                          title="Regenerate key"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </button>
                        <button onClick={() => handleRevokeKey(k.id, k.name)} className="p-2 text-stone-400 hover:text-red-600 bg-white border border-stone-200 rounded-xl transition-all" title="Revoke Key">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] bg-stone-100 text-gray-400 p-2 rounded-xl font-bold shrink-0">Revoked</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Security notice */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-yellow-700 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-yellow-950">Keep your API keys secret</p>
                <p className="text-[11px] text-yellow-800 leading-relaxed">Keys are only shown once at creation. Copy and store them securely. Use server-to-server communication — never expose in client-side code.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vibe' && (
          <VibeWizard
            clientName={undefined}
            instances={clientInstances}
          />
        )}
      </div>

      {/* New key modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm">New FidScript API Key</h4>
                <button onClick={() => setShowNewKeyModal(false)} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs font-semibold text-forest-deep">
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">Key Name</label>
                  <input type="text" required placeholder="e.g. ERP Sales Hook, Mobile App" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs" />
                  <p className="text-[9px] text-stone-400 mt-1">A label to identify this key.</p>
                </div>
                <div className="flex gap-2 justify-end pt-3">
                  <button type="button" onClick={() => setShowNewKeyModal(false)} className="px-4 py-2 border border-stone-200 rounded-xl text-xs hover:bg-stone-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-stone-950 font-bold text-xs rounded-xl">Generate Key</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Regenerate key modal */}
      <AnimatePresence>
        {showRegenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm">Regenerate API Key</h4>
                <button onClick={() => setShowRegenerateModal(false)} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <p className="font-bold mb-1">This will replace the current key</p>
                  <p>The existing key <strong>"{regenerateKeyName}"</strong> will be permanently revoked and cannot be recovered. A new key will be generated with the same name.</p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setShowRegenerateModal(false)} className="px-4 py-2 border border-stone-200 rounded-xl hover:bg-stone-50">Cancel</button>
                  <button onClick={handleRegenerateKey} disabled={regeneratingKeyId === regenerateKeyId}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50">
                    {regeneratingKeyId === regenerateKeyId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Regenerate Key
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

