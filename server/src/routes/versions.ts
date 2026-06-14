import { Router } from 'express';
import { adminAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = Router();

interface DeployVersion {
  id: number;
  version: string;
  commit_hash: string;
  deployed_at: string;
  changes_summary: string;
  service: string;
}

// GET /api/versions/latest - returns latest deploy version (public)
router.get('/latest', (_req, res) => {
  try {
    const latest = db.prepare(`
      SELECT version, commit_hash, deployed_at, changes_summary, service
      FROM deploy_versions
      ORDER BY id DESC
      LIMIT 1
    `).get() as DeployVersion | undefined;

    if (!latest) {
      res.json({
        success: true,
        data: {
          version: '1.0.0',
          commit_hash: 'unknown',
          deployed_at: new Date().toISOString(),
          changes_summary: 'Initial deployment',
          service: 'both',
        },
      });
      return;
    }

    res.json({ success: true, data: latest });
  } catch (error) {
    console.error('Error fetching latest version:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch version' });
  }
});

// GET /api/versions/history - admin only
router.get('/history', adminAuth, (_req, res) => {
  try {
    const history = db.prepare(`
      SELECT id, version, commit_hash, deployed_at, changes_summary, service
      FROM deploy_versions
      ORDER BY id DESC
      LIMIT 50
    `).all() as unknown as DeployVersion[];

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch version history' });
  }
});

// POST /api/versions - internal, called by deploy script
router.post('/', (req, res) => {
  try {
    const { version, commit_hash, changes_summary, service } = req.body;

    if (!version) {
      res.status(400).json({ success: false, error: 'Version is required' });
      return;
    }

    db.prepare(`
      INSERT INTO deploy_versions (version, commit_hash, changes_summary, service)
      VALUES (?, ?, ?, ?)
    `).run(version, commit_hash || null, changes_summary || null, service || 'both');

    res.json({ success: true, data: { message: 'Deploy version recorded' } });
  } catch (error) {
    console.error('Error recording deploy version:', error);
    res.status(500).json({ success: false, error: 'Failed to record deploy version' });
  }
});

export default router;
