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
const POSTMAN_PATH = path.join(process.cwd(), 'fidscript-postman-collection.json');
const SDK_PATH = path.join(process.cwd(), 'static', 'sdk');

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

router.get('/postman-collection.json', (_req, res) => {
  try {
    const collection = JSON.parse(fs.readFileSync(POSTMAN_PATH, 'utf8'));
    res.json(collection);
  } catch {
    res.status(404).json({ success: false, error: 'Postman collection not generated. Run: cd server && npm run gen:postman' });
  }
});

// GET /api/v1/sdk/fidscript.js (and .py, .php, .go, README.md)
router.get('/sdk/:file', (req, res) => {
  const { file } = req.params;
  const allowed = ['fidscript.js', 'fidscript.py', 'fidscript.php', 'fidscript.go', 'README.md'];
  if (!allowed.includes(file)) {
    res.status(404).json({ success: false, error: 'Unknown SDK file' });
    return;
  }
  const filePath = path.join(SDK_PATH, file);
  try {
    const stat = fs.statSync(filePath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    if (file.endsWith('.md')) res.setHeader('Content-Type', 'text/markdown');
    else if (file.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    else if (file.endsWith('.py')) res.setHeader('Content-Type', 'text/x-python');
    else if (file.endsWith('.php')) res.setHeader('Content-Type', 'text/x-php');
    else if (file.endsWith('.go')) res.setHeader('Content-Type', 'text/x-go');
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.status(404).json({ success: false, error: 'SDK not generated. Run: cd server && npm run gen:sdk' });
  }
});

export default router;
