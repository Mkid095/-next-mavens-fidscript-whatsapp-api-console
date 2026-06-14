import React, { useState } from 'react';
import { Copy, Check, BookOpen, Zap, Shield, Code, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DocsSectionProps {
  client: Client;
}

interface Client {
  id: string;
  name: string;
  email: string;
  api_key: string;
}

type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

// ─── Endpoint definitions ─────────────────────────────────────────────────────

interface DocEndpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  path: string;
  name: string;
  desc: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  cost?: number;
  category: string;
}

interface DocCategory {
  name: string;
  icon: string;
  endpoints: DocEndpoint[];
}

const DOC_GROUPS: DocCategory[] = [
  {
    name: 'Messaging',
    icon: 'Send',
    endpoints: [
      { method: 'POST', path: '/instance/sendText/:instance', name: 'Send Text', desc: 'Send a plain text message to any WhatsApp number.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number (E.164 format, e.g. 254712345678)' }, { name: 'message', type: 'string', required: true, desc: 'Text content of the message' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendMedia/:instance', name: 'Send Media', desc: 'Send an image, video, audio, or document via URL.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number' }, { name: 'media_url', type: 'string', required: true, desc: 'Public URL of the media file' }, { name: 'media_type', type: 'string', required: true, desc: 'Media type: image, video, audio, document, sticker' }, { name: 'caption', type: 'string', required: false, desc: 'Optional text caption for the media' }], cost: 2, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendLocation/:instance', name: 'Send Location', desc: 'Share GPS coordinates with a name and address.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number' }, { name: 'latitude', type: 'number', required: true, desc: 'Latitude coordinate' }, { name: 'longitude', type: 'number', required: true, desc: 'Longitude coordinate' }, { name: 'name', type: 'string', required: false, desc: 'Location name' }, { name: 'address', type: 'string', required: false, desc: 'Full address' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendContact/:instance', name: 'Send Contact', desc: 'Share a contact card (vCard) to a WhatsApp number.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number' }, { name: 'contact', type: 'string', required: true, desc: 'JSON string of contact object: {Name, phones[]}' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendReaction/:instance', name: 'Send Reaction', desc: 'React to an existing message with an emoji.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number' }, { name: 'key', type: 'string', required: true, desc: 'JSON message key object: {id, from}' }, { name: 'reaction', type: 'string', required: true, desc: 'Emoji character to react with' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendPoll/:instance', name: 'Send Poll', desc: 'Create an interactive poll in a group or chat.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone or group JID' }, { name: 'poll', type: 'string', required: true, desc: 'JSON: {title, options: string[], multipleChoices?}' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendList/:instance', name: 'Send List', desc: 'Send an interactive list message with sections and rows.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number' }, { name: 'list', type: 'string', required: true, desc: 'JSON: {title, text, sections: [{title, rows: [{title, description, rowId}]}]}' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/instance/sendButtons/:instance', name: 'Send Buttons', desc: 'Send a message with interactive buttons.', params: [{ name: 'to', type: 'string', required: true, desc: 'Destination phone number' }, { name: 'buttons', type: 'string', required: true, desc: 'JSON: {text, buttons: [{type, reply: {id, title}}]}' }], cost: 1, category: 'Messaging' },
    ],
  },
  {
    name: 'Instance',
    icon: 'Smartphone',
    endpoints: [
      { method: 'GET', path: '/instance/connectionState/:instance', name: 'Connection State', desc: 'Get the current connection status of a WhatsApp container.', params: [], category: 'Instance' },
      { method: 'POST', path: '/instance/connect/:instance', name: 'Connect / QR Code', desc: 'Generate a QR code to link your WhatsApp account via QR scan.', params: [], category: 'Instance' },
      { method: 'POST', path: '/instance/restart/:instance', name: 'Restart Instance', desc: 'Restart the WhatsApp connection without logging out.', params: [], category: 'Instance' },
      { method: 'DELETE', path: '/instance/logout/:instance', name: 'Disconnect', desc: 'Log out and disconnect the WhatsApp session.', params: [], category: 'Instance' },
      { method: 'POST', path: '/instance/setPresence/:instance', name: 'Set Presence', desc: 'Set your presence status (available, typing, recording).', params: [{ name: 'presence', type: 'string', required: true, desc: 'available | composing | recording | paused' }], category: 'Instance' },
    ],
  },
  {
    name: 'Chat',
    icon: 'MessageSquare',
    endpoints: [
      { method: 'POST', path: '/chat/findContacts/:instance', name: 'Find Contacts', desc: 'Search contacts in the WhatsApp contact list.', params: [{ name: 'search', type: 'string', required: false, desc: 'Search query string' }], category: 'Chat' },
      { method: 'POST', path: '/chat/findChats/:instance', name: 'Find Chats', desc: 'Search chat threads by name or message content.', params: [{ name: 'search', type: 'string', required: false, desc: 'Search query string' }], category: 'Chat' },
      { method: 'POST', path: '/chat/whatsappNumbers/:instance', name: 'Check Numbers', desc: 'Validate which phone numbers have an active WhatsApp account.', params: [{ name: 'numbers', type: 'string', required: true, desc: 'JSON array of phone numbers: ["254712345678","254700000000"]' }], category: 'Chat' },
      { method: 'POST', path: '/chat/markMessageAsRead/:instance', name: 'Mark Read', desc: 'Mark a specific message as read.', params: [{ name: 'key', type: 'string', required: true, desc: 'JSON message key: {"id":"...","from":"..."}' }], category: 'Chat' },
      { method: 'POST', path: '/chat/updateBlockStatus/:instance', name: 'Block / Unblock', desc: 'Block or unblock a contact.', params: [{ name: 'number', type: 'string', required: true, desc: 'Phone number to block/unblock' }, { name: 'type', type: 'string', required: true, desc: 'block or unblock' }], category: 'Chat' },
    ],
  },
  {
    name: 'Group',
    icon: 'Users',
    endpoints: [
      { method: 'POST', path: '/group/create/:instance', name: 'Create Group', desc: 'Create a new WhatsApp group.', params: [{ name: 'subject', type: 'string', required: true, desc: 'Group name/subject' }, { name: 'participants', type: 'string', required: true, desc: 'JSON array of phone numbers: ["254712345678"]' }], category: 'Group' },
      { method: 'POST', path: '/group/updateGroupSubject/:instance', name: 'Update Subject', desc: 'Change the group name.', params: [{ name: 'groupJid', type: 'string', required: true, desc: 'Group JID (e.g. 123456789-987654@g.us)' }, { name: 'subject', type: 'string', required: true, desc: 'New group name' }], category: 'Group' },
      { method: 'POST', path: '/group/addParticipants/:instance', name: 'Add Participants', desc: 'Add members to an existing group.', params: [{ name: 'groupJid', type: 'string', required: true, desc: 'Group JID' }, { name: 'participants', type: 'string', required: true, desc: 'JSON array of phone numbers to add' }], category: 'Group' },
      { method: 'POST', path: '/group/removeParticipants/:instance', name: 'Remove Participants', desc: 'Remove members from a group.', params: [{ name: 'groupJid', type: 'string', required: true, desc: 'Group JID' }, { name: 'participants', type: 'string', required: true, desc: 'JSON array of phone numbers to remove' }], category: 'Group' },
      { method: 'GET', path: '/group/fetchAllGroups/:instance', name: 'List Groups', desc: 'Get all groups the instance is a member of.', params: [], category: 'Group' },
    ],
  },
  {
    name: 'Settings',
    icon: 'Settings',
    endpoints: [
      { method: 'GET', path: '/settings/:instance', name: 'Get Settings', desc: 'Fetch current webhook and presence settings for the instance.', params: [], category: 'Settings' },
      { method: 'POST', path: '/webhook/set/:instance', name: 'Set Webhook', desc: 'Configure the webhook URL and events for an instance.', params: [{ name: 'enabled', type: 'boolean', required: false, desc: 'Enable or disable webhook' }, { name: 'url', type: 'string', required: true, desc: 'Your webhook URL' }, { name: 'webhookByEvents', type: 'boolean', required: false, desc: 'Send only configured events' }, { name: 'events', type: 'string', required: false, desc: 'JSON array: ["CONNECTION_UPDATE","MESSAGES_UPSERT"]' }], category: 'Settings' },
    ],
  },
  {
    name: 'Utils',
    icon: 'Wrench',
    endpoints: [
      { method: 'GET', path: '/health', name: 'Health Check', desc: 'Check if the Evolution API server is running.', params: [], category: 'Utils' },
    ],
  },
];

// ─── Code generators ─────────────────────────────────────────────────────────

function buildCodeSnippet(lang: Lang, method: string, path: string, params: { name: string; type: string; required: boolean; desc: string }[], apiKey: string): string {
  const baseUrl = 'https://whatsapp.fidscript.com/api/instance';
  const cleanPath = path.replace(':instance', 'my-container');
  const fullUrl = `${baseUrl}${cleanPath}`;
  const key = apiKey || 'fidscript_live_your_key_here';

  const bodyParams = params.filter(p => p.required && p.type !== 'boolean' && p.type !== 'string');
  const boolParams = params.filter(p => p.required && p.type === 'boolean');

  const buildBody = () => {
    const obj: Record<string, string> = {};
    params.filter(p => !p.type.endsWith(']')).forEach(p => {
      obj[p.name] = p.type === 'number' ? `<${p.name}>` : `<${p.name}>`;
    });
    const arrParams = params.filter(p => p.type.endsWith(']'));
    arrParams.forEach(p => { obj[p.name] = `[${p.name}]`; });
    return JSON.stringify(obj, null, 2);
  };

  switch (lang) {
    case 'curl':
      return `curl -X ${method} ${fullUrl} \\
  -H "X-API-Key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${buildBody().replace(/"/g, '\\"')}'`;

    case 'node':
      return `const response = await fetch("${fullUrl}", {
  method: "${method}",
  headers: {
    "X-API-Key": "${key}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${buildBody()})
});
const data = await response.json();
console.log(data);`;

    case 'python':
      return `import requests

url = "${fullUrl}"
headers = {
    "X-API-Key": "${key}",
    "Content-Type": "application/json"
}
payload = ${buildBody().replace(/"/g, '"').replace(/'/g, '"')}

response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)
print(response.json())`;

    case 'php':
      return `<?php
$url = "${fullUrl}";
$data = ${buildBody().replace(/"/g, '"')};

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: ${key}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
print_r(json_decode($response, true));`;

    case 'go':
      return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]interface{}{
${params.map(p => `        "${p.name}": "<${p.name}>"`).join(',\n')}
    }
    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest("${method}", "${fullUrl}", bytes.NewBuffer(body))
    req.Header.Set("X-API-Key", "${key}")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
}`;

    default:
      return '';
  }
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-stone-400 hover:text-yellow-400 transition-colors">
      {copied ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH: 'bg-orange-500 text-white',
};

export default function DocsSection({ client }: DocsSectionProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(DOC_GROUPS[0].name);
  const [activeLang, setActiveLang] = useState<Lang>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const currentCategory = DOC_GROUPS.find(g => g.name === activeCategory) || DOC_GROUPS[0];

  const handleCopySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(code);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const snippet = selectedEndpoint
    ? buildCodeSnippet(activeLang, selectedEndpoint.method, selectedEndpoint.path, selectedEndpoint.params || [], client?.api_key)
    : '';

  return (
    <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Left sidebar */}
      <div className="w-72 shrink-0 bg-white border border-[#eaebe4] rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 bg-[#f9f9f2] border-b border-[#eaebe4]">
          <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-yellow-700" /> API Reference</h3>
          <p className="text-[10px] text-graphite mt-0.5">Select an endpoint to view docs.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {DOC_GROUPS.map(group => (
            <div key={group.name}>
              <button
                onClick={() => setActiveCategory(group.name)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold hover:bg-stone-50 transition-colors border-b border-[#eaebe4]/50 ${activeCategory === group.name ? 'bg-yellow-50 text-forest-deep' : 'text-graphite'}`}
              >
                <span className="text-stone-500 text-[10px]">{group.name}</span>
                <span className="ml-auto text-[9px] text-stone-400">{group.endpoints.length}</span>
              </button>
              <AnimatePresence>
                {activeCategory === group.name && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-stone-50/50">
                    {group.endpoints.map(ep => (
                      <button
                        key={ep.path + ep.method}
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-[10px] hover:bg-yellow-50 transition-colors border-b border-[#eaebe4]/30 text-left ${selectedEndpoint?.path === ep.path ? 'bg-yellow-50 border-l-2 border-l-yellow-500 text-forest-deep' : 'text-stone-600'}`}
                      >
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                        <span className="font-bold truncate">{ep.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-white border border-[#eaebe4] rounded-3xl shadow-sm flex flex-col">
        {selectedEndpoint ? (
          <>
            {/* Endpoint header */}
            <div className="p-6 border-b border-[#eaebe4] bg-[#f9f9f2]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
                <code className="text-xs font-mono font-bold text-forest-deep">{selectedEndpoint.path}</code>
                {selectedEndpoint.cost !== undefined && (
                  <span className="ml-2 text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">{selectedEndpoint.cost} token{selectedEndpoint.cost > 1 ? 's' : ''}</span>
                )}
              </div>
              <p className="text-xs text-graphite">{selectedEndpoint.desc}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Parameters */}
              {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Parameters</h4>
                  <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead className="bg-[#f9f9f2]">
                        <tr>
                          <th className="text-left px-4 py-2 font-bold text-forest-deep">Name</th>
                          <th className="text-left px-4 py-2 font-bold text-forest-deep">Type</th>
                          <th className="text-left px-4 py-2 font-bold text-forest-deep">Required</th>
                          <th className="text-left px-4 py-2 font-bold text-forest-deep">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaebe4]">
                        {selectedEndpoint.params.map(p => (
                          <tr key={p.name} className="hover:bg-stone-50/50">
                            <td className="px-4 py-2.5 font-mono font-bold text-forest-deep">{p.name}</td>
                            <td className="px-4 py-2.5 font-mono text-stone-500 text-[10px]">{p.type}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.required ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-500'}`}>{p.required ? 'Required' : 'Optional'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-graphite">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Base URL */}
              <div>
                <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Base URL</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono bg-stone-100 border border-[#eaebe4] px-3 py-2 rounded-xl text-forest-deep">https://whatsapp.fidscript.com/api/instance</code>
                  <CopyButton text="https://whatsapp.fidscript.com/api/instance" />
                </div>
              </div>

              {/* Authentication */}
              <div>
                <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Authentication</h4>
                <div className="bg-[#13120d] text-[#e3ded2] rounded-xl p-3 font-mono text-[11px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#b8ab81] text-[9px] font-bold">Header</span>
                    <CopyButton text={`X-API-Key: ${client?.api_key || 'fidscript_live_your_key_here'}`} />
                  </div>
                  <p><span className="text-blue-400">X-API-Key</span>: <span className="text-yellow-300">{client?.api_key || 'fidscript_live_your_key_here'}</span></p>
                </div>
              </div>

              {/* Code snippets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-forest-deep uppercase tracking-wider text-[#3d3311]">Code Examples</h4>
                  <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setActiveLang(l.id)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${activeLang === l.id ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#13120d] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#1f1d0b] border-b border-[#2d2813]">
                    <span className="text-[10px] font-mono text-[#8f834a] font-bold">{LANGUAGES.find(l => l.id === activeLang)?.label}</span>
                    <CopyButton text={snippet} />
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-yellow-200 overflow-x-auto whitespace-pre-wrap">{snippet}</pre>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400 space-y-3">
            <BookOpen className="w-12 h-12 text-yellow-200" />
            <p className="font-bold text-forest-deep text-sm">Select an endpoint</p>
            <p className="text-xs text-graphite max-w-xs">Choose an endpoint from the left sidebar to view its documentation, parameters, and code examples.</p>
          </div>
        )}
      </div>
    </div>
  );
}
