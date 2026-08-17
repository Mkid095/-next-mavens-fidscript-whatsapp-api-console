import { bus } from '../events/index.js';
import { upsertMetric, ensureMetricRollupsTable, type MetricType, type Period } from './rollups.js';
import type { DomainEventPayload } from '../events/index.js';

// =============================================================================
// AnalyticsProjector - one per domain, registered at boot.
// Metric catalog: messages_received/sent, conversations_created/resolved,
// sla_breached, campaign_sent/delivered/failed, ai_replies_generated,
// ai_handoffs_requested, automation_flows_started/completed,
// integration_events_synced.
// =============================================================================

export interface AnalyticsProjector {
  handles: string[];
  // eventType is the bus event type (known at subscribe time); it is NOT a
  // field on the payload, so projectors must branch on this param, not on a
  // payload field.
  project(payload: DomainEventPayload, wsId: string, eventType: string): void;
}

function p(payload: DomainEventPayload): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

function byConv(payload: DomainEventPayload): string | null {
  const r = p(payload);
  return r.conversationId ? String(r.conversationId) : null;
}

function byEntity(payload: DomainEventPayload, field: string): string | null {
  const r = p(payload);
  return r[field] ? String(r[field]) : null;
}

const PERIODS_ALL: Period[] = ['hour', 'day', 'week', 'month'];
const PERIODS_DAY_UP: Period[] = ['day', 'week', 'month'];

// ---------------------------------------------------------------------------
// MessageProjector
// ---------------------------------------------------------------------------

const messageProjector: AnalyticsProjector = {
  handles: ['message.received', 'message.sent', 'message.failed'],

  project(payload, wsId, eventType) {
    const convId = byConv(payload);
    const kind: MetricType | null =
      eventType === 'message.received' ? 'messages_received'
      : eventType === 'message.sent' ? 'messages_sent'
      : null;
    if (!kind) return;
    const extra = convId ? { conversationId: convId } : undefined;
    PERIODS_ALL.forEach(period => {
      upsertMetric(wsId, kind, 'message', convId, period, 1, extra);
    });
  },
};

// ---------------------------------------------------------------------------
// ConversationProjector
// ---------------------------------------------------------------------------

const conversationProjector: AnalyticsProjector = {
  handles: ['conversation.created', 'conversation.status_changed'],

  project(payload, wsId, eventType) {
    const r = p(payload);
    const convId = byConv(payload);

    if (eventType === 'conversation.created') {
      PERIODS_DAY_UP.forEach(period => {
        upsertMetric(wsId, 'conversations_created', 'conversation', convId, period, 1);
      });
    }

    if (eventType === 'conversation.status_changed' && r.status === 'resolved') {
      PERIODS_DAY_UP.forEach(period => {
        upsertMetric(wsId, 'conversations_resolved', 'conversation', convId, period, 1);
      });
    }
  },
};

// ---------------------------------------------------------------------------
// SLAProjector
// ---------------------------------------------------------------------------

const slaProjector: AnalyticsProjector = {
  handles: ['sla.breached'],

  project(payload, wsId) {
    const r = p(payload);
    const convId = byConv(payload);
    PERIODS_DAY_UP.forEach(period => {
      upsertMetric(wsId, 'sla_breached', 'conversation', convId, period, 1, {
        kind: r.kind,
        policyId: r.policyId,
      });
    });
  },
};

// ---------------------------------------------------------------------------
// CampaignProjector
// ---------------------------------------------------------------------------

const campaignProjector: AnalyticsProjector = {
  handles: ['campaign.started', 'campaign.completed'],

  project(payload, wsId, eventType) {
    const r = p(payload);
    const campaignId = byEntity(payload, 'campaignId');
    const stats = r.stats as { sent?: number; delivered?: number; failed?: number; totalRecipients?: number } | undefined;

    if (eventType === 'campaign.started') {
      upsertMetric(wsId, 'campaign_sent', 'campaign', campaignId, 'day', stats?.totalRecipients ?? 0);
    }
    if (eventType === 'campaign.completed' && stats) {
      upsertMetric(wsId, 'campaign_sent', 'campaign', campaignId, 'day', stats.sent ?? 0);
      upsertMetric(wsId, 'campaign_delivered', 'campaign', campaignId, 'day', stats.delivered ?? 0);
      upsertMetric(wsId, 'campaign_failed', 'campaign', campaignId, 'day', stats.failed ?? 0);
    }
  },
};

// ---------------------------------------------------------------------------
// AIProjector
// ---------------------------------------------------------------------------

const aiProjector: AnalyticsProjector = {
  handles: ['ai.reply.generated', 'ai.handoff_requested'],

  project(payload, wsId, eventType) {
    const r = p(payload);
    const convId = byConv(payload);
    const metric: MetricType = eventType === 'ai.reply.generated'
      ? 'ai_replies_generated'
      : 'ai_handoffs_requested';
    upsertMetric(wsId, metric, 'conversation', convId, 'day', 1, {
      agentId: r.agentId,
      confidence: r.confidence,
    });
  },
};

// ---------------------------------------------------------------------------
// AutomationProjector
// ---------------------------------------------------------------------------

const automationProjector: AnalyticsProjector = {
  handles: ['flow.started', 'flow.completed'],

  project(payload, wsId, eventType) {
    const flowId = byEntity(payload, 'flowId');
    const metric: MetricType = eventType === 'flow.started'
      ? 'automation_flows_started'
      : 'automation_flows_completed';
    upsertMetric(wsId, metric, 'automation_flow', flowId, 'day', 1);
  },
};

// ---------------------------------------------------------------------------
// IntegrationProjector
// ---------------------------------------------------------------------------

const integrationProjector: AnalyticsProjector = {
  handles: ['integration.synced'],

  project(payload, wsId) {
    const r = p(payload);
    const integrationId = byEntity(payload, 'integrationId');
    upsertMetric(wsId, 'integration_events_synced', 'integration', integrationId, 'day',
      Number(r.eventCount ?? 0), { connector: r.connector });
  },
};

// ---------------------------------------------------------------------------
// All projectors
// ---------------------------------------------------------------------------

export const ALL_PROJECTORS: AnalyticsProjector[] = [
  messageProjector,
  conversationProjector,
  slaProjector,
  campaignProjector,
  aiProjector,
  automationProjector,
  integrationProjector,
];

export function registerAnalyticsProjectors(): void {
  ensureMetricRollupsTable();

  ALL_PROJECTORS.forEach(projector => {
    projector.handles.forEach(type => {
      bus().subscribe(type as never, (payload: DomainEventPayload) => {
        // workspaceId is stamped onto the payload envelope by dispatch.emit()
        const r = p(payload);
        const wsId = String(r.workspaceId ?? '');
        if (!wsId) return;
        try {
          projector.project(payload, wsId, type);
        } catch (err) {
          console.error(`[analytics.${type}] failed:`, err);
        }
      });
    });
  });
}
