import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { sqliteFtsProvider } from '../../modules/platform/search/index.js';

// =============================================================================
// /api/platform/search - universal search (§8).
// Delegates to the SearchProvider (SqliteFts now, swappable later).
// Workspace-scoped + type-filtered.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

// GET /?q=&types=customer,message,order&limit=
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q) { res.json({ success: true, data: [] }); return; }

    const types = (req.query.types as string | undefined)
      ?.split(',').map(t => t.trim()).filter(Boolean);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const hits = await sqliteFtsProvider.query(req.client!.id, q, { types, limit });
    res.json({ success: true, data: hits });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
