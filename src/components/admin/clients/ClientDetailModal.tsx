import { useState, useEffect, useCallback } from 'react';
import { X, Mail, Phone, Building, Calendar, Shield, Coins, RefreshCw, ToggleLeft, ToggleRight, Smartphone, AlertCircle } from 'lucide-react';
import { clientsApi, type Client, type TokenTransaction } from '../../../services/clients';

type Tab = 'details' | 'transactions';

interface ClientDetailModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onToggle: (id: string) => Promise<void>;
  onResetKey: (id: string) => Promise<void>;
  onAwardTokens: (client: Client) => void;
}

function typeBadge(type: string): { label: string; color: string } {
  switch (type) {
    case 'admin_award': return { label: 'Award', color: 'bg-emerald-100 text-emerald-700' };
    case 'purchase':     return { label: 'Purchase', color: 'bg-blue-100 text-blue-700' };
    case 'sent':        return { label: 'Sent', color: 'bg-stone-100 text-stone-600' };
    case 'refund':      return { label: 'Refund', color: 'bg-yellow-100 text-yellow-700' };
    case 'failed':      return { label: 'Failed', color: 'bg-red-100 text-red-700' };
    default:            return { label: type, color: 'bg-stone-100 text-stone-600' };
  }
}

export default function ClientDetailModal({
  isOpen,
  client,
  onClose,
  onToggle,
  onResetKey,
  onAwardTokens,
}: ClientDetailModalProps) {
  const [tab, setTab] = useState<Tab>('details');
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!isOpen || !client || tab !== 'transactions') return;
    setLoadingTx(true);
    setTxError(null);
    clientsApi.getTransactions(client.id).then((res) => {
      if (res.success && res.data) setTransactions(res.data);
      else setTxError(res.error || 'Failed to load');
      setLoadingTx(false);
    });
  }, [isOpen, client, tab]);

  const handleToggle = useCallback(async () => {
    if (!client) return;
    setActioning(true);
    await onToggle(client.id);
    setActioning(false);
  }, [client, onToggle]);

  const handleResetKey = useCallback(async () => {
    if (!client) return;
    setActioning(true);
    await onResetKey(client.id);
    setActioning(false);
  }, [client, onResetKey]);

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

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          {(['details', 'transactions'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'text-forest-deep border-b-2 border-forest-deep' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {tab === 'details' && (
            <div className="space-y-4 p-4">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Mail size={13} className="text-stone-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Phone size={13} className="text-stone-400 shrink-0" />
                  <span>{client.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Calendar size={13} className="text-stone-400 shrink-0" />
                  <span>Joined {new Date(client.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Shield size={13} className="text-stone-400 shrink-0" />
                  <span>{client.plan_name || 'No plan'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-center">
                  <p className="text-lg font-bold text-stone-800">{(client as any).token_balance?.toLocaleString() ?? '—'}</p>
                  <p className="text-[10px] text-stone-400">Token balance</p>
                </div>
                <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-center">
                  <p className="text-lg font-bold text-stone-800">{client.total_messages.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">Messages sent</p>
                </div>
                <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-center">
                  <p className="text-lg font-bold text-stone-800">{client.msg_count_today.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">Today</p>
                </div>
              </div>

              {/* Instances */}
              {(client as any).instances?.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Containers</p>
                  <div className="space-y-2">
                    {(client as any).instances.map((inst: any) => (
                      <div key={inst.id} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Smartphone size={13} className="text-yellow-600" />
                          <span className="font-medium text-stone-700">{inst.display_name || inst.name}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                          inst.status === 'connected' ? 'bg-emerald-100 text-emerald-700' :
                          inst.status === 'connecting' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-stone-100 text-stone-500'
                        }`}>
                          {inst.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onAwardTokens(client)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs font-bold text-yellow-700 hover:bg-yellow-100 transition-colors"
                >
                  <Coins size={13} /> Award Tokens
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggle}
                    disabled={actioning}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                  >
                    {client.is_active === 1 ? <><ToggleLeft size={13} /> Disable</> : <><ToggleRight size={13} /> Enable</>}
                  </button>
                  <button
                    onClick={handleResetKey}
                    disabled={actioning}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={13} /> Reset API Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'transactions' && (
            <div className="p-4">
              {loadingTx && <p className="text-xs text-stone-400 text-center py-6">Loading…</p>}
              {txError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{txError}</p>}
              {!loadingTx && !txError && transactions.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-6">No transactions yet.</p>
              )}
              {!loadingTx && !txError && transactions.length > 0 && (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const badge = typeBadge(tx.type);
                    return (
                      <div key={tx.id} className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${badge.color}`}>{badge.label}</span>
                          <span className="text-stone-500 text-[10px]">{new Date(tx.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </p>
                          {tx.reference && <p className="text-[9px] text-stone-400 truncate max-w-[140px]">{tx.reference}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
