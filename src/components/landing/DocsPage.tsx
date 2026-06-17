import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, Terminal, Code2, BookOpen, Zap, MessageSquare, Users, Bell, Settings } from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    icon: <Zap className="w-5 h-5" />,
    title: 'Getting Started',
    items: [
      { id: 'quickstart', title: 'Quickstart' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'api-keys', title: 'API Keys' },
      { id: 'webhooks', title: 'Webhooks' },
      { id: 'rate-limits', title: 'Rate Limits' },
    ],
  },
  {
    id: 'messaging',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Messaging',
    items: [
      { id: 'send-text', title: 'Send Text' },
      { id: 'send-media', title: 'Send Media' },
      { id: 'send-location', title: 'Send Location' },
      { id: 'send-contact', title: 'Send Contact' },
      { id: 'reactions', title: 'Reactions' },
      { id: 'polls', title: 'Polls' },
      { id: 'groups', title: 'Group Messages' },
    ],
  },
  {
    id: 'instances',
    icon: <Settings className="w-5 h-5" />,
    title: 'Instances',
    items: [
      { id: 'create-instance', title: 'Create Instance' },
      { id: 'connect-qr', title: 'Connect via QR' },
      { id: 'connection-state', title: 'Connection State' },
      { id: 'logout', title: 'Logout / Disconnect' },
    ],
  },
  {
    id: 'contacts',
    icon: <Users className="w-5 h-5" />,
    title: 'Contacts',
    items: [
      { id: 'import-contacts', title: 'Import Contacts' },
      { id: 'delete-contact', title: 'Delete Contact' },
    ],
  },
  {
    id: 'platform',
    icon: <Bell className="w-5 h-5" />,
    title: 'Platform',
    items: [
      { id: 'usage', title: 'Usage API' },
      { id: 'whoami', title: 'WhoAmI' },
    ],
  },
];

const codeExamples: Record<string, { curl: string; js: string; python: string }> = {
  'send-text': {
    curl: `curl -X POST https://whatsapp.fidscript.com/api/v1/sendText \\
  -H "X-API-Key: fidscript_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instanceName": "my-instance",
    "number": "254712345678",
    "text": "Hello from FIDScript!"
  }'`,
    js: `const response = await fetch('https://whatsapp.fidscript.com/api/v1/sendText', {
  method: 'POST',
  headers: {
    'X-API-Key': 'fidscript_live_your_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceName: 'my-instance',
    number: '254712345678',
    text: 'Hello from FIDScript!'
  })
});
const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.post(
    'https://whatsapp.fidscript.com/api/v1/sendText',
    headers={
        'X-API-Key': 'fidscript_live_your_key_here',
        'Content-Type': 'application/json'
    },
    json={
        'instanceName': 'my-instance',
        'number': '254712345678',
        'text': 'Hello from FIDScript!'
    }
)
print(response.json())`,
  },
  'send-media': {
    curl: `curl -X POST https://whatsapp.fidscript.com/api/v1/sendMedia \\
  -H "X-API-Key: fidscript_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instanceName": "my-instance",
    "number": "254712345678",
    "mediatype": "image",
    "media": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }'`,
    js: `await fetch('https://whatsapp.fidscript.com/api/v1/sendMedia', {
  method: 'POST',
  headers: {
    'X-API-Key': 'fidscript_live_your_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceName: 'my-instance',
    number: '254712345678',
    mediatype: 'image',
    media: 'https://example.com/image.jpg',
    caption: 'Check this out!'
  })
});`,
    python: `requests.post(
    'https://whatsapp.fidscript.com/api/v1/sendMedia',
    headers={'X-API-Key': 'fidscript_live_your_key_here'},
    json={
        'instanceName': 'my-instance',
        'number': '254712345678',
        'mediatype': 'image',
        'media': 'https://example.com/image.jpg',
        'caption': 'Check this out!'
    }
)`,
  },
  'webhooks': {
    curl: `# Webhook payload for inbound messages
{
  "event": "messages.upsert",
  "instanceName": "my-instance",
  "data": {
    "key": {
      "id": "BAE5F1234567890",
      "remoteJid": "254712345678@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Hello!"
    },
    "messageType": "conversation",
    "timestamp": 1718123456
  }
}`,
    js: `// Express webhook handler example
app.post('/webhook/fidscript', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'messages.upsert') {
    const { number, text, messageType } = data;

    console.log(\`Incoming \${messageType} from \${number}: \${text}\`);

    // Acknowledge receipt
    res.status(200).send('OK');
  }
});`,
    python: `# Flask webhook handler example
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook/fidscript', methods=['POST'])
def webhook():
    payload = request.json
    event = payload.get('event')

    if event == 'messages.upsert':
        data = payload.get('data', {})
        number = data.get('key', {}).get('remoteJid')
        print(f"Incoming message from {number}")

    return jsonify({'status': 'ok'}), 200`,
  },
};

const tabIcons = { curl: Terminal, js: Code2, python: BookOpen };

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const currentExample = codeExamples[activeSection];

  const copy = () => {
    if (currentExample) {
      navigator.clipboard.writeText(currentExample[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[#8a886a] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <img src="/logo.png" alt="FIDScript" className="h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">FIDSCRIPT</span>
              <span className="text-[9px] text-yellow-500">by Next Mavens</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Documentation</h1>
          <p className="text-[#8a886a]">Complete API reference, guides, and code examples for FIDScript.</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
                    <span className="text-yellow-500">{section.icon}</span>
                    {section.title}
                  </div>
                  <ul className="space-y-1 ml-7">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => { setActiveSection(item.id); setActiveTab('curl'); }}
                          className={`text-xs text-left w-full py-1 px-2 rounded-lg transition-colors ${
                            activeSection === item.id
                              ? 'text-yellow-500 bg-yellow-500/10'
                              : 'text-[#6a6c5d] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Quickstart */}
            {activeSection === 'quickstart' && (
              <motion.div key="quickstart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Quickstart</h2>
                  <p className="text-[#a8a594] mb-6">Get up and running with FIDScript in under 5 minutes.</p>
                </div>
                <div className="space-y-6">
                  {[
                    { step: '1', title: 'Create an account', desc: 'Sign up at whatsapp.fidscript.com and receive 500 free welcome tokens.' },
                    { step: '2', title: 'Get your API key', desc: 'Navigate to Settings → API Keys and copy your key.' },
                    { step: '3', title: 'Create an instance', desc: 'Create a WhatsApp instance and pair it using a QR code.' },
                    { step: '4', title: 'Send your first message', desc: 'Use the REST API or dashboard to send a test message.' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-stone-950 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">{title}</h3>
                        <p className="text-[#8a886a] text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#11110a] border border-[#262413] rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-3">Base URL</h3>
                  <div className="flex items-center gap-2 bg-[#0c0b06] border border-[#262413] rounded-xl px-4 py-3 font-mono text-sm text-[#a8a594]">
                    <code>https://whatsapp.fidscript.com/api/v1</code>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Authentication */}
            {activeSection === 'authentication' && (
              <motion.div key="authentication" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
                  <p className="text-[#a8a594] mb-6">All API requests require your API key passed in the <code className="bg-[#1b1910] border border-[#383416] px-1.5 py-0.5 rounded text-yellow-500 text-sm">X-API-Key</code> header.</p>
                </div>
                <div className="bg-[#11110a] border border-[#262413] rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-3">Example Request</h3>
                  <pre className="text-xs text-[#a8a594] font-mono overflow-x-auto">{`curl -X GET https://whatsapp.fidscript.com/api/v1/usage \\
  -H "X-API-Key: fidscript_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"`}</pre>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-sm text-yellow-200">Your API key is shown only once when created. Store it securely — if lost, you can reset it from the dashboard.</p>
                </div>
              </motion.div>
            )}

            {/* Webhooks */}
            {activeSection === 'webhooks' && (
              <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Webhooks</h2>
                  <p className="text-[#a8a594] mb-6">Receive real-time notifications when events occur on your instances.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Supported Events</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'].map(e => (
                      <div key={e} className="bg-[#11110a] border border-[#262413] rounded-xl px-4 py-3 font-mono text-xs text-[#a8a594]">{e}</div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#11110a] border border-[#262413] rounded-2xl p-5">
                  <h3 className="text-white font-semibold mb-3">Webhook Payload — messages.upsert</h3>
                  <pre className="text-xs text-[#a8a594] font-mono overflow-x-auto whitespace-pre-wrap">{`{
  "event": "messages.upsert",
  "instanceName": "my-instance",
  "data": {
    "key": {
      "id": "BAE5F1234567890",
      "remoteJid": "254712345678@s.whatsapp.net",
      "fromMe": false
    },
    "message": { "conversation": "Hello!" },
    "messageType": "conversation",
    "timestamp": 1718123456
  }
}`}</pre>
                </div>
              </motion.div>
            )}

            {/* Rate Limits */}
            {activeSection === 'rate-limits' && (
              <motion.div key="rate-limits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
                  <p className="text-[#a8a594] mb-6">FIDScript enforces rate limits per API category to ensure platform stability.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { category: 'Send Operations', limit: 'Plan-based (clientRateLimit)', note: 'Per-client messages per minute' },
                    { category: 'Read Operations (V1_READ)', limit: '600/min', note: 'Chats, contacts, profile reads' },
                    { category: 'Mutation Operations (V1_MUTATE)', limit: '120/min', note: 'Groups, chat updates' },
                    { category: 'Strict Operations (V1_STRICT)', limit: '30/min', note: 'Instance restart, profile changes' },
                  ].map(({ category, limit, note }) => (
                    <div key={category} className="bg-[#11110a] border border-[#262413] rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold text-sm">{category}</div>
                        <div className="text-[#6a6c5d] text-xs mt-0.5">{note}</div>
                      </div>
                      <div className="text-yellow-500 font-mono text-sm font-bold">{limit}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Default: code example for send-text */}
            {['send-text', 'send-media'].includes(activeSection) && currentExample && (
              <motion.div key={activeSection + '-code'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white capitalize">
                    {activeSection.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex gap-1 bg-[#11110a] border border-[#262413] rounded-xl p-1">
                    {(['curl', 'js', 'python'] as const).map(tab => {
                      const Icon = tabIcons[tab];
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            activeTab === tab ? 'bg-yellow-500 text-stone-950' : 'text-[#6a6c5d] hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.toUpperCase()}
                        </button>
                      );
                    })}
                    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6a6c5d] hover:text-white transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-[#11110a] border border-[#262413] rounded-2xl p-5">
                  <pre className="text-xs text-[#a8a594] font-mono overflow-x-auto whitespace-pre-wrap">{currentExample[activeTab]}</pre>
                </div>
              </motion.div>
            )}

            {/* Catch-all for other sections */}
            {!['quickstart', 'authentication', 'webhooks', 'rate-limits', 'send-text', 'send-media'].includes(activeSection) && (
              <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-[#11110a] border border-[#262413] flex items-center justify-center mx-auto mb-4 text-[#6a6c5d]">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 capitalize">{activeSection.replace(/-/g, ' ')}</h2>
                <p className="text-[#6a6c5d] text-sm">Documentation for this section coming soon.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
