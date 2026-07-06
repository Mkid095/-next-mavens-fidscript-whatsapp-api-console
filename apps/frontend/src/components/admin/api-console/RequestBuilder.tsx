import React from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { RouteId, RouteConfig } from './endpointsData';

interface RequestBuilderProps {
  routes: RouteConfig[];
  selectedRoute: RouteId;
  onSelectRoute: (id: RouteId) => void;
  targetInstance: string;
  onInstanceChange: (v: string) => void;
  customApiKey: string;
  onApiKeyChange: (v: string) => void;
  destinationPhone: string;
  onDestinationPhoneChange: (v: string) => void;
  messageBody: string;
  onMessageBodyChange: (v: string) => void;
  mpesaAmount: string;
  onMpesaAmountChange: (v: string) => void;
  mpesaRef: string;
  onMpesaRefChange: (v: string) => void;
  isRunning: boolean;
  onRunRequest: () => void;
}

const inputClass = 'w-full px-3 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono text-xs';

function RouteButtons({ routes, selectedRoute, onSelectRoute }: Omit<RequestBuilderProps, 'targetInstance' | 'onInstanceChange' | 'customApiKey' | 'onApiKeyChange' | 'destinationPhone' | 'onDestinationPhoneChange' | 'messageBody' | 'onMessageBodyChange' | 'mpesaAmount' | 'onMpesaAmountChange' | 'mpesaRef' | 'onMpesaRefChange' | 'isRunning' | 'onRunRequest'>) {
  return (
    <div className="flex flex-col gap-1.5">
      {routes.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectRoute(item.id)}
          className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex flex-col transition-all focus:outline-none ${
            selectedRoute === item.id
              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-900/50'
              : 'bg-[#181711] text-[#a8a99e] border-[#2d2813] hover:bg-[#2d2813]'
          }`}
        >
          <span>{item.label}</span>
          <span className="text-[9px] text-[#6e684a] font-normal mt-0.5">{item.desc}</span>
        </button>
      ))}
    </div>
  );
}

function RequestParams({
  selectedRoute, targetInstance,
  destinationPhone, onDestinationPhoneChange, messageBody, onMessageBodyChange,
  mpesaAmount, onMpesaAmountChange, mpesaRef, onMpesaRefChange,
}: Pick<RequestBuilderProps, 'selectedRoute' | 'targetInstance' | 'destinationPhone' | 'onDestinationPhoneChange' | 'messageBody' | 'onMessageBodyChange' | 'mpesaAmount' | 'onMpesaAmountChange' | 'mpesaRef' | 'onMpesaRefChange'>) {
  if (selectedRoute === 'sendText') {
    return (
      <div className="space-y-2.5">
        <div>
          <label className="block text-[9px] font-bold text-[#6e684a]">Destination Phone (+254...)</label>
          <input type="text" value={destinationPhone} onChange={(e) => onDestinationPhoneChange(e.target.value)} className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg font-mono text-xs focus:outline-none" />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-[#6e684a]">Message text</label>
          <textarea value={messageBody} onChange={(e) => onMessageBodyChange(e.target.value)} rows={2} className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs focus:outline-none resize-none" />
        </div>
      </div>
    );
  }
  if (selectedRoute === 'mpesaCallback') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] font-bold text-[#6e684a]">Amount (KES)</label>
          <input type="text" value={mpesaAmount} onChange={(e) => onMpesaAmountChange(e.target.value)} className="w-full px-2.5 py-2 border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg font-mono text-xs focus:outline-none" />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-[#6e684a]">M-Pesa Code</label>
          <input type="text" value={mpesaRef} onChange={(e) => onMpesaRefChange(e.target.value)} className="w-full px-2.5 py-2 border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg font-mono text-xs focus:outline-none" />
        </div>
      </div>
    );
  }
  if (selectedRoute === 'connectionState') {
    return (
      <p className="text-[10px] text-[#a8a99e] italic leading-relaxed py-1">
        Queries state metrics of instance: <code className="font-mono text-yellow-500 bg-[#181711] px-1 py-0.5 rounded">{targetInstance}</code> including paired status, battery level, and channel rate.
      </p>
    );
  }
  return null;
}

export default function RequestBuilder({
  routes, selectedRoute, onSelectRoute,
  targetInstance, onInstanceChange, customApiKey, onApiKeyChange,
  destinationPhone, onDestinationPhoneChange, messageBody, onMessageBodyChange,
  mpesaAmount, onMpesaAmountChange, mpesaRef, onMpesaRefChange,
  isRunning, onRunRequest,
}: RequestBuilderProps) {
  return (
    <div className="lg:col-span-2 bg-[#1a1915] border border-[#2d2813] rounded-3xl p-5 space-y-5">
      <span className="block font-mono text-[10px] uppercase font-bold tracking-widest text-yellow-500 border-b border-[#2d2813] pb-2">
        REST Engine Simulator
      </span>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-[#a8a99e] uppercase tracking-wider mb-2">Simulated Endpoint Target</label>
          <RouteButtons routes={routes} selectedRoute={selectedRoute} onSelectRoute={onSelectRoute} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#a8a99e] uppercase tracking-wider mb-1.5">Target Instance Container</label>
          <input type="text" value={targetInstance} onChange={(e) => onInstanceChange(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#a8a99e] uppercase tracking-wider mb-1.5">ApiKey Token Lease Bearer</label>
          <input type="text" value={customApiKey} onChange={(e) => onApiKeyChange(e.target.value)} className={inputClass} />
        </div>

        <div className="pt-2 border-t border-[#2d2813] space-y-3">
          <span className="block text-[10px] font-bold text-[#a8a99e] uppercase tracking-wider">Interactive Request Params</span>
          <RequestParams
            selectedRoute={selectedRoute} targetInstance={targetInstance}
            destinationPhone={destinationPhone} onDestinationPhoneChange={onDestinationPhoneChange}
            messageBody={messageBody} onMessageBodyChange={onMessageBodyChange}
            mpesaAmount={mpesaAmount} onMpesaAmountChange={onMpesaAmountChange}
            mpesaRef={mpesaRef} onMpesaRefChange={onMpesaRefChange}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#2d2813]">
        <button
          onClick={onRunRequest}
          disabled={isRunning}
          className="w-full inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] py-2.5 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none disabled:opacity-50"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin text-[#181711]" /> : <Play className="w-4 h-4 fill-[#181711] text-[#181711]" />}
          <span>{isRunning ? 'Delivering REST sequence...' : 'Initiate API Hook'}</span>
        </button>
      </div>
    </div>
  );
}