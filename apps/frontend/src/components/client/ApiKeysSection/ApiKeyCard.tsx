import React from 'react';
import { Eye, EyeOff, Copy, Check, Trash2, Terminal, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { ClientApiKey } from '../../../services/api';

interface KeyWithStats extends ClientApiKey {
  request_count?: number;
}

interface ApiKeyCardProps {
  k: KeyWithStats;
  revealed: boolean;
  copied: boolean;
  testing: boolean;
  testResult: { id: string; ok: boolean; msg: string } | null;
  onToggleReveal: () => void;
  onCopy: () => void;
  onTest: () => void;
  onRegenerate: () => void;
  onRevoke: () => void;
}

export default function ApiKeyCard({
  k,
  revealed,
  copied,
  testing,
  testResult,
  onToggleReveal,
  onCopy,
  onTest,
  onRegenerate,
  onRevoke,
}: ApiKeyCardProps) {
  const isRevoked = k.status === 'Revoked';
  const hasSecret = !!k.key;
  const masked = `${k.key_prefix || k.key?.substring(0, 20) || 'fidscript_live_'}••••••••••••`;

  return (
    <div
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
                onClick={onToggleReveal}
                className="p-1.5 text-[#6e684a] hover:text-[#eab308] bg-[#181711] border border-[#2d2813] rounded-lg transition-colors shrink-0"
                title={revealed ? 'Hide' : 'Reveal'}
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onCopy}
                className="p-1.5 text-[#6e684a] hover:text-[#eab308] bg-[#181711] border border-[#2d2813] rounded-lg transition-colors shrink-0"
                title="Copy full key"
              >
                {copied
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
            onClick={onTest}
            disabled={testing || !hasSecret}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[#2d2813] hover:bg-[#3d3a1e] text-[#6e684a] border border-[#2d2813] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title={hasSecret ? 'Test this key against the live API' : 'Secret not in memory — regenerate to test'}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{testing ? 'Testing...' : 'Test'}</span>
            <span className="sm:hidden">{testing ? '...' : 'Test'}</span>
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[#2d2813] hover:bg-[#3d3a1e] text-amber-400 border border-[#2d2813] rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
          <button
            onClick={onRevoke}
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
}
