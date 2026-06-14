import React from 'react';
import { Code, CheckCircle, Zap, Webhook } from 'lucide-react';
import type { Client } from '../../services/api';

interface DocsSectionProps {
  client: Client;
}

export default function DocsSection({ client }: DocsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><Code className="w-4 h-4 text-yellow-700" /> FidScript WhatsApp API</h3>
          <p className="text-xs text-graphite mt-0.5">Complete API reference for integrating WhatsApp messaging into your applications.</p>
        </div>

        <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4">
          <p className="text-[10px] font-bold text-forest-deep mb-2">Base URL</p>
          <code className="text-xs font-mono bg-white border border-[#eaebe4] px-3 py-2 rounded-xl text-forest-deep block">https://whatsapp.fidscript.com/api/instance</code>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3d3311] pb-2 border-b border-[#eaebe4]">Token Consumption</h4>

            <div className="space-y-2">
              {[
                { method: 'POST', path: '/sendText/:instance', name: 'Send Text Message', cost: 1 },
                { method: 'POST', path: '/sendMedia/:instance', name: 'Send Image', cost: 2 },
                { method: 'POST', path: '/sendMedia/:instance', name: 'Send Document', cost: 3 },
                { method: 'POST', path: '/sendMedia/:instance', name: 'Send Audio', cost: 4 },
                { method: 'POST', path: '/sendMedia/:instance', name: 'Send Video', cost: 3 },
                { method: 'POST', path: '/sendLocation/:instance', name: 'Send Location', cost: 1 },
              ].map((ep) => (
                <div key={ep.path + ep.method} className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${ep.method === 'POST' ? 'bg-yellow-600 text-stone-950' : 'bg-blue-600 text-white'}`}>{ep.method}</span>
                    <code className="text-[11px] font-mono font-bold text-forest-deep">{ep.path}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-graphite">{ep.name}</p>
                    <span className="text-[10px] font-bold text-yellow-700 font-mono">{ep.cost} token{ep.cost > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3d3311] pb-2 border-b border-[#eaebe4]">Request Examples</h4>

            <div className="bg-[#13120d] text-[#e3ded2] rounded-2xl p-4 border border-[#3b351e] font-mono text-[11px]">
              <p className="text-[10px] font-bold text-[#b8ab81] mb-2">Send Text Message</p>
              <pre className="text-yellow-100 leading-relaxed overflow-x-auto">{`curl -X POST https://whatsapp.fidscript.com/api/instance/sendText/my-container \\
  -H "X-API-Key: fidscript_live_pk_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "254712345678",
    "message": "Hello from FidScript!"
  }'`}</pre>
            </div>

            <div className="bg-[#13120d] text-[#e3ded2] rounded-2xl p-4 border border-[#3b351e] font-mono text-[11px]">
              <p className="text-[10px] font-bold text-[#b8ab81] mb-2">Send Media</p>
              <pre className="text-yellow-100 leading-relaxed overflow-x-auto">{`curl -X POST https://whatsapp.fidscript.com/api/instance/sendMedia/my-container \\
  -H "X-API-Key: fidscript_live_pk_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "254712345678",
    "media_url": "https://example.com/image.jpg",
    "media_type": "image",
    "caption": "Check this out!"
  }'`}</pre>
            </div>
          </div>
        </div>

        <div className="bg-[#13120d] text-[#e3ded2] rounded-2xl p-4 border border-[#3b351e] font-mono text-[11px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#3b351e] mb-4">
            <span className="text-[10px] uppercase font-bold text-[#b8ab81]">Python Integration</span>
          </div>
          <pre className="text-yellow-100 leading-relaxed overflow-x-auto">{`import requests

url = "https://whatsapp.fidscript.com/api/instance/sendText/my-container"
headers = {
    "X-API-Key": "fidscript_live_pk_xxxx",
    "Content-Type": "application/json"
}
payload = {
    "to": "254712345678",
    "message": "Hello from FidScript!"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs font-bold text-forest-deep">Rate Limit</p>
            </div>
            <p className="text-sm font-bold text-forest-deep">30 messages/minute</p>
            <p className="text-[10px] text-stone-500 mt-1">1 message every 2 seconds</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <p className="text-xs font-bold text-forest-deep">Token Cost</p>
            </div>
            <p className="text-sm font-bold text-forest-deep">1 token = 1 text</p>
            <p className="text-[10px] text-stone-500 mt-1">Media costs 2-4 tokens</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Webhook className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-forest-deep">Webhook</p>
            </div>
            <p className="text-sm font-bold text-forest-deep">Configure per container</p>
            <p className="text-[10px] text-stone-500 mt-1">Receive incoming messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
