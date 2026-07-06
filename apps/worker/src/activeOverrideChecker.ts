/**
 * Active Override Checker — determines if a human-takeover override is active
 * for a given conversation.
 */

export function isOverrideActive(row: { mode: string; expires_at?: string | null }): boolean {
  if (row.mode !== 'manual') return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at) > new Date();
}
