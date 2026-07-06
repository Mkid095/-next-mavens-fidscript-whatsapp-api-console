import db from '../../../database.js';

// =============================================================================
// metric_rollups table + upsert helpers
// Projectors call upsertMetric() per event they handle.
// =============================================================================

export function ensureMetricRollupsTable(): void {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS metric_rollups (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      metric_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      period TEXT NOT NULL,
      period_start TEXT NOT NULL,
      value INTEGER DEFAULT 0,
      extra TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workspace_id, metric_type, entity_type, entity_id, period, period_start)
    )
  `).exec();
}

export type MetricType =
  | 'messages_received'
  | 'messages_sent'
  | 'conversations_created'
  | 'conversations_resolved'
  | 'sla_breached'
  | 'campaign_sent'
  | 'campaign_delivered'
  | 'campaign_failed'
  | 'ai_replies_generated'
  | 'ai_handoffs_requested'
  | 'automation_flows_started'
  | 'automation_flows_completed'
  | 'integration_events_synced';

export type Period = 'hour' | 'day' | 'week' | 'month';

function periodStart(period: Period, date: Date = new Date()): string {
  switch (period) {
    case 'hour':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(),
        date.getHours(), 0, 0, 0).toISOString();
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0] + 'T00:00:00.000Z';
    case 'week': {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0] + 'T00:00:00.000Z';
    }
    case 'month':
      return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0] + 'T00:00:00.000Z';
  }
}

export function upsertMetric(
  wsId: string,
  metricType: MetricType,
  entityType: string,
  entityId: string | null,
  period: Period,
  incrementBy = 1,
  extra?: Record<string, unknown>
): void {
  const start = periodStart(period);
  const id = `${wsId}_${metricType}_${entityType}_${entityId ?? 'global'}_${period}_${start}`;

  db.prepare(`
    INSERT INTO metric_rollups
      (id, workspace_id, metric_type, entity_type, entity_id, period, period_start, value, extra, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      value = value + excluded.value,
      extra = COALESCE(excluded.extra, extra),
      updated_at = excluded.updated_at
  `).run(
    id, wsId, metricType, entityType, entityId ?? null, period, start,
    incrementBy, extra ? JSON.stringify(extra) : null,
    new Date().toISOString()
  );
}
