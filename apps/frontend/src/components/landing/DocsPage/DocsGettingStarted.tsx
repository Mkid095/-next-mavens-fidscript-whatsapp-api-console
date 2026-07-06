/* Getting Started guide content  -  Quickstart, Authentication, Webhooks */
import React from 'react';
import { motion } from 'motion/react';
import { Callout } from './shared.js';
import { DocsCodeBlock } from '../../shared/DocsCodeBlock.js';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index.js';

/* ── Quickstart ── */
function QuickstartGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Quick Start</h1>
      <p className="text-sm text-[#8a886a] mb-8">Get up and running with FIDScript in 5 minutes.</p>
      <Callout type="info"><p><strong className="text-white">New to FIDScript?</strong> You'll need an account (free signup), an API key, and a WhatsApp instance to start sending.</p></Callout>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Getting Started</h2>
      {[
        { n: 1, title: 'Create an account', items: ['Sign up at whatsapp.fidscript.com/register', 'Check your email for a magic login code', '500 free welcome tokens are credited automatically'] },
        { n: 2, title: 'Get your API Key', items: ['Go to Settings → API Keys', 'Copy your key  -  format: fidscript_live_...', 'Keep this secret  -  regenerate if lost'] },
        { n: 3, title: 'Create a WhatsApp Instance', items: ['Go to WhatsApp Containers → New Instance', 'Name your instance (e.g. my-business)', 'Click Connect → scan the QR code with your WhatsApp app'] },
        { n: 4, title: 'Send your First Message', items: ['Use the API reference or the built-in sandbox', 'Try sending a text message to your own number', 'Check delivery status in real-time on your dashboard'] },
      ].map(({ n, title, items }) => (
        <div key={n} className="flex gap-4 mb-6">
          <div className="w-7 h-7 rounded-full bg-yellow-500 text-stone-950 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</div>
          <div>
            <div className="text-sm font-semibold text-white mb-2">{title}</div>
            <ul className="space-y-1.5">{items.map(i => <li key={i} className="text-xs text-[#8a886a] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#4a4a3a]">{i}</li>)}</ul>
          </div>
        </div>
      ))}
      <h2 className="text-lg font-bold text-white mt-10 mb-4">Base URL</h2>
      <DocsCodeBlock code={PUBLIC_API_BASE} lang="bash" />
    </motion.div>
  );
}

/* ── Authentication ── */
function AuthGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Authentication</h1>
      <p className="text-sm text-[#8a886a] mb-8">All requests require your API key in the <code className="bg-[#1a1910] border border-[#262413] px-1.5 py-0.5 rounded text-yellow-500 font-mono text-xs">X-API-Key</code> header.</p>
      <Callout type="warning"><p><strong className="text-white">Keep your API key secret.</strong> If exposed, reset it immediately from Settings → API Keys.</p></Callout>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Request Example</h2>
      <DocsCodeBlock code={`curl -X GET ${PUBLIC_API_BASE}/usage \\\n  -H "X-API-Key: fidscript_live_your_key_here"`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Error Codes</h2>
      <div className="space-y-2">
        {[{ c: 401, m: 'Invalid or missing API key' },{ c: 403, m: 'Valid key but insufficient permissions' },{ c: 429, m: 'Rate limit exceeded  -  slow down' },{ c: 500, m: 'Server error  -  retry with backoff' }].map(({ c, m }) => (
          <div key={c} className="flex items-center gap-3 text-xs"><span className="font-mono font-bold text-yellow-500 w-8">{c}</span><span className="text-[#8a886a]">{m}</span></div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Webhooks ── */
function WebhooksGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Webhooks</h1>
      <p className="text-sm text-[#8a886a] mb-8">Configure a webhook URL in your instance settings. FIDScript will POST event payloads to your endpoint as they occur.</p>
      <h2 className="text-lg font-bold text-white mb-4">Supported Events</h2>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'].map(e => (
          <div key={e} className="bg-[#1a1910] border border-[#262413] rounded-xl px-3 py-2.5 font-mono text-xs text-[#8a886a]">{e}</div>
        ))}
      </div>
      <h2 className="text-lg font-bold text-white mb-4">Payload  -  messages.upsert</h2>
      <DocsCodeBlock code={`{\n  "event": "messages.upsert",\n  "instanceName": "my-instance",\n  "data": {\n    "key": {\n      "id": "BAE5F1234567890",\n      "remoteJid": "254712345678@s.whatsapp.net",\n      "fromMe": false\n    },\n    "message": { "conversation": "Hello!" },\n    "messageType": "conversation",\n    "timestamp": 1718123456\n  }\n}`} lang="json" />
    </motion.div>
  );
}

/* ── Export by id ── */
export function DocsGettingStarted({ id }: { id: string }) {
  if (id === 'quickstart') return <QuickstartGuide />;
  if (id === 'authentication') return <AuthGuide />;
  if (id === 'webhooks') return <WebhooksGuide />;
  return null;
}

export default DocsGettingStarted;
