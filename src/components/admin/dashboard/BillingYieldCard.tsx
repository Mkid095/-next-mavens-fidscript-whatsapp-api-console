import React from 'react';
import { Database, CheckCircle, TrendingUp } from 'lucide-react';

export default function BillingYieldCard() {
  return (
    <div className="bg-[#dcefe5] border border-[#bcdbc8] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
      <div className="space-y-4">
        <p className="text-[11px] font-bold text-[#1e583c] uppercase tracking-wider">FIDScript Billing Yield (KES)</p>

        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[#0e3c25] tracking-tight leading-none">KES 942,650</h2>
          <div className="flex items-center gap-1 text-xs font-semibold text-[#185335]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>+24.5% direct M-Pesa automated subscription</span>
          </div>
        </div>

        <hr className="border-[#bddfc9]" />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c8e2d4] flex items-center justify-center text-emerald-800">
                <Database className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="font-bold text-[#143625]">Daraja API Hook C2B</p>
                <p className="text-[10px] text-[#4d7d65]">Safaricom Instant Callback</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-forest-deep">KES 540K</p>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded">Processed</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c8e2d4] flex items-center justify-center text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="font-bold text-[#143625]">Corporate Bank Wire</p>
                <p className="text-[10px] text-[#4d7d65]">Manual Invoices Settled</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-forest-deep">KES 402K</p>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded">Reconciled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
