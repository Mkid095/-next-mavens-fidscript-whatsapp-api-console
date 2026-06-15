import { EventEmitter } from 'events';
import type { DomainEventType, DomainEventPayload } from './catalog.js';

// =============================================================================
// EventBus interface — Phase 2: InProcessBus. Reserved: RedisBus, KafkaBus, NatsBus.
// Nothing in the codebase calls EventEmitter directly — only bus().
// =============================================================================

export interface EventBus {
  emit<T extends DomainEventType>(type: T, payload: DomainEventPayload): Promise<void>;
  subscribe<T extends DomainEventType>(
    type: T | '*',
    handler: (payload: DomainEventPayload) => void | Promise<void>
  ): () => void;
}

// =============================================================================
// InProcessBus — Node EventEmitter wrapper, singleton
// =============================================================================

class InProcessBusImpl implements EventBus {
  private emitter = new EventEmitter();
  // Raise limit for high-event-volume workloads (subscribers × async handlers)
  private emitterMaxListeners = 50;

  async emit<T extends DomainEventType>(type: T, payload: DomainEventPayload): Promise<void> {
    this.emitter.emit(type, payload);
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

// Singleton — replaced by RedisBus/KafkaBus/NatsBus in later phases
let _bus: EventBus | null = null;

export function bus(): EventBus {
  if (!_bus) {
    _bus = new InProcessBusImpl();
  }
  return _bus;
}

// Expose reset for testing only (not used in production)
export function _resetBus(): void {
  _bus = null;
}
