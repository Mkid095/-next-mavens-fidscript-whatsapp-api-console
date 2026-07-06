import { X, Building } from 'lucide-react';
import { type Client } from '../../../../services/clients';
import { ClientDetailContent } from './ClientDetailContent';

export interface ClientDetailModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onToggle: (id: string) => Promise<void>;
  onResetKey: (id: string) => Promise<void>;
  onAwardTokens: (client: Client) => void;
}

export default function ClientDetailModal({
  isOpen,
  client,
  onClose,
  onToggle,
  onResetKey,
  onAwardTokens,
}: ClientDetailModalProps) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-16" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Building size={15} className="text-yellow-600" />
            <h3 className="text-sm font-semibold text-stone-800">{client.name}</h3>
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
              client.is_active === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
            }`}>
              {client.is_active === 1 ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <ClientDetailContent
          client={client}
          onToggle={onToggle}
          onResetKey={onResetKey}
          onAwardTokens={onAwardTokens}
        />
      </div>
    </div>
  );
}
