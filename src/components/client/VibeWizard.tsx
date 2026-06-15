import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Eye, EyeOff, ChevronRight, ChevronDown, Bot, Settings, Zap, Globe, CheckSquare, Square, ArrowRight, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS, API_CATEGORIES, PUBLIC_API_BASE, type ApiEndpoint, type BodyField } from '../../data/apiEndpoints/index';
import { buildCurl, buildCodeSnippet, type CodeLang } from '../../utils/codegen';

interface VibeWizardProps {
  apiKey: string;
  clientName?: string;
  apiKeys: Array<{ id: string; name: string; key?: string; key_prefix?: string; status: string }>;
  instances: Array<{ id: string; name: string; display_name?: string; phone_number?: string; status: string }>;
}

// ── Step types ────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3;
type CategorySelection = 'all' | 'none' | 'custom';

interface Step2State {
  global: CategorySelection;
  categories: Record<string, CategorySelection>;
  selectedEndpoints: Set<string>;
}

// ── Prompt generation ────────────────────────────────────────────────────────

function flattenFields(fields: BodyField[], prefix = ''): Array<{ name: string; type: string; required: boolean; desc: string }> {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

function buildExampleBody(ep: ApiEndpoint): Record<string, unknown> {
  if (!ep.bodyFields.length) return {};
  return ep.bodyFields.reduce<Record<string, unknown>>((acc, f) => {
    if (f.default !== undefined) acc[f.key] = f.default;
    else if (f.enum?.length) acc[f.key] = f.enum[0];
    else if (f.type === 'number') acc[f.key] = 0;
    else if (f.type === 'boolean') acc[f.key] = false;
    else if (f.type === 'array') acc[f.key] = [];
    else if (f.type === 'object') acc[f.key] = {};
    else acc[f.key] = `<${f.key}>`;
    return acc;
  }, {});
}

function generatePrompt(
  apiKey: string,
  clientName: string | undefined,
  selectedEps: ApiEndpoint[],
  lang: CodeLang,
  baseUrl: string,
  instanceName?: string,
): string {
  const lines: string[] = [];
  const nl = (s = '') => lines.push(s);
  const grouped = selectedEps.reduce<Record<string, ApiEndpoint[]>>((acc, ep) => {
    (acc[ep.category] ||= []).push(ep);
    return acc;
  }, {});

  nl(`# FIDScript WhatsApp API — Integration Prompt`);
  nl('');
  nl(`> Generated for ${clientName ? `"${clientName}"` : 'your application'} at ${new Date().toLocaleString()}`);
  nl('');
  nl(`## Project Context`);
  nl('');
  nl(`You are integrating a WhatsApp Business API into a web or mobile application. The backend is a Node.js/Express server (or your chosen framework). The integration communicates with the **FIDScript WhatsApp API**, a white-label wrapper over the Evolution API v2 gateway.`);
  nl('');
  nl(`## API Credentials`);
  nl('');
  nl(`| Variable | Value |`);
  nl(`|---|---|`);
  nl(`| Base URL | \`${baseUrl}\` |`);
  if (apiKey) {
    nl(`| API Key | \`${apiKey}\` |`);
  }
  if (instanceName) {
    nl(`| Instance | \`${instanceName}\` |`);
  }
  nl('');
  if (apiKey) {
    nl(`**Auth header** required on every request:`);
    nl('```');
    nl(`X-API-Key: ${apiKey}`);
    nl('```');
    nl('');
  }
  nl(`## Quick Reference`);
  nl('');
  nl(`| What | Detail |`);
  nl(`|---|---|`);
  nl(`| Token cost | Text = 1 token; Media/Status/Audio/Sticker = 2 tokens; Management ops = free |`);
  nl(`| Rate limits | Sends = per-plan limit; Reads (V1_READ) = 600/min; Mutations (V1_MUTATE) = 120/min; Profile/restart (V1_STRICT) = 30/min |`);
  nl(`| Idempotency | Send endpoints accept \`Idempotency-Key: <uuid>\` header — retries return cached result, no re-charge |`);
  nl(`| Instance name | Your WhatsApp container name (e.g. \`my-shop\`) — passed as \`:instance\` path parameter |`);
  nl('');
  nl(`## Installation`);
  nl('');
  nl(`Install the HTTP client for your language:`);
  nl('');
  if (lang === 'node') {
    nl('```bash');
    nl('# npm install node-fetch');
    nl('```');
  } else if (lang === 'python') {
    nl('```bash');
    nl('# pip install requests');
    nl('```');
  } else if (lang === 'php') {
    nl('```bash');
    nl('# composer require guzzlehttp/guzzle');
    nl('```');
  } else if (lang === 'go') {
    nl('```bash');
    nl('# go get github.com/google/uuid');
    nl('```');
  }

  nl('');
  nl(`## Base Request Helper`);
  nl('');

  if (lang === 'node') {
    nl('```javascript');
    nl('async function fidscriptRequest(method, path, body, apiKey) {');
    nl(`  const res = await fetch(\`\${baseUrl}\${path}\`, {`);
    nl('    method,');
    nl('    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },');
    nl('    body: body ? JSON.stringify(body) : undefined,');
    nl('  });');
    nl('  const data = await res.json();');
    nl('  if (!res.ok) throw new Error(data.error || `HTTP \${res.status}`);');
    nl('  return data;');
    nl('}');
    nl('const API_KEY = "<YOUR_API_KEY>";');
    nl('// Usage: fidscriptRequest("POST", "/sendText/my-instance", { number: "254712345678", text: "Hello!" }, API_KEY);');
    nl('```');
  } else if (lang === 'python') {
    nl('```python');
    nl('import requests');
    nl('');
    nl(`BASE_URL = "${baseUrl}"`);
    nl('HEADERS = {"X-API-Key": "<YOUR_API_KEY>"}');
    nl('');
    nl('def fidscript_request(method, path, body=None):');
    nl('    url = f"{BASE_URL}{path}"');
    nl('    resp = requests.request(method, url, json=body, headers=HEADERS)');
    nl('    resp.raise_for_status()');
    nl('    return resp.json()');
    nl('');
    nl('# Usage: fidscript_request("POST", "/sendText/my-instance", {"number": "254712345678", "text": "Hello!"})');
    nl('```');
  } else if (lang === 'php') {
    nl('```php');
    nl(`$baseUrl = "${baseUrl}";`);
    nl('$apiKey = "<YOUR_API_KEY>";');
    nl('$headers = ["X-API-Key: $apiKey", "Content-Type: application/json"];');
    nl('');
    nl('function fidscriptRequest($method, $path, $body = null) {');
    nl('  global $baseUrl, $headers;');
    nl('  $ch = curl_init($baseUrl . $path);');
    nl('  curl_setopt_array($ch, [');
    nl('    CURLOPT_RETURNTRANSFER => true,');
    nl('    CURLOPT_CUSTOMREQUEST => $method,');
    nl('    CURLOPT_HTTPHEADER => $headers,');
    nl('    $body !== null ? CURLOPT_POSTFIELDS => json_encode($body) : 0,');
    nl('  ]);');
    nl('  $resp = curl_exec($ch);');
    nl('  curl_close($ch);');
    nl('  return json_decode($resp, true);');
    nl('}');
    nl('// Usage: fidscriptRequest("POST", "/sendText/my-instance", ["number" => "254712345678", "text" => "Hello!"]);');
    nl('```');
  } else if (lang === 'go') {
    nl('```go');
    nl('import (');
    nl('  "bytes"');
    nl('  "encoding/json"');
    nl('  "fmt"');
    nl('  "net/http"');
    nl(')');
    nl('');
    nl(`const baseURL = "${baseUrl}"`);
    nl('const apiKey = "<YOUR_API_KEY>"');
    nl('');
    nl('func fidscriptRequest(method, path string, body interface{}) (map[string]interface{}, error) {');
    nl('  url := baseURL + path');
    nl('  var bodyBytes []byte');
    nl('  if body != nil {');
    nl('    bodyBytes, _ = json.Marshal(body)');
    nl('  }');
    nl('  req, _ := http.NewRequest(method, url, bytes.NewReader(bodyBytes))');
    nl('  req.Header.Set("X-API-Key", apiKey)');
    nl('  req.Header.Set("Content-Type", "application/json")');
    nl('  resp, err := http.DefaultClient.Do(req)');
    nl('  if err != nil { return nil, err }');
    nl('  defer resp.Body.Close()');
    nl('  var result map[string]interface{}');
    nl('  json.NewDecoder(resp.Body).Decode(&result)');
    nl('  return result, nil');
    nl('}');
    nl('// Usage: fidscriptRequest("POST", "/sendText/my-instance", map[string]interface{}{"number": "254712345678", "text": "Hello!"})');
    nl('```');
  } else {
    nl('```bash');
    nl(`BASE_URL="${baseUrl}"`);
    nl(`API_KEY="${apiKey}"`);
    nl('# cURL examples are shown per endpoint below');
    nl('```');
  }

  nl('');
  nl(`## Endpoint Reference`);
  nl('');

  for (const [catName, eps] of Object.entries(grouped)) {
    nl(`### ${catName}`);
    nl('');

    for (const ep of eps) {
      const pathDisplay = ep.path.replace('/api/v1', '').replace(':instance', '{instanceName}');
      const body = buildExampleBody(ep);
      const params = flattenFields(ep.bodyFields);
      const curlExample = buildCurl(ep, apiKey);

      nl(`#### \`${ep.method} ${pathDisplay}\` — ${ep.name}`);
      nl('');
      nl(ep.desc);
      nl('');
      if (ep.cost !== undefined) {
        nl(`**Cost:** ${ep.cost === 0 ? 'Free (management operation)' : `${ep.cost} token${ep.cost > 1 ? 's' : ''}`}`);
        nl('');
      }
      nl(`**Path parameters:**`);
      if (ep.pathParams.length) {
        for (const p of ep.pathParams) {
          nl(`- \`${p.name}\` — ${p.desc || 'required path segment'}`);
        }
      } else {
        nl(`- (none — uses query params or request body)`);
      }
      nl('');

      if (params.length) {
        nl(`**Request body fields:**`);
        nl(`| Field | Type | Required | Description |`);
        nl(`|---|---|---|---|`);
        for (const p of params) {
          nl(`| \`${p.name}\` | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.desc} |`);
        }
        nl('');
      }

      nl(`**Example cURL:**`);
      nl('```bash');
      nl(curlExample);
      nl('```');
      nl('');

      if (lang !== 'curl') {
        const codeExample = buildCodeSnippet(ep, apiKey, lang);
        const langLabel = lang === 'node' ? 'JavaScript' : lang === 'python' ? 'Python' : lang === 'php' ? 'PHP' : 'Go';
        nl(`**Example (${langLabel}):**`);
        nl('```' + (lang === 'node' ? 'javascript' : lang === 'python' ? 'python' : lang === 'php' ? 'php' : 'go'));
        nl(codeExample);
        nl('```');
        nl('');
      }

      nl(`**Success response:**`);
      nl('```json');
      nl(JSON.stringify(ep.response || { success: true, data: {} }, null, 2));
      nl('```');
      nl('');
      nl('---');
      nl('');
    }
  }

  nl(`## Integration Notes`);
  nl('');
  nl(`1. **Instance name** — Replace \`{instanceName}\` in the path with your actual WhatsApp container name (e.g. \`my-shop\`, \`prod-instance\`). Get your container name from the dashboard.`);
  nl(`2. **Phone numbers** — Use international format without the \`+\` sign (e.g. \`254712345678\`, not \`+254712345678\`).`);
  nl(`3. **Media URLs** — For \`sendMedia\`, the \`media_url\` must be a publicly accessible URL (e.g. from your CDN or object storage).`);
  nl(`4. **Error handling** — Always check \`result.success\` before using \`result.data\`. On failure, \`result.error\` contains the error message.`);
  nl(`5. **Token balance** — Monitor your token balance at the dashboard. Top up at the Token Store.`);
  nl(`6. **Idempotency** — For send endpoints, pass \`Idempotency-Key: <uuid>\` header to prevent duplicate sends on retry.`);
  nl('');
  nl(`## Webhook Integration`);
  nl('');
  nl(`Configure your webhook URL in the dashboard (Settings → Instance → Webhook). Events you can receive:`);
  nl(`- \`messages.upsert\` — inbound messages (text, image, video, document, voice, etc.)`);
  nl(`- \`connection.update\` — connection state changes (connected/disconnected)`);
  nl(`- \`qrcode.updated\` — new QR code generated`);
  nl('');
  nl(`Example webhook handler (Node.js/Express):`);
  nl('```javascript');
  nl('app.post("/webhook/fidscript", express.json(), (req, res) => {');
  nl('  const { event, payload } = req.body;');
  nl('  if (event === "messages.upsert") {');
  nl('    const { key, pushName, message, messageType } = payload;');
  nl('    console.log(`From: ${pushName} (${key.remoteJid})`);');
  nl('    console.log(`Type: ${messageType}`);');
  nl('    console.log(`Message:`, message);');
  nl('  }');
  nl('  res.sendStatus(200);');
  nl('});');
  nl('```');
  nl('');
  nl(`---\n*Generated by FIDScript · ${new Date().toISOString()}*`);

  return lines.join('\n');
}

// ── Copy button helper ────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold bg-forest-deep hover:bg-[#33301a] text-white rounded-xl transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  );
}

// ── Step 1: Credentials ────────────────────────────────────────────────────────

function Step1Credentials({ apiKey, apiKeys, instances, selectedKeyId, setSelectedKeyId, selectedInstance, setSelectedInstance, onNext, onKeySelect }: {
  apiKey: string;
  apiKeys: VibeWizardProps['apiKeys'];
  instances: VibeWizardProps['instances'];
  selectedKeyId: string;
  setSelectedKeyId: (id: string) => void;
  selectedInstance: string;
  setSelectedInstance: (name: string) => void;
  onNext: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Resolve the actual key string from selected key ID
  const activeKey = (selectedKeyId ? apiKeys.find(k => k.id === selectedKeyId)?.key : null) || apiKey || '';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <p className="text-xs font-bold text-forest-deep">Vibe Coding Wizard</p>
          <p className="text-[10px] text-graphite">Generate an AI-ready integration prompt for your selected endpoints.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* API Key dropdown */}
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-2">API Key</label>
          <select
            value={selectedKeyId}
            onChange={e => {
              const id = e.target.value;
              setSelectedKeyId(id);
              if (onKeySelect) onKeySelect(id, apiKeys.find(k => k.id === id)?.key || '');
            }}
            className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs text-forest-deep"
          >
            <option value="">— Select a key —</option>
            {apiKeys.map(k => (
              <option key={k.id} value={k.id}>
                {k.name} — {k.key_prefix || (k.key ? k.key.substring(0, 12) : '••••••••')}{k.key ? '…' : ''} [{k.status}]
              </option>
            ))}
          </select>
          {apiKeys.length === 0 && (
            <p className="text-[9px] text-amber-600 mt-1">No API keys found. Generate one in the "My API Keys" tab first.</p>
          )}
        </div>

        {/* Container dropdown — truly optional */}
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-2">WhatsApp Container <span className="normal-case font-normal text-stone-400">(optional)</span></label>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs text-forest-deep"
          >
            <option value="">— Leave unset —</option>
            {instances.map(i => (
              <option key={i.id} value={i.name}>
                {(i.display_name || i.name)} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
              </option>
            ))}
          </select>
        </div>

        {/* Key reveal + base URL — only show if we have a key */}
        {activeKey && (
          <div className="p-3 bg-stone-50 border border-[#eaebe4] rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono bg-white border border-[#eaebe4] px-3 py-2 rounded-lg text-stone-700 select-all truncate">
                {revealed ? activeKey : activeKey.substring(0, 16) + '••••••••••••••••••••'}
              </code>
              <button onClick={() => setRevealed(v => !v)} className="p-2 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-xl transition-colors shrink-0">
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono bg-white border border-[#eaebe4] px-3 py-2 rounded-lg text-stone-700">{PUBLIC_API_BASE}</code>
              <CopyButton text={PUBLIC_API_BASE} label="Copy" />
            </div>
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-900 leading-relaxed">
            This prompt will embed your API key and container name if set. Only use this wizard on a trusted device and paste the result into your AI coding assistant.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <button onClick={() => setConfirmed(v => !v)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${confirmed ? 'bg-forest-deep border-forest-deep' : 'border-stone-300'}`}>
            {confirmed && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-[11px] text-graphite">I understand credentials may be embedded in the generated prompt</span>
        </label>
      </div>

      <button onClick={onNext} disabled={!confirmed}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-forest-deep hover:bg-[#33301a] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-all">
        Continue to Endpoint Selection <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 2: Select Endpoints ──────────────────────────────────────────────────

function Step2Select({ state, setState, onBack, onNext }: {
  state: Step2State;
  setState: React.Dispatch<React.SetStateAction<Step2State>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).map(e => e.id));
    setState({ global: 'all', categories: {}, selectedEndpoints: allIds });
  };

  const selectNone = () => {
    setState({ global: 'none', categories: {}, selectedEndpoints: new Set() });
  };

  const setCatSelection = (cat: string, sel: 'all' | 'none') => {
    setState(s => {
      const newCats = { ...s.categories, [cat]: sel };
      const newGlobal = Object.values(newCats).every(v => v === 'all') ? 'all'
        : Object.values(newCats).every(v => v === 'none') ? 'none' : 'custom';
      let newEps = new Set(s.selectedEndpoints);
      if (sel === 'all') {
        API_ENDPOINTS.filter(e => e.category === cat && e.path.startsWith('/api/v1')).forEach(e => newEps.add(e.id));
      } else {
        API_ENDPOINTS.filter(e => e.category === cat && e.path.startsWith('/api/v1')).forEach(e => newEps.delete(e.id));
      }
      return { global: newGlobal, categories: newCats, selectedEndpoints: newEps };
    });
  };

  const toggleEndpoint = (epId: string) => {
    setState(s => {
      const next = new Set(s.selectedEndpoints);
      if (next.has(epId)) next.delete(epId); else next.add(epId);
      return { ...s, selectedEndpoints: next };
    });
  };

  const totalEps = API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).length;
  const selectedCount = state.selectedEndpoints.size;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${state.global === 'all' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
            All {totalEps}
          </button>
          <button onClick={selectNone} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${state.global === 'none' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
            None
          </button>
        </div>
        <span className="text-[10px] font-bold text-stone-500">{selectedCount} of {totalEps} selected</span>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {API_CATEGORIES.filter(c => c.name !== 'Receiving').map(cat => {
          const catEps = API_ENDPOINTS.filter(e => e.category === cat.name && e.path.startsWith('/api/v1'));
          if (!catEps.length) return null;
          const catSel = state.categories[cat.name] ||
            (catEps.every(e => state.selectedEndpoints.has(e.id))) ? 'all' :
            (catEps.some(e => state.selectedEndpoints.has(e.id))) ? 'custom' : 'none';
          const expanded = expandedCats.has(cat.name);

          return (
            <div key={cat.name} className="border border-[#eaebe4] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f2]">
                <button onClick={() => toggleCat(cat.name)} className="flex items-center gap-2 flex-1 text-left">
                  <span className="text-stone-500"><Settings className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-forest-deep">{cat.name}</span>
                  <span className="text-[9px] text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">{catEps.length}</span>
                  {expanded ? <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 text-stone-400 ml-auto" />}
                </button>
                <div className="flex items-center gap-1.5 ml-3">
                  <button onClick={() => setCatSelection(cat.name, 'all')}
                    className={`px-2 py-1 text-[8px] font-bold rounded border transition-all ${catSel === 'all' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
                    All
                  </button>
                  <button onClick={() => setCatSelection(cat.name, 'none')}
                    className={`px-2 py-1 text-[8px] font-bold rounded border transition-all ${catSel === 'none' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
                    None
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="divide-y divide-[#eaebe4]/50">
                      {catEps.map(ep => {
                        const sel = state.selectedEndpoints.has(ep.id);
                        return (
                          <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors">
                            <button onClick={() => toggleEndpoint(ep.id)} className="shrink-0">
                              {sel
                                ? <CheckSquare className="w-4 h-4 text-forest-deep" />
                                : <Square className="w-4 h-4 text-stone-400" />}
                            </button>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${ep.method === 'POST' ? 'bg-yellow-100 text-yellow-800' : ep.method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {ep.method}
                            </span>
                            <span className="text-[10px] font-bold text-stone-700 flex-1">{ep.name}</span>
                            {ep.cost !== undefined && (
                              <span className="text-[8px] font-mono text-stone-400 shrink-0">{ep.cost === 0 ? 'free' : `${ep.cost}t`}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors">← Back</button>
        <button onClick={onNext} disabled={selectedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-deep hover:bg-[#33301a] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-all">
          Generate Prompt ({selectedCount} endpoint{selectedCount !== 1 ? 's' : ''}) <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Generated Prompt ────────────────────────────────────────────────

function Step3Prompt({ apiKey, clientName, selectedEps, instanceName, onBack }: {
  apiKey: string;
  clientName?: string;
  selectedEps: ApiEndpoint[];
  instanceName?: string;
  onBack: () => void;
}) {
  const [lang, setLang] = useState<CodeLang>('node');
  const [showFull, setShowFull] = useState(false);

  const prompt = useMemo(() => generatePrompt(apiKey, clientName, selectedEps, lang, PUBLIC_API_BASE, instanceName), [apiKey, clientName, selectedEps, lang, instanceName]);

  const LANG_OPTIONS: { id: CodeLang; label: string }[] = [
    { id: 'node', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP' },
    { id: 'go', label: 'Go' },
    { id: 'curl', label: 'cURL' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1">
          {LANG_OPTIONS.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              className={`px-2.5 py-1.5 text-[9px] font-bold rounded-lg transition-all ${lang === l.id ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFull(v => !v)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${showFull ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
            {showFull ? 'Hide' : 'Show'} Full Prompt
          </button>
          <CopyButton text={prompt} label="Copy Full Prompt" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(selectedEps.reduce<Record<string, number>>((acc, ep) => {
          (acc[ep.category] ||= 0); acc[ep.category]++;
          return acc;
        }, {})).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl">
            <span className="text-[10px] font-bold text-forest-deep">{count}×</span>
            <span className="text-[10px] text-graphite">{cat}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showFull && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1613] border-b border-[#162721]">
                <span className="text-[10px] font-mono font-bold text-emerald-400">Generated Prompt</span>
                <CopyButton text={prompt} label="Copy" />
              </div>
              <pre className="p-4 text-[10px] font-mono text-emerald-200 bg-[#09100e] overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                {prompt}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-graphite uppercase tracking-wider">Or copy a specific section</p>
        {(['Project Context', 'API Credentials', 'Quick Reference', 'Installation', 'Base Request Helper', 'Endpoint Reference', 'Integration Notes', 'Webhook Integration'] as const).map(section => (
          <button
            key={section}
            onClick={() => {
              const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const match = prompt.match(new RegExp(`## ${escaped}[\\s\\S]*?(?=## |\\n*---|$)`));
              if (match) navigator.clipboard.writeText(match[0].trim());
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-[#eaebe4] hover:border-yellow-300 hover:bg-yellow-50 rounded-xl transition-all text-left group">
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-forest-deep">{section}</span>
            <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-yellow-700" />
          </button>
        ))}
      </div>

      <button onClick={onBack}
        className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors">
        ← Edit Selection
      </button>
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────

export default function VibeWizard({ apiKey, clientName, apiKeys, instances }: VibeWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);

  // Persist the key secret in a ref so it survives across apiKeys re-fetches without stale-closure issues
  const keySecretRef = useRef<string>(apiKey);

  // Which API key is selected in Step 1
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');

  // Auto-select key whenever apiKeys changes
  useEffect(() => {
    if (apiKeys.length === 0) return;
    // If the selected key still has its secret in the fresh apiKeys, keep it — ref is already set
    const currentKey = selectedKeyId ? apiKeys.find(k => k.id === selectedKeyId) : null;
    if (selectedKeyId && currentKey?.key) {
      keySecretRef.current = currentKey.key;
      return;
    }
    // Selected key missing secret (apiKeys was re-fetched) — try to preserve ref
    const firstWithSecret = apiKeys.find(k => k.key);
    const first = apiKeys[0];
    const target = firstWithSecret || first;
    if (target) {
      setSelectedKeyId(target.id);
      keySecretRef.current = target.key || apiKey;
    }
  }, [apiKeys]);

  // Container selection — optional, starts empty
  const [selectedInstance, setSelectedInstance] = useState<string>('');

  // Derive the actual key string: selected key's secret in apiKeys > ref > prop fallback
  const activeKey =
    (selectedKeyId ? apiKeys.find(k => k.id === selectedKeyId)?.key : null)
    || keySecretRef.current
    || apiKey
    || '';

  const [step2State, setStep2State] = useState<Step2State>({
    global: 'all',
    categories: {},
    selectedEndpoints: new Set(API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).map(e => e.id)),
  });

  const selectedEps = useMemo(() =>
    API_ENDPOINTS.filter(e => step2State.selectedEndpoints.has(e.id)),
    [step2State.selectedEndpoints]
  );

  const stepLabels = ['Verify Credentials', 'Select Endpoints', 'AI Integration Prompt'];

  return (
    <div className="p-6 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0 flex-wrap">
        {([1, 2, 3] as WizardStep[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${step === s ? 'bg-forest-deep text-white' : s < step ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>
              <span className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-[8px] shrink-0">{s < step ? '✓' : s}</span>
              <span className="hidden sm:inline">{stepLabels[i]}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-1 min-w-4 ${s < step ? 'bg-green-400' : 'bg-stone-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Step1Credentials
              apiKey={apiKey}
              apiKeys={apiKeys}
              instances={instances}
              selectedKeyId={selectedKeyId}
              setSelectedKeyId={setSelectedKeyId}
              selectedInstance={selectedInstance}
              setSelectedInstance={setSelectedInstance}
              onNext={() => setStep(2)}
              onKeySelect={(_id, secret) => {
                keySecretRef.current = secret || apiKey;
              }}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Step2Select state={step2State} setState={setStep2State} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Step3Prompt
              apiKey={activeKey}
              clientName={clientName}
              selectedEps={selectedEps}
              instanceName={selectedInstance}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
