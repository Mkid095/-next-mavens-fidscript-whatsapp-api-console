import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import db from '../database.js';

export function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id || 'system', action, entityType, entityId, details || null, req.ip);
}

export function logApiRequest(req: Request, instanceId: string | null, clientId: string | null, status: number, responseBody?: string) {
  db.prepare(`
    INSERT INTO api_logs (id, instance_id, client_id, method, endpoint, request_body, response_status, response_body, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    instanceId,
    clientId,
    req.method,
    req.path,
    JSON.stringify(req.body) || null,
    status,
    responseBody ? JSON.stringify(responseBody).substring(0, 1000) : null,
    req.ip,
    req.headers['user-agent']
  );
}
