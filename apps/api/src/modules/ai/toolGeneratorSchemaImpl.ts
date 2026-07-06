/**
 * toolGenerator — schema import only.
 * @see toolGeneratorImpl.ts for OpenAPI import
 * @see toolGenerator.ts for the barrel
 */

interface SchemaInput {
  tables: Array<{
    name: string;
    columns: Array<{ name: string; type: string; primary_key?: boolean }>;
    searchable?: string[];
  }>;
  exclude_tables?: string[];
  include_tables?: string[];
}

const BLOCKED_TABLE_PATTERNS = [
  'session', 'password', 'api_key', 'secret', 'token', 'audit_log',
  'migration', 'schema', '__', 'knex', 'sequelize',
];

function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('ses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function generateFromSchema(schemaJson: string): import('./toolGeneratorImpl.js').GeneratedTool[] {
  const schema = JSON.parse(schemaJson) as SchemaInput;
  const tools: import('./toolGeneratorImpl.js').GeneratedTool[] = [];

  for (const table of schema.tables) {
    const tableNameLower = table.name.toLowerCase();
    if (schema.exclude_tables?.some((t) => t.toLowerCase() === tableNameLower)) continue;
    if (schema.include_tables && !schema.include_tables.some((t) => t.toLowerCase() === tableNameLower)) continue;
    if (BLOCKED_TABLE_PATTERNS.some((p) => tableNameLower.includes(p))) continue;

    const singular = singularize(table.name);
    const pk = table.columns.find((c) => c.primary_key) ?? table.columns[0];
    const pkName = pk?.name ?? 'id';
    const searchable = table.searchable ?? table.columns.map((c) => c.name);

    tools.push({
      name: `lookup_${singular}`,
      description: `Look up a single ${singular} record by ${pkName}. Returns the full record or null if not found.`,
      type: 'lookup',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: { [pkName]: { type: pk?.type ?? 'string', description: `The ${pkName} of the ${singular}` } },
        required: [pkName],
      }),
      executor_json: JSON.stringify({ keyField: pkName }),
    });

    const searchProps: Record<string, { type: string; description: string }> = {};
    for (const col of searchable) {
      searchProps[col] = { type: 'string', description: `Filter by ${col}` };
    }
    searchProps.query = { type: 'string', description: `Free-text search across ${table.name}` };
    tools.push({
      name: `search_${table.name}`,
      description: `Search ${table.name} by free-text query or specific fields.`,
      type: 'search',
      parameters_json: JSON.stringify({ type: 'object', properties: searchProps }),
      executor_json: '{}',
    });
  }

  return tools;
}
