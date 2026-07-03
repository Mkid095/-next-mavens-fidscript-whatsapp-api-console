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
  const isError = msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed');
  return (
    <form onSubmit={onPay} className="bg-[#181711] border border-[#2d2813] p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-[#cbd3cf]">{pkg.name}</h4>
          <p className="text-xs text-[#6e684a]">
            {(pkg.tokens + (pkg.bonus_tokens || 0)).toLocaleString()} tokens
            {(pkg.bonus_tokens || 0) > 0 ? ` (${pkg.tokens.toLocaleString()} + ${(pkg.bonus_tokens || 0).toLocaleString()} bonus)` : ''}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-lg font-bold text-yellow-500">KES {pkg.price_kes.toLocaleString()}</p>
          <p className="text-[10px] text-[#5a554a]">Total</p>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1.5">M-Pesa Phone Number</label>
        <input
          type="text"
          required
          placeholder="0740123456"
          value={phone}
          onChange={e => onPhone(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1a1915] border border-[#2d2813] rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono text-sm text-[#cbd3cf] placeholder:text-[#5a554a]"
        />
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          isError
            ? 'bg-red-900/40 text-red-400 border border-red-900/50'
            : 'bg-green-900/40 text-green-400 border border-green-900/50'
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
            ? 'bg-yellow-500 hover:bg-yellow-400 text-[#181711]'
            : 'bg-[#2d2813] hover:bg-[#3d3a1e] text-[#cbd3cf] border border-[#3d3a1e]'
        }`}
      >
        <CreditCard className="w-4 h-4 shrink-0" />
        {paying ? 'Processing...' : `Pay KES ${pkg.price_kes.toLocaleString()} via M-Pesa`}
      </button>
    </form>
  );
}