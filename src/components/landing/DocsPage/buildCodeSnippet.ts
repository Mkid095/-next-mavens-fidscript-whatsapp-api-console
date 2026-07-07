import type { Lang, ParamRow } from './types.ts';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';

export function buildCodeSnippet(
  lang: Lang,
  method: string,
  path: string,
  params: ParamRow[],
  apiKey: string,
): string {
  const cleanPath = path.replace(':instance', 'my-instance');
  const fullUrl = `${PUBLIC_API_BASE}${cleanPath}`;
  const key = apiKey || 'fidscript_live_your_key_here';

  const buildBody = () => {
    const obj: Record<string, string> = {};
    params
      .filter(p => !['boolean', 'string'].includes(p.type) && !p.type.endsWith(']'))
      .forEach(p => { obj[p.name] = `<${p.name}>`; });
    params.filter(p => p.type.endsWith(']')).forEach(p => { obj[p.name] = `[${p.name}]`; });
    return JSON.stringify(obj, null, 2);
  };

  const b = buildBody();

  switch (lang) {
    case 'curl':
      return `curl -X ${method} ${fullUrl} \\\n  -H "X-API-Key: ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '${b.replace(/"/g, '\\"')}'`;
    case 'node':
      return `const response = await fetch("${fullUrl}", {\n  method: "${method}",\n  headers: {\n    "X-API-Key": "${key}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${b})\n});\nconst data = await response.json();\nconsole.log(data);`;
    case 'python':
      return `import requests\n\nurl = "${fullUrl}"\nheaders = {\n    "X-API-Key": "${key}",\n    "Content-Type": "application/json"\n}\npayload = ${b.replace(/"/g, '"')}\n\nresponse = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\nprint(response.json())`;
    case 'php':
      return `<?php\n$url = "${fullUrl}";\n$data = ${b};\n\n$ch = curl_init($url);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "X-API-Key: ${key}",\n    "Content-Type: application/json"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$response = curl_exec($ch);\ncurl_close($ch);\nprint_r(json_decode($response, true));`;
    case 'go':
      return `package main\n\nimport (\n    "bytes"\n    "encoding/json"\n    "fmt"\n    "net/http"\n)\n\nfunc main() {\n    payload := map[string]interface{}{\n${params.map(p => `        "${p.name}": "<${p.name}>"`).join(',\n')}\n    }\n    body, _ := json.Marshal(payload)\n\n    req, _ := http.NewRequest("${method}", "${fullUrl}", bytes.NewBuffer(body))\n    req.Header.Set("X-API-Key", "${key}")\n    req.Header.Set("Content-Type", "application/json")\n\n    client := &http.Client{}\n    resp, _ := client.Do(req)\n    defer resp.Body.Close()\n}`;
    default:
      return '';
  }
}
