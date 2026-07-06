import crypto from 'crypto';

// =============================================================================
// HMAC signing for outbound webhook deliveries.
// §14.1 — X-FIDScript-Signature header is HMAC-SHA256(secret, rawBody), hex.
// Consumers verify: signature === HMAC(secret, rawBody) with timingSafeEqual.
// =============================================================================

export function signPayload(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// Constant-time compare to discourage timing oracles in consumer-side verification.
export function verifySignature(secret: string, body: string, signature: string): boolean {
  const expected = signPayload(secret, body);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
