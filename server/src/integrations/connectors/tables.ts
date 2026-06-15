import db from '../../database.js';

// =============================================================================
// Integration connector tables — integrations + integration_events
// Created via CREATE TABLE IF NOT EXISTS (existing from migrations.ts).
// This file provides typed helpers for connector operations.
// =============================================================================

export function getIntegration(
  workspaceId: string,
  connector: string
): { id: string; credentials_ref: string; status: string } | null {
  return (db.prepare(
    'SELECT id, credentials_ref, status FROM integrations WHERE workspace_id = ? AND connector = ?'
  ).get(workspaceId, connector) as { id: string; credentials_ref: string; status: string } | undefined) ?? null;
}

export function updateIntegrationStatus(
  integrationId: string,
  status: string
): void {
  db.prepare('UPDATE integrations SET status = ?, last_synced_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), integrationId);
}

export function logIntegrationEvent(
  integrationId: string,
  externalId: string,
  type: string,
  payload: Record<string, unknown>
): void {
  db.prepare(`
    INSERT INTO integration_events (id, integration_id, external_id, type, payload, ingested_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `ie_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    integrationId,
    externalId,
    type,
    JSON.stringify(payload),
    new Date().toISOString()
  );
}
