import React from 'react';

type RouteId = 'sendText' | 'connectionState' | 'mpesaCallback';

interface RouteParamsProps {
  selectedRoute: RouteId;
  destinationPhone: string;
  messageBody: string;
  mpesaAmount: string;
  mpesaRef: string;
  targetInstance: string;
  onPhoneChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onRefChange: (v: string) => void;
}

export default function RouteParams({
  selectedRoute,
  destinationPhone,
  messageBody,
  mpesaAmount,
  mpesaRef,
  targetInstance,
  onPhoneChange,
  onMessageChange,
  onAmountChange,
  onRefChange,
}: RouteParamsProps) {
  if (selectedRoute === 'sendText') {
    return (
      <div className="space-y-2.5">
        <div>
          <label className="block text-[9px] font-bold text-[#657a6e]">Destination Phone (+254...)</label>
          <input
            type="text"
            value={destinationPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-lg font-mono text-xs focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-[#657a6e]">WhatsApp Message Text</label>
          <textarea
            value={messageBody}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={2}
            className="w-full px-2.5 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-lg text-xs focus:outline-none resize-none"
          />
        </div>
      </div>
    );
  }

  if (selectedRoute === 'mpesaCallback') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] font-bold text-[#657a6e]">Amount (KES)</label>
          <input
            type="text"
            value={mpesaAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-[#dee9e4] bg-white rounded-lg font-mono text-xs focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-[#657a6e]">M-Pesa Code</label>
          <input
            type="text"
            value={mpesaRef}
            onChange={(e) => onRefChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-[#dee9e4] bg-white rounded-lg font-mono text-xs focus:outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <p className="text-[10px] text-graphite italic leading-relaxed py-1">
      Queries state metrics of instance: <code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">{targetInstance}</code> including paired status, battery level, and channel rate.
    </p>
  );
}
