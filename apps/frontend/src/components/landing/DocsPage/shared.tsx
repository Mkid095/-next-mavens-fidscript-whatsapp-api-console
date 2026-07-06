/* ─────────────────────────────────────────────────────────
   SHARED TYPES & CONSTANTS for DocsPage sub-components
   ───────────────────────────────────────────────────────── */

import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Code2, BookOpen } from 'lucide-react';
import { DocsCodeBlock } from '../../shared/DocsCodeBlock.js';
import { CopyButton } from '../../shared/CopyButton.js';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index.js';
import type { BodyField } from '../../../data/apiEndpoints/index.js';

/* ── Types ── */
export type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

export interface ParamRow { name: string; type: string; required: boolean; desc: string }

/* ── Language list ── */
export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

/* ── HTTP method colors ── */
export const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-600 text-white',
  POST:   'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH:  'bg-orange-500 text-white',
  PUT:    'bg-purple-600 text-white',
};

/* ── Helpers ── */
export function flattenFields(fields: BodyField[], prefix = ''): ParamRow[] {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

function buildBody(params: ParamRow[]): string {
  const obj: Record<string, string> = {};
  params.filter(p => !['boolean','string'].includes(p.type) && !p.type.endsWith(']')).forEach(p => { obj[p.name] = `<${p.name}>`; });
  params.filter(p => p.type.endsWith(']')).forEach(p => { obj[p.name] = `[${p.name}]`; });
  return JSON.stringify(obj, null, 2);
}

export function buildCodeSnippet(lang: Lang, method: string, path: string, params: ParamRow[], apiKey: string): string {
  const cleanPath = path.replace(':instance', 'my-instance');
  const fullUrl = `${PUBLIC_API_BASE}${cleanPath}`;
  const key = apiKey || 'fidscript_live_your_key_here';
  const b = buildBody(params);
  switch (lang) {
    case 'curl': return `curl -X ${method} ${fullUrl} \\\n  -H "X-API-Key: ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '${b.replace(/"/g, '\\"')}'`;
    case 'node': return `const response = await fetch("${fullUrl}", {\n  method: "${method}",\n  headers: {\n    "X-API-Key": "${key}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${b})\n});\nconst data = await response.json();\nconsole.log(data);`;
    case 'python': return `import requests\n\nurl = "${fullUrl}"\nheaders = {\n    "X-API-Key": "${key}",\n    "Content-Type": "application/json"\n}\npayload = ${b.replace(/"/g, '"')}\n\nresponse = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\nprint(response.json())`;
    case 'php': return `<?php\n$url = "${fullUrl}";\n$data = ${b};\n\n$ch = curl_init($url);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "X-API-Key: ${key}",\n    "Content-Type: application/json"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$response = curl_exec($ch);\ncurl_close($ch);\nprint_r(json_decode($response, true));`;
    case 'go': return `package main\n\nimport (\n    "bytes"\n    "encoding/json"\n    "fmt"\n    "net/http"\n)\n\nfunc main() {\n    payload := map[string]interface{}{\n${params.map(p => `        "${p.name}": "<${p.name}>"`).join(',\n')}\n    }\n    body, _ := json.Marshal(payload)\n\n    req, _ := http.NewRequest("${method}", "${fullUrl}", bytes.NewBuffer(body))\n    req.Header.Set("X-API-Key", "${key}")\n    req.Header.Set("Content-Type", "application/json")\n\n    client := &http.Client{}\n    resp, _ := client.Do(req)\n    defer resp.Body.Close()\n}`;
    default: return '';
  }
}

/* ── Param Table ── */
export function ParamTable({ params }: { params: ParamRow[] }) {
  if (params.length === 0) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-[#262413]">
      <table className="w-full text-xs">
        <thead className="bg-[#1a1910]">
          <tr>
            {['Name','Type','Required','Description'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 font-bold text-[#8a886a]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262413]">
          {params.map(p => (
            <tr key={p.name} className="hover:bg-[#1a1910]/50">
              <td className="px-4 py-2.5 font-mono font-bold text-yellow-500">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-[#8a886a]">{p.type}</td>
              <td className="px-4 py-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.required ? 'bg-red-950 text-red-400' : 'bg-[#1a1910] text-[#6a6c5d]'}`}>{p.required ? 'Required' : 'Optional'}</span>
              </td>
              <td className="px-4 py-2.5 text-[#8a886a]">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Language Tabs ── */
export function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center bg-[#1a1910] rounded-xl p-1 gap-1 w-fit">
      {LANGUAGES.map(l => {
        const Icon = l.id === 'curl' ? Terminal : l.id === 'node' ? Code2 : BookOpen;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${active === l.id ? 'bg-yellow-500 text-stone-950' : 'text-[#6a6c5d] hover:text-white'}`}>
            <Icon size={12} />{l.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Callout ── */
export function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'success' }) {
  const colors = { info: 'border-blue-800 bg-blue-950/30 text-blue-300', warning: 'border-yellow-800 bg-yellow-950/30 text-yellow-200', success: 'border-green-800 bg-green-950/30 text-green-300' };
  return <div className={`rounded-xl border p-4 text-xs leading-relaxed ${colors[type]}`}>{children}</div>;
}

/* ── CLI Comparison block ── */
export function CliComparison({ op, curl, cli }: { op: string; curl: string; cli: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-white">{op}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-mono text-[#6a6c5d] uppercase tracking-wider mb-1.5">cURL</div>
          <DocsCodeBlock code={curl} lang="bash" />
        </div>
        <div>
          <div className="text-[10px] font-mono text-yellow-500 uppercase tracking-wider mb-1.5">fidscript CLI</div>
          <DocsCodeBlock code={cli} lang="bash" />
        </div>
      </div>
    </div>
  );
}
