// Shared refresh gate — coalesces bursts and enforces a minimum interval so the
// chat mirror stays under the 10/min per-client rate cap on the backend
// (and well under WhatsApp's ~80/min account limit). Module-level so the chat
// list and the open thread share the same throttle window — only one of them
// is the "active" target per refresh (chosen by MessagesPage), so a single
// SSE burst produces one backend call per window, not two.
//
// Rules:
//   - Calls within MIN_INTERVAL_MS of the last fire are deferred to a single
//     coalesced timer (latest fire in the window covers all pending callers).
//   - When the timer fires, every pending callback is invoked exactly once.
//   - Each caller therefore fires at most ceil(60 / MIN_INTERVAL_MS) per minute.

const MIN_INTERVAL_MS = 6000; // ~10/min cap; combined with 30s poll (2/min) ~12/min worst case
let lastFire = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const pending = new Set<() => void>();

export function scheduleRefresh(cb: () => void): void {
  const now = Date.now();
  if (now - lastFire >= MIN_INTERVAL_MS) {
    lastFire = now;
    cb();
    return;
  }
  pending.add(cb);
  if (pendingTimer) return;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    lastFire = Date.now();
    const cbs = [...pending];
    pending.clear();
    for (const fn of cbs) {
      try { fn(); } catch { /* listener errors must not break the gate */ }
    }
  }, MIN_INTERVAL_MS - (now - lastFire) + 100);
}

export function cancelPendingRefreshs(): void {
  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  pending.clear();
}