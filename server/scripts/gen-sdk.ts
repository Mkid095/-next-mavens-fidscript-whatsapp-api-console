/**
 * Generate multi-language SDK packages from the API registry.
 *
 *   npm run gen:sdk   (from server/)
 *
 * Outputs to server/static/sdk/ — committed so the backend can serve them.
 * Run whenever endpoint signatures change.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_ENDPOINTS, PUBLIC_API_BASE, type ApiEndpoint, type BodyField } from '../../src/data/apiEndpoints/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'static', 'sdk');

// ── shared helpers ────────────────────────────────────────────────────────────

function fieldValue(f: BodyField): string {
  if (f.default !== undefined) return JSON.stringify(f.default);
  if (f.enum?.length) return JSON.stringify(f.enum[0]);
  if (f.type === 'number') return '0';
  if (f.type === 'boolean') return 'false';
  if (f.type === 'array') return '[]';
  if (f.type === 'object') return '{}';
  return `"<${f.key}>"`;
}

function buildBody(ep: ApiEndpoint): Record<string, unknown> | null {
  if (!ep.bodyFields.length) return null;
  return ep.bodyFields.reduce<Record<string, unknown>>((acc, f) => {
    acc[f.key] = fieldValue(f);
    return acc;
  }, {});
}

function cleanPath(path: string): string {
  return path.replace('/api/v1', '').replace(':instance', '{instanceName}');
}

// ── JavaScript / TypeScript SDK ───────────────────────────────────────────────

function genJS(): string {
  const methods = API_ENDPOINTS
    .filter(ep => ep.path.startsWith('/api/v1'))
    .map(ep => {
      const fn = ep.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const params = ['instanceName', ...ep.bodyFields.map(f => f.key)].filter((v, i, a) => a.indexOf(v) === i);
      const body = buildBody(ep);
      const hasBody = !!body && Object.keys(body).length > 0;
      const method = ep.method.toLowerCase();
      const path = cleanPath(ep.path);
      return `  /**
   * ${ep.desc}
   * ${ep.method} ${path}${ep.cost ? ` — costs ${ep.cost} token(s)` : ' — free'}
   */
  async ${fn}(${params.join(', ')}) {
    const url = \`\${this.baseUrl}${path}\`;
    const opts = { method: '${ep.method}', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    ${hasBody ? `opts.body = JSON.stringify(${JSON.stringify(body, null, 4).replace(/"/g, "'")});` : ''}
    const res = await fetch(url, opts);
    return res.json();
  }`;
    }).join('\n\n');

  return `/**
 * FIDScript WhatsApp API — JavaScript/TypeScript SDK
 * Generated ${new Date().toISOString()}
 * Base: ${PUBLIC_API_BASE}
 *
 * Usage:
 *   import { Fidscript } from './fidscript.js';
 *   const api = new Fidscript({ apiKey: 'fidscript_live_...' });
 *   await api.send_text('my-instance', { number: '254700000000', text: 'Hello!' });
 */

export class Fidscript {
  baseUrl = '${PUBLIC_API_BASE}';

  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) throw new Error('apiKey is required');
    this.apiKey = apiKey;
  }

${methods}
}
`;
}

// ── Python SDK ────────────────────────────────────────────────────────────────

function genPython(): string {
  const methods = API_ENDPOINTS
    .filter(ep => ep.path.startsWith('/api/v1'))
    .map(ep => {
      const fn = ep.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const params = ['instance_name', ...ep.bodyFields.map(f => f.key)].filter((v, i, a) => a.indexOf(v) === i);
      const body = buildBody(ep);
      const hasBody = !!body && Object.keys(body).length > 0;
      const path = cleanPath(ep.path);
      return `    def ${fn}(${params.join(', ')}):
        """
        ${ep.desc}
        ${ep.method} ${path}${ep.cost ? ` — costs ${ep.cost} token(s)` : ' — free'}
        """
        url = f"{self.base_url}${path}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        ${hasBody ? `payload = ${JSON.stringify(body, null, 4).replace(/\n/g, '\n        ')}\n        resp = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)` : `resp = requests.${ep.method.toLowerCase()}(url, headers=headers)`}
        return resp.json()`;
    }).join('\n\n');

  return `# FIDScript WhatsApp API — Python SDK
# Generated ${new Date().toISOString()}
# Base: ${PUBLIC_API_BASE}
#
# Usage:
#   from fidscript import Fidscript
#   api = Fidscript(api_key='fidscript_live_...')
#   api.send_text('my-instance', number='254700000000', text='Hello!')

import requests

class Fidscript:
    base_url = '${PUBLIC_API_BASE}'

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError('api_key is required')
        self.api_key = api_key

${methods}
`;
}

// ── PHP SDK ──────────────────────────────────────────────────────────────────

function genPHP(): string {
  const methods = API_ENDPOINTS
    .filter(ep => ep.path.startsWith('/api/v1'))
    .map(ep => {
      const fn = lcfirst(ep.name.replace(/[^a-zA-Z0-9]/g, ''));
      const params = ['$instanceName', ...ep.bodyFields.map(f => '$' + f.key)].filter((v, i, a) => a.indexOf(v) === i);
      const body = buildBody(ep);
      const hasBody = !!body && Object.keys(body).length > 0;
      const path = cleanPath(ep.path);
      const curlOpts = `CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => '${ep.method}',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey${hasBody ? `, 'Content-Type: application/json'` : ''}]${hasBody ? `,
      CURLOPT_POSTFIELDS => $payload` : ''}`;
      return `  /**
   * ${ep.desc}
   * ${ep.method} ${path}${ep.cost ? ` — costs ${ep.cost} token(s)` : ' — free'}
   */
  public function ${fn}(${params.join(', ')})
  {
    $url = $this->baseUrl . '${path}';
    ${hasBody ? `$payload = json_encode(${JSON.stringify(body)});` : ''}
    $ch = curl_init();
    curl_setopt_array($ch, [
      ${curlOpts}
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }`;
    }).join('\n');

  return `<?php
/**
 * FIDScript WhatsApp API — PHP SDK
 * Generated ${new Date().toISOString()}
 * Base: ${PUBLIC_API_BASE}
 *
 * Usage:
 *   require_once 'fidscript.php';
 *   $api = new Fidscript('fidscript_live_...');
 *   $api->sendText('my-instance', '254700000000', 'Hello!');
 */

class Fidscript {
  private string $baseUrl = '${PUBLIC_API_BASE}';
  private string $apiKey;

  public function __construct(string $apiKey) {
    if (!$apiKey) throw new \\InvalidArgumentException('apiKey required');
    $this->apiKey = $apiKey;
  }

${methods}
}
`;

  function lcfirst(s: string): string {
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
}

// ── Go SDK ────────────────────────────────────────────────────────────────────

function genGo(): string {
  const methods = API_ENDPOINTS
    .filter(ep => ep.path.startsWith('/api/v1'))
    .map(ep => {
      const fn = toGoCase(ep.name.replace(/[^a-zA-Z0-9]/g, '_'));
      const body = buildBody(ep);
      const hasBody = !!body && Object.keys(body).length > 0;
      const path = cleanPath(ep.path);
      const hasPathParams = path.includes('{');
      const pathParams = hasPathParams ? 'instanceName string, ' : '';
      return `// ${ep.desc}
// ${ep.method} ${path}${ep.cost ? ` — costs ${ep.cost} token(s)` : ' — free'}
func (c *Client) ${fn}(${pathParams}${ep.bodyFields.map(f => f.key + ` string`).join(', ')}) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s${path}", c.baseUrl${hasPathParams ? `, instanceName` : ''})
  ${hasBody ? `payload, _ := json.Marshal(map[string]interface{}{${ep.bodyFields.map(f => `"${f.key}": ${f.key}`).join(', ')}})` : ''}
  req, _ := http.NewRequest("${ep.method}", url, ${hasBody ? 'bytes.NewReader(payload)' : 'nil'})
  req.Header.Set("X-API-Key", c.apiKey)
  ${hasBody ? `req.Header.Set("Content-Type", "application/json")` : ''}
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}`;
    }).join('\n');

  return `package fidscript

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
  "time"
)

// Client is the FIDScript WhatsApp API client.
// Generated ${new Date().toISOString()}.
type Client struct {
  baseUrl string
  apiKey  string
  http    *http.Client
}

func New(apiKey string) *Client {
  return &Client{
    baseUrl: "${PUBLIC_API_BASE}",
    apiKey:  apiKey,
    http:    &http.Client{Timeout: 30 * time.Second},
  }
}

${methods}
`;
  function toGoCase(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/_+/g, '_');
  }
}

// ── README ────────────────────────────────────────────────────────────────────

const readme = `# FIDScript WhatsApp API SDK

Generated ${new Date().toISOString()}.
Base URL: ${PUBLIC_API_BASE}

## Authentication

All requests require your API key via the \`X-API-Key\` header:

\`\`\`
X-API-Key: fidscript_live_your_key_here
\`\`\`

## Quick Start

### JavaScript / TypeScript

\`\`\`bash
npm install
# or just import fidscript.js directly
\`\`\`

\`\`\`js
import { Fidscript } from './fidscript.js';
const api = new Fidscript({ apiKey: 'fidscript_live_...' });
const result = await api.send_text('my-instance', { number: '254700000000', text: 'Hello!' });
\`\`\`

### Python

\`\`\`bash
pip install requests
\`\`\`

\`\`\`python
from fidscript import Fidscript
api = Fidscript(api_key='fidscript_live_...')
result = api.send_text('my-instance', number='254700000000', text='Hello!')
\`\`\`

### PHP

\`\`\`php
<?php
require_once 'fidscript.php';
$api = new Fidscript('fidscript_live_...');
$result = $api->sendText('my-instance', '254700000000', 'Hello!');
\`\`\`

### Go

\`\`\`go
package main
import "github.com/fidscript/sdk-go"
\`\`\`

\`\`\`go
client := fidscript.New("fidscript_live_...")
result, err := client.SendText("my-instance", "254700000000", "Hello!")
\`\`\`

## Endpoints Coverage

| Category | Count |
|----------|-------|
${[...new Set(API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).map(e => e.category))]
  .map(cat => `| ${cat} | ${API_ENDPOINTS.filter(e => e.category === cat && e.path.startsWith('/api/v1')).length} |`)
  .join('\n')}

## Rate Limits

- Sends: per your plan's \`clientRateLimit\` (token-bucket, per-minute)
- Reads (V1_READ): 600/min
- Mutations (V1_MUTATE): 120/min
- Profile/restart (V1_STRICT): 30/min

## Idempotency

Send endpoints accept \`Idempotency-Key: <uuid>\` header — retries return the cached first result without re-charge.

## Webhooks

Configure your webhook URL in the dashboard. Events delivered:
- \`messages.upsert\` — inbound messages (stored with raw + normalized payload)
- \`connection.update\` — instance connection state changes
- \`qrcode.updated\` — new QR code generated

## SDK Methods

${API_ENDPOINTS.filter(ep => ep.path.startsWith('/api/v1')).map(ep =>
  `- \`${ep.name}\` — ${ep.desc} (\`${ep.method} ${cleanPath(ep.path)}\`${ep.cost ? `, ${ep.cost} token(s)` : ', free'})`
).join('\n')}
`;

// ── write all files ───────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/fidscript.js`, genJS());
writeFileSync(`${OUT}/fidscript.py`, genPython());
writeFileSync(`${OUT}/fidscript.php`, genPHP());
writeFileSync(`${OUT}/fidscript.go`, genGo());
writeFileSync(`${OUT}/README.md`, readme);

console.log(`✓ SDK written to ${OUT}/`);
console.log(`  fidscript.js  (${genJS().split('\n').length} lines)`);
console.log(`  fidscript.py  (${genPython().split('\n').length} lines)`);
console.log(`  fidscript.php (${genPHP().split('\n').length} lines)`);
console.log(`  fidscript.go  (${genGo().split('\n').length} lines)`);
console.log(`  README.md     (${readme.split('\n').length} lines)`);
console.log(`  ${API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).length} endpoints covered`);