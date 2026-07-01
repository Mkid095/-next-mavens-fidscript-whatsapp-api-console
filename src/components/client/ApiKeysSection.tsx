import React, { useState, useEffect } from 'react';
import { Plus, Key, Copy, X, Eye, EyeOff, Trash2, Lock, Check, RefreshCw, CheckCircle, XCircle, Terminal, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clientKeysApi, instancesApi } from '../../services/api';
import { apiV1 } from '../../services/whatsapp';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';
import type { ClientApiKey } from './types';
import type { Instance } from '../../services/types';
import VibeWizard from './VibeWizard';

interface ApiKeysSectionProps {
  clientToken?: string;
  clientName?: string;
}

interface KeyWithStats extends ClientApiKey {
  request_count?: number;
}

export default function ApiKeysSection({ clientToken, clientName }: ApiKeysSectionProps) {
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
      setShowKeyValue((prev) => new Set(prev).add(created.id));
      setNewKeyName('');
      setShowNewKeyModal(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleCopyKey = (id: string, val: string) => {
    copyToClipboard(val);
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
      const res = await apiV1.whoami(k.key);
      setTestResult({
        id: k.id,
        ok: res.success,
        msg: res.success ? 'Key is valid and active!' : (res.error || 'Key is invalid or revoked'),
      });
    } catch (err) {
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

  const activeKeys = apiKeys.filter(k => k.status !== 'Revoked');

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <div className="flex items-center gap-1.5 p-1.5 bg-[#181711] border border-[#2d2813] rounded-2xl w-fit">
            {(['keys', 'vibe'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-[#eab308] text-[#181711]'
                    : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813]'
                }`}
              >
                {tab === 'keys'
                  ? 'My API Keys'
                  : <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Vibe Coding</span>
                }
              </button>
            ))}
          </div>
        </div>

        {/* ─── API Keys Tab ─────────────────────────────────────────────── */}
        {activeTab === 'keys' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Base URL banner */}
            <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-[#6e684a] mb-2">FidScript API Base URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono bg-[#1a1915] border border-[#2d2813] px-3 py-2 rounded-xl text-[#a8a99e] overflow-x-auto break-all">
                  {PUBLIC_API_BASE}
                </code>
                <button
                  onClick={() => copyToClipboard(PUBLIC_API_BASE)}
                  className="p-2 text-[#6e684a] hover:text-[#eab308] bg-[#1a1915] border border-[#2d2813] rounded-xl transition-colors shrink-0"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#a8a99e] flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#eab308]" /> FidScript API Credentials
                </h3>
                <p className="text-xs text-[#6e684a] mt-0.5">Manage API keys for integrating with FidScript endpoints.</p>
              </div>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="bg-[#eab308] hover:bg-yellow-400 text-[#181711] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Key
              </button>
            </div>

            {/* Key list */}
            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="py-12 text-center text-[#6e684a] space-y-3">
                  <Key className="w-10 h-10 text-[#3d3a1e] mx-auto" />
                  <p className="font-bold text-[#a8a99e] text-sm">No API keys yet</p>
                  <p className="text-xs text-[#6e684a]">Generate a key to start integrating with FidScript.</p>
                  <button
                    onClick={() => setShowNewKeyModal(true)}
                    className="px-4 py-2 bg-[#eab308] text-[#181711] font-bold text-xs rounded-xl mt-2 hover:bg-yellow-400 transition-all"
                  >
                    Generate Your First Key
                  </button>
                </div>
              ) : apiKeys.map((k) => {
                const isRevoked = k.status === 'Revoked';
                const hasSecret = !!k.key;
                const revealed = showKeyValue.has(k.id) && hasSecret && !isRevoked;
                const masked = `${k.key_prefix || k.key?.substring(0, 20) || 'fidscript_live_'}••••••••••••`;
                return (
                  <div
                    key={k.id}
                    className={`p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border rounded-2xl transition-colors ${
                      isRevoked
                        ? 'border-[#2d2813] bg-[#181711]/50 opacity-60'
                        : 'border-[#2d2813] bg-[#1a1915] hover:border-[#3d3a1e]'
                    }`}
                  >
                    {/* Key info */}
                    <div className="space-y-2 flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-xs font-bold font-mono ${isRevoked ? 'line-through text-[#5a554a]' : 'text-[#a8a99e]'}`}>
                          {k.name}
                        </p>
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${
                          isRevoked
                            ? 'bg-red-900/40 text-red-400 border border-red-900/50'
                            : 'bg-green-900/40 text-green-400 border border-green-900/50'
                        }`}>
                          {k.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="flex-1 text-[11px] font-mono bg-[#181711] border border-[#2d2813] px-2 py-1.5 rounded text-[#a8a99e] select-all truncate max-w-full">
                          {revealed ? k.key : masked}
                        </code>
                        {!isRevoked && hasSecret && (
                          <>
                            <button
                              onClick={() => toggleShowKey(k.id)}
                              className="p-1.5 text-[#6e684a] hover:text-[#eab308] bg-[#181711] border border-[#2d2813] rounded-lg transition-colors shrink-0"
                              title={revealed ? 'Hide' : 'Reveal'}
                            >
                              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopyKey(k.id, k.key || '')}
                              className="p-1.5 text-[#6e684a] hover:text-[#eab308] bg-[#181711] border border-[#2d2813] rounded-lg transition-colors shrink-0"
                              title="Copy full key"
                            >
                              {copiedKeyId === k.id
                                ? <Check className="w-3.5 h-3.5 text-green-400" />
                                : <Copy className="w-3.5 h-3.5" />
                              }
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#5a554a] flex-wrap">
                        <span>Created {k.created_at}</span>
                        <span className="hidden sm:inline">·</span>
                        <span>Last used {k.last_used}</span>
                      </div>

                      {testResult && testResult.id === k.id && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                          {testResult.ok
                            ? <CheckCircle className="w-3.5 h-3.5" />
                            : <XCircle className="w-3.5 h-3.5" />
                          }
                          {testResult.msg}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isRevoked ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTestKey(k)}
                          disabled={testingKeyId === k.id || !hasSecret}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[#2d2813] hover:bg-[#3d3a1e] text-[#6e684a] border border-[#2d2813] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title={hasSecret ? 'Test this key against the live API' : 'Secret not in memory — regenerate to test'}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{testingKeyId === k.id ? 'Testing...' : 'Test'}</span>
                          <span className="sm:hidden">{testingKeyId === k.id ? '...' : 'Test'}</span>
                        </button>
                        <button
                          onClick={() => openRegenerateModal(k)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[#2d2813] hover:bg-[#3d3a1e] text-amber-400 border border-[#2d2813] rounded-xl transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="p-1.5 text-[#6e684a] hover:text-red-400 bg-[#181711] border border-[#2d2813] rounded-xl transition-all"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] bg-[#181711] text-[#5a554a] p-2 rounded-xl font-bold shrink-0 border border-[#2d2813]">
                        Revoked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Security notice */}
            <div className="p-4 bg-[#181711] border border-[#2d2813] rounded-2xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#eab308] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#a8a99e]">Keep your API keys secret</p>
                <p className="text-[11px] text-[#6e684a] leading-relaxed">
                  Keys are only shown once at creation. Copy and store them securely.
                  Use server-to-server communication — never expose in client-side code.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Vibe Coding Tab ─────────────────────────────────────────── */}
        {activeTab === 'vibe' && clientToken && (
          <VibeWizard
            clientName={clientName}
            clientToken={clientToken}
            instances={clientInstances}
            activeKeys={activeKeys.map(k => ({
              id: k.id,
              name: k.name,
              key_prefix: k.key_prefix,
              last_used: k.last_used ?? null,
            }))}
          />
        )}
      </div>

      {/* ─── New Key Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#2d2813]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2d2813] flex items-center justify-center">
                    <Key className="w-4 h-4 text-[#eab308]" />
                  </div>
                  <h4 className="font-bold text-sm text-[#a8a99e]">New FidScript API Key</h4>
                </div>
                <button onClick={() => setShowNewKeyModal(false)} className="text-[#6e684a] hover:text-[#a8a99e] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1.5">Key Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ERP Sales Hook, Mobile App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#2d2813] bg-[#181711] rounded-xl focus:outline-none focus:border-[#eab308] text-xs text-[#a8a99e] placeholder:text-[#5a554a] font-mono"
                    autoFocus
                  />
                  <p className="text-[9px] text-[#5a554a] mt-1">A label to identify this key.</p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyModal(false)}
                    className="px-4 py-2 border border-[#2d2813] rounded-xl text-xs text-[#6e684a] hover:text-[#a8a99e] hover:border-[#3d3a1e] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#eab308] hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl transition-all"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Regenerate Key Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showRegenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#2d2813]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-900/40 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-sm text-[#a8a99e]">Regenerate API Key</h4>
                </div>
                <button onClick={() => setShowRegenerateModal(false)} className="text-[#6e684a] hover:text-[#a8a99e] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-amber-900/20 border border-amber-900/40 rounded-xl">
                  <p className="text-xs font-bold text-amber-400 mb-1">This will replace the current key</p>
                  <p className="text-[11px] text-[#6e684a] leading-relaxed">
                    The existing key <strong className="text-[#a8a99e]">"{regenerateKeyName}"</strong> will be permanently revoked and cannot be recovered.
                    A new key will be generated with the same name.
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowRegenerateModal(false)}
                    className="px-4 py-2 border border-[#2d2813] rounded-xl text-xs text-[#6e684a] hover:text-[#a8a99e] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerateKey}
                    disabled={regeneratingKeyId === regenerateKeyId}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    {regeneratingKeyId === regenerateKeyId
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <RefreshCw className="w-3.5 h-3.5" />
                    }
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
