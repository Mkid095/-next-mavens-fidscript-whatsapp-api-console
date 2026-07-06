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
import { generateFromOpenApi, generateFromSchema } from '../../modules/ai/toolGenerator.js';

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

// ─── Tool generation: auto-create tools from OpenAPI or schema ──────────────

router.post('/:id/generate-from-openapi', (req: Request, res: Response) => {
  const ds = db.prepare('SELECT id FROM data_sources WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!ds) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }

  const { spec, base_url } = req.body as { spec: string; base_url?: string };
  if (!spec) { res.status(400).json({ success: false, error: 'spec (OpenAPI JSON string) is required' }); return; }

  try {
    const { tools, serverUrl } = generateFromOpenApi(spec, base_url);
    const created: string[] = [];
    for (const tool of tools.slice(0, 50)) { // cap at 50 tools to prevent abuse
      const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json, approved, requires_confirmation) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`)
        .run(id, req.params.id, tool.name, tool.description, tool.type, tool.parameters_json, tool.executor_json, tool.requires_confirmation ? 1 : 0);
      created.push(id);
    }
    // Update data source config with server URL if detected
    if (serverUrl) {
      db.prepare('UPDATE data_sources SET config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify({ endpoint: serverUrl }), req.params.id);
    }
    res.json({ success: true, data: { tools_generated: created.length, tool_ids: created, server_url: serverUrl } });
  } catch (err) {
    res.status(400).json({ success: false, error: `Failed to parse OpenAPI spec: ${(err as Error).message}` });
  }
});

router.post('/:id/generate-from-schema', (req: Request, res: Response) => {
  const ds = db.prepare('SELECT id FROM data_sources WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
  if (!ds) { res.status(404).json({ success: false, error: 'Data source not found' }); return; }

  const { schema } = req.body as { schema: string };
  if (!schema) { res.status(400).json({ success: false, error: 'schema (JSON string) is required' }); return; }

  try {
    const tools = generateFromSchema(schema);
    const created: string[] = [];
    for (const tool of tools.slice(0, 50)) {
      const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json, approved) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`)
        .run(id, req.params.id, tool.name, tool.description, tool.type, tool.parameters_json, tool.executor_json);
      created.push(id);
    }
    res.json({ success: true, data: { tools_generated: created.length, tool_ids: created } });
  } catch (err) {
    res.status(400).json({ success: false, error: `Failed to parse schema: ${(err as Error).message}` });
  }
});

// ─── Tool approval (generated tools need explicit approval before use) ──────

router.post('/:id/tools/:toolId/approve', (req: Request, res: Response) => {
  const result = db.prepare(`
    UPDATE tools SET approved = 1
    WHERE id = ? AND data_source_id = ?
      AND data_source_id IN (SELECT id FROM data_sources WHERE workspace_id = ?)
  `).run(req.params.toolId, req.params.id, wsId(req));
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }
  res.json({ success: true, message: 'Tool approved — now usable by chatbots' });
});

router.post('/:id/tools/:toolId/reject', (req: Request, res: Response) => {
  // Reject = delete (the tool was generated but shouldn't be used)
  const result = db.prepare(`
    DELETE FROM tools WHERE id = ? AND data_source_id = ?
      AND data_source_id IN (SELECT id FROM data_sources WHERE workspace_id = ?)
  `).run(req.params.toolId, req.params.id, wsId(req));
  if (result.changes === 0) { res.status(404).json({ success: false, error: 'Tool not found' }); return; }
  res.json({ success: true, message: 'Tool rejected and removed' });
});

export default router;