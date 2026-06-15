import React, { useState } from 'react';
import { Copy, Check, BookOpen, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_ENDPOINTS, API_CATEGORIES, PUBLIC_API_BASE, type ApiEndpoint, type BodyField } from '../../data/apiEndpoints/index';
import { buildMarkdownReference } from '../../utils/codegen';

type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

// ─── Derive groups from the live registry ───────────────────────────────────────

/** Flatten a nested field hierarchy for the params table. */
function flattenFields(fields: BodyField[], prefix = ''): Array<{ name: string; type: string; required: boolean; desc: string }> {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

/** Strip /api/v1 prefix and convert :instance → :instanceName for readability. */
function displayPath(path: string): string {
  return path.replace('/api/v1', '').replace(':instance', ':instanceName');
}

interface DocEndpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  path: string;
  name: string;
  desc: string;
  params: Array<{ name: string; type: string; required: boolean; desc: string }>;
  cost?: number;
  category: string;
}

const DOC_GROUPS: Array<{ name: string; icon: string; endpoints: DocEndpoint[] }> =
  API_CATEGORIES
    .filter(cat => cat.name !== 'Receiving') // webhook events are not API calls clients make
    .map(cat => ({
      name: cat.name,
      icon: cat.icon,
      endpoints: API_ENDPOINTS
        .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
        .map((ep: ApiEndpoint) => ({
          method: ep.method,
          path: displayPath(ep.path),
          name: ep.name,
          desc: ep.desc,
          params: flattenFields(ep.bodyFields),
          cost: ep.cost,
          category: ep.category,
        })),
    }))
    .filter(g => g.endpoints.length > 0);

// ─── Code generators ─────────────────────────────────────────────────────────

function buildCodeSnippet(lang: Lang, method: string, path: string, params: Array<{ name: string; type: string; required: boolean; desc: string }>, apiKey: string): string {
  const base = PUBLIC_API_BASE;
  const cleanPath = path.replace(':instanceName', 'my-container');
  const fullUrl = `${base}${cleanPath}`;
  const key = apiKey || 'fidscript_live_your_key_here';

  const buildBody = () => {
    const obj: Record<string, string> = {};
    params.filter(p => p.type !== 'boolean' && p.type !== 'string' && !p.type.endsWith(']')).forEach(p => {
      obj[p.name] = `<${p.name}>`;
    });
    params.filter(p => p.type.endsWith(']')).forEach(p => { obj[p.name] = `[${p.name}]`; });
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
  PUT: 'bg-purple-600 text-white',
};

export default function DocsSection({ client }: { client?: { api_key?: string } }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(DOC_GROUPS[0]?.name || '');
  const [activeLang, setActiveLang] = useState<Lang>('curl');

  const currentCategory = DOC_GROUPS.find(g => g.name === activeCategory) || DOC_GROUPS[0];

  const snippet = selectedEndpoint
    ? buildCodeSnippet(activeLang, selectedEndpoint.method, selectedEndpoint.path, selectedEndpoint.params, client?.api_key)
    : '';

  return (
    <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Left sidebar */}
      <div className="w-72 shrink-0 bg-white border border-[#eaebe4] rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 bg-[#f9f9f2] border-b border-[#eaebe4]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5 w-full sm:w-auto"><BookOpen className="w-4 h-4 text-yellow-700" /> API Reference</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const doc = buildMarkdownReference(API_ENDPOINTS, client?.api_key);
                  const blob = new Blob([doc], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'fidscript-api-reference.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors shrink-0"
                title="Download full API reference"
              >
                <Download className="w-3 h-3" /> Export All
              </button>
              <button
                onClick={() => {
                  window.open(`${PUBLIC_API_BASE}/postman-collection.json`, '_blank');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0"
                title="Download Postman collection"
              >
                <Download className="w-3 h-3" /> Postman
              </button>
              <div className="relative">
                <button
                  onClick={() => {
                    const sdks = [
                      { file: 'fidscript.js', label: 'JS/TS' },
                      { file: 'fidscript.py', label: 'Python' },
                      { file: 'fidscript.php', label: 'PHP' },
                      { file: 'fidscript.go', label: 'Go' },
                    ];
                    const menu = prompt(`Enter SDK number:\n${sdks.map((s, i) => `${i + 1}. ${s.label}`).join('\n')}\n\nOr visit: ${PUBLIC_API_BASE}/sdk/fidscript.js`);
                    const idx = parseInt(menu || '') - 1;
                    if (idx >= 0 && sdks[idx]) {
                      window.open(`${PUBLIC_API_BASE}/sdk/${sdks[idx].file}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors shrink-0"
                  title="Download SDK"
                >
                  <Download className="w-3 h-3" /> SDK
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-graphite hidden sm:block">All FIDScript WhatsApp API endpoints.</p>
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
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method] || 'bg-gray-400 text-white'}`}>{ep.method}</span>
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
            <div className="p-6 border-b border-[#eaebe4] bg-[#f9f9f2]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[selectedEndpoint.method] || 'bg-gray-400 text-white'}`}>{selectedEndpoint.method}</span>
                <code className="text-xs font-mono font-bold text-forest-deep">{selectedEndpoint.path}</code>
                {selectedEndpoint.cost !== undefined && (
                  <span className="ml-2 text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">{selectedEndpoint.cost === 0 ? 'Free' : `${selectedEndpoint.cost} token${selectedEndpoint.cost > 1 ? 's' : ''}`}</span>
                )}
              </div>
              <p className="text-xs text-graphite">{selectedEndpoint.desc}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedEndpoint.params.length > 0 && (
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

              <div>
                <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Base URL</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono bg-stone-100 border border-[#eaebe4] px-3 py-2 rounded-xl text-forest-deep">{PUBLIC_API_BASE}</code>
                  <CopyButton text={PUBLIC_API_BASE} />
                </div>
              </div>

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
