import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../../middleware/auth.js';
import { logAuditAction } from '../../../utils/audit.js';
import cloudinary from '../../../utils/cloudinary.js';
import db from '../../../database.js';

// =============================================================================
// /api/platform/media - Phase 5 Slice B. Workspace-scoped media library (§15.3).
// media_assets was reserved by database/phase5.ts; this route fills it in.
// Three intake paths: (1) POST { url } - caller already has a public URL
// (CDN/Cloudinary/etc.); (2) POST { image } data URL - server uploads to
// Cloudinary; (3) POST { file } as raw binary - server uploads.
// kind is inferred from mime; tags_json is an array of strings.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }

function inferKind(mime: string): 'image' | 'video' | 'audio' | 'document' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

interface MediaRow {
  id: string;
  workspace_id: string;
  name: string;
  kind: string;
  mime: string;
  url: string;
  public_id: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  tags_json: string | null;
  created_by: string | null;
  created_at: string;
}

function serialize(r: MediaRow) {
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    name: r.name,
    kind: r.kind,
    mime: r.mime,
    url: r.url,
    public_id: r.public_id,
    size_bytes: r.size_bytes,
    width: r.width,
    height: r.height,
    tags: r.tags_json ? (JSON.parse(r.tags_json) as string[]) : [],
    created_by: r.created_by,
    created_at: r.created_at,
  };
}

// GET / - list (workspace-scoped; filterable by kind, tag, q)
router.get('/', (req: Request, res: Response) => {
  try {
    const kind = (req.query.kind as string) || '';
    const tag = (req.query.tag as string) || '';
    const q = (req.query.q as string) || '';

    const conds = ['workspace_id = ?'];
    const params: unknown[] = [wsId(req)];
    if (kind) { conds.push('kind = ?'); params.push(kind); }
    if (q) { conds.push('(name LIKE ? OR tags_json LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

    const rows = db.prepare(`
      SELECT * FROM media_assets WHERE ${conds.join(' AND ')}
      ORDER BY created_at DESC LIMIT 200
    `).all(...params) as unknown as MediaRow[];

    const data = rows.map(serialize).filter((m) => !tag || m.tags.includes(tag));
    res.json({ success: true, data });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST / - register a media asset. Either { url, name?, mime?, tags? } OR
// { image } as a data-URL (uploads to Cloudinary).
router.post('/', async (req: Request, res: Response) => {
  try {
    const id = `med_${uuidv4().substring(0, 8)}`;
    const name = ((req.body?.name as string) || '').trim() || 'Untitled';
    const tags = Array.isArray(req.body?.tags) ? (req.body.tags as string[]).filter(Boolean) : [];
    const mime = ((req.body?.mime as string) || '').trim();

    let url = '';
    let publicId: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let sizeBytes: number | null = null;
    let finalMime = mime;

    if (req.body?.url) {
      url = String(req.body.url);
      publicId = (req.body.public_id as string) || null;
      if (!finalMime) finalMime = mimeFromExtension(url);
    } else if (req.body?.image) {
      // Data-URL upload to Cloudinary
      const result = await cloudinary.uploader.upload(String(req.body.image), {
        folder: `fidscript/media/${wsId(req)}`,
        resource_type: 'auto',
      });
      url = result.secure_url;
      publicId = result.public_id;
      width = result.width || null;
      height = result.height || null;
      sizeBytes = (result as { bytes?: number }).bytes ?? null;
      finalMime = result.format ? mimeFromExtension(result.format) : 'image/jpeg';
    } else {
      res.status(400).json({ success: false, error: 'Provide url or image' });
      return;
    }

    const kind = inferKind(finalMime);

    db.prepare(`
      INSERT INTO media_assets
        (id, workspace_id, name, kind, mime, url, public_id, size_bytes, width, height, tags_json, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, wsId(req), name, kind, finalMime, url, publicId, sizeBytes, width, height,
      tags.length ? JSON.stringify(tags) : null, wsId(req)
    );

    logAuditAction(req, 'MEDIA_CREATED', 'media_asset', id, name);
    const row = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as unknown as MediaRow;
    res.status(201).json({ success: true, data: serialize(row) });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// PATCH /:id - update name and/or tags
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT * FROM media_assets WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req)) as MediaRow | undefined;
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const fields: string[] = [];
    const params: unknown[] = [];
    if (typeof req.body?.name === 'string') { fields.push('name = ?'); params.push(req.body.name.trim()); }
    if (Array.isArray(req.body?.tags)) {
      fields.push('tags_json = ?');
      params.push(JSON.stringify((req.body.tags as string[]).filter(Boolean)));
    }
    if (!fields.length) { res.json({ success: true }); return; }
    params.push(req.params.id);
    db.prepare(`UPDATE media_assets SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    logAuditAction(req, 'MEDIA_UPDATED', 'media_asset', req.params.id, JSON.stringify(req.body));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// DELETE /:id - best-effort Cloudinary cleanup if we have the public_id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT * FROM media_assets WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req)) as MediaRow | undefined;
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    if (owned.public_id) {
      cloudinary.uploader.destroy(owned.public_id, { resource_type: 'auto', invalidate: true }).catch(() => { /* best effort */ });
    }
    db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'MEDIA_DELETED', 'media_asset', req.params.id, owned.name);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

function mimeFromExtension(s: string): string {
  const ext = s.toLowerCase().split('.').pop() || s.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  if (['mp4', 'mov', 'webm'].includes(ext)) return `video/${ext}`;
  if (['mp3', 'ogg', 'wav', 'm4a', 'opus'].includes(ext)) return `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
  if (ext === 'pdf') return 'application/pdf';
  if (['doc', 'docx'].includes(ext)) return 'application/msword';
  return 'application/octet-stream';
}

export default router;
