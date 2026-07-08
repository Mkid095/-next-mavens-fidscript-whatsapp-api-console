/**
 * Display name resolution for WhatsApp JIDs.
 */
import db from '../../../database.js';
import { normalizePhone } from '../../../utils/phone.js';
import { getCachedGroupInfo } from '../groupSync.js';
import { getContactDisplayName } from '../../contactResolver.js';

/**
 * Resolve a display name for a JID. Priority:
 *  1:1   → CRM name → WhatsApp profile name → raw phone number
 *  group → cached group subject → pushName → JID
 */
export function resolveDisplayName(workspaceId: string, jid: string, pushName?: string): string {
  if (jid.includes('@g.us')) {
    const cached = getCachedGroupInfo(jid);
    if (cached?.subject) return cached.subject;
    if (pushName) return pushName;
    return jid;
  }
  const rawPhone = jid.split('@')[0];
  if (/^\d+$/.test(rawPhone)) {
    const normalizedForDb = normalizePhone(rawPhone);
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
  }
  // Format bare E.164 Kenyan numbers as local format for display
  if (/^\+254[79]\d{8}$/.test(rawPhone)) {
    const num = rawPhone.slice(1); // 2547… or 2541…
    return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  return rawPhone;
}
