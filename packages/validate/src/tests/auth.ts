import type { HttpClient } from '../client/http.js';
import type { TestCollection, EnvConfig } from '../types.js';

interface AuthTokens {
  adminToken?: string;
  clientToken?: string;
}

export async function authTests(
  platform: HttpClient,
  env: EnvConfig,
  tokens: AuthTokens,
): Promise<TestCollection> {
  const results = [];

  // --- Register (use unique email to avoid conflict) ---
  const timestamp = Date.now();
  const testEmail = `e2e+${timestamp}@test.fidscript.com`;
  const testPassword = 'TestPass123!';

  try {
    const start = Date.now();
    const res = await platform.request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'E2E Test',
        email: testEmail,
        password: testPassword,
      },
    });
    results.push({
      name: 'register',
      status: res.data ? ('pass' as const) : ('fail' as const),
      latency: res.latency,
    });
    // Extract token from response if available
    const d = res.data as Record<string, unknown>;
    if (d.token) tokens.adminToken = String(d.token);
  } catch (err) {
    results.push({ name: 'register', status: 'fail' as const, error: String(err), latency: 0 });
  }

  // --- Login ---
  if (tokens.adminToken) {
    try {
      const start = Date.now();
      const res = await platform.request({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: testEmail, password: testPassword },
      });
      results.push({
        name: 'login',
        status: res.data ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
      });
    } catch (err) {
      results.push({ name: 'login', status: 'fail' as const, error: String(err), latency: 0 });
    }
  } else {
    results.push({ name: 'login', status: 'skip' as const });
  }

  // --- Magic code login (admin) ---
  if (env.adminEmail && env.adminPassword) {
    try {
      const start = Date.now();
      const res = await platform.request({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: env.adminEmail, password: env.adminPassword },
      });
      results.push({
        name: 'admin login',
        status: res.data ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
      });
    } catch (err) {
      results.push({ name: 'admin login', status: 'fail' as const, error: String(err), latency: 0 });
    }
  } else {
    results.push({ name: 'admin login', status: 'skip' as const });
  }

  return { title: 'Authentication', tests: results };
}
