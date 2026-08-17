import { type CodeLang } from '../../../utils/codegen';

/** Per-language install commands (npm install / pip / composer / go get). */
export function installSnippet(lang: CodeLang): string[] {
  const lines: string[] = ['```bash'];
  if (lang === 'node') lines.push('# npm install node-fetch');
  else if (lang === 'python') lines.push('# pip install requests');
  else if (lang === 'php') lines.push('# composer require guzzlehttp/guzzle');
  else if (lang === 'go') lines.push('# go get github.com/google/uuid');
  lines.push('```');
  return lines;
}

/** Base request helper in the user's chosen language - produces a ready-to-paste
 *  fidscriptRequest(...) wrapper, or a cURL env-var stub for `curl`. */
export function requestHelperSnippet(lang: CodeLang, baseUrl: string, apiKey: string): string[] {
  const lines: string[] = [];
  if (lang === 'node') {
    lines.push('```javascript');
    lines.push('async function fidscriptRequest(method, path, body, apiKey) {');
    lines.push(`  const res = await fetch(\`\${baseUrl}\${path}\`, {`);
    lines.push('    method,');
    lines.push('    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },');
    lines.push('    body: body ? JSON.stringify(body) : undefined,');
    lines.push('  });');
    lines.push('  const data = await res.json();');
    lines.push('  if (!res.ok) throw new Error(data.error || `HTTP \${res.status}`);');
    lines.push('  return data;');
    lines.push('}');
    lines.push('const API_KEY = "<YOUR_API_KEY>";');
    lines.push('// Usage: fidscriptRequest("POST", "/sendText/my-instance", { number: "254712345678", text: "Hello!" }, API_KEY);');
    lines.push('```');
  } else if (lang === 'python') {
    lines.push('```python');
    lines.push('import requests');
    lines.push('');
    lines.push(`BASE_URL = "${baseUrl}"`);
    lines.push('HEADERS = {"X-API-Key": "<YOUR_API_KEY>"}');
    lines.push('');
    lines.push('def fidscript_request(method, path, body=None):');
    lines.push('    url = f"{BASE_URL}{path}"');
    lines.push('    resp = requests.request(method, url, json=body, headers=HEADERS)');
    lines.push('    resp.raise_for_status()');
    lines.push('    return resp.json()');
    lines.push('');
    lines.push('# Usage: fidscript_request("POST", "/sendText/my-instance", {"number": "254712345678", "text": "Hello!"})');
    lines.push('```');
  } else if (lang === 'php') {
    lines.push('```php');
    lines.push(`$baseUrl = "${baseUrl}";`);
    lines.push('$apiKey = "<YOUR_API_KEY>";');
    lines.push('$headers = ["X-API-Key: $apiKey", "Content-Type: application/json"];');
    lines.push('');
    lines.push('function fidscriptRequest($method, $path, $body = null) {');
    lines.push('  global $baseUrl, $headers;');
    lines.push('  $ch = curl_init($baseUrl . $path);');
    lines.push('  curl_setopt_array($ch, [');
    lines.push('    CURLOPT_RETURNTRANSFER => true,');
    lines.push('    CURLOPT_CUSTOMREQUEST => $method,');
    lines.push('    CURLOPT_HTTPHEADER => $headers,');
    lines.push('    $body !== null ? CURLOPT_POSTFIELDS => json_encode($body) : 0,');
    lines.push('  ]);');
    lines.push('  $resp = curl_exec($ch);');
    lines.push('  curl_close($ch);');
    lines.push('  return json_decode($resp, true);');
    lines.push('}');
    lines.push('// Usage: fidscriptRequest("POST", "/sendText/my-instance", ["number" => "254712345678", "text" => "Hello!"]);');
    lines.push('```');
  } else if (lang === 'go') {
    lines.push('```go');
    lines.push('import (');
    lines.push('  "bytes"');
    lines.push('  "encoding/json"');
    lines.push('  "fmt"');
    lines.push('  "net/http"');
    lines.push(')');
    lines.push('');
    lines.push(`const baseURL = "${baseUrl}"`);
    lines.push('const apiKey = "<YOUR_API_KEY>"');
    lines.push('');
    lines.push('func fidscriptRequest(method, path string, body interface{}) (map[string]interface{}, error) {');
    lines.push('  url := baseURL + path');
    lines.push('  var bodyBytes []byte');
    lines.push('  if body != nil {');
    lines.push('    bodyBytes, _ = json.Marshal(body)');
    lines.push('  }');
    lines.push('  req, _ := http.NewRequest(method, url, bytes.NewReader(bodyBytes))');
    lines.push('  req.Header.Set("X-API-Key", apiKey)');
    lines.push('  req.Header.Set("Content-Type", "application/json")');
    lines.push('  resp, err := http.DefaultClient.Do(req)');
    lines.push('  if err != nil { return nil, err }');
    lines.push('  defer resp.Body.Close()');
    lines.push('  var result map[string]interface{}');
    lines.push('  json.NewDecoder(resp.Body).Decode(&result)');
    lines.push('  return result, nil');
    lines.push('}');
    lines.push('// Usage: fidscriptRequest("POST", "/sendText/my-instance", map[string]interface{}{"number": "254712345678", "text": "Hello!"})');
    lines.push('```');
  } else {
    lines.push('```bash');
    lines.push(`BASE_URL="${baseUrl}"`);
    lines.push(`API_KEY="${apiKey}"`);
    lines.push('# cURL examples are shown per endpoint below');
    lines.push('```');
  }
  return lines;
}
