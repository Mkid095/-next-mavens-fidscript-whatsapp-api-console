// Campaign status route handlers — thin barrel.
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import type { StatusPostRow, CreateStatusInput } from './statuses.js';

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

  const inst = db.prepare('SELECT id FROM instances WHERE id = ? AND client_id = ?')
    .get(input.instance_id, workspaceId);
  if (!inst) throw new Error('Instance not found in this workspace');

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

export { postStatusNow } from './statusPosting.js';
