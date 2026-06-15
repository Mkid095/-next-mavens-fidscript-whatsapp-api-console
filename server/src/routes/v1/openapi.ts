import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { stringify as yamlStringify } from 'yaml';

/**
 * Serve the generated OpenAPI spec. The JSON artifact is produced by
 * `npm run gen:openapi` (scripts/gen-openapi.ts) from the frontend registry and
 * committed at server/openapi.json. The YAML mirror is converted at request
 * time so both always agree with the committed JSON.
 */
const router = Router();
const SPEC_PATH = path.join(process.cwd(), 'openapi.json');

function readSpec(): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

router.get('/openapi.json', (_req, res) => {
  const spec = readSpec();
  if (!spec) return res.status(404).json({ success: false, error: 'OpenAPI spec not generated' });
  res.json(spec);
});

router.get('/openapi.yaml', (_req, res) => {
  const spec = readSpec();
  if (!spec) return res.status(404).json({ success: false, error: 'OpenAPI spec not generated' });
  res.type('text/yaml').send(yamlStringify(spec));
});

export default router;
