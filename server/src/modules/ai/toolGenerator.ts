/**
 * toolGenerator.ts — auto-generate tools from OpenAPI specs or database schemas.
 *
 * Two modes:
 *   1. OpenAPI import — parse a 3.x spec, create one tool per endpoint
 *   2. Schema import — parse table definitions, create CRUD tools per table
 *
 * This eliminates the #1 friction: manual tool creation. A user connects
 * their system, uploads the spec/schema, and gets working tools instantly.
 */

export interface GeneratedTool {
  name: string;
  description: string;
  type: 'lookup' | 'search' | 'query' | 'action';
  parameters_json: string;
  executor_json: string;
}

// ── OpenAPI import ──────────────────────────────────────────────────────────

interface OpenApiSpec {
  openapi?: string;
  paths?: Record<string, Record<string, OpenApiOperation>>;
  servers?: Array<{ url: string }>;
  info?: { title?: string };
}

interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean; schema?: { type?: string }; description?: string }>;
  requestBody?: {
    content?: Record<string, { schema?: { $ref?: string; properties?: Record<string, { type?: string; description?: string }> } }>;
  };
  tags?: string[];
}

/** Derive a tool name from an OpenAPI operation. */
function toolNameFromOperation(path: string, method: string, op: OpenApiOperation): string {
  if (op.operationId) {
    return op.operationId
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .slice(0, 60);
  }
  // Derive from path: /api/products/{id} GET → get_product
  const segments = path.split('/').filter((s) => s && !s.startsWith('{'));
  const last = segments[segments.length - 1] ?? 'resource';
  const singular = last.endsWith('s') ? last.slice(0, -1) : last;
  const verb = method === 'GET' ? (path.includes('{') ? 'get' : 'list') : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';
  return `${verb}_${singular}`.toLowerCase();
}

/** Build a JSON Schema for the tool parameters from OpenAPI operation params + body. */
function buildParametersFromOperation(op: OpenApiOperation): Record<string, unknown> {
  const properties: Record<string, { type: string; description?: string }> = {};
  const required: string[] = [];

  // Path + query params
  for (const param of op.parameters ?? []) {
    properties[param.name] = {
      type: param.schema?.type ?? 'string',
      ...(param.description ? { description: param.description } : {}),
    };
    if (param.required) required.push(param.name);
  }

  // Request body properties (first content type)
  const bodySchema = op.requestBody?.content?.['application/json']?.schema;
  if (bodySchema?.properties) {
    for (const [key, val] of Object.entries(bodySchema.properties)) {
      if (!properties[key]) {
        properties[key] = {
          type: val.type ?? 'string',
          ...(val.description ? { description: val.description } : {}),
        };
      }
    }
  }

  return { type: 'object', properties, ...(required.length ? { required } : {}) };
}

/** Parse an OpenAPI spec and generate tools. */
export function generateFromOpenApi(specJson: string, baseUrl?: string): { tools: GeneratedTool[]; serverUrl: string | null } {
  const spec = JSON.parse(specJson) as OpenApiSpec;
  const serverUrl = baseUrl ?? spec.servers?.[0]?.url ?? null;
  const tools: GeneratedTool[] = [];

  if (!spec.paths) return { tools, serverUrl };

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const upperMethod = method.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod)) continue;

      const name = toolNameFromOperation(path, upperMethod, op);
      const type: GeneratedTool['type'] = upperMethod === 'GET' ? 'query' : 'action';
      const parameters = buildParametersFromOperation(op);
      const desc = op.summary ?? op.description ?? `${upperMethod} ${path}`;

      // Build executor config
      const hasPathParam = path.includes('{');
      const executor: Record<string, unknown> = {};
      if (serverUrl) {
        executor.endpoint = `${serverUrl.replace(/\/$/, '')}${path}`;
      }
      executor.method = upperMethod;
      if (hasPathParam) {
        executor.pathTemplate = `${serverUrl?.replace(/\/$/, '') ?? ''}${path}`;
        executor.endpoint = undefined; // use pathTemplate instead
      }

      tools.push({
        name,
        description: desc.slice(0, 500),
        type,
        parameters_json: JSON.stringify(parameters),
        executor_json: JSON.stringify(executor),
      });
    }
  }

  return { tools, serverUrl };
}

// ── Schema import ──────────────────────────────────────────────────────────

interface SchemaInput {
  tables: Array<{
    name: string;
    columns: Array<{ name: string; type: string; primary_key?: boolean }>;
    searchable?: string[]; // column names to include in free-text search
  }>;
}

function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('ses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** Parse a schema definition and generate CRUD tools per table. */
export function generateFromSchema(schemaJson: string): GeneratedTool[] {
  const schema = JSON.parse(schemaJson) as SchemaInput;
  const tools: GeneratedTool[] = [];

  for (const table of schema.tables) {
    const singular = singularize(table.name);
    const pk = table.columns.find((c) => c.primary_key) ?? table.columns[0];
    const pkName = pk?.name ?? 'id';
    const searchable = table.searchable ?? table.columns.map((c) => c.name);

    // lookup_<table> — fetch by primary key
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

    // search_<table> — free-text search
    const searchProps: Record<string, { type: string; description: string }> = {};
    for (const col of searchable) {
      searchProps[col] = { type: 'string', description: `Filter by ${col}` };
    }
    searchProps.query = { type: 'string', description: `Free-text search across ${table.name}` };
    tools.push({
      name: `search_${table.name}`,
      description: `Search ${table.name} by free-text query or specific fields. Returns up to 10 matching records with all columns: ${table.columns.map((c) => c.name).join(', ')}.`,
      type: 'search',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: searchProps,
      }),
      executor_json: '{}',
    });
  }

  return tools;
}