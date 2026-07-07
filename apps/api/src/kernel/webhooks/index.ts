// kernel/webhooks — replay protection helpers for inbound webhooks
export { isReplay, markDelivered, isStale, markOrReject } from './replayProtection.js';
