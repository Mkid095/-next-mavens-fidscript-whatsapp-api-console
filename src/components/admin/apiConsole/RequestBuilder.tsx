import React from 'react';
import { Play, RefreshCw } from 'lucide-react';
import RouteParams from './RouteParams';

type RouteId = 'sendText' | 'connectionState' | 'mpesaCallback';

interface RequestBuilderProps {
  selectedRoute: RouteId;
  targetInstance: string;
  customApiKey: string;
  destinationPhone: string;
  messageBody: string;
  mpesaAmount: string;
  mpesaRef: string;
  isRunning: boolean;
  onRouteChange: (route: RouteId) => void;
  onInstanceChange: (v: string) => void;
  onApiKeyChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onRefChange: (v: string) => void;
  onRun: () => void;
}

const ROUTES = [
  { id: 'sendText' as RouteId, label: 'POST /message/sendText', desc: 'Dispatch active text message' },
  { id: 'connectionState' as RouteId, label: 'GET /instance/connectionState', desc: 'Fetch container details' },
  { id: 'mpesaCallback' as RouteId, label: 'POST /webhook/mpesa-callback', desc: 'Mock automated M-Pesa receipt' },
];

export default function RequestBuilder({
  selectedRoute,
  targetInstance,
  customApiKey,
  destinationPhone,
  messageBody,
  mpesaAmount,
  mpesaRef,
  isRunning,
  onRouteChange,
  onInstanceChange,
  onApiKeyChange,
  onPhoneChange,
  onMessageChange,
  onAmountChange,
  onRefChange,
  onRun,
}: RequestBuilderProps) {
  return (
    <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 rounded-3xl p-5 space-y-5">
      <span className="block font-mono text-[10px] uppercase font-bold tracking-widest text-emerald-800 border-b border-[#e1e9e5]/60 pb-2">
        REST Engine Simulator
      </span>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-2">
            Simulated Endpoint Target
          </label>
          <div className="flex flex-col gap-1.5">
            {ROUTES.map((item) => (
              <button
                key={item.id}
                onClick={() => onRouteChange(item.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex flex-col transition-all focus:outline-none ${
                  selectedRoute === item.id
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                    : 'bg-[#f8faf9] text-[#4d665a] border-[#e1e9e5] hover:bg-[#f0f4f2]'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[9px] text-[#718c7f] font-normal mt-0.5">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
            Target Instance Container
          </label>
          <input
            type="text"
            value={targetInstance}
            onChange={(e) => onInstanceChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
            ApiKey Token Lease Bearer
          </label>
          <input
            type="text"
            value={customApiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
          />
        </div>

        <div className="pt-2 border-t border-[#e2eae6]/60 space-y-3">
          <span className="block text-[10px] font-bold text-graphite uppercase tracking-wider">
            Interactive Request Params
          </span>
          <RouteParams
            selectedRoute={selectedRoute}
            destinationPhone={destinationPhone}
            messageBody={messageBody}
            mpesaAmount={mpesaAmount}
            mpesaRef={mpesaRef}
            targetInstance={targetInstance}
            onPhoneChange={onPhoneChange}
            onMessageChange={onMessageChange}
            onAmountChange={onAmountChange}
            onRefChange={onRefChange}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[#e2eae6]/60">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#0c2e21] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Play className="w-4 h-4 fill-white text-white" />
          )}
          <span>{isRunning ? 'Delivering REST sequence...' : 'Initiate API Hook'}</span>
        </button>
      </div>
    </div>
  );
}
