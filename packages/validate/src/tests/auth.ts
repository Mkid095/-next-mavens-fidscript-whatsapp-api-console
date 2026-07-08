import type { HttpClient, ApiResponse } from '../client/http.js';
import type { TestCollection, Severity } from '../types.js';

interface AuthTokens {
  adminToken?: string;
  clientToken?: string;
}

function mkResult(
  name: string,
  res: ApiResponse<unknown>,
  severity: Severity = 'high',
) {
  const isOk = res.error === undefined && (res.status ?? 200) < 400;
  return {
    name,
    status: (isOk ? 'pass' : 'fail') as 'pass' | 'fail',
    severity: isOk ? undefined : severity,
    category: 'auth',
    latency: res.latency,
    error: res.error,
    detail: res.errorBody !== undefined ? JSON.stringify(res.errorBody) : undefined,
  };
}

export async function authTests(
  platform: HttpClient,
  env: { adminEmail?: string; adminPassword?: string },
  tokens: AuthTokens,
): Promise<TestCollection> {
  const tests = [];
  const timestamp = Date.now();
  const testEmail = `e2e+${timestamp}@test.fidscript.com`;
  const testPassword = 'TestPass123!';

  // Register
  tests.push(mkResult(
    'register',
    await platform.request({
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'E2E Test', email: testEmail, password: testPassword },
    }),
    'high',
  ));

  // Login with test account
  const loginRes = await platform.request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: testEmail, password: testPassword },
  });
  tests.push(mkResult('login (test account)', loginRes, 'high'));

  // Admin login
  if (env.adminEmail && env.adminPassword) {
    tests.push(mkResult(
      'admin login',
      await platform.request({
        method: 'POST',
        path: '/api/auth/login',
        body: { email: env.adminEmail, password: env.adminPassword },
      }),
      'critical',
    ));
  } else {
    tests.push({ name: 'admin login', status: 'skip' as const, category: 'auth' });
  }

  return { title: 'Authentication', tests };
}
