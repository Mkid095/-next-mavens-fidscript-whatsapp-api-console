// =============================================================================
// Data Layer - frontend event bus (§16, P4)
// A tiny typed emitter that bridges SSE pushes to data hooks.
// SSE listeners (useInstanceSSE etc.) call dataEvents.emit(...); hooks subscribe
// via useDataEvent. This mirrors the backend domain event catalog (a subset that
// crosses the wire over SSE). Decouples realtime transport from consumers.
// =============================================================================

export type PlatformEventType =
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'presence'
  | 'connection.state_change'
  | 'conversation.created'
  | 'conversation.assigned'
  | 'conversation.priority_changed'
  | 'conversation.status_changed'
  | 'customer.created'
  | 'customer.tagged'
  | 'ai.reply.generated'
  | 'ai.handoff_requested'
  | 'ai.state_changed'
  | 'ai.override_changed';

export interface PlatformEvent {
  type: PlatformEventType;
  payload: Record<string, unknown>;
}

type Handler = (event: PlatformEvent) => void;

class DataEventBus {
  private handlers = new Map<PlatformEventType | '*', Set<Handler>>();

  on(type: PlatformEventType | '*', handler: Handler): () => void {
    let set = this.handlers.get(type);
    if (!set) { set = new Set(); this.handlers.set(type, set); }
    set.add(handler);
    return () => set!.delete(handler);
  }

  emit(event: PlatformEvent): void {
    // Wildcard listeners receive everything
    this.handlers.get('*')?.forEach(h => {
      try { h(event); } catch { /* listener error must not break others */ }
    });
    this.handlers.get(event.type)?.forEach(h => {
      try { h(event); } catch { /* ignore */ }
    });
  }
}

// Singleton bus - the one realtime dispatch point for the frontend
export const dataEvents = new DataEventBus();

// Convenience: emit from a raw SSE event name + data blob
export function emitDataEvent(type: PlatformEventType, payload: Record<string, unknown>): void {
  dataEvents.emit({ type, payload });
}
