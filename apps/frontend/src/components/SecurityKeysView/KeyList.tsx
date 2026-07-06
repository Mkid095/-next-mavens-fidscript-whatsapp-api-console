import { useState } from 'react';
import { Loader2, Eye, EyeOff, Copy, CheckCheck, Trash2 } from 'lucide-react';
import type { AdminKey } from '../../services/admin';

interface KeyListProps {
  keys: AdminKey[];
  loading: boolean;
  error: string | null;
  onRevoke: (id: string) => void;
}

function isRevoked(k: AdminKey) {
  return k.status === 'Revoked';
}

function displayFullKey(k: AdminKey): string {
  if (isRevoked(k)) return '—';
  return `${(k.key || '').substring(0, 18)}************************`;
}

export default function KeyList({ keys, loading, error, onRevoke }: KeyListProps) {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevoke = (id: string) => {
    setRevokingId(id);
    onRevoke(id);
    setRevokingId(null);
  };

  return (
    <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 rounded-[28px] overflow-hidden shadow-sm">
      <div className="bg-[#f8faf9] border-b border-[#e1e9e5]/80 px-5 py-3.5 flex items-center justify-between text-[#55695f] font-bold">
        <span className="font-mono text-[9px] tracking-wider uppercase">Registered Web-Tokens</span>
        <span className="text-xs text-[#0f241d]">{keys.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-graphite" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-red-500">{error}</div>
      ) : keys.length === 0 ? (
        <div className="p-6 text-center text-xs text-graphite">No keys registered yet.</div>
      ) : (
        <div className="divide-y divide-stone-100 text-xs">
          {keys.map((k) => (
            <div
              key={k.id}
              className={`p-5 transition-colors ${isRevoked(k) ? 'bg-rose-500/[0.01] opacity-70' : 'hover:bg-[#f9f9f2]/50'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-forest-deep text-xs">{k.name}</h4>
                    <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold rounded-full font-mono ${
                      isRevoked(k)
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {k.status}
                    </span>
                  </div>

                  <p className="font-mono text-[10px] text-[#2c3d35] bg-[#edf2ef] px-2.5 py-1.5 rounded-lg inline-block select-all max-w-full truncate font-bold border border-[#dae5df]">
                    {isRevoked(k) ? '—' : displayFullKey(k)}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-graphite font-mono">
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    <span>Last Used: {k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                  {!isRevoked(k) && k.key && (
                    <button
                      onClick={() => setVisibleKeys((prev) => ({ ...prev, [k.id]: !prev[k.id] }))}
                      className="p-2 border border-[#dee9e4] hover:bg-stone-50 rounded-xl text-graphite hover:text-black transition-colors"
                      title={visibleKeys[k.id] ? 'Hide key' : 'Reveal key'}
                    >
                      {visibleKeys[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  {!isRevoked(k) && (
                    <button
                      onClick={() => copyKey(k.key, k.id)}
                      className="p-2 border border-[#dee9e4] hover:bg-stone-50 rounded-xl text-graphite hover:text-black transition-colors"
                      title="Copy key"
                    >
                      {copiedKeyId === k.id ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  {!isRevoked(k) && (
                    <button
                      onClick={() => handleRevoke(k.id)}
                      disabled={revokingId === k.id}
                      className="p-2 rounded-xl border border-rose-100 hover:bg-rose-50 text-[#ef4444] hover:text-red-700 transition-colors disabled:opacity-50"
                      title="Revoke key"
                    >
                      {revokingId === k.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
