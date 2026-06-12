import React, { useState } from 'react';
import { ApiKey } from '../types';
import { ShieldCheck, Eye, EyeOff, Trash2, Plus, Check, RefreshCw } from 'lucide-react';

interface SecurityKeysViewProps {
  keys: ApiKey[];
  onAddKey: (name: string) => void;
  onRevokeKey: (id: string) => void;
}

export default function SecurityKeysView({ keys, onAddKey, onRevokeKey }: SecurityKeysViewProps) {
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    onAddKey(newKeyName.trim());
    setNewKeyName('');
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">
          Security Credentials & API Tokens
        </h1>
        <p className="text-xs text-graphite mt-1">
          Generate high-entropy bearer tokens to authorize external web app integrations with your Evolution WhatsApp instances.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create new token */}
        <div className="bg-white border border-[#e1e9e5]/80 rounded-3xl p-5 space-y-4 h-fit shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-forest-deep uppercase tracking-wider">
              Generate Bearer Token
            </h3>
            <p className="text-[11px] text-[#4d665a] mt-1">
              Secret keys let your CRM, Erp, or transactional servers dispatch data straight into Nairobi routes.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs font-semibold text-[#0f241d]">
            <div>
              <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
                Credential Label / Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ERP System Webhook Token"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#0c2e21] text-white font-bold py-2.5 rounded-xl text-xs transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Register Evolution Key</span>
            </button>
          </form>

          {/* Secure advisory card */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-[18px] space-y-1.5">
            <h4 className="font-bold text-[11px] text-forest-deep flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              Cryptographic Safeguarding
            </h4>
            <p className="text-[10px] text-[#55695f] leading-relaxed font-medium">
              API tokens contain high-entropy private prefixes (`NM_EVO_LIVE_...`). Keep credentials fully hidden. Avoid checking client credential strings into public Git repositories.
            </p>
          </div>
        </div>

        {/* Right Columns: Active Key List */}
        <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 rounded-[28px] overflow-hidden shadow-sm">
          <div className="bg-[#f8faf9] border-b border-[#e1e9e5]/80 px-5 py-3.5 flex items-center justify-between text-[#55695f] font-bold">
            <span className="font-mono text-[9px] tracking-wider uppercase">
              Registered Web-Tokens
            </span>
            <span className="text-xs text-[#0f241d]">
              {keys.length} active leases
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {keys.map((k) => {
              const isVisible = visibleKeys[k.id];
              const isRevoked = k.status === 'Revoked';
              return (
                <div
                  key={k.id}
                  className={`p-5 transition-colors ${
                    isRevoked ? 'bg-rose-500/[0.01] opacity-70' : 'hover:bg-eco-bg/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-forest-deep text-xs">
                          {k.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold rounded-full font-mono ${
                            isRevoked
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {k.status}
                        </span>
                      </div>

                      {/* Display redacted/visible key inside Mono blocks */}
                      <p className="font-mono text-[10px] text-[#2c3d35] bg-[#edf2ef] px-2.5 py-1.5 rounded-lg inline-block select-all max-w-full truncate font-bold border border-[#dae5df]">
                        {isVisible 
                          ? k.key 
                          : `${k.key.substring(0, 11)}********************************`
                        }
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-graphite font-mono">
                        <span>Date Created: {k.created}</span>
                        <span>Last Transmission: {k.lastUsed}</span>
                      </div>
                    </div>

                    {/* Quick controls: Visibility & Revoking */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => toggleVisibility(k.id)}
                        className="p-2 border border-[#dee9e4] hover:bg-stone-50 rounded-xl text-graphite hover:text-black transition-colors"
                        title="Display full signature"
                        disabled={isRevoked}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onRevokeKey(k.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isRevoked
                            ? 'text-neutral-300 pointer-events-none'
                            : 'border border-rose-100 hover:bg-rose-50 text-[#ef4444] hover:text-red-700'
                        }`}
                        title="Deauthorize Token"
                        disabled={isRevoked}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
