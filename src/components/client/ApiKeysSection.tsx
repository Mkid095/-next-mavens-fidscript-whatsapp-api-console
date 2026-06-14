import React, { useState, useEffect } from 'react';
import { Plus, Key, Copy, X, Eye, EyeOff, Trash2, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clientKeysApi } from '../../services/api';
import type { ClientApiKey } from './types';

interface ApiKeysSectionProps {
  clientToken?: string;
}

export default function ApiKeysSection({ clientToken }: ApiKeysSectionProps) {
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ClientApiKey[]>([]);
  const [showKeyValue, setShowKeyValue] = useState<Set<string>>(new Set());

  const fetchKeys = async () => {
    if (!clientToken) return;
    const res = await clientKeysApi.getAll();
    if (res.success && res.data) {
      setApiKeys(res.data.map((k) => ({ ...k, last_used: k.last_used || 'Never' })));
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [clientToken]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !clientToken) return;
    const res = await clientKeysApi.create(newKeyName.trim());
    if (res.success && res.data) {
      setApiKeys((prev) => [{ ...res.data, last_used: 'Never' } as ClientApiKey, ...prev]);
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

  const toggleShowKey = (id: string) => {
    setShowKeyValue((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><Key className="w-4 h-4 text-yellow-700" /> FidScript API Credentials</h3>
          <p className="text-xs text-graphite mt-0.5">Custom API keys for integrating with FidScript endpoints.</p>
        </div>
        <button onClick={() => setShowNewKeyModal(true)} className="bg-forest-deep hover:bg-[#33301a] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Generate Key
        </button>
      </div>

      <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4">
        <p className="text-[10px] font-bold text-forest-deep mb-2">FidScript API Base URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-white border border-[#eaebe4] px-3 py-2 rounded-xl text-forest-deep">https://whatsapp.fidscript.com/api/instance</code>
          <button onClick={() => navigator.clipboard.writeText('https://whatsapp.fidscript.com/api/instance')}
            className="p-2 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-xl transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {apiKeys.map((k) => {
          const isRevoked = k.status === 'Revoked';
          return (
            <div key={k.id} className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#eaebe4] rounded-2xl ${isRevoked ? 'opacity-50' : ''}`}>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-bold font-mono ${isRevoked ? 'line-through text-gray-400' : 'text-forest-deep'}`}>{k.name}</p>
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${isRevoked ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-800'}`}>{k.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono bg-stone-100 px-2 py-1 rounded text-stone-700 truncate select-all max-w-md">
                    {showKeyValue.has(k.id) ? k.key : `${k.key?.substring(0, 20)}••••••••••••••••`}
                  </code>
                  <button onClick={() => toggleShowKey(k.id)} className="p-1.5 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-lg transition-colors">
                    {showKeyValue.has(k.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleCopyKey(k.id, k.key || '')} disabled={isRevoked} className="p-1.5 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-lg transition-colors">
                    {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400 shrink-0">
                <div><p className="text-[9px] uppercase font-bold text-stone-400">Created</p><p className="text-stone-700 font-bold mt-0.5">{k.created_at}</p></div>
                {!isRevoked ? (
                  <button onClick={() => handleRevokeKey(k.id, k.name)} className="p-2 text-stone-400 hover:text-red-600 bg-white border border-stone-200 rounded-xl transition-all" title="Revoke Key"><Trash2 className="w-3.5 h-3.5" /></button>
                ) : <span className="text-[9px] bg-stone-100 text-gray-400 p-2 rounded-xl font-bold">Revoked</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-yellow-700 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-yellow-950">Keep your API keys secret</p>
          <p className="text-[11px] text-yellow-800 leading-relaxed">Never expose keys in client-side code or public repositories. Use server-to-server communication.</p>
        </div>
      </div>

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
                  <input type="text" required placeholder="e.g. ERP Sales Hook" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs" />
                  <p className="text-[9px] text-stone-400 mt-1">A label to identify this key.</p>
                </div>
                <div className="flex gap-2 justify-end pt-3">
                  <button type="button" onClick={() => setShowNewKeyModal(false)} className="px-4 py-2 border border-stone-200 rounded-xl text-xs">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-stone-950 font-bold text-xs rounded-xl">Generate Key</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
