import React from 'react';
import { ApiKey } from '../../../types';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface KeyRowProps {
  key_: ApiKey;
  isVisible: boolean;
  onToggleVisibility: (id: string) => void;
  onRevoke: (id: string) => void;
}

export default function KeyRow({ key_, isVisible, onToggleVisibility, onRevoke }: KeyRowProps) {
  const isRevoked = key_.status === 'Revoked';

  return (
    <div
      className={`p-5 transition-colors ${
        isRevoked ? 'bg-rose-500/[0.01] opacity-70' : 'hover:bg-eco-bg/20'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-forest-deep text-xs">{key_.name}</h4>
            <span
              className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold rounded-full font-mono ${
                isRevoked
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {key_.status}
            </span>
          </div>

          <p className="font-mono text-[10px] text-[#2c3d35] bg-[#edf2ef] px-2.5 py-1.5 rounded-lg inline-block select-all max-w-full truncate font-bold border border-[#dae5df]">
            {isVisible ? key_.key : `${key_.key.substring(0, 11)}********************************`}
          </p>

          <div className="flex items-center gap-4 text-[10px] text-graphite font-mono">
            <span>Date Created: {key_.created}</span>
            <span>Last Transmission: {key_.lastUsed}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
          <button
            onClick={() => onToggleVisibility(key_.id)}
            className="p-2 border border-[#dee9e4] hover:bg-stone-50 rounded-xl text-graphite hover:text-black transition-colors"
            title="Display full signature"
            disabled={isRevoked}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onRevoke(key_.id)}
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
}
