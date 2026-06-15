import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';

export type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH: 'bg-orange-500 text-white',
  PUT: 'bg-purple-600 text-white',
};

interface ParamRow { name: string; type: string; required: boolean; desc: string; }

export function buildCodeSnippet(lang: Lang, method: string, path: string, params: ParamRow[], apiKey: string): string {
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
${params.map(p => `        "${p.name}": "<${p.name}">`).join(',\n')}
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

export function CopyButton({ text }: { text: string }) {
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
