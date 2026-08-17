// Node.js 20+ has native global fetch - no import needed

const TUMA_API_URL = 'https://api.tuma.co.ke';

interface TumaToken {
  token: string;
  expires_at: number; // Unix ms
}

let cachedToken: TumaToken | null = null;

/**
 * Get a valid Tuma bearer token, using a cached one if still valid (with 60s buffer).
 */
export async function getTumaToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.token;
  }

  const email = process.env.TUMA_BUSINESS_EMAIL;
  const apiKey = process.env.TUMA_API_KEY;

  if (!email || !apiKey) {
    throw new Error('TUMA_BUSINESS_EMAIL and TUMA_API_KEY must be set');
  }

  const response = await fetch(`${TUMA_API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, api_key: apiKey }),
  });

  const raw = await response.json() as Record<string, unknown>;

  if (!response.ok || raw.success !== true) {
    const msg = (raw.message as string) || 'Failed to obtain Tuma token';
    throw new Error(msg);
  }

  const body = raw as { success: true; data: { token: string; expires_in?: number } };
  const token = body.data?.token;
  if (!token) {
    throw new Error('Tuma auth response missing token');
  }

  cachedToken = {
    token,
    expires_at: Date.now() + ((body.data?.expires_in ?? 86400) * 1000),
  };

  return cachedToken.token;
}

/**
 * Make an authenticated Tuma API request.
 */
export async function tumaRequest(
  endpoint: string,
  method: string,
  body?: object
): Promise<Record<string, unknown>> {
  const token = await getTumaToken();
  const response = await fetch(`${TUMA_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json() as Promise<Record<string, unknown>>;
}
