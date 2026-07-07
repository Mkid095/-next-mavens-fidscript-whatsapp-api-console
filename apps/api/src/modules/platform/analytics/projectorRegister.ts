/**
 * Analytics projector registration.
 * @see projectorImpl.ts for all projector definitions
 * @see projector.ts for the barrel
 */

import { bus } from '../events/index.js';
import { ensureMetricRollupsTable } from './rollups.js';
import { ALL_PROJECTORS } from './projectorImpl.js';
import type { DomainEventPayload } from '../events/index.js';

export function registerAnalyticsProjectors(): void {
  ensureMetricRollupsTable();

  ALL_PROJECTORS.forEach(projector => {
    projector.handles.forEach(type => {
      bus().subscribe(type as never, (payload: DomainEventPayload) => {
        const r = payload as unknown as Record<string, unknown>;
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
