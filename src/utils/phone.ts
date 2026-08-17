/**
 * Canonical phone / chat key. Mirror of server/src/utils/phone.ts - the single
 * source of truth for conversation thread identity on the frontend. See the
 * backend version for the full rules.
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';
  const value = String(input).trim();
  if (!value) return '';
  if (value.includes('@')) return value; // group or full JID - passthrough
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = '254' + digits.slice(1);
  } else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    digits = '254' + digits;
  }
  return '+' + digits;
}
