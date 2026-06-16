import React from 'react';
import { CreditCard, XCircle, CheckCircle } from 'lucide-react';

interface PkgSummary {
  id: string;
  name: string;
  tokens: number;
  price_kes: number;
  bonus_tokens?: number;
}

interface PayFormProps {
  pkg: PkgSummary;
  phone: string;
  onPhone: (v: string) => void;
  paying: boolean;
  msg: string;
  onPay: (e: React.FormEvent) => void;
  custom?: boolean;
}

export default function PayForm({
  pkg, phone, onPhone, paying, msg, onPay, custom,
}: PayFormProps) {
  const isError = msg.includes('Error') || msg.includes('error') || msg.includes('failed');
  return (
    <form onSubmit={onPay} className="bg-[#fafaf5] border border-[#eaebe4] p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-forest-deep">{pkg.name}</h4>
          <p className="text-xs text-graphite">{(pkg.tokens + (pkg.bonus_tokens || 0)).toLocaleString()} tokens{(pkg.bonus_tokens || 0) > 0 ? ` (${pkg.tokens.toLocaleString()} + ${(pkg.bonus_tokens || 0).toLocaleString()} bonus)` : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-yellow-800">KES {pkg.price_kes.toLocaleString()}</p>
          <p className="text-[10px] text-stone-400">Total</p>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">M-Pesa Phone Number</label>
        <input
          type="text"
          required
          placeholder="0740123456"
          value={phone}
          onChange={e => onPhone(e.target.value)}
          className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono text-sm text-forest-deep"
        />
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {isError ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          {msg}
        </div>
      )}

      <button
        type="submit"
        disabled={paying || !phone}
        className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
          custom
            ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950'
            : 'bg-forest-deep hover:bg-[#33301a] text-white'
        }`}
      >
        <CreditCard className="w-4 h-4 shrink-0" />
        {paying ? 'Processing...' : `Pay KES ${pkg.price_kes.toLocaleString()} via M-Pesa`}
      </button>
    </form>
  );
}
