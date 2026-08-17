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
      <div className="text-center py-12 text-[#5a554a]">
        <div className="w-8 h-8 border-2 border-[#2d2813] border-t-yellow-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading transactions...</p>
      </div>
    );
  }

  if (txs.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#181711] flex items-center justify-center mx-auto">
          <History className="w-6 h-6 text-[#3d3a1e]" />
        </div>
        <p className="text-sm font-bold text-[#cbd3cf]">No transactions yet</p>
        <p className="text-xs text-[#6e684a]">Your payment history will appear here after your first purchase.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-[9px] font-bold text-[#6e684a] uppercase tracking-wide mb-2">
        <span>Date</span>
        <span>Package</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Status</span>
      </div>
      {txs.map(tx => (
        <div key={tx.id} className="grid grid-cols-4 gap-2 px-3 py-3 rounded-xl hover:bg-[#2d2813] transition-colors items-center border-b border-[#2d2813] last:border-0">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#cbd3cf]">
              {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[9px] text-[#5a554a] font-mono truncate max-w-[120px]">
              {tx.payhero_reference || tx.checkout_request_id || tx.id}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#cbd3cf] truncate">{tx.package_name || tx.package_id || 'Custom'}</p>
            <p className="text-[9px] text-[#5a554a]">
              {tx.tokens ? `${(tx.tokens + (tx.bonus_tokens || 0)).toLocaleString()} tokens` : '-'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-yellow-500">KES {tx.amount_kes.toLocaleString()}</p>
          </div>
          <div className="flex justify-end"><StatusPill status={tx.status} /></div>
        </div>
      ))}
    </div>
  );
}