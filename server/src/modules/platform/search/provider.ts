import db from '../../../database.js';

// =============================================================================
// SearchProvider interface — Phase 2: SqliteFtsProvider.
// Reserved: MeilisearchProvider, TypesenseProvider, OpenSearchProvider.
// Swappable without touching the indexer or query UI.
// =============================================================================

export interface SearchHit {
  entityType: string;
  entityId: string;
  body: string;
  tags: string[];
  workspaceId: string;
}

export interface SearchProvider {
  index(
    wsId: string,
    entityType: string,
    entityId: string,
    body: string,
    tags?: string[]
  ): Promise<void>;
  remove(wsId: string, entityType: string, entityId: string): Promise<void>;
  query(
    wsId: string,
    q: string,
    opts?: { types?: string[]; limit?: number }
  ): Promise<SearchHit[]>;
}

// =============================================================================
// SqliteFtsProvider — FTS5 over search_index table
// Falls back to LIKE scan if FTS5 is unavailable (sql.js build variant).
// =============================================================================

function entityTypeMatch(hitType: string, filterTypes?: string[]): boolean {
  if (!filterTypes || filterTypes.length === 0) return true;
  return filterTypes.includes(hitType);
}

export const sqliteFtsProvider: SearchProvider = {
  async index(
    wsId: string,
    entityType: string,
    entityId: string,
    body: string,
    tags?: string[]
  ): Promise<void> {
    // Upsert: delete existing then insert new (simpler than UPDATE + FTS sync)
    db.prepare(
      'DELETE FROM search_index WHERE workspace_id = ? AND entity_type = ? AND entity_id = ?'
    ).run(wsId, entityType, entityId);

    db.prepare(`
      INSERT INTO search_index (id, workspace_id, entity_type, entity_id, body, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `${entityType}_${entityId}`,
      wsId,
      entityType,
      entityId,
      body,
      tags ? JSON.stringify(tags) : null,
      new Date().toISOString()
    );
  },

  async remove(wsId: string, entityType: string, entityId: string): Promise<void> {
    db.prepare(
      'DELETE FROM search_index WHERE workspace_id = ? AND entity_type = ? AND entity_id = ?'
    ).run(wsId, entityType, entityId);
  },

  async query(
    wsId: string,
    q: string,
    opts?: { types?: string[]; limit?: number }
  ): Promise<SearchHit[]> {
    const limit = opts?.limit ?? 20;
    const types = opts?.types;

    if (!q.trim()) return [];

    // Try FTS5 match first
    let rows: Record<string, unknown>[] = [];
    try {
      // FTS5: query the virtual table and join back to search_index for
      // the metadata columns. ORDER BY rank uses the FTS5 bm25 score.
      const ftsExists = db.prepare(
        `SELECT count(*) as n FROM sqlite_master WHERE type='table' AND name='search_index_fts'`
      ).get() as { n: number } | undefined;
      if (!ftsExists || ftsExists.n === 0) throw new Error('fts missing');

      rows = db.prepare(`
        SELECT si.entity_type, si.entity_id, si.body, si.tags, si.workspace_id
        FROM search_index_fts fts
        JOIN search_index si ON si.rowid = fts.rowid
        WHERE si.workspace_id = ?
          AND search_index_fts MATCH ?
          ${types?.length ? `AND si.entity_type IN (${types.map(() => '?').join(',')})` : ''}
        ORDER BY rank
        LIMIT ?
      `).all(wsId, `"${q.replace(/"/g, '""')}"`, ...(types ?? []), limit) as Record<string, unknown>[];
    } catch (_) {
      // FTS5 not available — fall back to LIKE scan
      rows = db.prepare(`
        SELECT entity_type, entity_id, body, tags, workspace_id
        FROM search_index
        WHERE workspace_id = ?
          AND (body LIKE ? OR tags LIKE ?)
          ${types?.length ? `AND entity_type IN (${types.map(() => '?').join(',')})` : ''}
        ORDER BY updated_at DESC
        LIMIT ?
      `).all(
        wsId,
        `%${q}%`, `%${q}%`,
        ...(types ?? []), limit
      ) as Record<string, unknown>[];
    }

    return rows
      .filter(r => entityTypeMatch(r.entity_type as string, types))
      .map(r => ({
        entityType: r.entity_type as string,
        entityId: r.entity_id as string,
        body: r.body as string,
        tags: r.tags ? JSON.parse(r.tags as string) : [],
        workspaceId: r.workspace_id as string,
      }));
  },
};
