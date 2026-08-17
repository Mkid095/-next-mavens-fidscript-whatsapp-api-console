import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { DomainEventType, DomainEventPayload } from './catalog.js';

// =============================================================================
// EventBus interface - Phase 2: InProcessBus. Reserved: RedisBus, KafkaBus, NatsBus.
// Nothing in the codebase calls EventEmitter directly - only bus().
// =============================================================================
//
// Wildcard subscribers (registered with type = '*') receive an envelope:
//   { __type, __id, __workspaceId, __actorUserId, ...payload }
// so fan-out subscribers (audit, webhooks) can route by type without
// needing to know every event name up-front. Per-type subscribers receive
// the raw payload unchanged.
// =============================================================================

export interface EventBusEmitMeta {
  id?: string;
  workspaceId?: string | null;
  actorUserId?: string | null;
}

export interface EventBus {
  emit<T extends DomainEventType>(
    type: T,
    payload: DomainEventPayload,
    meta?: EventBusEmitMeta
  ): Promise<void>;
  subscribe<T extends DomainEventType>(
    type: T | '*',
    handler: (payload: DomainEventPayload) => void | Promise<void>
  ): () => void;
}

interface WildcardEnvelope {
  __type: DomainEventType;
  __id: string;
  __workspaceId: string | null;
  __actorUserId: string | null;
  [key: string]: unknown;
}

class InProcessBusImpl implements EventBus {
  private emitter = new EventEmitter();
  private emitterMaxListeners = 100;

  async emit<T extends DomainEventType>(
    type: T,
    payload: DomainEventPayload,
    meta?: EventBusEmitMeta
  ): Promise<void> {
    this.emitter.emit(type, payload);

    const p = payload as unknown as Record<string, unknown>;
    const workspaceId =
      meta?.workspaceId !== undefined
        ? meta.workspaceId
        : ((p.workspaceId as string | null | undefined) ?? null);
    const actorUserId =
      meta?.actorUserId !== undefined
        ? meta.actorUserId
        : ((p.actorUserId as string | null | undefined) ?? null);

    const envelope: WildcardEnvelope = {
      ...(payload as unknown as Record<string, unknown>),
      __type: type,
      __id: meta?.id ?? uuidv4(),
      __workspaceId: workspaceId,
      __actorUserId: actorUserId,
    };
    this.emitter.emit('*', envelope);
  }

  subscribe<T extends DomainEventType>(
    type: T | '*',
    handler: (payload: DomainEventPayload) => void | Promise<void>
  ): () => void {
    this.emitter.setMaxListeners(this.emitterMaxListeners);
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }
}

let _bus: EventBus | null = null;

export function bus(): EventBus {
  if (!_bus) {
    _bus = new InProcessBusImpl();
  }
  return _bus;
}

export function _resetBus(): void {
  _bus = null;
}
