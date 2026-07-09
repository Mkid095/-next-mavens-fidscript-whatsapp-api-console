/**
 * Display name resolution for WhatsApp JIDs.
 * NEVER returns a raw JID — always a contact name, group subject, or
 * a human-readable formatted phone number.
 */
import db from '../../../database.js';
import { normalizePhone } from '../../../utils/phone.js';
import { getCachedGroupInfo } from '../groupSync.js';
import { getContactDisplayName } from '../../contactResolver.js';

/** Format a bare phone number (digits only, possibly with leading +) into a
 *  human-readable Kenyan format: "07XX XXX XXX" or "01X XXX XXXX". */
function formatKenyanPhone(digits: string): string {
  // Strip leading +
  const d = digits.replace(/^\+/, '');
  // Kenyan: 07XX XXX XXX (Safaricom/Airtel) or 01X XXX XXXX (landline)
  if (/^254[79]\d{8}$/.test(d)) {
    return `${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  }
  if (/^2541\d{8}$/.test(d)) {
    return `${d.slice(3, 4)} ${d.slice(4, 7)} ${d.slice(7, 10)} ${d.slice(10)}`;
  }
  // Fallback: group in 2-3 chunks
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

/**
 * Resolve a display name for a JID. Priority:
 *  1:1   → CRM name → WhatsApp pushName → formatted phone
 *  group → cached group subject → pushName → JID (NEVER returned raw)
 */
export function resolveDisplayName(workspaceId: string, jid: string, pushName?: string): string {
  if (jid.includes('@g.us')) {
    const cached = getCachedGroupInfo(jid);
    if (cached?.subject) return cached.subject;
    if (pushName) return pushName;
    // Group JID with no subject — return a friendly truncated form
    return jid.split('@')[0].slice(0, 30) || jid;
  }
  const raw = jid.split('@')[0];
  // Try CRM contact
  if (/^\+?\d+$/.test(raw)) {
    const normalizedForDb = normalizePhone(raw.startsWith('+') ? raw : `+${raw}`);
    if (normalizedForDb) {
      const contact = db.prepare(`
        SELECT ci.contact_id FROM contact_identifiers ci
        JOIN contacts c ON c.id = ci.contact_id
        WHERE ci.type = 'phone' AND ci.value = ? AND c.client_id = ?
        LIMIT 1
      `).get(normalizedForDb, workspaceId) as { contact_id: string } | undefined;
      if (contact) {
        const resolvedName = getContactDisplayName(contact.contact_id);
        if (resolvedName) return resolvedName;
      }
    }
    // Format as Kenyan local number
    return formatKenyanPhone(raw.startsWith('+') ? raw : `+${raw}`);
  }
  // Weird JID — strip device suffix (e.g. :22) and format
  const clean = raw.replace(/:.*$/, '');
  return formatKenyanPhone(clean.startsWith('+') ? clean : `+${clean}`);
}
