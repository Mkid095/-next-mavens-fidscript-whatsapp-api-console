import type { HttpClient, ApiResponse } from '../client/http.js';
import type { TestCollection, Severity } from '../types.js';

function result(
  name: string,
  res: ApiResponse<unknown>,
  severity: Severity = 'high',
  category = 'infrastructure',
) {
  const ok = res.error === undefined && (res.status ?? 200) < 400;
  return {
    name,
    status: ok ? 'pass' as const : 'fail' as const,
    severity: ok ? undefined : severity,
    category,
    latency: res.latency,
    error: res.error,
    detail: res.errorBody !== undefined ? JSON.stringify(res.errorBody) : undefined,
    data: res.status,
  };
}

export async function infraTests(
  platform: HttpClient,
  whatsapp: HttpClient,
): Promise<TestCollection> {
  return {
    title: 'Infrastructure',
    tests: [
      result('platform health', await platform.request({ method: 'GET', path: '/api/v1/health' })),
      result('whatsapp-api /health', await whatsapp.request({ method: 'GET', path: '/health' })),
      result('whatsapp-api /', await whatsapp.request({ method: 'GET', path: '/' })),
      result('whatsapp-api instanceList', await whatsapp.request({ method: 'GET', path: '/instance/instanceList' })),
      result('whatsapp-api webhook/load', await whatsapp.request({ method: 'GET', path: '/webhook/load' })),
      await testFrontend('https://whatsapp.fidscript.com'),
    ],
  };
}

async function testFrontend(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const ok = res.status >= 200 && res.status < 400;
    return {
      name: `frontend - ${url}`,
      status: ok ? 'pass' as const : 'fail' as const,
      severity: ok ? undefined : ('high' as Severity),
      category: 'infrastructure' as string,
      latency: Date.now() - start,
      data: `${res.status} ${res.statusText}`,
    };
  } catch (err) {
    return {
      name: `frontend - ${url}`,
      status: 'fail' as const,
      severity: 'high' as Severity,
      category: 'infrastructure',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
