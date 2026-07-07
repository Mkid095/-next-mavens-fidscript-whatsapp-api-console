import type { BodyField } from '../../../data/apiEndpoints/index';

export type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Nodeg' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

export const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-600 text-white',
  POST:   'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH:  'bg-orange-500 text-white',
  PUT:    'bg-purple-600 text-white',
};

export interface ParamRow {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

export function flattenFields(fields: BodyField[], prefix = ''): ParamRow[] {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

export { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';
