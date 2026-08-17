/**
 * Group sync - fetches all WhatsApp groups for an instance and ensures each
 * one has a conversation entry in our DB, so groups appear in the inbox even
 * before any message arrives (just like real WhatsApp).
 *
 * Also resolves group participants' phone numbers against saved contacts so they
 * show a human-readable name instead of just the JID.
 */

import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { fetchAllGroups } from './groups.js';
import { type SendContext, gatewayNameOf } from './shared.js';
import { normalizePhone } from '../../utils/phone.js';
import { logAuditAction } from '../../utils/audit.js';
import type { Instance } from '../../types.js';

interface GatewayGroup {
  id?: { user?: string; server?: string } | string;
  subject?: string;
  size?: number;
  restrict?: boolean;
  participants?: Array<{ id?: { user?: string; server?: string }; admin?: 'admin' | 'superadmin' | null }>;
}

function extractJid(group: GatewayGroup): string {
  if (typeof group.id === 'string') return group.id;
  if (typeof group.id === 'object' && group.id?.user) {
    return `${group.id.user}@${group.id.server || 'g.us'}`;
  }
  return '';
}

function extractParticipantJid(participant: { id?: { user?: string; server?: string }; admin?: string | null }): string {
  if (!participant.id) return '';
  if (typeof participant.id === 'string') return participant.id;
  return `${participant.id.user || ''}@${participant.id.server || 's.whatsapp.net'}`;
}

/**
 * Extract a normalized phone number from a participant JID.
 * e.g. "254712345678@s.whatsapp.net" → "+254712345678"
 */
function extractPhoneFromParticipant(participant: { id?: { user?: string; server?: string } }): string | null {
  const jid = extractParticipantJid(participant);
  if (!jid || jid.includes('@g.us')) return null;
  const match = jid.match(/^(\d+)@/);
  if (!match) return null;
  const phone = match[1];
  return phone.startsWith('0') ? `+${phone}` : `+${phone}`;
}

/**
 * Fetch and cache group metadata (subject, size, restrict, self_is_admin) in
 * our DB so group conversations display human-readable names and admin status
 * without an extra API call.
 *
 * @param groupJid      The group's full JID (e.g. 123456789@g.us)
 * @param subject       Human-readable group name
 * @param size          Number of participants
 * @param restrict      Whether only admins can send (from WhatsApp group settings)
 * @param selfIsAdmin   Whether our own phone number is an admin/superadmin
 */
export function cacheGroupInfo(
  groupJid: string,
  subject: string,
  size: number,
  restrict = false,
  selfIsAdmin = false,
): void {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO cached_group_info (group_jid, subject, size, restrict, self_is_admin, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(groupJid, subject, size, restrict ? 1 : 0, selfIsAdmin ? 1 : 0, new Date().toISOString());
  } catch { /* non-critical */ }
}

/**
 * Sync all WhatsApp groups for a connected instance.
 * Called when an instance successfully connects (QR scan) so all groups
 * immediately appear in the inbox before any message arrives.
 *
 * @param instance  The database instance record
 * @param clientId  The workspace/client ID
 */
export async function syncGroupsForInstance(
  instance: Instance & { client_id: string },
  clientId: string
): Promise<{ synced: number; errors: number }> {
  const workspaceId = clientId;
  let synced = 0;
  let errors = 0;

  // Build a minimal context that fetchAllGroups can use
  const ctx: SendContext = {
    instance,
    client: { id: clientId } as SendContext['client'],
    req: { headers: {} } as SendContext['req'],
  };

  // Our own phone number - used to determine if we are an admin in each group
  const selfPhoneRaw = (instance as { phone_number?: string }).phone_number || '';
  // Normalize to the same format as participant JIDs: digits only (no +)
  const selfPhoneDigits = selfPhoneRaw.replace(/\D/g, '');

  try {
    // 1. Fetch all groups from the gateway
    const result = await fetchAllGroups(ctx, false);

    if (!result.ok) {
      console.error('[groupSync] fetchAllGroups failed:', result.error);
      return { synced: 0, errors: 1 };
    }

    // the gateway returns groups array under various keys depending on version
    const responseData = result.data as { groups?: GatewayGroup[]; response?: GatewayGroup[] };
    const groups: GatewayGroup[] = (responseData.groups || responseData.response || []) as GatewayGroup[];

    if (!Array.isArray(groups)) {
      console.error('[groupSync] unexpected groups shape:', JSON.stringify(result.data));
      return { synced: 0, errors: 1 };
    }

    // 2. Ensure a conversation exists for each group
    for (const group of groups) {
      const jid = extractJid(group);
      if (!jid || !jid.includes('@g.us')) continue;

      const subject = group.subject || 'Unnamed Group';
      const size = group.size || group.participants?.length || 0;
      const restrict = !!group.restrict;

      // Check if our own phone number is an admin/superadmin in this group
      let selfIsAdmin = false;
      if (selfPhoneDigits && group.participants) {
        for (const p of group.participants) {
          const pJid = extractParticipantJid(p);
          if (!pJid) continue;
          const pPhone = pJid.replace(/\D/g, '');
          if (pPhone === selfPhoneDigits && (p.admin === 'admin' || p.admin === 'superadmin')) {
            selfIsAdmin = true;
            break;
          }
        }
      }

      try {
        // Upsert group conversation
        const existing = db.prepare(
          'SELECT id FROM conversations WHERE chat_id = ? AND channel = ? AND workspace_id = ?'
        ).get(jid, 'whatsapp', workspaceId) as { id: string } | undefined;

        if (!existing) {
          const convId = uuidv4();
          db.prepare(`
            INSERT INTO conversations
              (id, workspace_id, customer_id, channel, instance_id, chat_id, status, priority, last_message_at, created_at)
            VALUES (?, ?, ?, 'whatsapp', ?, ?, 'open', 'low', ?, ?)
          `).run(
            convId,
            workspaceId,
            uuidv4(), // placeholder customer_id for groups
            String(instance.id),
            jid,
            new Date().toISOString(),
            new Date().toISOString()
          );
        }

        // Cache group metadata including restrict flag and self admin status
        cacheGroupInfo(jid, subject, size, restrict, selfIsAdmin);

        // 3. Try to identify group participants against saved contacts
        syncGroupParticipants(workspaceId, jid, group.participants || []);

        synced++;
      } catch (err) {
        console.error('[groupSync] error syncing group', jid, err);
        errors++;
      }
    }

    logAuditAction({ headers: {} } as never, 'GROUP_SYNC', 'instance', String(instance.id), `Synced ${synced} groups`);
    console.log(`[groupSync] instance=${instance.name} synced=${synced} errors=${errors}`);
  } catch (err) {
    console.error('[groupSync] unexpected error:', err);
    errors++;
  }

  return { synced, errors };
}

/**
 * Resolve each participant's phone number against our contacts and cache
 * the mapping so inbound group messages can show a readable sender name.
 */
function syncGroupParticipants(
  workspaceId: string,
  groupJid: string,
  participants: Array<{ id?: { user?: string; server?: string } }>
): void {
  for (const participant of participants) {
    const phone = extractPhoneFromParticipant(participant);
    if (!phone) continue;

    const normalized = normalizePhone(phone);
    if (!normalized) continue;

    try {
      // Find if we have this contact saved
      const contact = db.prepare(
        'SELECT id, name FROM contacts WHERE client_id = ? AND phone = ?'
      ).get(workspaceId, normalized) as { id: string; name: string } | undefined;

      if (contact) {
        // Cache participant -> contact mapping for quick lookup in messages
        db.prepare(`
          INSERT OR REPLACE INTO cached_participants (group_jid, phone, contact_id, display_name, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(groupJid, normalized, contact.id, contact.name, new Date().toISOString());
      }
    } catch { /* non-critical */ }
  }
}

/**
 * Get a participant's display name from cache (fast path for incoming messages).
 */
export function getGroupParticipantName(
  groupJid: string,
  phone: string
): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const row = db.prepare(
    'SELECT display_name FROM cached_participants WHERE group_jid = ? AND phone = ?'
  ).get(groupJid, normalized) as { display_name: string } | undefined;

  return row?.display_name ?? null;
}

/**
 * Get cached group subject (for inbox display without an API call).
 */
export function getCachedGroupInfo(groupJid: string): { subject: string; size: number } | null {
  const row = db.prepare(
    'SELECT subject, size FROM cached_group_info WHERE group_jid = ?'
  ).get(groupJid) as { subject: string; size: number } | undefined;

  return row ?? null;
}
