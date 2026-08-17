// Platform Analytics module - public barrel
export { upsertMetric, ensureMetricRollupsTable } from './rollups.js';
export type { MetricType, Period } from './rollups.js';
export { registerAnalyticsProjectors, ALL_PROJECTORS } from './projector.js';
export type { AnalyticsProjector } from './projector.js';
