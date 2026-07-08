import type { HttpClient } from '../client/http.js';
import type { TestCollection } from '../types.js';

export async function infraTests(
  platform: HttpClient,
  whatsapp: HttpClient,
): Promise<TestCollection> {
  return {
    title: 'Infrastructure',
    tests: [
      await testEndpoint(platform, 'GET', '/api/v1/health', 'platform — /api/v1/health'),
      await testJson(whatsapp, 'GET', '/health', 'whatsapp-api — /health'),
      await testJson(whatsapp, 'GET', '/', 'whatsapp-api — /'),
      await testJson(whatsapp, 'GET', '/instance/instanceList', 'whatsapp-api — instanceList'),
      await testJson(whatsapp, 'GET', '/webhook/load', 'whatsapp-api — webhook/load'),
      await testFrontend('https://whatsapp.fidscript.com'),
    ],
  };
}

async function testEndpoint(
  client: HttpClient,
  method: string,
  path: string,
  name: string,
) {
  const start = Date.now();
  try {
    await client.request({ method, path });
    return { name, status: 'pass' as const, latency: Date.now() - start };
  } catch (err) {
    return {
      name,
      status: 'fail' as const,
      latency: Date.now() - start,
      error: String(err),
    };
  }
}

async function testJson(
  client: HttpClient,
  method: string,
  path: string,
  name: string,
) {
  const start = Date.now();
  try {
    const result = await client.request({ method, path });
    const isObject = result.data !== null && typeof result.data === 'object';
    return {
      name,
      status: isObject ? ('pass' as const) : ('fail' as const),
      latency: result.latency,
    };
  } catch (err) {
    return {
      name,
      status: 'fail' as const,
      latency: Date.now() - start,
      error: String(err),
    };
  }
}

async function testFrontend(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const ok = res.status >= 200 && res.status < 400;
    return {
      name: `frontend — ${url}`,
      status: ok ? ('pass' as const) : ('fail' as const),
      latency: Date.now() - start,
      data: `${res.status} ${res.statusText}`,
    };
  } catch (err) {
    return {
      name: `frontend — ${url}`,
      status: 'fail' as const,
      latency: Date.now() - start,
      error: String(err),
    };
  }
}
