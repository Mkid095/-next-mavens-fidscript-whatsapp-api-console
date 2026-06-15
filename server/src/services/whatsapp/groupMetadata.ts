import { callEvolutionAPI } from '../../utils/evolution.js';

// =============================================================================
// Group metadata cache (in-memory, 1h TTL) — proxies Evolution /group/find.
// Fixes the inbox UX gap: group chats previously showed raw JIDs instead of
// the group's subject. Cached per-process to avoid hammering Evolution.
// =============================================================================

interface GroupInfo {
  subject: string;
  size: number;
  owner: string | null;
  cachedAt: number;
}

const CACHE = new Map<string, GroupInfo>();
const TTL_MS = 60 * 60 * 1000;

function isFresh(info: GroupInfo): boolean {
  return Date.now() - info.cachedAt < TTL_MS;
}

/** Fetch group info from Evolution, mapping a few common payload shapes. */
async function fetchFromEvolution(chatId: string): Promise<GroupInfo> {
  const evo = await callEvolutionAPI('POST', '/group/findGroupInfos', { groupJid: chatId });
  // Evolution returns either an array or an object — be defensive
  const arr = Array.isArray(evo) ? evo : (Array.isArray((evo as { groups?: unknown[] }).groups) ? (evo as { groups: Record<string, unknown>[] }).groups : []);
  const row = arr.find((g) => g.id === chatId) || arr[0] || {};
  const subject = String((row as Record<string, unknown>).subject ?? '');
  const size = Number((row as Record<string, unknown>).size ?? 0);
  const owner = ((row as Record<string, unknown>).owner as string | undefined) ?? null;
  return { subject, size, owner, cachedAt: Date.now() };
}

export async function getGroupInfo(chatId: string): Promise<GroupInfo> {
  const cached = CACHE.get(chatId);
  if (cached && isFresh(cached)) return cached;
  try {
    const fresh = await fetchFromEvolution(chatId);
    CACHE.set(chatId, fresh);
    return fresh;
  } catch (err) {
    // On failure, return whatever's cached (even stale) so the UI still has something
    if (cached) return cached;
    return { subject: '', size: 0, owner: null, cachedAt: Date.now() };
  }
}

/** Warm the cache (used by the webhook when a group message first arrives). */
export async function warmGroupCache(chatId: string): Promise<void> {
  const cached = CACHE.get(chatId);
  if (cached && isFresh(cached)) return;
  try {
    CACHE.set(chatId, await fetchFromEvolution(chatId));
  } catch { /* best-effort */ }
}
