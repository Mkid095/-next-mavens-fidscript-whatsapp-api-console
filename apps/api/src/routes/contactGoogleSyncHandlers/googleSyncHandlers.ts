/**
 * Google OAuth — sync handlers.
 * Handles: getGoogleStatus, importGoogleContacts, unlinkGoogle, refreshGoogleAccessToken.
 */
import { Request, Response } from 'express';
import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { encryptApiKey, decryptApiKey } from '../../utils/crypto.js';
import { resolveContact, upsertContactIdentifier, insertContactSource } from '../../services/contactResolver.js';

export async function getGoogleStatus(req: Request, res: Response): Promise<void> {
  const client = db.prepare(
    'SELECT google_access_token, google_refresh_token, google_token_expiry FROM clients WHERE id = ?',
  ).get(req.client!.id) as {
    google_access_token: string | null;
    google_refresh_token: string | null;
    google_token_expiry: string | null;
  } | undefined;

  if (!client?.google_access_token) {
    res.json({ success: true, linked: false });
    return;
  }

  let accessToken: string;
  const isExpired = client.google_token_expiry ? new Date(client.google_token_expiry) <= new Date() : true;

  if (isExpired && client.google_refresh_token) {
    try {
      const refreshPayload = JSON.parse(client.google_refresh_token);
      accessToken = await refreshGoogleAccessToken(refreshPayload);
    } catch {
      res.json({ success: true, linked: false, reason: 'token_refresh_failed' });
      return;
    }
  } else {
    try {
      accessToken = decryptApiKey(JSON.parse(client.google_access_token));
    } catch {
      res.json({ success: true, linked: false, reason: 'decrypt_failed' });
      return;
    }
  }

  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      res.json({ success: true, linked: true, profile: null });
      return;
    }
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
}

export async function importGoogleContacts(req: Request, res: Response): Promise<void> {
  const client = db.prepare(
    'SELECT google_access_token, google_refresh_token, google_token_expiry FROM clients WHERE id = ?',
  ).get(req.client!.id) as {
    google_access_token: string | null;
    google_refresh_token: string | null;
    google_token_expiry: string | null;
  } | undefined;

  if (!client?.google_access_token) {
    res.status(400).json({ success: false, error: 'Google account not linked' });
    return;
  }

  let accessToken: string;
  try {
    accessToken = decryptApiKey(JSON.parse(client.google_access_token));
  } catch {
    res.status(401).json({ success: false, error: 'Failed to decrypt access token' });
    return;
  }

  if (client.google_token_expiry && new Date(client.google_token_expiry) <= new Date()) {
    if (!client.google_refresh_token) {
      res.status(401).json({ success: false, error: 'Token expired and no refresh token' });
      return;
    }
    try {
      accessToken = await refreshGoogleAccessToken(JSON.parse(client.google_refresh_token));
      const encrypted = encryptApiKey(accessToken);
      db.prepare('UPDATE clients SET google_access_token = ?, google_token_expiry = ? WHERE id = ?')
        .run(JSON.stringify(encrypted), new Date(Date.now() + 3500 * 1000).toISOString(), req.client!.id);
    } catch {
      res.status(401).json({ success: false, error: 'Token refresh failed' });
      return;
    }
  }

  const allContacts: { name: string; phone: string; resourceName: string }[] = [];
  let nextPageToken: string | undefined;

  do {
    const params = new URLSearchParams({ personFields: 'names,phoneNumbers,resourceName', pageSize: '200' });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const peopleRes = await fetch(`https://people.googleapis.com/v1/people/me/connections?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!peopleRes.ok) {
      const err = await peopleRes.text();
      res.status(peopleRes.status).json({ success: false, error: `Google API error: ${err}` });
      return;
    }
    const data = await peopleRes.json() as {
      connections?: { names?: { displayName: string }[]; phoneNumbers?: { value: string }[]; resourceName?: string }[];
      nextPageToken?: string;
    };

    for (const person of data.connections || []) {
      const name = person.names?.[0]?.displayName;
      const phone = person.phoneNumbers?.[0]?.value;
      const resourceName = person.resourceName;
      if (name && phone) {
        const normalized = '+' + phone.replace(/\D/g, '');
        allContacts.push({ name, phone: normalized, resourceName: resourceName ?? '' });
      }
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  let imported = 0;
  let errors = 0;
  for (const contact of allContacts) {
    try {
      const normalized = normalizePhone(contact.phone) || contact.phone;
      const result = resolveContact({
        clientId: req.client!.id,
        phone: normalized,
        googleId: contact.resourceName || undefined,
        displayName: contact.name,
        source: 'google',
      });
      if (result.isNew) {
        db.prepare('UPDATE contacts SET google_name = ? WHERE id = ?').run(contact.name, result.contactId);
      } else {
        db.prepare('UPDATE contacts SET google_name = COALESCE(NULLIF(google_name,\'\'), ?) WHERE id = ?')
          .run(contact.name, result.contactId);
      }
      if (contact.resourceName) {
        upsertContactIdentifier({ contactId: result.contactId, type: 'google_resource', value: contact.resourceName, isPrimary: false });
      }
      insertContactSource({ contactId: result.contactId, sourceType: 'google', externalId: contact.resourceName || undefined });
      imported++;
    } catch {
      errors++;
    }
  }

  res.json({ success: true, imported, errors, total: allContacts.length });
}

export async function unlinkGoogle(req: Request, res: Response): Promise<void> {
  db.prepare(
    'UPDATE clients SET google_access_token = NULL, google_refresh_token = NULL, google_token_expiry = NULL, google_oauth_state = NULL WHERE id = ?',
  ).run(req.client!.id);
  res.json({ success: true });
}

export async function refreshGoogleAccessToken(
  refreshPayload: { iv: string; authTag: string; ciphertext: string; keyVersion: number },
): Promise<string> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
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
