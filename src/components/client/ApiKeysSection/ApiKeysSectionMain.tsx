import React, { useState, useEffect } from 'react';
import { Plus, Key, Copy, Lock, Bot, RefreshCw } from 'lucide-react';
import { clientKeysApi, instancesApi } from '../../../services/api';
import { apiV1 } from '../../../services/whatsapp';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';
import type { ClientApiKey } from '../types';
import type { Instance } from '../../../services/types';
import VibeWizard from '../VibeWizard';
import KeyCard from './KeyCard';
import CreateKeyModal from './CreateKeyModal';
import RegenerateKeyModal from './RegenerateKeyModal';

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
              ) : apiKeys.map((k) => (
                <KeyCard
                  key={k.id}
                  keyData={k}
                  revealed={showKeyValue.has(k.id) && !!k.key && k.status !== 'Revoked'}
                  copied={copiedKeyId === k.id}
                  testing={testingKeyId === k.id}
                  testResult={testResult}
                  onToggleShow={() => toggleShowKey(k.id)}
                  onCopy={() => handleCopyKey(k.id, k.key || '')}
                  onTest={() => handleTestKey(k)}
                  onRegenerate={() => openRegenerateModal(k)}
                  onRevoke={() => handleRevokeKey(k.id, k.name)}
                />
              ))}
            </div>

            {/* Security notice */}
            <div className="p-4 bg-[#181711] border border-[#2d2813] rounded-2xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#eab308] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#a8a99e]">Keep your API keys secret</p>
                <p className="text-[11px] text-[#6e684a] leading-relaxed">
                  Keys are only shown once at creation. Copy and store them securely.
                  Use server-to-server communication - never expose in client-side code.
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

      {/* ─── Modals ─────────────────────────────────────────────────── */}
      <CreateKeyModal
        show={showNewKeyModal}
        newKeyName={newKeyName}
        onNewKeyNameChange={setNewKeyName}
        onClose={() => setShowNewKeyModal(false)}
        onSubmit={handleCreateApiKey}
      />

      <RegenerateKeyModal
        show={showRegenerateModal}
        keyName={regenerateKeyName}
        regenerating={regeneratingKeyId === regenerateKeyId}
        onClose={() => { setShowRegenerateModal(false); setRegenerateKeyId(null); }}
        onConfirm={handleRegenerateKey}
      />
    </div>
  );
}
