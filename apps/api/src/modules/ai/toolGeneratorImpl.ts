/**
 * toolGenerator — OpenAPI import only.
 * @see toolGeneratorSchemaImpl.ts for schema import
 * @see toolGenerator.ts for the barrel
 */

export interface GeneratedTool {
  name: string;
  description: string;
  type: 'lookup' | 'search' | 'query' | 'action';
  parameters_json: string;
  executor_json: string;
  requires_confirmation?: boolean;
}

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

function toolNameFromOperation(path: string, method: string, op: OpenApiOperation): string {
  if (op.operationId) {
    return op.operationId
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .slice(0, 60);
  }
  const segments = path.split('/').filter((s) => s && !s.startsWith('{'));
  const last = segments[segments.length - 1] ?? 'resource';
  const singular = last.endsWith('s') ? last.slice(0, -1) : last;
  const verb = method === 'GET' ? (path.includes('{') ? 'get' : 'list') : method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update';
  return `${verb}_${singular}`.toLowerCase();
}

function buildParametersFromOperation(op: OpenApiOperation): Record<string, unknown> {
  const properties: Record<string, { type: string; description?: string }> = {};
  const required: string[] = [];

  for (const param of op.parameters ?? []) {
    properties[param.name] = {
      type: param.schema?.type ?? 'string',
      ...(param.description ? { description: param.description } : {}),
    };
    if (param.required) required.push(param.name);
  }

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

      const hasPathParam = path.includes('{');
      const executor: Record<string, unknown> = {};
      if (serverUrl) {
        executor.endpoint = `${serverUrl.replace(/\/$/, '')}${path}`;
      }
      executor.method = upperMethod;
      if (hasPathParam) {
        executor.pathTemplate = `${serverUrl?.replace(/\/$/, '') ?? ''}${path}`;
        executor.endpoint = undefined;
      }

      const isDangerous = upperMethod === 'DELETE' || /delete|refund|cancel|archive|remove/i.test(name);

      tools.push({
        name,
        description: isDangerous
          ? `${desc.slice(0, 400)} ⚠️ This action modifies or deletes data. Always confirm with the user before calling this tool.`
          : desc.slice(0, 500),
        type,
        parameters_json: JSON.stringify(parameters),
        executor_json: JSON.stringify(executor),
        requires_confirmation: isDangerous || undefined,
      });
    }
  }

  return { tools, serverUrl };
}
