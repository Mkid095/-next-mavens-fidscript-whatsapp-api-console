/**
 * Generate the public OpenAPI 3.0 spec from the frontend registry.
 *
 *   npm run gen:openapi   (from server/)
 *
 * Run this whenever src/data/apiEndpoints/* changes, then commit server/openapi.json.
 * The backend serves it at GET /api/v1/openapi.json (+ .yaml via runtime conversion).
 *
 * Lives in scripts/ (excluded from tsc) so importing the frontend registry across
 * the src/ boundary does not affect the backend build.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_ENDPOINTS, API_CATEGORIES, PUBLIC_API_BASE, type ApiEndpoint } from '../../src/data/apiEndpoints';
import { endpointToOpenApiOperation } from '../../src/utils/codegen';

function toOpenApiPath(ep: ApiEndpoint): string {
  return ep.path.replace('/api/v1', '').replace(/:([a-zA-Z]+)/g, '{$1}');
}

const paths: Record<string, Record<string, unknown>> = {};
for (const ep of API_ENDPOINTS) {
  const p = toOpenApiPath(ep);
  paths[p] = paths[p] || {};
  const op = endpointToOpenApiOperation(ep);
  // whoami/usage need the key; the spec document itself is public.
  if (ep.auth === 'none') op.security = [];
  paths[p][ep.method.toLowerCase()] = op;
}

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'FIDScript WhatsApp API',
    version: 'v1',
    description:
      'Send and receive WhatsApp messages, manage groups, chats, profile and instance lifecycle. ' +
      'Authenticate every request with `X-API-Key: fidscript_live_…`. All responses use `{ success, data?, error? }`.',
  },
  servers: [{ url: PUBLIC_API_BASE, description: 'Production' }],
  tags: API_CATEGORIES.map((c) => ({ name: c.name, description: c.desc })),
  paths,
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'A fidscript_live_ API key' },
    },
  },
  security: [{ ApiKeyAuth: [] }],
};

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'openapi.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(spec, null, 2) + '\n');
console.log(`✓ OpenAPI written to ${outPath} (${API_ENDPOINTS.length} operations)`);
