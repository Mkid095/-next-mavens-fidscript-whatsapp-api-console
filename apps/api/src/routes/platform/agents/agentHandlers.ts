/**
 * Agent route handlers
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../../middleware/auth.js';
import { logAuditAction } from '../../../utils/audit.js';
import { canAgent, getAgentPermissions, grantAgentPermission, listAgentActions } from '../../../modules/ai/index.js';
import { dispatchAiStateChanged, dispatchAiHandoffRequested } from '../../../modules/platform/events/index.js';
import db from '../../../database.js';

// =============================================================================
// /api/platform/agents — Phase 4 agent registry + governance (§10).
// Workspace-scoped. Agents live in ai_agents; permissions in agent_permissions.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }

// GET / — list agents + their allowed actions
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, name, description, model, default_action_set, enabled, created_at
      FROM ai_agents WHERE workspace_id = ? ORDER BY created_at DESC
    `).all(wsId(req));
    const agents = (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      description: r.description ? String(r.description) : null,
      model: r.model ? String(r.model) : null,
      default_action_set: r.default_action_set ? String(r.default_action_set) : null,
      enabled: Boolean(r.enabled),
      created_at: String(r.created_at),
      permissions: getAgentPermissions(String(r.id)),
    }));
    res.json({ success: true, data: { agents, action_catalog: listAgentActions() } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const name = ((req.body?.name as string) || '').trim();
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO ai_agents (id, workspace_id, name, description, model, triggers, default_action_set, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, wsId(req), name,
      (req.body?.description as string) ?? null,
      (req.body?.model as string) ?? null,
      JSON.stringify(req.body?.triggers ?? []),
      JSON.stringify(req.body?.default_action_set ?? []),
      req.body?.enabled === false ? 0 : 1,
    );
    logAuditAction(req, 'AGENT_CREATED', 'ai_agent', id, name);
    res.json({ success: true, data: { id } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_agents WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const fields: string[] = [];
    const params: unknown[] = [];
    for (const k of ['name', 'description', 'model', 'triggers', 'default_action_set'] as const) {
      if (req.body?.[k] !== undefined) { fields.push(`${k} = ?`); params.push(typeof req.body[k] === 'string' ? req.body[k] : JSON.stringify(req.body[k])); }
    }
    if (req.body?.enabled !== undefined) { fields.push('enabled = ?'); params.push(req.body.enabled ? 1 : 0); }
    if (fields.length) {
      params.push(req.params.id);
      db.prepare(`UPDATE ai_agents SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }
    logAuditAction(req, 'AGENT_UPDATED', 'ai_agent', req.params.id, JSON.stringify(req.body));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_agents WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM agent_permissions WHERE agent_id = ?').run(req.params.id);
    db.prepare('DELETE FROM ai_agents WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'AGENT_DELETED', 'ai_agent', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- Permissions -----------------------------------------------------------
router.get('/:id/permissions', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_agents WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: { granted: getAgentPermissions(req.params.id), catalog: listAgentActions() } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/:id/permissions', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_agents WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const action = (req.body?.action as string) ?? '';
    if (!listAgentActions().includes(action)) { res.status(400).json({ success: false, error: 'unknown action' }); return; }
    grantAgentPermission({ workspaceId: wsId(req), userId: wsId(req), roleId: 'role_0', perms: ['*'] } as never, req.params.id, action);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/:id/permissions/:action', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_agents WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM agent_permissions WHERE agent_id = ? AND action = ?').run(req.params.id, req.params.action);
    logAuditAction(req, 'AGENT_PERMISSION_REVOKED', 'ai_agent', req.params.id, req.params.action);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- canAgent test seam (exposed for the UI's "check" affordance) ---------
router.post('/:id/can', (req: Request, res: Response) => {
  try {
    const action = (req.body?.action as string) ?? '';
    const allowed = canAgent(req.params.id, action, { workspaceId: wsId(req), userId: wsId(req), roleId: 'role_0', perms: ['*'] } as never);
    res.json({ success: true, data: { allowed } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- Handoff (manual) ------------------------------------------------------
router.post('/handoff', (req: Request, res: Response) => {
  try {
    const { conversation_id, state, reason } = req.body ?? {};
    if (!conversation_id || !state) { res.status(400).json({ success: false, error: 'conversation_id and state required' }); return; }
    const owned = db.prepare('SELECT 1 FROM conversations WHERE id = ? AND workspace_id = ?').get(conversation_id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('UPDATE conversations SET ai_state = ? WHERE id = ?').run(state, conversation_id);
    logAuditAction(req, 'AI_HANDOFF', 'conversation', conversation_id, `${state}${reason ? ' - ' + reason : ''}`);
    const ctx = { workspaceId: wsId(req), actorUserId: wsId(req) };
    dispatchAiStateChanged(ctx, { conversationId: conversation_id, state, byUserId: wsId(req) }).catch(() => {});
    if (state === 'escalated' || state === 'human_active') {
      dispatchAiHandoffRequested(ctx, {
        agentId: 'sys_human',
        conversationId: conversation_id,
        reason: reason || 'manual handoff',
        confidence: 0,
      }).catch(() => {});
    }
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
