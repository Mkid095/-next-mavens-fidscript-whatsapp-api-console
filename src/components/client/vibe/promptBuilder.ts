import type { ApiEndpoint, BodyField } from '../../data/apiEndpoints/index';

/** Flatten a nested field hierarchy for the params table. */
export function flattenFields(fields: BodyField[], prefix = ''): Array<{ name: string; type: string; required: boolean; desc: string }> {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

/** Build a representative example body for a registry endpoint. */
export function buildExampleBody(ep: ApiEndpoint): Record<string, unknown> {
  if (!ep.bodyFields.length) return {};
  return ep.bodyFields.reduce<Record<string, unknown>>((acc, f) => {
    if (f.default !== undefined) acc[f.key] = f.default;
    else if (f.enum?.length) acc[f.key] = f.enum[0];
    else if (f.type === 'number') acc[f.key] = 0;
    else if (f.type === 'boolean') acc[f.key] = false;
    else if (f.type === 'array') acc[f.key] = [];
    else if (f.type === 'object') acc[f.key] = {};
    else acc[f.key] = `<${f.key}>`;
    return acc;
  }, {});
}
