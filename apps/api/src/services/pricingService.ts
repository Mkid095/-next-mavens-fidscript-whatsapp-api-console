/**
 * pricingService - central read path for all token costs.
 *
 * All runtime cost decisions (shared.ts, billingService.ts, billing.ts)
 * must go through this service, NOT hardcoded constants.
 *
 * Admin write path: admin routes update token_action_costs row,
 * then call pricingCacheInvalidate() so subsequent reads reflect the change.
 */
import db from '../database/index.js';

// In-memory cache - invalidated on admin write. Fast path for hot reads.
interface CostEntry {
  tokenCost: number;
  category: 'whatsapp' | 'ai';
}
const _cache = new Map<string, CostEntry>();
let _cacheDirty = true;

function _reloadCache(): void {
  _cache.clear();
  try {
    const rows = db.prepare(
      'SELECT action, token_cost, category FROM token_action_costs WHERE is_active = 1'
    ).all() as Array<{ action: string; token_cost: number; category: string }>;
    for (const row of rows) {
      _cache.set(row.action, {
        tokenCost: row.token_cost,
        category: row.category as 'whatsapp' | 'ai',
      });
    }
  } catch {
    // DB not ready yet - skip cache warm
  }
  _cacheDirty = false;
}

function _ensureCache(): void {
  if (_cacheDirty) _reloadCache();
}

/**
 * Get the token cost for a single action.
 * Returns 1 as default if the action hasn't been configured.
 */
export function getCost(action: string): number {
  _ensureCache();
  return _cache.get(action)?.tokenCost ?? 1;
}

/**
 * Get all costs for a category in one call.
 * Useful for admin UI listings.
 */
export function getCostsByCategory(category: 'whatsapp' | 'ai'): Array<{
  action: string; displayName: string; tokenCost: number; description: string;
}> {
  _ensureCache();
  const rows = db.prepare(
    'SELECT action, display_name, token_cost, description FROM token_action_costs WHERE category = ? AND is_active = 1'
  ).all(category) as Array<{ action: string; display_name: string; token_cost: number; description: string }>;
  return rows.map(r => ({
    action: r.action,
    displayName: r.display_name,
    tokenCost: r.token_cost,
    description: r.description,
  }));
}

/**
 * Get ALL active costs. Use sparingly - for admin panels, not hot paths.
 */
export function getAllCosts(): Array<{
  id: string; action: string; displayName: string;
  tokenCost: number; category: string; description: string; isActive: number;
}> {
  const rows = db.prepare(
    'SELECT id, action, display_name, token_cost, category, description, is_active FROM token_action_costs ORDER BY category, action'
  ).all() as Array<{
    id: string; action: string; display_name: string;
    token_cost: number; category: string; description: string; is_active: number;
  }>;
  return rows.map(r => ({
    id: r.id,
    action: r.action,
    displayName: r.display_name,
    tokenCost: r.token_cost,
    category: r.category,
    description: r.description,
    isActive: r.is_active,
  }));
}

/** Update a single cost. Returns true if a row was updated. */
export function updateCost(id: string, tokenCost: number): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(
    'UPDATE token_action_costs SET token_cost = ?, updated_at = ? WHERE id = ?'
  ).run(tokenCost, now, id);
  if ((result as { changes: number }).changes > 0) {
    _cacheDirty = true;
    return true;
  }
  return false;
}

/** Toggle active status */
export function setCostActive(id: string, isActive: boolean): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(
    'UPDATE token_action_costs SET is_active = ?, updated_at = ? WHERE id = ?'
  ).run(isActive ? 1 : 0, now, id);
  if ((result as { changes: number }).changes > 0) {
    _cacheDirty = true;
    return true;
  }
  return false;
}

/** Invalidate cache after a bulk write (called by admin routes) */
export function pricingCacheInvalidate(): void {
  _cacheDirty = true;
}

// Prewarm cache on first import
_reloadCache();
