import React from 'react';
import { Globe, Cpu, Sparkles, Key, Check } from 'lucide-react';
import type { SharedProvider, WorkspaceConnection } from './types';

interface Props {
  sharedProviders: SharedProvider[];
  connections: WorkspaceConnection[];
  isUsingShared: boolean;
  selectedSharedProvider: SharedProvider | undefined;
  selectedConnection: WorkspaceConnection | undefined;
  onSharedSelect: (sp: SharedProvider) => void;
  onConnectionSelect: (conn: WorkspaceConnection) => void;
}

function ProviderCard({ sp, isSelected, onSelect }: { sp: SharedProvider; isSelected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
        isSelected ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
      }`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
        <Cpu size={14} className={isSelected ? 'text-yellow-400' : 'text-blue-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>{sp.name}</p>
        <p className="text-[10px] text-[#6e684a] truncate">{sp.description}</p>
      </div>
      {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
    </button>
  );
}

function ConnectionCard({ conn, isSelected, onSelect }: { conn: WorkspaceConnection; isSelected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
        isSelected ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
      }`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 shrink-0">
        <Sparkles size={14} className={isSelected ? 'text-yellow-400' : 'text-yellow-500/60'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>{conn.name}</p>
        <p className="text-[10px] text-[#6e684a]">{conn.provider} {conn.api_key_last4 && `(****${conn.api_key_last4})`}</p>
      </div>
      {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
    </button>
  );
}

export default function ProviderSection({
  sharedProviders,
  connections,
  isUsingShared,
  selectedSharedProvider,
  selectedConnection,
  onSharedSelect,
  onConnectionSelect,
}: Props) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-3">AI Provider</label>

      {/* FIDScript Defaults */}
      {sharedProviders.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Globe size={11} /> FIDScript Default (no API key needed)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sharedProviders.map(sp => (
              <ProviderCard key={sp.id} sp={sp} isSelected={isUsingShared && selectedSharedProvider?.id === sp.id} onSelect={() => onSharedSelect(sp)} />
            ))}
          </div>
        </div>
      )}

      {/* Your Connections (BYOK) */}
      <div>
        <p className="text-[10px] font-bold text-[#8f834a] uppercase tracking-wider mb-2 flex items-center gap-1">
          <Key size={11} /> Your Connections
          {connections.length > 0 && <span className="text-[#6e684a]">({connections.length})</span>}
        </p>
        {connections.length === 0 ? (
          <div className="p-4 rounded-xl border border-[#2d2813] bg-[#0d0c0a] text-center">
            <p className="text-[11px] text-[#6e684a]">No connections yet. Add your own API keys in <span className="text-yellow-400">LLM Connections</span> to use custom models.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {connections.map(conn => (
              <ConnectionCard key={conn.id} conn={conn} isSelected={selectedConnection?.id === conn.id} onSelect={() => onConnectionSelect(conn)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
