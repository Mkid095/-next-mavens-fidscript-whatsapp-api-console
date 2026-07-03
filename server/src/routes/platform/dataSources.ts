/**
 * dataSources.ts — /api/platform/data-sources
 *
 * Workspace CRUD for data sources + the tools that wrap them.
 * Tools can also be attached to chatbots via /api/platform/chatbots/:id/tools.
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';
import { executeTool } from '../../modules/ai/toolRunner.js';

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

// ─── List data sources in this workspace ────────────────────────────────────
router.get('/', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, name, description, type, config_json, is_builtin, enabled, created_at, updated_at
    FROM data_sources
    WHERE workspace_id = ?
    ORDER BY is_builtin DESC, created_at DESC
  `).all(wsId(req));
  res.json({ success: true, data: rows });
});

// ─── Get one data source with its tools ─────────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare(`
    SELECT id, name, description, type, config_json, is_builtin, enabled, created_at, updated_at
    FROM data_sources
    WHERE id = ? AND workspace_id = ?
  `).get(req.params.id, wsId(req));
  if (!row) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }

  const tools = db.prepare(`
    SELECT id, name, description, parameters_json, type, executor_json, enabled, created_at
    FROM tools
    WHERE data_source_id = ?
    ORDER BY name ASC
  `).all(req.params.id);
  res.json({ success: true, data: { ...(row as object), tools } });
});

// ─── Create a data source ──────────────────────────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { name, description = '', type, config_json = '{}' } = req.body as Record<string, string>;
  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'name and type are required' });
  }
  if (!['api_endpoint', 'sql_table', 'sql_query', 'static_json', 'demo'].includes(type)) {
    return res.status(400).json({ success: false, error: 'type must be api_endpoint|sql_table|sql_query|static_json|demo' });
  }
  const id = `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    db.prepare(`INSERT INTO data_sources (id, workspace_id, name, description, type, config_json) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, wsId(req), name, description, type, config_json);
    res.status(201).json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ─── Update a data source ────────────────────────────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT id FROM data_sources WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!existing) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }
  const { name, description, config_json, enabled } = req.body as Record<string, unknown>;
  db.prepare(`UPDATE data_sources SET
    name = COALESCE(?, name),
    description = COALESCE(?, description),
    config_json = COALESCE(?, config_json),
    enabled = COALESCE(?, enabled),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`).run(name ?? null, description ?? null, config_json ?? null, enabled === undefined ? null : (enabled ? 1 : 0), req.params.id);
  res.json({ success: true, message: 'Data source updated' });
});

// ─── Delete a data source (cascades to its tools) ──────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM data_sources WHERE id = ? AND workspace_id = ?').run(req.params.id, wsId(req));
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }
  res.json({ success: true, message: 'Data source deleted' });
});

// ─── List tools on a data source ──────────────────────────────────────────
router.get('/:id/tools', (req: Request, res: Response) => {
  const ds = db.prepare('SELECT id FROM data_sources WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!ds) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }
  const rows = db.prepare(`
    SELECT id, name, description, parameters_json, type, executor_json, enabled, created_at
    FROM tools WHERE data_source_id = ?
    ORDER BY name ASC
  `).all(req.params.id);
  res.json({ success: true, data: rows });
});

// ─── Add a tool to a data source ─────────────────────────────────────────
router.post('/:id/tools', (req: Request, res: Response) => {
  const ds = db.prepare('SELECT id FROM data_sources WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!ds) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }
  const { name, description, type, parameters_json = '{"type":"object","properties":{}}', executor_json = '{}' } = req.body as Record<string, string>;
  if (!name || !description || !type) {
    return res.status(400).json({ success: false, error: 'name, description, type are required' });
  }
  if (!['lookup', 'search', 'query', 'action', 'workflow'].includes(type)) {
    return res.status(400).json({ success: false, error: 'type must be lookup|search|query|action|workflow' });
  }
  const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.params.id, name, description, type, parameters_json, executor_json);
  res.status(201).json({ success: true, data: { id } });
});

router.delete('/:id/tools/:toolId', (req: Request, res: Response) => {
  const result = db.prepare(`
    DELETE FROM tools WHERE id = ? AND data_source_id = ?
      AND data_source_id IN (SELECT id FROM data_sources WHERE workspace_id = ?)
  `).run(req.params.toolId, req.params.id, wsId(req));
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }
  res.json({ success: true, message: 'Tool deleted' });
});

// ─── Direct tool execution (used by the chatbot engine) ───────────────────
router.post('/:id/tools/:toolId/exec', async (req: Request, res: Response) => {
  const ds = db.prepare(`
    SELECT ds.id, ds.config_json, ds.workspace_id
    FROM data_sources ds WHERE ds.id = ? AND ds.workspace_id = ?
  `).get(req.params.id, wsId(req)) as { id: string; config_json: string; workspace_id: string } | undefined;
  if (!ds) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }
  const tool = db.prepare(`
    SELECT id, name, type, parameters_json, executor_json, data_source_id
    FROM tools WHERE id = ? AND data_source_id = ?
  `).get(req.params.toolId, req.params.id) as { id: string; name: string; type: string; parameters_json: string; executor_json: string; data_source_id: string } | undefined;
  if (!tool) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }
  const params = (req.body as Record<string, unknown>).arguments ?? {};
  try {
    const result = await executeTool({
      tool,
      arguments: params as Record<string, unknown>,
      workspaceId: ds.workspace_id,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;