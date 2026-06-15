import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/automations — Phase 4 flow CRUD (§11).
// The engine lives in server/src/modules/automation/. This router owns the
// flows + nodes + edges tables, workspace-scoped.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }

function loadFlow(workspaceId: string, id: string) {
  const flow = db.prepare(`SELECT * FROM automation_flows WHERE id = ? AND workspace_id = ?`).get(id, workspaceId) as Record<string, unknown> | undefined;
  if (!flow) return null;
  const nodes = db.prepare(`SELECT id, flow_id, type, config FROM automation_nodes WHERE flow_id = ?`).all(id) as Record<string, unknown>[];
  const edges = db.prepare(`SELECT id, flow_id, from_node_id, to_node_id, label FROM automation_edges WHERE flow_id = ?`).all(id) as Record<string, unknown>[];
  return {
    id: String(flow.id),
    workspace_id: String(flow.workspace_id),
    name: String(flow.name),
    trigger_event: String(flow.trigger_event ?? 'message.received'),
    enabled: Boolean(flow.enabled),
    version: Number(flow.version ?? 1),
    nodes: nodes.map((n) => {
      let config: unknown = {};
      try { config = JSON.parse(String(n.config ?? '{}')); } catch { /* keep {} */ }
      return { id: String(n.id), type: String(n.type), config };
    }),
    edges: edges.map((e) => ({ id: String(e.id), from: String(e.from_node_id), to: String(e.to_node_id), label: e.label ? String(e.label) : undefined })),
  };
}

// GET / — list flows (no node/edge payload, just summary)
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`SELECT id, name, trigger_event, enabled, version, created_at FROM automation_flows WHERE workspace_id = ? ORDER BY created_at DESC`).all(wsId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// GET /:id — full flow (nodes + edges)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const flow = loadFlow(wsId(req), req.params.id);
    if (!flow) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: flow });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST / — create a flow with optional initial nodes/edges
router.post('/', (req: Request, res: Response) => {
  try {
    const name = ((req.body?.name as string) || '').trim();
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO automation_flows (id, workspace_id, name, trigger_event, enabled, version)
      VALUES (?, ?, ?, ?, 1, 1)
    `).run(id, wsId(req), name, (req.body?.trigger_event as string) ?? 'message.received');

    const nodes = Array.isArray(req.body?.nodes) ? req.body.nodes as Array<{ id?: string; type: string; config: unknown }> : [];
    const nodeIdMap = new Map<string, string>();
    for (const n of nodes) {
      const nodeId = n.id ?? uuidv4();
      nodeIdMap.set(n.id ?? nodeId, nodeId);
      db.prepare(`INSERT INTO automation_nodes (id, flow_id, type, config) VALUES (?, ?, ?, ?)`)
        .run(nodeId, id, n.type, JSON.stringify(n.config ?? {}));
    }
    const edges = Array.isArray(req.body?.edges) ? req.body.edges as Array<{ from: string; to: string; label?: string }> : [];
    for (const e of edges) {
      const fromId = nodeIdMap.get(e.from);
      const toId = nodeIdMap.get(e.to);
      if (!fromId || !toId) continue;
      db.prepare(`INSERT INTO automation_edges (id, flow_id, from_node_id, to_node_id, label) VALUES (?, ?, ?, ?, ?)`)
        .run(uuidv4(), id, fromId, toId, e.label ?? null);
    }
    logAuditAction(req, 'AUTOMATION_CREATED', 'automation_flow', id, name);
    res.json({ success: true, data: { id } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// PATCH /:id — rename / toggle / replace nodes+edges
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM automation_flows WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const { name, trigger_event, enabled, nodes, edges } = req.body ?? {};
    if (name || trigger_event || enabled !== undefined) {
      const fields: string[] = [];
      const params: unknown[] = [];
      if (name) { fields.push('name = ?'); params.push(name); }
      if (trigger_event) { fields.push('trigger_event = ?'); params.push(trigger_event); }
      if (enabled !== undefined) { fields.push('enabled = ?'); params.push(enabled ? 1 : 0); }
      if (fields.length) { params.push(req.params.id); db.prepare(`UPDATE automation_flows SET ${fields.join(', ')} WHERE id = ?`).run(...params); }
    }
    if (Array.isArray(nodes) && Array.isArray(edges)) {
      // Replace graph atomically: delete + re-insert. The DAG model is small.
      db.prepare('DELETE FROM automation_edges WHERE flow_id = ?').run(req.params.id);
      db.prepare('DELETE FROM automation_nodes WHERE flow_id = ?').run(req.params.id);
      const nodeIdMap = new Map<string, string>();
      for (const n of nodes as Array<{ id?: string; type: string; config: unknown }>) {
        const nodeId = n.id ?? uuidv4();
        nodeIdMap.set(n.id ?? nodeId, nodeId);
        db.prepare(`INSERT INTO automation_nodes (id, flow_id, type, config) VALUES (?, ?, ?, ?)`)
          .run(nodeId, req.params.id, n.type, JSON.stringify(n.config ?? {}));
      }
      for (const e of edges as Array<{ from: string; to: string; label?: string }>) {
        const fromId = nodeIdMap.get(e.from);
        const toId = nodeIdMap.get(e.to);
        if (!fromId || !toId) continue;
        db.prepare(`INSERT INTO automation_edges (id, flow_id, from_node_id, to_node_id, label) VALUES (?, ?, ?, ?, ?)`)
          .run(uuidv4(), req.params.id, fromId, toId, e.label ?? null);
      }
    }
    logAuditAction(req, 'AUTOMATION_UPDATED', 'automation_flow', req.params.id, JSON.stringify({ name, trigger_event, enabled, nodeCount: Array.isArray(nodes) ? nodes.length : 0 }));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// DELETE /:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM automation_flows WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM automation_edges WHERE flow_id = ?').run(req.params.id);
    db.prepare('DELETE FROM automation_nodes WHERE flow_id = ?').run(req.params.id);
    db.prepare('DELETE FROM automation_flows WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'AUTOMATION_DELETED', 'automation_flow', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// GET /:id/executions — recent runs
router.get('/:id/executions', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM automation_flows WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const rows = db.prepare(`
      SELECT id, customer_id, conversation_id, status, started_at, completed_at
      FROM automation_executions WHERE flow_id = ? ORDER BY started_at DESC LIMIT 50
    `).all(req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
