import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { adminApi, type AdminKey } from '../../services/admin';
import KeyForm from './KeyForm';
import KeyList from './KeyList';

interface NewKeyDisplay {
  id: string;
  name: string;
  key: string;
}

export default function SecurityKeysView() {
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewKeyDisplay | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.getKeys();
    if (res.success && res.data) {
      setKeys(res.data);
    } else {
      setError(res.error || 'Failed to load keys');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleKeyCreated = (key: NewKeyDisplay) => {
    setNewlyCreatedKey(key);
    void loadKeys();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this key? This cannot be undone.')) return;
    const res = await adminApi.revokeKey(id);
    if (res.success) {
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'Revoked' } : k));
    }
  };

  return (
    <div className="space-y-6">
      {newlyCreatedKey && (
        <NewKeyBanner
          key Display={newlyCreatedKey}
          onDismiss={() => setNewlyCreatedKey(null)}
        />
      )}

      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">
          Security Credentials &amp; API Tokens
        </h1>
        <p className="text-xs text-graphite mt-1">
          Platform-level bearer tokens for server-to-server integrations. Store these securely — they are only shown once.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KeyForm onKeyCreated={handleKeyCreated} />
        <KeyList
          keys={keys}
          loading={loading}
          error={error}
          onRevoke={handleRevoke}
        />
      </div>
    </div>
  );
}

function NewKeyBanner({ keyDisplay, onDismiss }: { keyDisplay: NewKeyDisplay; onDismiss: () => void }) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-emerald-300">Key created — copy it now, it won&apos;t be shown again</p>
        <button onClick={onDismiss} className="text-emerald-500 hover:text-emerald-300 text-xs">Dismiss</button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 font-mono text-xs text-emerald-200 bg-emerald-950/60 px-3 py-2 rounded-xl border border-emerald-800/50 select-all">
          {keyDisplay.key}
        </code>
        <button
          onClick={() => copyKey(keyDisplay.key, keyDisplay.id)}
          className="shrink-0 p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-200 transition-colors"
          title="Copy key"
        >
          {copiedKeyId === keyDisplay.id ? (
            <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
          ) : (
            <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}
