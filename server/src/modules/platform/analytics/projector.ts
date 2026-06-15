import { bus } from '../events/bus.js';
import { upsertMetric, ensureMetricRollupsTable, type MetricType, type Period } from './rollups.js';
import type { DomainEventPayload } from '../events/catalog.js';

// =============================================================================
// AnalyticsProjector — one per domain, registered at boot.
// Metric catalog: messages_received/sent, conversations_created/resolved,
// sla_breached, campaign_sent/delivered/failed, ai_replies_generated,
// ai_handoffs_requested, automation_flows_started/completed,
// integration_events_synced.
// =============================================================================

export interface AnalyticsProjector {
  handles: string[];
  project(payload: DomainEventPayload, wsId: string): void;
}

function p(payload: DomainEventPayload): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

function byConv(payload: DomainEventPayload): string | null {
  const r = p(payload);
  return r.conversationId ? String(r.conversationId) : null;
}

function byCustomer(payload: DomainEventPayload): string | null {
  const r = p(payload);
  return r.customerId ? String(r.customerId) : null;
}

function byEntity(payload: DomainEventPayload, field: string): string | null {
  const r = p(payload);
  return r[field] ? String(r[field]) : null;
}

// ---------------------------------------------------------------------------
// MessageProjector
// ---------------------------------------------------------------------------

const messageProjector: AnalyticsProjector = {
  handles: ['message.received', 'message.sent', 'message.failed'],

  project(payload, wsId) {
    const r = p(payload);
    const convId = byConv(payload);
    const kind = r.type === 'message.received'
      ? 'messages_received'
      : r.type === 'message.sent'
        ? 'messages_sent'
        : null;
    if (!kind) return;
    const extra = convId ? { conversationId: convId } : undefined;
    (['hour', 'day', 'week', 'month'] as Period[]).forEach(period => {
      upsertMetric(wsId, kind as MetricType, 'message', convId, period, 1, extra);
    });
  },
};

// ---------------------------------------------------------------------------
// ConversationProjector
// ---------------------------------------------------------------------------

const conversationProjector: AnalyticsProjector = {
  handles: ['conversation.created', 'conversation.status_changed'],

  project(payload, wsId) {
    const r = p(payload);
    const convId = byConv(payload);

    if (r.type === 'conversation.created') {
      (['day', 'week', 'month'] as Period[]).forEach(period => {
        upsertMetric(wsId, 'conversations_created', 'conversation', convId, period, 1);
      });
    }

    if (r.type === 'conversation.status_changed' && r.status === 'resolved') {
      (['day', 'week', 'month'] as Period[]).forEach(period => {
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
    (['day', 'week', 'month'] as Period[]).forEach(period => {
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

  project(payload, wsId) {
    const r = p(payload);
    const campaignId = byEntity(payload, 'campaignId');
    const stats = r.stats as { sent?: number; delivered?: number; failed?: number; totalRecipients?: number } | undefined;

    if (r.type === 'campaign.started') {
      upsertMetric(wsId, 'campaign_sent', 'campaign', campaignId, 'day', stats?.totalRecipients ?? 0);
    }
    if (r.type === 'campaign.completed' && stats) {
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

  project(payload, wsId) {
    const r = p(payload);
    const convId = byConv(payload);
    const metric: MetricType = r.type === 'ai.reply.generated'
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

  project(payload, wsId) {
    const r = p(payload);
    const flowId = byEntity(payload, 'flowId');
    const metric: MetricType = r.type === 'flow.started'
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
        const r = p(payload);
        const wsId = String(r.workspaceId ?? r.customerId ?? '');
        if (!wsId) return;
        try {
          projector.project(payload, wsId);
        } catch (err) {
          console.error(`[analytics.${type}] failed:`, err);
        }
      });
    });
  });
}
