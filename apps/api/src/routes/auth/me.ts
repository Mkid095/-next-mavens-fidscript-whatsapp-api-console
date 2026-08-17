import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import db from '../../database.js';

const router = Router();

interface ClientRow {
  id: string;
  name: string;
  email: string;
}

/**
 * GET /api/auth/me - return the currently signed-in admin's profile.
 *
 * Used by App.tsx on page load to restore the session from localStorage
 * (`fidscript_admin_token`). Without this endpoint, every page refresh
 * silently destroyed the admin session: `authApi.me()` 404'd, the
 * frontend treated it as a failed auth, cleared the token, and bounced
 * the admin back to /login.
 *
 * Mounted under /api/auth (not /api/admin) because the frontend calls it
 * via the passwordless-auth namespace. Protected by adminAuth so a
 * non-admin (or missing) token returns 401 instead of leaking rows.
 */
router.get('/me', adminAuth, (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id: string; email: string; name: string; role?: string } }).user;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Admin session not found' });
  }
  return res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, role: user.role ?? 'admin' },
  });
});

export default router;