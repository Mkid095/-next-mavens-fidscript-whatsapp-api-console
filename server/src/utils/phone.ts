/**
 * Canonical phone / chat key. This is the SINGLE source of truth for how a
 * conversation thread is identified across send + receive + storage.
 *
 * - Group JIDs (…@g.us) and full individual JIDs (…@s.whatsapp.net) pass through.
 * - Kenyan local formats are normalized to international +254 (the platform's
 *   primary market): 07XXXXXXXX / 01XXXXXXXX and bare 7/1XXXXXXXX.
 * - Already-international numbers keep their country code.
 * - Non-numeric input (e.g. 'status') returns '' so it never collides with a
 *   real conversation thread.
 *
 * Idempotent: normalizePhone(normalizePhone(x)) === normalizePhone(x).
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';
  const value = String(input).trim();
  if (!value) return '';
  if (value.includes('@')) return value; // group or full JID — passthrough
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  // Kenya local: leading 0 (07xxxxxxxx / 01xxxxxxxx) → 254…
  if (digits.startsWith('0')) {
    digits = '254' + digits.slice(1);
  } else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    // Kenya local without the 0 (7xxxxxxxx / 1xxxxxxxx) → 254…
    digits = '254' + digits;
  }
  // Anything else is treated as already-international and kept verbatim.
  return '+' + digits;
}
