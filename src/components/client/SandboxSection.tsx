import React, { useState } from 'react';
import { Send, Terminal, Activity } from 'lucide-react';
import { instancesApi } from '../../services/api';
import type { Instance } from '../../services/api';

interface SandboxSectionProps {
  clientToken?: string;
  instances: Instance[];
  tokenBalance: number;
  onTokenDeduct: (n: number) => void;
}

export default function SandboxSection({
  clientToken,
  instances,
  tokenBalance,
  onTokenDeduct,
}: SandboxSectionProps) {
  const [selectedInstance, setSelectedInstance] = useState('');
  const [destinationPhone, setDestinationPhone] = useState('254712345678');
  const [message, setMessage] = useState('Hello! This is a test message via FidScript WhatsApp Gateway.');
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance || !destinationPhone.trim() || !message.trim() || !clientToken) return;

    setSending(true);
    setResponse('');

    try {
      const res = await instancesApi.sendText(selectedInstance, destinationPhone.trim(), message.trim(), clientToken);
      setSending(false);
      if (res.success) {
        onTokenDeduct(1);
        setResponse(JSON.stringify({ status: 'SUCCESS', statusCode: 200, ...res.data }, null, 2));
      } else {
        setResponse(JSON.stringify({ status: 'ERROR', statusCode: 400, error: res.error || 'Send failed' }, null, 2));
      }
    } catch (err) {
      setSending(false);
      setResponse(JSON.stringify({ status: 'ERROR', statusCode: 500, error: String(err) }, null, 2));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 bg-white border border-[#eaebe4] rounded-3xl p-5 space-y-4 shadow-sm">
        <div>
          <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-yellow-700">REST Request</span>
          <h3 className="text-sm font-bold text-forest-deep mt-1">Test Message Dispatch</h3>
        </div>

        <form onSubmit={handleSend} className="space-y-4 text-xs font-semibold text-stone-955">
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">Container</label>
            <select
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs"
            >
              <option value="">-- Select Container --</option>
              {instances.map((inst) => (
                <option key={inst.id} value={inst.name} disabled={inst.status !== 'connected'}>
                  {inst.name} ({inst.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">Phone Number</label>
            <input
              type="text"
              required
              placeholder="254712345678"
              value={destinationPhone}
              onChange={(e) => setDestinationPhone(e.target.value)}
              className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">Message</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl focus:outline-none text-xs resize-none"
            />
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#6a6c5d]">
            <span>Balance:</span>
            <span className="font-bold text-yellow-800">{tokenBalance.toLocaleString()} tokens</span>
          </div>
          <button
            type="submit"
            disabled={sending || !selectedInstance || tokenBalance <= 0}
            className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5 text-yellow-400" />
            <span>{sending ? 'Sending...' : 'Send Message'} (1 token)</span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-3 bg-[#13120d] border border-[#2d2813] rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg">
        <div className="p-4 bg-[#1f1d0b] border-b border-[#353116] flex items-center justify-between text-[#cbd4d0] font-mono text-[11px]">
          <div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-yellow-400" /><span>Response Output</span></div>
          <span className="text-[9px] uppercase font-bold text-[#8f834a]">FidScript API</span>
        </div>
        <div className="p-5 flex-1 min-h-[250px] font-mono text-[11px] whitespace-pre overflow-auto bg-[#0d0d0a] text-yellow-300">
          {sending ? (
            <div className="h-full flex flex-col items-center justify-center text-yellow-600/60 text-center space-y-2 py-12">
              <Activity className="w-6 h-6 animate-pulse text-yellow-400" /><span>Processing request...</span>
            </div>
          ) : response ? (
            <code className="text-yellow-100 whitespace-pre leading-relaxed block">{response}</code>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#6e684a]/70 text-center space-y-2 py-12">
              <Terminal className="w-8 h-8 text-[#4a452c]" />
              <p className="font-bold text-xs text-white">Waiting for request</p>
              <p className="text-[10px] text-[#7d7756] max-w-sm mx-auto">Select a connected container and send a test message.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
