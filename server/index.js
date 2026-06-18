require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3001;

// Middleware
app.use(cors({
  origin: ['https://admin.nextmavens.cloud', 'https://portal.nextmavens.cloud'],
  credentials: true
}));

// Proxy Evolution API routes BEFORE express.json() to prevent body parsing issues
app.use('/api/evolution', authenticateToken, createProxyMiddleware({
  target: process.env.EVOLUTION_URL || 'http://evolution-api:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/evolution': ''
  },
  onProxyReq: (proxyReq, req) => {
    const existingKey = proxyReq.getHeader('apikey');
    if (!existingKey) {
      proxyReq.setHeader('apikey', process.env.AUTHENTICATION_API_KEY);
    }
    if (req.body && !req.bodyTransformed) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Evolution API proxy error' });
  }
}));

// ─── Evolution Webhook Receiver ────────────────────────────────────────────────
// Evolution API POSTs webhooks to this endpoint (no auth — validates via shared API key).
// Must be before express.json() so raw body can be forwarded.
app.use('/api/webhook', createProxyMiddleware({
  target: process.env.EVOLUTION_URL || 'http://nextmavens_evolution:8080',
  changeOrigin: true,
  pathRewrite: { '^/api/webhook': '/webhook' },
  onProxyReq: (proxyReq, req) => {
    const existingKey = proxyReq.getHeader('apikey');
    if (!existingKey) {
      proxyReq.setHeader('apikey', process.env.AUTHENTICATION_API_KEY);
    }
  },
  onError: (err, req, res) => {
    console.error('Webhook proxy error:', err.message);
    res.status(500).json({ error: 'Webhook proxy error' });
  }
}));

// Now use express.json() for the remaining routes
app.use(express.json());

// Trust proxy (Nginx) for real IP addresses
app.set('trust proxy', 1);

// Simple in-memory rate limiter for login endpoint
const loginAttempts = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  let record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxAttempts) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  record.count += 1;
  next();
}

setInterval(() => {
  const cutoff = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (cutoff > record.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);


// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

// Create instance_tokens table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS instance_tokens (
    id SERIAL PRIMARY KEY,
    instance_name VARCHAR(255) UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Failed to create instance_tokens table:', err));

// Ensure role column exists on startup
pool.query("ALTER TABLE nm_clients ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'client'").catch(() => {});
pool.query('ALTER TABLE nm_clients ADD COLUMN IF NOT EXISTS login_username VARCHAR(100)').catch(() => {});
pool.query('ALTER TABLE nm_clients ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)').catch(() => {});

// Auth middleware for JWT-protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // { id, username, role, clientId }
    next();
  });
}

// Role-based middleware
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireClient(req, res, next) {
  // Both 'admin' and 'client' roles can access
  if (!req.user?.role) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

// ═══════════════════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════════════════

// Admin login (username/password from .env)

// Auth routes for frontend compatibility (magic-link style)
// GET /api/auth/me - current admin profile
app.get('/api/auth/me', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ id: 0, username: process.env.ADMIN_USERNAME, role: 'admin', clientId: 0 });
});
// GET /api/auth/client/me - current client profile
app.get('/api/auth/client/me', authenticateToken, async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role, clientId: req.user.clientId });
});
// POST /api/auth/request-code - admin magic code request (stub)
app.post('/api/auth/request-code', rateLimiter, async (req, res) => {
  res.json({ success: true, message: 'Magic code sent (stub)' });
});
// POST /api/auth/verify-code - admin magic code verify (stub: accept email match)
app.post('/api/auth/verify-code', rateLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (email === process.env.ADMIN_EMAIL || !email) {
    const token = jwt.sign({ id: 0, username: process.env.ADMIN_USERNAME, role: 'admin', clientId: 0 }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, role: 'admin' });
  }
  res.status(401).json({ error: 'Invalid code' });
});
// POST /api/auth/client/request-code - client magic code request (stub)
app.post('/api/auth/client/request-code', rateLimiter, async (req, res) => {
  res.json({ success: true, message: 'Magic code sent (stub)' });
});
// POST /api/auth/client/verify-code - client magic code verify
app.post('/api/auth/client/verify-code', rateLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const result = await pool.query('SELECT id, company_name, email, role, is_active FROM nm_clients WHERE email = $1', [email]);
    const client = result.rows[0];
    if (!client || !client.is_active) return res.status(401).json({ error: 'Client not found or inactive' });
    const token = jwt.sign({ id: client.id, username: client.company_name, role: client.role || 'client', clientId: client.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, role: client.role || 'client' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});
// GET /api/auth/client/tokens - client token balance (stub)
app.get('/api/auth/client/tokens', authenticateToken, async (req, res) => {
  res.json({ tokens: 999999, history: [] });
});

app.post('/api/login', rateLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // First check admin credentials from .env
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 0, username, role: 'admin', clientId: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return res.json({ token, role: 'admin' });
  }

  // Then check client portal credentials in database
  try {
    const result = await pool.query(
      'SELECT id, company_name, email, password_hash, role, is_active FROM nm_clients WHERE login_username = $1',
      [username]
    );
    const client = result.rows[0];
    if (!client || !client.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, client.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!client.is_active) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const token = jwt.sign(
      { id: client.id, username: client.login_username, role: client.role, clientId: client.id, company_name: client.company_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, role: client.role, clientId: client.id, company_name: client.company_name });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════
// ADMIN-ONLY ROUTES
// ═══════════════════════════════════════════════════

// Get system keys (admin only)
app.get('/api/system/keys', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      jwt_secret: process.env.JWT_SECRET,
      master_api_key: process.env.AUTHENTICATION_API_KEY,
      admin_username: process.env.ADMIN_USERNAME,
      evolution_integration: process.env.INTEGRATION || 'not set'
    });
  } catch (err) {
    console.error('Get system keys error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stats (admin only)
app.get('/api/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const clientResult = await pool.query(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_clients,
        COALESCE(SUM(msg_count_today), 0) as messages_today,
        COALESCE(SUM(total_messages), 0) as total_messages
      FROM nm_clients
    `);
    const result = clientResult.rows[0];
    res.json({
      total_clients: parseInt(result.total_clients),
      active_clients: parseInt(result.active_clients),
      messages_today: parseInt(result.messages_today),
      total_messages: parseInt(result.total_messages)
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all clients (admin only)
app.get('/api/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.company_name, c.email, c.api_key, c.is_active,
        c.max_instances, c.msg_per_min, c.msg_count_today, c.total_messages,
        c.last_reset, c.created_at, c.role, c.login_username,
        c.phone, c.address, c.city, c.country, c.postal_code,
        c.contact_person, c.website, c.tax_id, c.plan_id, c.billing_cycle,
        c.subscription_start_date, c.subscription_end_date,
        c.trial_ends_at, c.is_on_trial, c.timezone,
        p.name as plan_name, p.price_monthly, p.price_yearly,
        COALESCE(i.instance_count, 0) as instance_count
      FROM nm_clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      LEFT JOIN (
        SELECT client_id, COUNT(*) as instance_count FROM "Instance" GROUP BY client_id
      ) i ON c.id = i.client_id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single client (admin only)
app.get('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name as plan_name, p.price_monthly, p.price_yearly,
        COALESCE(i.instance_count, 0) as instance_count
      FROM nm_clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      LEFT JOIN (
        SELECT client_id, COUNT(*) as instance_count FROM "Instance" GROUP BY client_id
      ) i ON c.id = i.client_id
      WHERE c.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Update client (admin only) — full update
app.put('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { company_name, email, phone, address, city, country, postal_code, contact_person, website, tax_id, plan_id, billing_cycle, subscription_start_date, subscription_end_date, is_active, max_instances, msg_per_min, notes } = req.body;
    const result = await pool.query(`
      UPDATE nm_clients SET
        company_name = COALESCE($1, company_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        country = COALESCE($6, country),
        postal_code = COALESCE($7, postal_code),
        contact_person = COALESCE($8, contact_person),
        website = COALESCE($9, website),
        tax_id = COALESCE($10, tax_id),
        plan_id = COALESCE($11, plan_id),
        billing_cycle = COALESCE($12, billing_cycle),
        subscription_start_date = COALESCE($13, subscription_start_date),
        subscription_end_date = COALESCE($14, subscription_end_date),
        is_active = COALESCE($15, is_active),
        max_instances = COALESCE($16, max_instances),
        msg_per_min = COALESCE($17, msg_per_min),
        notes = COALESCE($18, notes),
        updated_at = NOW()
      WHERE id = $19
      RETURNING *
    `, [company_name, email, phone, address, city, country, postal_code, contact_person, website, tax_id, plan_id, billing_cycle, subscription_start_date, subscription_end_date, is_active, max_instances, msg_per_min, notes, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Create new client with portal credentials (admin only)
app.post('/api/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { company_name, email, max_instances, msg_per_min, portal_password } = req.body;
    if (!company_name || !email) {
      return res.status(400).json({ error: 'Company name and email required' });
    }
    const api_key = crypto.randomBytes(32).toString('hex');

    // If portal password provided, hash it
    let passwordHash = null;
    let loginUsername = null;
    if (portal_password) {
      loginUsername = email.split('@')[0].toLowerCase();
      passwordHash = bcrypt.hashSync(portal_password, 10);
    }

    const result = await pool.query(`
      INSERT INTO nm_clients (company_name, email, api_key, max_instances, msg_per_min, role, login_username, password_hash)
      VALUES ($1, $2, $3, $4, $5, 'client', $6, $7)
      RETURNING id, company_name, email, api_key, is_active, max_instances, msg_per_min, created_at, login_username
    `, [company_name, email, api_key, max_instances || 5, msg_per_min || 30, loginUsername, passwordHash]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create client error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update client portal credentials (admin only)
app.patch('/api/clients/:id/portal', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { login_username, password, portal_password, is_active, msg_per_min, max_instances, notes } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (login_username) {
      updates.push(`login_username = $${idx++}`);
      values.push(login_username);
    }
    if (portal_password) {
      updates.push(`password_hash = $${idx++}`);
      values.push(bcrypt.hashSync(portal_password, 10));
    }
    if (password) {
      // Reset password with generated one
      updates.push(`password_hash = $${idx++}`);
      values.push(bcrypt.hashSync(password, 10));
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(is_active);
    }
    if (msg_per_min !== undefined) {
      updates.push(`msg_per_min = $${idx++}`);
      values.push(msg_per_min);
    }
    if (max_instances !== undefined) {
      updates.push(`max_instances = $${idx++}`);
      values.push(max_instances);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE nm_clients SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, company_name, email, is_active, login_username, msg_per_min, max_instances, notes`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update client portal error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle client active/suspended
app.patch('/api/clients/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE nm_clients
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING id, company_name, email, is_active
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle client error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete client
app.delete('/api/clients/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM nm_clients WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset client API key
app.post('/api/clients/:id/reset-key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const new_api_key = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      'UPDATE nm_clients SET api_key = $1 WHERE id = $2 RETURNING id, company_name, email, api_key',
      [new_api_key, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Reset key error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set or reset client portal access (admin only)
app.post('/api/clients/:id/portal-access', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, password } = req.body;
    // action: 'enable' | 'disable'

    if (action === 'enable') {
      const client = await pool.query('SELECT email, company_name, role FROM nm_clients WHERE id = $1', [id]);
      if (client.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

      const loginUsername = client.rows[0].email.split('@')[0].toLowerCase();
      const generatedPassword = password || crypto.randomBytes(8).toString('hex');
      const hash = bcrypt.hashSync(generatedPassword, 10);

      const result = await pool.query(
        'UPDATE nm_clients SET login_username = $1, password_hash = $2 WHERE id = $3 RETURNING id, company_name, login_username',
        [loginUsername, hash, id]
      );
      res.json({ message: 'Portal access enabled', ...result.rows[0], generatedPassword });
    }

    if (action === 'disable') {
      await pool.query("UPDATE nm_clients SET login_username = NULL, password_hash = NULL WHERE id = $1", [id]);
      res.json({ message: 'Portal access disabled' });
    }
  } catch (err) {
    console.error('Portal access error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════
// CLIENT PORTAL ROUTES (role = 'client' sees own data only)
// ═══════════════════════════════════════════════════

// Client gets their own profile
app.get('/api/portal/me', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const result = await pool.query(`
      SELECT id, company_name, email, api_key, is_active,
        max_instances, msg_per_min, msg_count_today, total_messages,
        last_reset, created_at, role, notes
      FROM nm_clients WHERE id = $1
    `, [clientId]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get client profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Client gets their own instances only
app.get('/api/portal/instances', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const result = await pool.query(`
      SELECT i.id, i.name as instance_name, i."connectionStatus" as status,
        i."ownerJid", i."number", i."integration", i."createdAt", i."updatedAt"
      FROM "Instance" i
      WHERE i.client_id = $1
      ORDER BY i."createdAt" DESC
    `, [clientId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get client instances error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Client gets list of active clients (they themselves) for instance creation
app.get('/api/instance/clients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query('SELECT id, company_name, email, is_active, login_username FROM nm_clients WHERE is_active = true ORDER BY company_name');
      res.json(result.rows);
    } else {
      // Client can only see themselves
      const result = await pool.query(
        'SELECT id, company_name, email, is_active FROM nm_clients WHERE id = $1',
        [req.user.id]
      );
      res.json(result.rows);
    }
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Get all instances with client ownership info (admin only sees all, client sees own)
app.get('/api/instances', authenticateToken, requireClient, async (req, res) => {
  try {
    let query = `
      SELECT i.id, i.name as instance_name, i."connectionStatus" as status,
        i."ownerJid", i."number", i."integration", i."createdAt", i."updatedAt",
        c.id as client_id, c.company_name as client_name, c.email as client_email
      FROM "Instance" i
      LEFT JOIN nm_clients c ON i.client_id = c.id`;

    if (req.user.role !== 'admin') {
      query += ' WHERE i.client_id = $1';
      query += ' ORDER BY i."createdAt" DESC';
      const result = await pool.query(query, [req.user.id]);
      return res.json(result.rows);
    }

    query += ' ORDER BY i."createdAt" DESC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Get instances error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Legacy admin route (backward compat)
app.get('/api/admin/instances', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    let query = `
      SELECT i.id, i.name as instance_name, i."connectionStatus" as status,
        i."ownerJid", i."number", i."createdAt", "updatedAt",
        c.id as client_id, c.company_name as client_name, c.email as client_email
      FROM "Instance" i
      LEFT JOIN nm_clients c ON i.client_id = c.id`;

    if (role !== 'admin') {
      query += ' WHERE i.client_id = $1 ORDER BY i."createdAt" DESC';
      const result = await pool.query(query, [req.user.id]);
      return res.json(result.rows);
    }

    query += ' ORDER BY i."createdAt" DESC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Get instances error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Store instance token
app.post('/api/instances/token', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { instance_name, api_key } = req.body;
    if (!instance_name || !api_key) return res.status(400).json({ error: 'Instance name and API key required' });
    const result = await pool.query(`
      INSERT INTO instance_tokens (instance_name, api_key)
      VALUES ($1, $2)
      ON CONFLICT (instance_name) DO UPDATE SET api_key = $2, updated_at = NOW()
      RETURNING id, instance_name, created_at, updated_at
    `, [instance_name, api_key]);
    res.json({ message: 'Token stored', instance: result.rows[0] });
  } catch (err) {
    console.error('Store token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get instance token (client can only access their own)
app.get('/api/instances/:instanceName/token', authenticateToken, requireClient, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const result = await pool.query(
      'SELECT api_key FROM instance_tokens WHERE instance_name = $1',
      [instanceName]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Instance token not found' });
    res.json({ api_key: result.rows[0].api_key });
  } catch (err) {
    console.error('Get token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin-only API routes
const testingRoutes = require('./routes/testing');
const logsRoutes = require('./routes/logs');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');
const plansRoutes = require('./routes/plans');
const auditRoutes = require('./routes/audit');

// Pool middleware for routes that need it
const withPool = (req, res, next) => { req.pool = pool; next(); };

// Attach routes
app.use('/api/admin/test', authenticateToken, requireAdmin, withPool, testingRoutes);
app.use('/api/admin/logs', authenticateToken, requireAdmin, withPool, logsRoutes);
app.use('/api/admin/analytics', authenticateToken, requireAdmin, withPool, analyticsRoutes);
app.use('/api/admin/chat', authenticateToken, requireAdmin, withPool, chatRoutes);

// Plans management (admin only)
app.use('/api/plans', authenticateToken, requireAdmin, withPool, plansRoutes);

// Audit logs (admin only) — also allow GET for anyone authenticated
app.use('/api/audit-logs', authenticateToken, requireAdmin, withPool, auditRoutes);

// Evolution API routes (proxy through Express)
const evolutionRoutes = require('./routes/evolution');
app.use('/api/instance', authenticateToken, requireClient, evolutionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`[Admin API] Running on port ${port}`);
});
