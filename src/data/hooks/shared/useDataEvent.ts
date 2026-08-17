// =============================================================================
// useDataEvent - subscribe to the frontend data event bus (§16).
// Components/hooks react to realtime domain events pushed over SSE without
// knowing the transport. Returns the last event seen for the given type.
// =============================================================================

import { useEffect, useState } from 'react';
import { dataEvents, type PlatformEventType, type PlatformEvent } from '../../events.js';

export function useDataEvent(type: PlatformEventType | '*'): PlatformEvent | null {
  const [event, setEvent] = useState<PlatformEvent | null>(null);

  useEffect(() => {
    const off = dataEvents.on(type, (e) => setEvent(e));
    return off;
  }, [type]);

  return event;
}

// Subscribe to multiple event types - fires a callback for any of them
export function useDataEvents(types: PlatformEventType[], onEvent: (e: PlatformEvent) => void): void {
  useEffect(() => {
    const offs = types.map((t) => dataEvents.on(t, onEvent));
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(','), onEvent]);
}
