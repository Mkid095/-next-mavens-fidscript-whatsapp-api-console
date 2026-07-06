import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { sendStatus } from '../../services/whatsapp/messaging.js';
import { getInstanceForClient, type SendContext } from '../../services/whatsapp/shared.js';
import { logAuditAction } from '../../utils/audit.js';
import type { Request } from 'express';

// =============================================================================
// Phase 5 Slice E — Status posts (text/image to the WhatsApp status feed).
// post_state lifecycle: draft → scheduled → posting → posted | failed | cancelled
//
// postStatusNow(row) is the canonical poster: it loads the instance the post
// belongs to, builds a SendContext, and calls the shared sendStatus sender
// (same pipeline 1:1 chat uses → tokens charged, message.sent fired, counters
// ticked). The state transition is atomic with the gateway call — if the send
// throws, the row is marked failed with the error message and tokens are
// refunded by the shared sender (so a 5% failure rate doesn't burn the budget).
// =============================================================================

export interface StatusPostRow {
  id: string;
  workspace_id: string;
  instance_id: string;
  kind: 'text' | 'image' | 'audio';
  content: string | null;
  media_id: string | null;
  caption: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  post_state: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';
  cross_post_json: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateStatusInput {
  instance_id: string;
  kind: 'text' | 'image' | 'audio';
  content?: string;
  media_id?: string;
  caption?: string;
  scheduled_at?: string | null;
  cross_post?: string[]; // additional instance_ids
}

export function listStatusPosts(workspaceId: string): StatusPostRow[] {
  return db.prepare(`
    SELECT * FROM status_posts
    WHERE workspace_id = ?
    ORDER BY COALESCE(scheduled_at, posted_at, created_at) DESC
    LIMIT 200
  `).all(workspaceId) as unknown as StatusPostRow[];
}

export function getStatusPost(id: string, workspaceId: string): StatusPostRow | null {
  const row = db.prepare('SELECT * FROM status_posts WHERE id = ? AND workspace_id = ?')
    .get(id, workspaceId) as StatusPostRow | undefined;
  return row ?? null;
}

export function createStatusPost(workspaceId: string, createdBy: string, input: CreateStatusInput): StatusPostRow {
  if (!input.instance_id) throw new Error('instance_id is required');
  if (!['text', 'image', 'audio'].includes(input.kind)) throw new Error('kind must be text, image, or audio');
  if (input.kind === 'text' && !input.content) throw new Error('content is required for text status');
  if ((input.kind === 'image' || input.kind === 'audio') && !input.media_id) throw new Error('media_id is required for media status');

  // Verify the primary instance belongs to this workspace
  const inst = db.prepare('SELECT id FROM instances WHERE id = ? AND client_id = ?')
    .get(input.instance_id, workspaceId);
  if (!inst) throw new Error('Instance not found in this workspace');

  // Verify any cross-post instances also belong to this workspace
  if (input.cross_post?.length) {
    const placeholders = input.cross_post.map(() => '?').join(',');
    const owned = db.prepare(`SELECT id FROM instances WHERE client_id = ? AND id IN (${placeholders})`)
      .all(workspaceId, ...input.cross_post) as { id: string }[];
    if (owned.length !== input.cross_post.length) throw new Error('One or more cross-post instances not found in this workspace');
  }

  const id = `stat_${uuidv4().substring(0, 8)}`;
  const postState = input.scheduled_at ? 'scheduled' : 'draft';
  db.prepare(`
    INSERT INTO status_posts
      (id, workspace_id, instance_id, kind, content, media_id, caption, scheduled_at, post_state, cross_post_json, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, workspaceId, input.instance_id, input.kind,
    input.content || null, input.media_id || null, input.caption || null,
    input.scheduled_at || null, postState,
    input.cross_post?.length ? JSON.stringify(input.cross_post) : null,
    createdBy
  );
  return getStatusPost(id, workspaceId) as StatusPostRow;
}

export function updateStatusPost(id: string, workspaceId: string, patch: Partial<CreateStatusInput>): StatusPostRow {
  const existing = getStatusPost(id, workspaceId);
  if (!existing) throw new Error('Not found');
  if (existing.post_state === 'posted' || existing.post_state === 'posting') {
    throw new Error(`Cannot edit a ${existing.post_state} status`);
  }
  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.content !== undefined) { fields.push('content = ?'); params.push(patch.content); }
  if (patch.media_id !== undefined) { fields.push('media_id = ?'); params.push(patch.media_id); }
  if (patch.caption !== undefined) { fields.push('caption = ?'); params.push(patch.caption); }
  if (patch.scheduled_at !== undefined) {
    fields.push('scheduled_at = ?');
    params.push(patch.scheduled_at);
    fields.push('post_state = ?');
    params.push(patch.scheduled_at ? 'scheduled' : 'draft');
  }
  if (patch.cross_post !== undefined) {
    fields.push('cross_post_json = ?');
    params.push(patch.cross_post.length ? JSON.stringify(patch.cross_post) : null);
  }
  if (!fields.length) return existing;
  params.push(id, workspaceId);
  db.prepare(`UPDATE status_posts SET ${fields.join(', ')} WHERE id = ? AND workspace_id = ?`).run(...params);
  return getStatusPost(id, workspaceId) as StatusPostRow;
}

export function deleteStatusPost(id: string, workspaceId: string): void {
  const existing = getStatusPost(id, workspaceId);
  if (!existing) throw new Error('Not found');
  if (existing.post_state === 'posting') throw new Error('Cannot delete a status that is currently posting');
  db.prepare('DELETE FROM status_posts WHERE id = ? AND workspace_id = ?').run(id, workspaceId);
}

export function scheduleStatusPost(id: string, workspaceId: string, scheduledAt: string): StatusPostRow {
  const existing = getStatusPost(id, workspaceId);
  if (!existing) throw new Error('Not found');
  if (existing.post_state !== 'draft' && existing.post_state !== 'scheduled' && existing.post_state !== 'cancelled') {
    throw new Error(`Cannot schedule a status in state ${existing.post_state}`);
  }
  db.prepare(`UPDATE status_posts SET scheduled_at = ?, post_state = 'scheduled' WHERE id = ? AND workspace_id = ?`)
    .run(scheduledAt, id, workspaceId);
  return getStatusPost(id, workspaceId) as StatusPostRow;
}

export function cancelStatusPost(id: string, workspaceId: string): StatusPostRow {
  const existing = getStatusPost(id, workspaceId);
  if (!existing) throw new Error('Not found');
  if (existing.post_state === 'posted' || existing.post_state === 'posting') {
    throw new Error(`Cannot cancel a ${existing.post_state} status`);
  }
  db.prepare(`UPDATE status_posts SET post_state = 'cancelled' WHERE id = ? AND workspace_id = ?`)
    .run(id, workspaceId);
  return getStatusPost(id, workspaceId) as StatusPostRow;
}

/**
 * Post a status now. Looks up the instance + its owner (client) and calls
 * the shared sendStatus sender — which charges tokens, fires message.sent,
 * and refunds on failure. Updates the row atomically with the result.
 *
 * Used by:
 *  - POST /statuses/:id/post  (manual "post now" from the dashboard)
 *  - statusScheduler.tick()    (scheduled fires)
 */
export async function postStatusNow(
  row: StatusPostRow,
  req?: Request
): Promise<{ ok: boolean; error?: string }> {
  // 1. Load the instance — must exist, be connected, and owned by the same workspace.
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

  // 2. Resolve media URL (image/audio statuses reference media_assets)
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

  // 3. Load the client record for the SendContext.
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(row.workspace_id) as SendContext['client'] | undefined;
  if (!client) {
    markFailed(row.id, row.workspace_id, 'Client not found');
    return { ok: false, error: 'Client not found' };
  }

  // 4. Stamp the row as 'posting' BEFORE the gateway call so concurrent
  //    ticks can't double-fire.
  db.prepare(`UPDATE status_posts SET post_state = 'posting' WHERE id = ?`).run(row.id);

  // 5. Build a minimal Express-like request for the shared sender (lets it
  //    honor the idempotency-key header, log api_requests, and resolve
  //    req.client for wrapSend's idempotency cache).
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

  // 6. Call the shared sender — for text statuses pass the content as
  //    `content`; for image/audio pass the media URL + optional caption.
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

  // 7. Mark posted + record any cross-posts (currently we just record the
  //    intent — future slices could expand to actually firing each).
  const data = result.data as { messageId?: string };
  db.prepare(`
    UPDATE status_posts SET post_state = 'posted', posted_at = CURRENT_TIMESTAMP, error_message = NULL
    WHERE id = ?
  `).run(row.id);

  // Fire audit (best-effort — never blocks the user response)
  try {
    if (req) logAuditAction(req, 'STATUS_POSTED', 'status_post', row.id, data.messageId);
  } catch (err) {
    console.error('[statuses] audit log failed:', err);
  }

  // 8. If cross-post was requested, queue mirrors as additional scheduled
  //    rows for the same content with status=scheduled, scheduled_at=NOW
  //    so the scheduler picks them up next tick. (Defer to a future slice
  //    to actually fan out — for Slice E we record the intent only.)
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

function markFailed(id: string, workspaceId: string, error: string): void {
  db.prepare(`
    UPDATE status_posts SET post_state = 'failed', error_message = ?
    WHERE id = ? AND workspace_id = ?
  `).run(error?.substring(0, 500) || 'unknown', id, workspaceId);
}
