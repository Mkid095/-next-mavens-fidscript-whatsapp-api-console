import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';

interface CreateKeyModalProps {
  newKeyName: string;
  onKeyNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateKeyModal({ newKeyName, onKeyNameChange, onSubmit }: CreateKeyModalProps) {
  return (
    <div className="bg-white border border-[#e1e9e5]/80 rounded-3xl p-5 space-y-4 h-fit shadow-sm">
      <div>
        <h3 className="text-xs font-bold text-forest-deep uppercase tracking-wider">
          Generate Bearer Token
        </h3>
        <p className="text-[11px] text-[#4d665a] mt-1">
          Secret keys let your CRM, ERP, or transactional servers dispatch data straight into Nairobi routes.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold text-[#0f241d]">
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
            Credential Label / Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. ERP System Webhook Token"
            value={newKeyName}
            onChange={(e) => onKeyNameChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#0c2e21] text-white font-bold py-2.5 rounded-xl text-xs transition-all"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Register Evolution Key</span>
        </button>
      </form>

      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-[18px] space-y-1.5">
        <h4 className="font-bold text-[11px] text-forest-deep flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          Cryptographic Safeguarding
        </h4>
        <p className="text-[10px] text-[#55695f] leading-relaxed font-medium">
          API tokens contain high-entropy private prefixes (`NM_EVO_LIVE_...`). Keep credentials fully hidden.
          Avoid checking client credential strings into public Git repositories.
        </p>
      </div>
    </div>
  );
}
