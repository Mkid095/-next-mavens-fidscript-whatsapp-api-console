import { History } from 'lucide-react';
import { PaymentTransaction } from '../../../services/payments';
import StatusPill from './StatusPill.js';

interface HistoryContentProps {
  loading: boolean;
  txs: PaymentTransaction[];
}

export default function HistoryContent({ loading, txs }: HistoryContentProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-stone-400">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-yellow-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading transactions...</p>
      </div>
    );
  }

  if (txs.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto">
          <History className="w-6 h-6 text-stone-300" />
        </div>
        <p className="text-sm font-bold text-forest-deep">No transactions yet</p>
        <p className="text-xs text-graphite">Your payment history will appear here after your first purchase.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-stone-50 rounded-xl text-[9px] font-bold text-stone-500 uppercase tracking-wide mb-2">
        <span>Date</span>
        <span>Package</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Status</span>
      </div>
      {txs.map(tx => (
        <div key={tx.id} className="grid grid-cols-4 gap-2 px-3 py-3 rounded-xl hover:bg-stone-50 transition-colors items-center border-b border-stone-100 last:border-0">
          <div>
            <p className="text-[11px] font-bold text-forest-deep">
              {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[9px] text-stone-400 font-mono truncate max-w-[120px]">
              {tx.payhero_reference || tx.checkout_request_id || tx.id}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-forest-deep">{tx.package_name || tx.package_id || 'Custom'}</p>
            <p className="text-[9px] text-stone-400">
              {tx.tokens ? `${(tx.tokens + (tx.bonus_tokens || 0)).toLocaleString()} tokens` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-yellow-700">KES {tx.amount_kes.toLocaleString()}</p>
          </div>
          <div className="flex justify-end"><StatusPill status={tx.status} /></div>
        </div>
      ))}
    </div>
  );
}
