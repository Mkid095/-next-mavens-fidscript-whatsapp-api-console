import { Key, Copy, Lock } from 'lucide-react';
import type { ClientApiKey } from '../../../services/api';
import ApiKeyCard from './ApiKeyCard';

interface KeyWithStats extends ClientApiKey {
  request_count?: number;
}

interface ApiKeyListProps {
  apiKeys: KeyWithStats[];
  showKeyValue: Set<string>;
  copiedKeyId: string | null;
  testingKeyId: string | null;
  testResult: { id: string; ok: boolean; msg: string } | null;
  onCopyKey: (id: string, val: string) => void;
  onToggleShowKey: (id: string) => void;
  onTestKey: (k: KeyWithStats) => void;
  onRevokeKey: (id: string, name: string) => void;
  onOpenRegenerateModal: (k: KeyWithStats) => void;
  onCreateFirst: () => void;
  copyToClipboard: (text: string) => void;
}

export default function ApiKeyList({
  apiKeys,
  showKeyValue,
  copiedKeyId,
  testingKeyId,
  testResult,
  onCopyKey,
  onToggleShowKey,
  onTestKey,
  onRevokeKey,
  onOpenRegenerateModal,
  onCreateFirst,
  copyToClipboard,
}: ApiKeyListProps) {
  if (apiKeys.length === 0) {
    return (
      <div className="py-12 text-center text-[#6e684a] space-y-3">
        <Key className="w-10 h-10 text-[#3d3a1e] mx-auto" />
        <p className="font-bold text-[#a8a99e] text-sm">No API keys yet</p>
        <p className="text-xs text-[#6e684a]">Generate a key to start integrating with FidScript.</p>
        <button
          onClick={onCreateFirst}
          className="px-4 py-2 bg-[#eab308] text-[#181711] font-bold text-xs rounded-xl mt-2 hover:bg-yellow-400 transition-all"
        >
          Generate Your First Key
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {apiKeys.map((k) => {
          const isRevoked = k.status === 'Revoked';
          const hasSecret = !!k.key;
          const revealed = showKeyValue.has(k.id) && hasSecret && !isRevoked;

          return (
            <ApiKeyCard
              key={k.id}
              k={k}
              revealed={revealed}
              copied={copiedKeyId === k.id}
              testing={testingKeyId === k.id}
              testResult={testResult}
              onToggleReveal={() => onToggleShowKey(k.id)}
              onCopy={() => onCopyKey(k.id, k.key || '')}
              onTest={() => onTestKey(k)}
              onRegenerate={() => onOpenRegenerateModal(k)}
              onRevoke={() => onRevokeKey(k.id, k.name)}
            />
          );
        })}
      </div>

      {/* Security notice */}
      <div className="p-4 bg-[#181711] border border-[#2d2813] rounded-2xl flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-[#eab308] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#a8a99e]">Keep your API keys secret</p>
          <p className="text-[11px] text-[#6e684a] leading-relaxed">
            Keys are only shown once at creation. Copy and store them securely.
            Use server-to-server communication — never expose in client-side code.
          </p>
        </div>
      </div>
    </>
  );
}
