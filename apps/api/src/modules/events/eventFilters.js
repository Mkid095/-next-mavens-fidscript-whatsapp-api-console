// Event filtering logic for subscription matching.
// Currently a placeholder — bus.subscribe() receives raw payloads and
// filters in the subscriber callback. Extracted here so future per-event
// filter predicates can live alongside the catalog.

// Predicate shape: return true to allow the event through.
export type EventFilter = (payload: Record<string, unknown>) => boolean;

// Stub filters — replace with real predicates per event type.
export function matchEventType(eventType: string): EventFilter {
  return (payload) => String(payload.event ?? '') === eventType;
}

export function matchWorkspace(workspaceId: string): EventFilter {
  return (payload) => String(payload.workspaceId ?? '') === workspaceId;
}
