import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';

export type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

/** Dark-mode method pill palette — same visual language as ApiKeysSection.tsx. */
export const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-900/40 text-blue-300 border border-blue-900/50',
  POST:   'bg-yellow-900/40 text-yellow-300 border border-yellow-900/50',
  DELETE: 'bg-red-900/40 text-red-300 border border-red-900/50',
  PATCH:  'bg-orange-900/40 text-orange-300 border border-orange-900/50',
  PUT:    'bg-purple-900/40 text-purple-300 border border-purple-900/50',
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
    "X-API-Key": ${key}",
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

// Local CopyButton removed — consumers should import { CopyButton } from '../shared/CopyButton.js'
export { CopyButton } from '../shared/CopyButton.js';