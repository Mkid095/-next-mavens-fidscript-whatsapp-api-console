import type { ApiEndpoint } from './index';

/** Platform endpoints — auth validation, usage analytics, the OpenAPI spec. */
export const platformEndpoints: ApiEndpoint[] = [
  {
    id: 'platform.whoami', version: 'v1', method: 'GET',
    path: '/api/v1/whoami', name: 'Validate Key', category: 'Platform', rateLimit: 'read', auth: 'apikey',
    desc: 'Confirm an API key is active and resolve the owning client. No side effects — ideal for a connection test.',
    pathParams: [],
    bodyFields: [],
    response: { success: true, data: { client: 'Kennedy Mwangi', key_id: 'key_1718...' } },
  },
  {
    id: 'platform.usage', version: 'v1', method: 'GET',
    path: '/api/v1/usage', name: 'Usage Analytics', category: 'Platform', rateLimit: 'read', auth: 'apikey',
    desc: 'Aggregate API usage for the authenticated client: requests today/this month, sends this month, token spend, and failed requests.',
    pathParams: [],
    bodyFields: [],
    response: {
      success: true,
      data: { requestsToday: 42, requestsMonth: 1180, sendsMonth: 612, tokenSpendMonth: 935, failedRequestsMonth: 3 },
    },
  },
  {
    id: 'platform.openapi', version: 'v1', method: 'GET',
    path: '/api/v1/openapi.json', name: 'OpenAPI Spec', category: 'Platform', rateLimit: 'read', auth: 'none',
    desc: 'The machine-readable OpenAPI 3.0 document for the entire API. Import into Postman, Insomnia, or an AI agent. A YAML mirror is at /api/v1/openapi.yaml.',
    pathParams: [],
    bodyFields: [],
    response: { openapi: '3.0.3', info: { title: 'FIDScript WhatsApp API', version: 'v1' } },
  },
];
