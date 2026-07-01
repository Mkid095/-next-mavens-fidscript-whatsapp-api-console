import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';
import { normalizePhone } from '../utils/phone.js';
import { encryptApiKey, decryptApiKey } from '../utils/crypto.js';
import crypto from 'crypto';

const router = Router();

// Get contacts for authenticated client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const contacts = db.prepare(
      'SELECT id, phone, name, tags, created_at FROM contacts WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.client!.id);
    res.json({ success: true, data: contacts });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Add contacts (batch import)
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ success: false, error: 'contacts array required' });
  }
  try {
    let added = 0;
    for (const c of contacts) {
      const id = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      // Always normalize phone to international format so lookups are consistent
      const normalizedPhone = normalizePhone(c.phone) || c.phone;
      db.prepare(
        'INSERT INTO contacts (id, client_id, phone, name, tags) VALUES (?, ?, ?, ?, ?)'
      ).run(id, req.client!.id, normalizedPhone, c.name || '', c.tags || '');
      added++;
    }
    res.json({ success: true, count: added });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Delete contact
router.delete('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM contacts WHERE id = ? AND client_id = ?').run(req.params.id, req.client!.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = (process.env.GOOGLE_REDIRECT_URI || `${process.env.SERVER_URL || 'http://localhost:3099'}/api/contacts/google/callback`);
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

// GET /api/contacts/google/auth-url — generate Google OAuth authorization URL
router.get('/google/auth-url', clientJwtAuth, async (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.',
    });
  }
  const state = crypto.randomBytes(16).toString('hex');
  // Store state against client_id for verification
  db.prepare('UPDATE clients SET google_oauth_state = ? WHERE id = ?').run(state, req.client!.id);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  res.json({ success: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

// GET /api/contacts/google/callback — handle OAuth callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/contacts?google_error=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/contacts?google_error=missing_params`);
  }

  // Find client by state (state was stored during auth-url generation)
  const client = db.prepare('SELECT id, google_oauth_state FROM clients WHERE google_oauth_state = ?').get(state) as { id: string; google_oauth_state: string } | undefined;
  if (!client) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/contacts?google_error=invalid_state`);
  }
  // Clear state
  db.prepare('UPDATE clients SET google_oauth_state = NULL WHERE id = ?').run(client.id);

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange error:', errText);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/contacts?google_error=token_exchange_failed`);
    }
    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };

    // Encrypt tokens before storing (reuse AES-256-GCM from crypto.ts)
    const encryptedAccess = encryptApiKey(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? encryptApiKey(tokens.refresh_token) : null;
    const expiry = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(); // 1 min buffer

    db.prepare(
      'UPDATE clients SET google_access_token = ?, google_refresh_token = ?, google_token_expiry = ? WHERE id = ?'
    ).run(
      JSON.stringify(encryptedAccess),
      encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
      expiry,
      client.id,
    );

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/contacts?google_linked=1`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/contacts?google_error=server_error`);
  }
});

// GET /api/contacts/google/status — check if Google account is linked
router.get('/google/status', clientJwtAuth, async (req: Request, res: Response) => {
  const client = db.prepare(
    'SELECT google_access_token, google_refresh_token, google_token_expiry FROM clients WHERE id = ?'
  ).get(req.client!.id) as {
    google_access_token: string | null;
    google_refresh_token: string | null;
    google_token_expiry: string | null;
  } | undefined;

  if (!client?.google_access_token) {
    return res.json({ success: true, linked: false });
  }

  // Check if token is expired — try to refresh if so
  let accessToken: string;
  const isExpired = client.google_token_expiry ? new Date(client.google_token_expiry) <= new Date() : true;

  if (isExpired && client.google_refresh_token) {
    // Attempt token refresh
    try {
      const refreshPayload = JSON.parse(client.google_refresh_token);
      const newAccessToken = await refreshGoogleAccessToken(refreshPayload);
      accessToken = newAccessToken;
    } catch {
      return res.json({ success: true, linked: false, reason: 'token_refresh_failed' });
    }
  } else {
    try {
      accessToken = decryptApiKey(JSON.parse(client.google_access_token));
    } catch {
      return res.json({ success: true, linked: false, reason: 'decrypt_failed' });
    }
  }

  // Fetch Google user profile
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) return res.json({ success: true, linked: true, profile: null });
    const profile = await profileRes.json() as { name?: string; email?: string; picture?: string };
    res.json({
      success: true,
      linked: true,
      name: profile.name || null,
      email: profile.email || null,
      picture: profile.picture || null,
    });
  } catch {
    res.json({ success: true, linked: true, profile: null });
  }
});

// POST /api/contacts/google/import — sync contacts from Google People API
router.post('/google/import', clientJwtAuth, async (req: Request, res: Response) => {
  const client = db.prepare(
    'SELECT google_access_token, google_refresh_token, google_token_expiry FROM clients WHERE id = ?'
  ).get(req.client!.id) as {
    google_access_token: string | null;
    google_refresh_token: string | null;
    google_token_expiry: string | null;
  } | undefined;

  if (!client?.google_access_token) {
    return res.status(400).json({ success: false, error: 'Google account not linked' });
  }

  let accessToken: string;
  try {
    accessToken = decryptApiKey(JSON.parse(client.google_access_token));
  } catch {
    return res.status(401).json({ success: false, error: 'Failed to decrypt access token' });
  }

  // Refresh if needed
  if (client.google_token_expiry && new Date(client.google_token_expiry) <= new Date()) {
    if (!client.google_refresh_token) return res.status(401).json({ success: false, error: 'Token expired and no refresh token' });
    try {
      accessToken = await refreshGoogleAccessToken(JSON.parse(client.google_refresh_token));
      // Update stored token
      const encrypted = encryptApiKey(accessToken);
      db.prepare('UPDATE clients SET google_access_token = ?, google_token_expiry = ? WHERE id = ?')
        .run(JSON.stringify(encrypted), new Date(Date.now() + 3500 * 1000).toISOString(), req.client!.id);
    } catch {
      return res.status(401).json({ success: false, error: 'Token refresh failed' });
    }
  }

  // Fetch all connections from Google People API
  const allContacts: { name: string; phone: string }[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({ personFields: 'names,phoneNumbers', pageSize: '200' });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const peopleRes = await fetch(`https://people.googleapis.com/v1/people/me/connections?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!peopleRes.ok) {
      const err = await peopleRes.text();
      return res.status(peopleRes.status).json({ success: false, error: `Google API error: ${err}` });
    }
    const data = await peopleRes.json() as {
      connections?: { names?: { displayName: string }[]; phoneNumbers?: { value: string }[] }[];
      nextPageToken?: string;
    };

    for (const person of data.connections || []) {
      const name = person.names?.[0]?.displayName;
      const phone = person.phoneNumbers?.[0]?.value;
      if (name && phone) {
        // Normalize phone: strip non-digits, ensure +
        const normalized = '+' + phone.replace(/\D/g, '');
        allContacts.push({ name, phone: normalized });
      }
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  // Upsert into contacts table: match by phone, update google_name
  let imported = 0;
  let errors = 0;
  for (const contact of allContacts) {
    try {
      const normalized = normalizePhone(contact.phone) || contact.phone;
      const existing = db.prepare(
        'SELECT id FROM contacts WHERE client_id = ? AND phone = ?'
      ).get(req.client!.id, normalized) as { id: string } | undefined;

      if (existing) {
        db.prepare('UPDATE contacts SET google_name = ? WHERE id = ?').run(contact.name, existing.id);
      } else {
        const id = `gcontact_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        db.prepare(
          'INSERT INTO contacts (id, client_id, phone, name, google_name, tags) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, req.client!.id, normalized, '', contact.name, '');
      }
      imported++;
    } catch {
      errors++;
    }
  }

  res.json({ success: true, imported, errors, total: allContacts.length });
});

// DELETE /api/contacts/google/link — unlink Google account
router.delete('/google/link', clientJwtAuth, async (req: Request, res: Response) => {
  db.prepare(
    'UPDATE clients SET google_access_token = NULL, google_refresh_token = NULL, google_token_expiry = NULL, google_oauth_state = NULL WHERE id = ?'
  ).run(req.client!.id);
  res.json({ success: true });
});

// Helper: refresh Google access token
async function refreshGoogleAccessToken(refreshPayload: { iv: string; authTag: string; ciphertext: string; keyVersion: number }): Promise<string> {
  const refreshToken = decryptApiKey(refreshPayload);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!tokenRes.ok) throw new Error('Token refresh failed');
  const tokens = await tokenRes.json() as { access_token: string; expires_in: number };
  return tokens.access_token;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// Update contact (name, phone, or tags)
router.patch('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  const { name, phone, tags } = req.body;
  if (!name && !phone && !tags) {
    return res.status(400).json({ success: false, error: 'At least one field required' });
  }
  try {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) {
      // Normalize phone to international format for consistency
      const normalizedPhone = normalizePhone(phone) || phone;
      fields.push('phone = ?'); values.push(normalizedPhone);
    }
    if (tags !== undefined) { fields.push('tags = ?'); values.push(tags); }
    values.push(req.params.id, req.client!.id);
    db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ? AND client_id = ?`).run(...values);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
