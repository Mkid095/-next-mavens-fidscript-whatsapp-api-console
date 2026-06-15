// =============================================================================
// AppProviders — the data-layer context root (§16).
// Mounts once near the React tree root. Exposes the API client + data event bus
// to descendants via useAppData(). Realtime SSE listeners can dispatch into
// dataEvents from within this provider's lifecycle.
// =============================================================================

import { createContext, useContext, type ReactNode } from 'react';
import { API_BASE_URL } from '../api/client.js';
import { dataEvents, type PlatformEventType } from '../events.js';
import { platformApi } from '../api/platform.js';

interface AppDataValue {
  apiBaseUrl: string;
  /** Emit a realtime event onto the frontend bus (called by SSE listeners) */
  emit: (type: PlatformEventType, payload: Record<string, unknown>) => void;
  /** Subscribe to the realtime bus */
  on: typeof dataEvents.on;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const value: AppDataValue = {
    apiBaseUrl: API_BASE_URL,
    emit: (type, payload) => dataEvents.emit({ type, payload }),
    on: (type, handler) => dataEvents.on(type, handler),
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    // Allow usage before the provider is mounted (graceful during migration)
    return {
      apiBaseUrl: API_BASE_URL,
      emit: (type, payload) => dataEvents.emit({ type, payload }),
      on: (type, handler) => dataEvents.on(type, handler),
    };
  }
  return ctx;
}

// Re-export the platform API through the provider surface for convenience
export { platformApi };
