// Status post execution — the actual WhatsApp status send logic.
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { sendStatus } from '../../services/whatsapp/messaging.js';
import type { SendContext } from '../../services/whatsapp/shared.js';
import { logAuditAction } from '../../utils/audit.js';
import type { Request } from 'express';
import type { StatusPostRow } from './statusHandlers.js';

function markFailed(id: string, workspaceId: string, error: string): void {
  db.prepare(`
    UPDATE status_posts SET post_state = 'failed', error_message = ?
    WHERE id = ? AND workspace_id = ?
  `).run(error?.substring(0, 500) || 'unknown', id, workspaceId);
}

export async function postStatusNow(
  row: StatusPostRow,
  req?: Request
): Promise<{ ok: boolean; error?: string }> {
  const instance = db.prepare(`
    SELECT i.*, c.id AS client_id
    FROM instances i JOIN clients c ON i.client_id = c.id
    WHERE i.id = ? AND c.id = ?
  `).get(row.instance_id, row.workspace_id) as (SendContext['instance'] | undefined);
  if (!instance) {
    markFailed(row.id, row.workspace_id, 'Instance not found');
    return { ok: false, error: 'Instance not found' };
  }
  if (instance.status !== 'connected') {
    markFailed(row.id, row.workspace_id, 'Instance is not connected');
    return { ok: false, error: 'Instance is not connected' };
  }

  let mediaUrl: string | undefined;
  if (row.media_id) {
    const media = db.prepare('SELECT url FROM media_assets WHERE id = ? AND workspace_id = ?')
      .get(row.media_id, row.workspace_id) as { url: string } | undefined;
    if (!media) {
      markFailed(row.id, row.workspace_id, 'Media asset not found');
      return { ok: false, error: 'Media asset not found' };
    }
    mediaUrl = media.url;
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(row.workspace_id) as SendContext['client'] | undefined;
  if (!client) {
    markFailed(row.id, row.workspace_id, 'Client not found');
    return { ok: false, error: 'Client not found' };
  }

  db.prepare(`UPDATE status_posts SET post_state = 'posting' WHERE id = ?`).run(row.id);

  const stubReq: Request = req ?? ({
    method: 'POST',
    path: `/api/campaigns/statuses/${row.id}/post`,
    body: { status_id: row.id },
    ip: '127.0.0.1',
    headers: { 'idempotency-key': `status_${row.id}` },
    get(this: Request, name: string) { return this.headers?.[name.toLowerCase()]; },
    user: undefined,
  } as unknown as Request);

  const ctx: SendContext = {
    instance: { ...instance, client_id: row.workspace_id } as SendContext['instance'],
    client,
    req: stubReq,
  };

  const result = row.kind === 'text'
    ? await sendStatus(ctx, { type: 'text', content: row.content || '' })
    : await sendStatus(ctx, {
        type: row.kind,
        content: mediaUrl || row.content || '',
        caption: row.caption || undefined,
      });

  if (!result.ok) {
    markFailed(row.id, row.workspace_id, result.error);
    return { ok: false, error: result.error };
  }

  const data = result.data as { messageId?: string };
  db.prepare(`
    UPDATE status_posts SET post_state = 'posted', posted_at = CURRENT_TIMESTAMP, error_message = NULL
    WHERE id = ?
  `).run(row.id);

  try {
    if (req) logAuditAction(req, 'STATUS_POSTED', 'status_post', row.id, data.messageId);
  } catch (err) {
    console.error('[statuses] audit log failed:', err);
  }

  if (row.cross_post_json) {
    const targets = JSON.parse(row.cross_post_json) as string[];
    for (const targetId of targets) {
      const mirrorId = `stat_${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO status_posts
          (id, workspace_id, instance_id, kind, content, media_id, caption, scheduled_at, post_state, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'scheduled', ?)
      `).run(mirrorId, row.workspace_id, targetId, row.kind, row.content, row.media_id, row.caption, row.created_by);
    }
  }

  return { ok: true };
}
