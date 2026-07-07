import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import {
  getAllCosts,
  updateCost,
  setCostActive,
  pricingCacheInvalidate,
} from '../../services/pricingService.js';
import {
  getTokenPackages,
  getTokenPackage,
  createTokenPackage,
  updateTokenPackage,
  deleteTokenPackage,
  adminAwardTokens,
  refundTokens,
} from '../../services/paymentService.js';

const router = Router();
router.use(adminAuth);

// ---------------------------------------------------------------------------
// Token costs  (GET /admin/token-costs, PUT /admin/token-costs/:id)
// ---------------------------------------------------------------------------

/** GET /api/admin/token-costs */
router.get('/token-costs', (_req: Request, res: Response) => {
  try {
    const costs = getAllCosts();
    res.json({ success: true, data: costs });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

/** PUT /api/admin/token-costs/:id */
router.put('/token-costs/:id', (req: Request, res: Response) => {
  try {
    const { tokenCost, isActive } = req.body as { tokenCost?: number; isActive?: boolean };
    if (tokenCost !== undefined) {
      if (typeof tokenCost !== 'number' || tokenCost < 0) {
        res.status(400).json({ success: false, error: 'tokenCost must be a non-negative number' });
        return;
      }
      const updated = updateCost(req.params.id, tokenCost);
      if (!updated) { res.status(404).json({ success: false, error: 'Cost record not found' }); return; }
      pricingCacheInvalidate();
      res.json({ success: true });
      return;
    }
    if (isActive !== undefined) {
      const updated = setCostActive(req.params.id, Boolean(isActive));
      if (!updated) { res.status(404).json({ success: false, error: 'Cost record not found' }); return; }
      pricingCacheInvalidate();
      res.json({ success: true });
      return;
    }
    res.status(400).json({ success: false, error: 'Provide tokenCost or isActive' });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

// ---------------------------------------------------------------------------
// Token packages  (GET /admin/token-packages, POST /admin/token-packages, …)
// ---------------------------------------------------------------------------

/** GET /api/admin/token-packages */
router.get('/token-packages', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    res.json({ success: true, data: getTokenPackages(includeInactive) });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

/** GET /api/admin/token-packages/:id */
router.get('/token-packages/:id', (req: Request, res: Response) => {
  try {
    const pkg = getTokenPackage(req.params.id);
    if (!pkg) { res.status(404).json({ success: false, error: 'Package not found' }); return; }
    res.json({ success: true, data: pkg });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

/** POST /api/admin/token-packages */
router.post('/token-packages', (req: Request, res: Response) => {
  try {
    const { name, tokens, priceKsh, bonusTokens } = req.body as {
      name: string; tokens: number; priceKsh: number; bonusTokens?: number;
    };
    if (!name || typeof tokens !== 'number' || typeof priceKsh !== 'number') {
      res.status(400).json({ success: false, error: 'name, tokens, priceKsh are required' });
      return;
    }
    const { id } = createTokenPackage({ name, tokens, priceKsh, bonusTokens });
    res.status(201).json({ success: true, id });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

/** PUT /api/admin/token-packages/:id */
router.put('/token-packages/:id', (req: Request, res: Response) => {
  try {
    const { name, tokens, priceKsh, bonusTokens, isActive } = req.body as {
      name?: string; tokens?: number; priceKsh?: number; bonusTokens?: number; isActive?: boolean;
    };
    const updated = updateTokenPackage(req.params.id, { name, tokens, priceKsh, bonusTokens, isActive });
    if (!updated) { res.status(404).json({ success: false, error: 'Package not found' }); return; }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

/** DELETE /api/admin/token-packages/:id */
router.delete('/token-packages/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteTokenPackage(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, error: 'Package not found' }); return; }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

// ---------------------------------------------------------------------------
// Manual token award  (POST /admin/token-award)
// ---------------------------------------------------------------------------

/** POST /api/admin/token-award */
router.post('/token-award', (req: Request, res: Response) => {
  try {
    const { clientId, amount, reason } = req.body as { clientId: string; amount: number; reason: string };
    if (!clientId || typeof amount !== 'number' || !reason) {
      res.status(400).json({ success: false, error: 'clientId, amount, reason are required' });
      return;
    }
    const result = adminAwardTokens({ clientId, amount, reason, awardedBy: (req as any).user?.id ?? 'admin' });
    res.json({ success: true, transactionId: (result as any).transactionId });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

/** POST /api/admin/token-refund */
router.post('/token-refund', (req: Request, res: Response) => {
  try {
    const { clientId, paymentId, amount, reason } = req.body as {
      clientId: string; paymentId: string; amount: number; reason: string;
    };
    if (!clientId || !paymentId || typeof amount !== 'number' || !reason) {
      res.status(400).json({ success: false, error: 'clientId, paymentId, amount, reason are required' });
      return;
    }
    const result = refundTokens(clientId, paymentId, amount, reason);
    res.json({ success: true, transactionId: (result as any).transactionId });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

export default router;
