/**
 * Contacts route handlers.
 */
import type { Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { encryptApiKey, decryptApiKey } from '../../utils/crypto.js';
import { resolveContact, upsertContactIdentifier, insertContactSource } from '../../services/contactResolver.js';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI
  || `${process.env.PLATFORM_URL || process.env.SERVER_URL || 'http://localhost:3099'}/api/contacts/google/callback`;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

export function registerContactsRoutes(router: import('express').Router): void {

  // GET /api/contacts
  router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
    try {
      const contacts = db.prepare('SELECT id, phone, name, tags, created_at FROM contacts WHERE client_id = ? ORDER BY created_at DESC').all(req.client!.id);
      res.json({ success: true, data: contacts });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // POST /api/contacts (batch import)
  router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) { res.status(400).json({ success: false, error: 'contacts array required' }); return; }
    try {
      let added = 0;
      for (const c of contacts) {
        const normalizedPhone = normalizePhone(c.phone) || c.phone;
        const result = resolveContact({ clientId: req.client!.id, phone: normalizedPhone || undefined, displayName: c.name || null, source: 'csv' });
        if (c.name) db.prepare('UPDATE contacts SET name = COALESCE(NULLIF(name,\'\'), ?) WHERE id = ?').run(c.name, result.contactId);
        if (c.tags) db.prepare('UPDATE contacts SET tags = COALESCE(NULLIF(tags,\'\'), ?) WHERE id = ?').run(c.tags, result.contactId);
        added++;
      }
      res.json({ success: true, count: added });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // PATCH /api/contacts/:id
  router.patch('/:id', clientJwtAuth, async (req: Request, res: Response) => {
    const { name, phone, tags } = req.body;
    if (!name && !phone && !tags) { res.status(400).json({ success: false, error: 'At least one field required' }); return; }
    try {
      const fields: string[] = []; const values: (string | number)[] = [];
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (phone !== undefined) { fields.push('phone = ?'); values.push(normalizePhone(phone) || phone); }
      if (tags !== undefined) { fields.push('tags = ?'); values.push(tags); }
      values.push(req.params.id, req.client!.id);
      db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ? AND client_id = ?`).run(...values);
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // DELETE /api/contacts/:id
  router.delete('/:id', clientJwtAuth, async (req: Request, res: Response) => {
    try {
      db.prepare('DELETE FROM contacts WHERE id = ? AND client_id = ?').run(req.params.id, req.client!.id);
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // GET /api/contacts/google/auth-url
  router.get('/google/auth-url', clientJwtAuth, async (req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(503).json({ success: false, error: 'Google OAuth not configured' }); return;
    }
    const state = crypto.randomBytes(16).toString('hex');
    db.prepare('UPDATE clients SET google_oauth_state = ? WHERE id = ?').run(state, req.client!.id);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code', scope: GOOGLE_SCOPES,
      access_type: 'offline', prompt: 'consent', state,
    });
    res.json({ success: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  // GET /api/contacts/google/callback
  router.get('/google/callback', async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;
    const frontUrl = process.env.FRONTEND_URL || process.env.PLATFORM_URL || 'http://localhost:5173';
    if (error) { res.redirect(`${frontUrl}/client/contacts?google_error=${encodeURIComponent(error)}`); return; }
    if (!code || !state) { res.redirect(`${frontUrl}/client/contacts?google_error=missing_params`); return; }
    const client = db.prepare('SELECT id, google_oauth_state FROM clients WHERE google_oauth_state = ?').get(state) as { id: string } | undefined;
    if (!client) { res.redirect(`${frontUrl}/client/contacts?google_error=invalid_state`); return; }
    db.prepare('UPDATE clients SET google_oauth_state = NULL WHERE id = ?').run(client.id);
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, code,
          grant_type: 'authorization_code', redirect_uri: GOOGLE_REDIRECT_URI,
        }),
      });
      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const tokens = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in: number };
      const encryptedAccess = encryptApiKey(tokens.access_token);
      const encryptedRefresh = tokens.refresh_token ? encryptApiKey(tokens.refresh_token) : null;
      const expiry = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString();
      db.prepare('UPDATE clients SET google_access_token = ?, google_refresh_token = ?, google_token_expiry = ? WHERE id = ?')
        .run(JSON.stringify(encryptedAccess), encryptedRefresh ? JSON.stringify(encryptedRefresh) : null, expiry, client.id);
      res.redirect(`${frontUrl}/client/contacts?google_linked=1`);
    } catch (err) {
      console.error('[Google OAuth] callback error:', err);
      res.redirect(`${frontUrl}/client/contacts?google_error=server_error`);
    }
  });

  // GET /api/contacts/google/status
  router.get('/google/status', clientJwtAuth, async (req: Request, res: Response) => {
    const client = db.prepare('SELECT google_access_token, google_refresh_token, google_token_expiry FROM clients WHERE id = ?').get(req.client!.id) as {
      google_access_token: string | null; google_refresh_token: string | null; google_token_expiry: string | null;
    } | undefined;
    if (!client?.google_access_token) { res.json({ success: true, linked: false }); return; }

    let accessToken: string;
    const isExpired = client.google_token_expiry ? new Date(client.google_token_expiry) <= new Date() : true;
    if (isExpired && client.google_refresh_token) {
      try { accessToken = await refreshGoogleAccessToken(JSON.parse(client.google_refresh_token)); }
      catch { res.json({ success: true, linked: false, reason: 'token_refresh_failed' }); return; }
    } else {
      try { accessToken = decryptApiKey(JSON.parse(client.google_access_token)); }
      catch { res.json({ success: true, linked: false, reason: 'decrypt_failed' }); return; }
    }

    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!profileRes.ok) { res.json({ success: true, linked: true, profile: null }); return; }
      const profile = await profileRes.json() as { name?: string; email?: string; picture?: string };
      res.json({ success: true, linked: true, name: profile.name || null, email: profile.email || null, picture: profile.picture || null });
    } catch { res.json({ success: true, linked: true, profile: null }); }
  });

  // POST /api/contacts/google/import
  router.post('/google/import', clientJwtAuth, async (req: Request, res: Response) => {
    const client = db.prepare('SELECT google_access_token, google_refresh_token, google_token_expiry FROM clients WHERE id = ?').get(req.client!.id) as {
      google_access_token: string | null; google_refresh_token: string | null; google_token_expiry: string | null;
    } | undefined;
    if (!client?.google_access_token) { res.status(400).json({ success: false, error: 'Google account not linked' }); return; }

    let accessToken: string;
    try { accessToken = decryptApiKey(JSON.parse(client.google_access_token)); }
    catch { res.status(401).json({ success: false, error: 'Failed to decrypt access token' }); return; }

    if (client.google_token_expiry && new Date(client.google_token_expiry) <= new Date()) {
      if (!client.google_refresh_token) { res.status(401).json({ success: false, error: 'Token expired and no refresh token' }); return; }
      try { accessToken = await refreshGoogleAccessToken(JSON.parse(client.google_refresh_token)); }
      catch { res.status(401).json({ success: false, error: 'Token refresh failed' }); return; }
    }

    const allContacts: { name: string; phone: string; resourceName: string }[] = [];
    let nextPageToken: string | undefined;
    do {
      const params = new URLSearchParams({ personFields: 'names,phoneNumbers,resourceName', pageSize: '200' });
      if (nextPageToken) params.set('pageToken', nextPageToken);
      const peopleRes = await fetch(`https://people.googleapis.com/v1/people/me/connections?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!peopleRes.ok) return res.status(peopleRes.status).json({ success: false, error: `Google API error: ${await peopleRes.text()}` });
      const data = await peopleRes.json() as { connections?: { names?: { displayName: string }[]; phoneNumbers?: { value: string }[]; resourceName?: string }[]; nextPageToken?: string };
      for (const person of data.connections || []) {
        const name = person.names?.[0]?.displayName;
        const phone = person.phoneNumbers?.[0]?.value;
        if (name && phone) allContacts.push({ name, phone: '+' + phone.replace(/\D/g, ''), resourceName: person.resourceName ?? '' });
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    let imported = 0; let errors = 0;
    for (const contact of allContacts) {
      try {
        const normalized = normalizePhone(contact.phone) || contact.phone;
        const result = resolveContact({ clientId: req.client!.id, phone: normalized, googleId: contact.resourceName || undefined, displayName: contact.name, source: 'google' });
        if (result.isNew) db.prepare('UPDATE contacts SET google_name = ? WHERE id = ?').run(contact.name, result.contactId);
        else db.prepare('UPDATE contacts SET google_name = COALESCE(NULLIF(google_name,\'\'), ?) WHERE id = ?').run(contact.name, result.contactId);
        if (contact.resourceName) upsertContactIdentifier({ contactId: result.contactId, type: 'google_resource', value: contact.resourceName, isPrimary: false });
        insertContactSource({ contactId: result.contactId, sourceType: 'google', externalId: contact.resourceName || undefined });
        imported++;
      } catch { errors++; }
    }
    res.json({ success: true, imported, errors, total: allContacts.length });
  });

  // DELETE /api/contacts/google/link
  router.delete('/google/link', clientJwtAuth, async (req: Request, res: Response) => {
    db.prepare('UPDATE clients SET google_access_token = NULL, google_refresh_token = NULL, google_token_expiry = NULL, google_oauth_state = NULL WHERE id = ?').run(req.client!.id);
    res.json({ success: true });
  });
}

async function refreshGoogleAccessToken(refreshPayload: { iv: string; authTag: string; ciphertext: string; keyVersion: number }): Promise<string> {
  const refreshToken = decryptApiKey(refreshPayload);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  if (!tokenRes.ok) throw new Error('Token refresh failed');
  const tokens = await tokenRes.json() as { access_token: string; expires_in: number };
  return tokens.access_token;
}
