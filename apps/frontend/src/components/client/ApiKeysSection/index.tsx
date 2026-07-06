import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { clientKeysApi, instancesApi } from '../../../services/api';
import { apiV1 } from '../../../services/whatsapp';
import type { ClientApiKey } from '../../../services/api';
import type { Instance } from '../../../services/types';
import VibeWizard from '../VibeWizard';
import CreateApiKeyModal from './CreateApiKeyModal';
import RegenerateKeyModal from './RegenerateKeyModal';
import KeysTabPanel from './KeysTabPanel';

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
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateKeyId, setRegenerateKeyId] = useState<string | null>(null);
  const [regenerateKeyName, setRegenerateKeyName] = useState('');
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<string | null>(null);

  const fetchKeys = async () => {
    if (!clientToken) return;
    const res = await clientKeysApi.getAll();
    if (res.success && res.data) setApiKeys(res.data.map((k) => ({ ...k, last_used: k.last_used || 'Never' })));
  };

  useEffect(() => {
    fetchKeys();
    if (clientToken) instancesApi.getClientInstances().then(res => { if (res.success && res.data) setClientInstances(res.data); });
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
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
    else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  };

  const handleCopyKey = (id: string, val: string) => { copyToClipboard(val); setCopiedKeyId(id); setTimeout(() => setCopiedKeyId(null), 2050); };
  const handleRevokeKey = async (id: string, name: string) => { if (confirm(`Revoke key "${name}"?`)) { await clientKeysApi.revoke(id); setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'Revoked' as const } : k)); } };

  const handleTestKey = async (k: KeyWithStats) => {
    if (!k.key) return;
    setTestingKeyId(k.id); setTestResult(null);
    try {
      const res = await apiV1.whoami(k.key);
      setTestResult({ id: k.id, ok: res.success, msg: res.success ? 'Key is valid and active!' : (res.error || 'Key is invalid or revoked') });
    } catch (err) { setTestResult({ id: k.id, ok: false, msg: err instanceof Error ? err.message : 'Connection failed' }); }
    setTestingKeyId(null);
  };

  const handleRegenerateKey = async () => {
    if (!regenerateKeyId) return;
    setRegeneratingKeyId(regenerateKeyId);
    try {
      const res = await clientKeysApi.regenerate(regenerateKeyId);
      if (res.success && res.data) {
        const newKey = res.data.key;
        setApiKeys((prev) => prev.map((k) => k.id === regenerateKeyId ? { ...k, key: newKey, key_prefix: newKey.substring(0, 20), last_used: 'Just now' } : k));
        setShowKeyValue((prev) => new Set(prev).add(regenerateKeyId));
        setShowRegenerateModal(false); setRegenerateKeyId(null); setRegenerateKeyName('');
      }
    } finally { setRegeneratingKeyId(null); }
  };

  const openRegenerateModal = (k: KeyWithStats) => { setRegenerateKeyId(k.id); setRegenerateKeyName(k.name); setShowRegenerateModal(true); };
  const toggleShowKey = (id: string) => { setShowKeyValue((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };

  const activeKeys = apiKeys.filter(k => k.status !== 'Revoked');

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <div className="flex items-center gap-1.5 p-1.5 bg-[#181711] border border-[#2d2813] rounded-2xl w-fit">
            {(['keys', 'vibe'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-[#eab308] text-[#181711]' : 'text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813]'}`}>
                {tab === 'keys' ? 'My API Keys' : <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Vibe Coding</span>}
              </button>
            ))}
          </div>
        </div>
        {activeTab === 'keys' && (
          <KeysTabPanel apiKeys={apiKeys} showKeyValue={showKeyValue} copiedKeyId={copiedKeyId}
            testingKeyId={testingKeyId} testResult={testResult} onCreateKey={() => setShowNewKeyModal(true)}
            onCopyKey={handleCopyKey} onToggleShowKey={toggleShowKey} onTestKey={handleTestKey}
            onRevokeKey={handleRevokeKey} onOpenRegenerateModal={openRegenerateModal} copyToClipboard={copyToClipboard} />
        )}
        {activeTab === 'vibe' && clientToken && (
          <VibeWizard clientName={clientName} clientToken={clientToken} instances={clientInstances}
            activeKeys={activeKeys.map(k => ({ id: k.id, name: k.name, key_prefix: k.key_prefix, last_used: k.last_used ?? null }))} />
        )}
      </div>
      <CreateApiKeyModal show={showNewKeyModal} newKeyName={newKeyName} onNameChange={setNewKeyName}
        onSubmit={handleCreateApiKey} onClose={() => setShowNewKeyModal(false)} />
      <RegenerateKeyModal show={showRegenerateModal} keyName={regenerateKeyName}
        regenerating={regeneratingKeyId === regenerateKeyId} onSubmit={handleRegenerateKey}
        onClose={() => setShowRegenerateModal(false)} />
    </div>
  );
}
