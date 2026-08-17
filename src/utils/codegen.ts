/**
 * Shared code + spec generation for the public API registry.
 *
 * Used by DocsSection, ApiReference, the "Copy everything" exporter, and the
 * `scripts/gen-openapi.ts` build step - so every code sample and the OpenAPI
 * document always agree with the registry.
 */
import type { ApiEndpoint, BodyField } from '../data/apiEndpoints';
import { PUBLIC_API_BASE } from '../data/apiEndpoints';

export const CODE_LANGUAGES = ['curl', 'node', 'python', 'php', 'go'] as const;
export type CodeLang = (typeof CODE_LANGUAGES)[number];

type Values = Record<string, unknown>;

/** Resolve the value for a field: explicit value → default → placeholder. */
function fieldValue(field: BodyField, values?: Values): unknown {
  if (values && field.key in values) return values[field.key];
  if (field.default !== undefined) return field.default;
  if (field.enum && field.enum.length) return field.enum[0];
  switch (field.type) {
    case 'number': return 0;
    case 'boolean': return false;
    case 'array': return field.fields ? [sampleObject(field.fields)] : [];
    case 'object': return field.fields ? sampleObject(field.fields) : {};
    default: return field.placeholder || `${field.label.toLowerCase()}`;
  }
}

function sampleObject(fields: BodyField[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, f) => {
    acc[f.key] = fieldValue(f);
    return acc;
  }, {});
}

/** Build the request body object from the endpoint's bodyFields. */
export function buildBody(ep: ApiEndpoint, values?: Values): Record<string, unknown> | null {
  if (!ep.bodyFields.length) return null;
  return ep.bodyFields.reduce<Record<string, unknown>>((acc, f) => {
    acc[f.key] = fieldValue(f, values);
    return acc;
  }, {});
}

/** Substitute path :params with provided values (or the token sans-colon). */
export function buildPath(ep: ApiEndpoint, values?: Values): string {
  return ep.path.replace(/:([a-zA-Z]+)/g, (_m, token) => {
    const v = values?.[token];
    return v ? String(v) : `<${token}>`;
  });
}

/** Full URL for the given endpoint. */
export function buildUrl(ep: ApiEndpoint, values?: Values): string {
  return `${PUBLIC_API_BASE}${buildPath(ep, values).replace(/^\/api\/v1/, '')}`;
}

export function buildCurl(ep: ApiEndpoint, apiKey: string, values?: Values): string {
  const url = buildUrl(ep, values);
  const key = apiKey || 'fidscript_live_your_key_here';
  const body = buildBody(ep, values);
  const lines = [`curl -X ${ep.method} ${url} \\`, `  -H "X-API-Key: ${key}"`];
  if (body) {
    lines[lines.length - 1] += ' \\';
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(body)}'`);
  }
  return lines.join('\n');
}

export function buildCodeSnippet(ep: ApiEndpoint, apiKey: string, lang: CodeLang, values?: Values): string {
  const key = apiKey || 'fidscript_live_your_key_here';
  const url = buildUrl(ep, values);
  const body = buildBody(ep, values);
  const bodyJson = body ? JSON.stringify(body) : null;
  switch (lang) {
    case 'curl':
      return buildCurl(ep, apiKey, values);
    case 'node':
      return `const res = await fetch("${url}", {
  method: "${ep.method}",
  headers: { "X-API-Key": "${key}"${bodyJson ? ', "Content-Type": "application/json"' : ''} },${bodyJson ? `\n  body: JSON.stringify(${bodyJson})` : ''}
});
const data = await res.json();
console.log(data);`;
    case 'python':
      return `import requests

res = requests.${ep.method.toLowerCase()}(
    "${url}",
    headers={"X-API-Key": "${key}"}${bodyJson ? `,\n    json=${bodyJson}` : ''},
)
print(res.json())`;
    case 'php':
      return `$ch = curl_init("${url}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${ep.method}");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: ${key}"${bodyJson ? ', "Content-Type: application/json"' : ''}]);${bodyJson ? `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${bodyJson}');` : ''}
$response = curl_exec($ch);
curl_close($ch);`;
    case 'go':
      return `package main

import (
  "fmt"
  "net/http"${bodyJson ? `\n  "strings"` : ''}
)

func main() {
  req, _ := http.NewRequest("${ep.method}", "${url}", nil)
  req.Header.Set("X-API-Key", "${key}")${bodyJson ? `\n  req.Body = strings.NewReader(\`${bodyJson}\`)` : ''}
  res, _ := http.DefaultClient.Do(req)
  fmt.Println(res.Status)
}`;
  }
}

/** "Copy everything": one markdown doc of all endpoints with the key baked in. */
export function buildMarkdownReference(endpoints: ApiEndpoint[], apiKey: string): string {
  const key = apiKey || 'fidscript_live_your_key_here';
  const lines = [
    '# FIDScript WhatsApp API',
    '',
    `Base URL: \`${PUBLIC_API_BASE}\``,
    `Authentication: \`X-API-Key: ${key}\``,
    '',
  ];
  for (const ep of endpoints) {
    lines.push(`## ${ep.name}`, '', ep.desc, '', `**${ep.method} \`${buildPath(ep)}\`**${ep.cost ? ` · ${ep.cost} token${ep.cost > 1 ? 's' : ''}` : ' · free'}`, '');
    lines.push('```bash', buildCurl(ep, key), '```', '');
  }
  return lines.join('\n');
}

/** Convert a BodyField into a JSON Schema node (for OpenAPI requestBody). */
function fieldToJsonSchema(field: BodyField): Record<string, unknown> {
  const schema: Record<string, unknown> = { description: field.desc || field.label };
  switch (field.type) {
    case 'number': schema.type = 'number'; break;
    case 'boolean': schema.type = 'boolean'; break;
    case 'text': schema.type = 'string'; schema.format = 'textarea'; break;
    case 'string': schema.type = 'string'; break;
    case 'array':
      schema.type = 'array';
      schema.items = field.fields ? { type: 'object', properties: props(field.fields), required: req(field.fields) } : { type: 'string' };
      break;
    case 'object':
      schema.type = 'object';
      if (field.fields) { schema.properties = props(field.fields); schema.required = req(field.fields); }
      break;
  }
  if (field.enum) schema.enum = field.enum;
  return schema;
}

function props(fields: BodyField[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, f) => { acc[f.key] = fieldToJsonSchema(f); return acc; }, {});
}
function req(fields: BodyField[]): string[] {
  return fields.filter((f) => f.required).map((f) => f.key);
}

/** Build an OpenAPI 3.0 operation object for an endpoint. */
export function endpointToOpenApiOperation(ep: ApiEndpoint): Record<string, unknown> {
  const op: Record<string, unknown> = {
    operationId: ep.id,
    summary: ep.name,
    description: ep.desc,
    tags: [ep.category],
  };
  const parameters = ep.pathParams.map((p) => ({
    name: p.name, in: 'path', required: p.required !== false,
    schema: { type: 'string' }, description: p.desc,
  }));
  if (parameters.length) op.parameters = parameters;
  if (ep.bodyFields.length) {
    op.requestBody = {
      required: ep.bodyFields.some((f) => f.required),
      content: { 'application/json': { schema: { type: 'object', properties: props(ep.bodyFields), required: req(ep.bodyFields) } } },
    };
  }
  const responses: Record<string, unknown> = {
    '200': { description: 'Successful response', content: ep.response ? { 'application/json': { schema: { type: 'object' }, example: ep.response } } : undefined },
    '401': { description: 'Missing or invalid API key' },
    '402': { description: 'Insufficient token balance' },
  };
  op.responses = responses;
  return op;
}
