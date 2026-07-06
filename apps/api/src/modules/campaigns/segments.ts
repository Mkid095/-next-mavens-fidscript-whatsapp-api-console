import db from '../../database.js';

// =============================================================================
// Segment filter resolver (§15.2).
// filter_json shape:
//   { logic: 'AND' | 'OR', rules: FilterRule[] }
//
// FilterRule shapes (discriminated by `field`):
//   { field: 'tag',       op: 'has_any_of' | 'has_all_of' | 'has_none_of', value: string[] }
//   { field: 'last_seen', op: 'within_days' | 'before_days' | 'never',     value?: number }
//   { field: 'created',   op: 'within_days' | 'before_days',                value: number }
//   { field: 'name',      op: 'contains' | 'equals' | 'starts_with',        value: string }
//   { field: 'channel',   op: 'is', value: 'whatsapp' }
//
// Resolver translates to a SQL query against the new `customers` model
// (workspace-scoped, has customer_tags + customer_identifiers for phone lookup).
// =============================================================================

export type FilterRule =
  | { field: 'tag'; op: 'has_any_of' | 'has_all_of' | 'has_none_of'; value: string[] }
  | { field: 'last_seen'; op: 'within_days' | 'before_days' | 'never'; value?: number }
  | { field: 'created'; op: 'within_days' | 'before_days'; value: number }
  | { field: 'name'; op: 'contains' | 'equals' | 'starts_with'; value: string }
  | { field: 'channel'; op: 'is'; value: 'whatsapp' | 'sms' | 'email' };

export interface Filter {
  logic: 'AND' | 'OR';
  rules: FilterRule[];
}

export interface ResolveResult {
  phones: string[];
  customer_count: number;
  computed_at: string;
}

const ISO_DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * ISO_DAY_MS).toISOString().slice(0, 19).replace('T', ' ');
}

/** Translate a single rule into a SQL fragment + params. Returns '' for rules that need no SQL. */
function ruleToSql(rule: FilterRule): { sql: string; params: unknown[] } {
  switch (rule.field) {
    case 'tag': {
      if (!Array.isArray(rule.value) || rule.value.length === 0) return { sql: '1=0', params: [] };
      if (rule.op === 'has_any_of') {
        const placeholders = rule.value.map(() => '?').join(',');
        return { sql: `EXISTS (SELECT 1 FROM customer_tags ct WHERE ct.customer_id = c.id AND ct.tag IN (${placeholders}))`, params: rule.value };
      }
      if (rule.op === 'has_all_of') {
        const parts = rule.value.map(() => `EXISTS (SELECT 1 FROM customer_tags ct WHERE ct.customer_id = c.id AND ct.tag = ?)`).join(' AND ');
        return { sql: `(${parts})`, params: rule.value };
      }
      // has_none_of
      const placeholders = rule.value.map(() => '?').join(',');
      return { sql: `NOT EXISTS (SELECT 1 FROM customer_tags ct WHERE ct.customer_id = c.id AND ct.tag IN (${placeholders}))`, params: rule.value };
    }
    case 'last_seen': {
      if (rule.op === 'never') return { sql: `(c.last_seen_at IS NULL OR c.last_seen_at = '')`, params: [] };
      const days = Math.max(0, Number(rule.value ?? 0));
      const cmp = rule.op === 'within_days' ? '>=' : '<';
      return { sql: `c.last_seen_at ${cmp} ?`, params: [isoDaysAgo(days)] };
    }
    case 'created': {
      const days = Math.max(0, Number(rule.value ?? 0));
      const cmp = rule.op === 'within_days' ? '>=' : '<';
      return { sql: `c.created_at ${cmp} ?`, params: [isoDaysAgo(days)] };
    }
    case 'name': {
      const v = String(rule.value ?? '');
      if (!v) return { sql: '1=1', params: [] };
      if (rule.op === 'equals') return { sql: 'c.display_name = ?', params: [v] };
      if (rule.op === 'starts_with') return { sql: 'c.display_name LIKE ?', params: [`${v}%`] };
      return { sql: 'c.display_name LIKE ?', params: [`%${v}%`] };
    }
    case 'channel': {
      return {
        sql: `EXISTS (SELECT 1 FROM customer_identifiers ci WHERE ci.customer_id = c.id AND ci.channel = ?)`,
        params: [rule.value],
      };
    }
  }
}

export function resolveSegment(filter: Filter, workspaceId: string, limit = 10000): ResolveResult {
  const validRules = (filter.rules || []).filter((r) => r && (r as { field?: string }).field);
  if (validRules.length === 0) return { phones: [], customer_count: 0, computed_at: new Date().toISOString() };

  const fragments: string[] = [];
  const params: unknown[] = [workspaceId];
  for (const r of validRules) {
    const { sql, params: rp } = ruleToSql(r);
    fragments.push(sql);
    params.push(...rp);
  }
  const joiner = filter.logic === 'OR' ? ' OR ' : ' AND ';
  const where = fragments.join(joiner);

  // Phone comes from the first whatsapp identifier (canonical).
  const rows = db.prepare(`
    SELECT c.id, c.display_name,
      (SELECT ci.value FROM customer_identifiers ci WHERE ci.customer_id = c.id AND ci.channel = 'whatsapp' ORDER BY ci.created_at ASC LIMIT 1) AS phone
    FROM customers c
    WHERE c.workspace_id = ? AND (${where})
    ORDER BY c.last_seen_at DESC NULLS LAST
    LIMIT ?
  `).all(...params, limit) as { id: string; display_name: string | null; phone: string | null }[];

  const phones = rows.map((r) => r.phone).filter((p): p is string => !!p);
  return { phones, customer_count: rows.length, computed_at: new Date().toISOString() };
}
