/**
 * Google OAuth — authentication handlers.
 * Handles: getGoogleAuthUrl, handleGoogleCallback.
 */
import { Request, Response } from 'express';
import db from '../database.js';
import { encryptApiKey } from '../utils/crypto.js';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const _explicitRedirect = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_REDIRECT_URI = _explicitRedirect
  || `${process.env.PLATFORM_URL || process.env.SERVER_URL || 'http://localhost:3099'}/api/contacts/google/callback`;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.PLATFORM_URL || 'http://localhost:5173';

export async function getGoogleAuthUrl(req: Request, res: Response): Promise<void> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(503).json({
      success: false,
      error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.',
    });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
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
}

export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`${FRONTEND_URL}/client/contacts?google_error=${encodeURIComponent(error)}`);
    return;
  }
  if (!code || !state) {
    res.redirect(`${FRONTEND_URL}/client/contacts?google_error=missing_params`);
    return;
  }

  const client = db.prepare(
    'SELECT id, google_oauth_state FROM clients WHERE google_oauth_state = ?',
  ).get(state) as { id: string; google_oauth_state: string } | undefined;
  if (!client) {
    res.redirect(`${FRONTEND_URL}/client/contacts?google_error=invalid_state`);
    return;
  }
  db.prepare('UPDATE clients SET google_oauth_state = NULL WHERE id = ?').run(client.id);

  try {
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
      res.redirect(`${FRONTEND_URL}/client/contacts?google_error=token_exchange_failed`);
      return;
    }
    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const encryptedAccess = encryptApiKey(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? encryptApiKey(tokens.refresh_token) : null;
    const expiry = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString();

    db.prepare(
      'UPDATE clients SET google_access_token = ?, google_refresh_token = ?, google_token_expiry = ? WHERE id = ?',
    ).run(
      JSON.stringify(encryptedAccess),
      encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
      expiry,
      client.id,
    );

    res.redirect(`${FRONTEND_URL}/client/contacts?google_linked=1`);
  } catch (err) {
    console.error('[Google OAuth] callback error:', err);
    res.redirect(`${FRONTEND_URL}/client/contacts?google_error=server_error`);
  }
}
