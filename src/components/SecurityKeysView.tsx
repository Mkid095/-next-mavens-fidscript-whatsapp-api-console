import React, { useState } from 'react';
import { ApiKey } from '../types';
import KeyRow from './admin/keys/KeyRow';
import CreateKeyModal from './admin/keys/CreateKeyModal';

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
        <CreateKeyModal
          newKeyName={newKeyName}
          onKeyNameChange={setNewKeyName}
          onSubmit={handleCreate}
        />

        <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 rounded-[28px] overflow-hidden shadow-sm">
          <div className="bg-[#f8faf9] border-b border-[#e1e9e5]/80 px-5 py-3.5 flex items-center justify-between text-[#55695f] font-bold">
            <span className="font-mono text-[9px] tracking-wider uppercase">
              Registered Web-Tokens
            </span>
            <span className="text-xs text-[#0f241d]">{keys.length} active leases</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {keys.map((k) => (
              <KeyRow
                key={k.id}
                key_={k}
                isVisible={!!visibleKeys[k.id]}
                onToggleVisibility={toggleVisibility}
                onRevoke={onRevokeKey}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
