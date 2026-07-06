import { RefreshCw } from 'lucide-react';

interface SyncMessageBannerProps {
  syncState: 'idle' | 'syncing' | 'done' | 'error';
  syncMessage: string;
  onDismiss: () => void;
}

export default function SyncMessageBanner({ syncState, syncMessage, onDismiss }: SyncMessageBannerProps) {
  if (!syncMessage) return null;

  return (
    <div className={`border-b px-4 py-1.5 text-[11px] ${
      syncState === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400'
        : syncState === 'done' ? 'border-green-500/30 bg-green-500/10 text-green-400'
        : 'border-[#2d2813] bg-[#1a1915] text-[#6e684a]'
    }`}>
      {syncMessage}
      {syncState === 'done' && (
        <button onClick={onDismiss} className="ml-2 text-[#6e684a] hover:text-[#a8a99e]" aria-label="Dismiss">
          <RefreshCw size={10} className="inline" />
        </button>
      )}
    </div>
  );
}
