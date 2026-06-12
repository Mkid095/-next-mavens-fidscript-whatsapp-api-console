import React, { useState } from 'react';
import { Play, Copy, RefreshCw, Terminal, CheckCircle2, Braces, Smartphone, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function ApiConsoleView() {
  const [selectedRoute, setSelectedRoute] = useState<'sendText' | 'connectionState' | 'mpesaCallback'>('sendText');
  const [targetInstance, setTargetInstance] = useState('soostori');
  const [customApiKey, setCustomApiKey] = useState('NM_EVO_LIVE_df3c6...2e6');
  
  // Custom interactive route inputs
  const [destinationPhone, setDestinationPhone] = useState('254732203353');
  const [messageBody, setMessageBody] = useState('Habari! Your Safaricom payment has been confirmed.');
  
  const [mpesaAmount, setMpesaAmount] = useState('1,500');
  const [mpesaRef, setMpesaRef] = useState('RHF4KT9XM1');

  // Response execution states
  const [isRunning, setIsRunning] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Endpoint map representation
  const getEndpointPath = () => {
    switch (selectedRoute) {
      case 'sendText':
        return `/message/sendText/${targetInstance}`;
      case 'connectionState':
        return `/instance/connectionState/${targetInstance}`;
      case 'mpesaCallback':
        return `/webhook/mpesa/daraja-callback`;
    }
  };

  const handleRunRequest = () => {
    setIsRunning(true);
    setResponseCode(null);
    setResponseBody('');
    
    setTimeout(() => {
      setIsRunning(false);
      setResponseCode(200);

      let payloadResult = {};

      if (selectedRoute === 'sendText') {
        payloadResult = {
          status: "success",
          messageId: `NM_EVO_MSG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          instance: targetInstance,
          payload: {
            phone: destinationPhone,
            message: messageBody,
            device_pacing_ms: 250,
            status: "PENDING_HANDSHAKE"
          },
          telemetry: {
            datacenter: "nairobi-node-01",
            latency: "14ms"
          }
        };
      } else if (selectedRoute === 'connectionState') {
        payloadResult = {
          name: targetInstance,
          status: "connected",
          owner: {
            phone: "254732203353",
            pushName: "Soostori Kenya"
          },
          handshake: {
            connected_at: new Date().toISOString(),
            uptime_seconds: 345000,
            device: "Android 13.0 (Evolution Native)"
          }
        };
      } else {
        payloadResult = {
          mpesa_service: "C2B_daraja_automated_hook",
          status: "PROCESSED",
          transaction_ref: mpesaRef,
          amount: parseFloat(mpesaAmount.replace(/,/g, '')),
          sender_phone: destinationPhone,
          whatsapp_receipt_dispatch: {
            status: "SENT",
            gateway_delay_ms: 18
          }
        };
      }

      setResponseBody(JSON.stringify(payloadResult, null, 2));
    }, 700);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(responseBody || 'No active response payload');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">
          Evolution API REST Sandbox
        </h1>
        <p className="text-xs text-graphite mt-1">
          Dry-run secure POST / GET requests to check WhatsApp payload parameters and Daraja callback events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Configurator */}
        <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 rounded-3xl p-5 space-y-5">
          <span className="block font-mono text-[10px] uppercase font-bold tracking-widest text-emerald-800 border-b border-[#e1e9e5]/60 pb-2">
            REST Engine Simulator
          </span>

          <div className="space-y-4 text-xs">
            {/* Route Selector */}
            <div>
              <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-2">
                Simulated Endpoint Target
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'sendText', label: 'POST /message/sendText', desc: 'Dispatch active text message' },
                  { id: 'connectionState', label: 'GET /instance/connectionState', desc: 'Fetch container details' },
                  { id: 'mpesaCallback', label: 'POST /webhook/mpesa-callback', desc: 'Mock automated M-Pesa receipt' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRoute(item.id as any)}
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

            {/* Target Instance */}
            <div>
              <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
                Target Instance Container
              </label>
              <input
                type="text"
                value={targetInstance}
                onChange={(e) => setTargetInstance(e.target.value)}
                className="w-full px-3 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>

            {/* Custom Header */}
            <div>
              <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
                ApiKey Token Lease Bearer
              </label>
              <input
                type="text"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>

            {/* Custom fields depending on Route */}
            <div className="pt-2 border-t border-[#e2eae6]/60 space-y-3">
              <span className="block text-[10px] font-bold text-graphite uppercase tracking-wider">
                Interactive Request Params
              </span>

              {selectedRoute === 'sendText' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[9px] font-bold text-[#657a6e]">Destination Phone (+254...)</label>
                    <input
                      type="text"
                      value={destinationPhone}
                      onChange={(e) => setDestinationPhone(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-lg font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#657a6e]">WhatsApp Message Text</label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-lg text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {selectedRoute === 'mpesaCallback' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-[#657a6e]">Amount (KES)</label>
                    <input
                      type="text"
                      value={mpesaAmount}
                      onChange={(e) => setMpesaAmount(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#dee9e4] bg-white rounded-lg font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#657a6e]">M-Pesa Code</label>
                    <input
                      type="text"
                      value={mpesaRef}
                      onChange={(e) => setMpesaRef(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#dee9e4] bg-white rounded-lg font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedRoute === 'connectionState' && (
                <p className="text-[10px] text-graphite italic leading-relaxed py-1">
                  Queries state metrics of instance: <code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">{targetInstance}</code> including paired status, battery level, and channel rate.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2eae6]/60">
            <button
              onClick={handleRunRequest}
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

        {/* Right Shell Terminal */}
        <div className="lg:col-span-3 bg-[#0d1613] border border-[#162721] rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="p-4 bg-[#11211b] border-b border-[#1b3129] flex items-center justify-between text-[#cbd4d0]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-[11px] font-bold">
                Evolution Server Core Terminal
              </span>
            </div>

            {responseCode && (
              <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold font-mono bg-[#10b981]/15 text-emerald-400 border border-emerald-500/20">
                HTTP {responseCode} OK
              </span>
            )}
          </div>

          {/* Code Shell Area */}
          <div className="p-5 flex-1 min-h-[300px] font-mono text-[11px] whitespace-pre overflow-auto bg-[#09100e] text-emerald-300">
            {isRunning ? (
              <div className="h-full flex flex-col items-center justify-center text-[#567a68] space-y-3 pb-8">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="font-bold">POST {getEndpointPath()} HTTP/1.1</span>
                <span>Resolving remote node handshakes...</span>
              </div>
            ) : responseBody ? (
              <motion.code
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="block text-[#c4ebd8] leading-relaxed"
              >
                {responseBody}
              </motion.code>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#415e50]/70 text-center space-y-2 py-12">
                <Braces className="w-8 h-8 text-[#263e32]" />
                <p className="font-bold">Ready to dispatch requests.</p>
                <p className="text-[10px] text-[#416252]">
                  API Sandbox targets: <code className="font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">{getEndpointPath()}</code>
                </p>
              </div>
            )}
          </div>

          {/* Terminal control footer */}
          <div className="p-4 bg-[#0d1613] border-t border-[#162721] flex items-center justify-between text-[#4e6a5b]">
            <span className="text-[9px] font-mono font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL HANDSHAKE DEPLOYED</span>
            </span>
            
            {responseBody && (
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 text-[10px] text-[#cbd4d0] hover:text-white bg-[#14231e] hover:bg-[#192e27] border border-[#203a31] px-3 py-1.5 rounded-lg transition-colors focus:outline-none"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
