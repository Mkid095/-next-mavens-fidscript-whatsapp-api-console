import type { Database } from 'sql.js';

// =============================================================================
// Workspace tables — created via CREATE TABLE IF NOT EXISTS
// client_id = workspace_id bridge during migration (§4.5 spec)
// =============================================================================

export function createWorkspaceTables(db: Database): void {
  // Workspaces — one per client (initially), workspace_id = client_id
  db.run(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      client_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT,
      plan_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users — unified admin + client owner identity
  // Existing 'users' table is extended via migrations.ts
  db.run(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      invited_email TEXT,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workspace_id, user_id)
    )
  `);

  // Teams
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id)
    )
  `);

  // Roles — system roles are workspace_id = NULL
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      name TEXT NOT NULL,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Permissions catalog
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Role → permissions mapping
  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      UNIQUE(role_id, permission_id)
    )
  `);
}

// =============================================================================
// Seed system roles + permission catalog
// =============================================================================

const SYSTEM_ROLES = [
  { name: 'Owner', isSystem: 1 },
  { name: 'Admin', isSystem: 1 },
  { name: 'Manager', isSystem: 1 },
  { name: 'Support Agent', isSystem: 1 },
  { name: 'Sales Agent', isSystem: 1 },
  { name: 'Marketing Agent', isSystem: 1 },
];

const PERMISSIONS = [
  // Conversations
  { key: 'conversations.view' },
  { key: 'conversations.assign' },
  { key: 'conversations.delete' },
  // Customers
  { key: 'customers.view' },
  { key: 'customers.create' },
  { key: 'customers.update' },
  { key: 'customers.delete' },
  { key: 'customers.notes.write' },
  { key: 'customers.tags.manage' },
  // Campaigns
  { key: 'campaigns.view' },
  { key: 'campaigns.launch' },
  { key: 'campaigns.manage' },
  // AI Agents
  { key: 'agents.view' },
  { key: 'agents.manage' },
  { key: 'agents.publish' },
  // Automations
  { key: 'automations.view' },
  { key: 'automations.manage' },
  // Media & Status
  { key: 'media.manage' },
  { key: 'status.manage' },
  // Integrations
  { key: 'integrations.connect' },
  { key: 'integrations.manage' },
  // Analytics
  { key: 'analytics.view' },
  // Developers
  { key: 'developers.keys.manage' },
  { key: 'developers.webhooks.manage' },
  { key: 'developers.apps.manage' },
  // Workspace
  { key: 'workspace.members.manage' },
  { key: 'workspace.billing' },
  { key: 'workspace.settings' },
  // Audit
  { key: 'audit.view' },
];

export function seedWorkspaceData(db: Database): void {
  // Seed permissions — use db.exec() for static multi-row inserts
  PERMISSIONS.forEach((p, i) => {
    db.exec(
      `INSERT OR IGNORE INTO permissions (id, key, description) VALUES ('perm_${i}', '${p.key.replace(/'/g, "''")}', NULL)`
    );
  });

  // Seed system roles
  SYSTEM_ROLES.forEach((r, i) => {
    db.exec(
      `INSERT OR IGNORE INTO roles (id, workspace_id, name, is_system) VALUES ('role_${i}', NULL, '${r.name.replace(/'/g, "''")}', ${r.isSystem})`
    );
  });

  // Grant all permissions to Owner role
  const ownerRoleId = 'role_0';
  PERMISSIONS.forEach((_, i) => {
    db.exec(
      `INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id) VALUES ('rp_${ownerRoleId}_perm_${i}', '${ownerRoleId}', 'perm_${i}')`
    );
  });

  // Grant view permissions to Support Agent
  const supportRoleId = 'role_3';
  const viewPerms = PERMISSIONS.filter(p =>
    p.key.includes('.view') || p.key.startsWith('conversations') || p.key.startsWith('customers')
  );
  viewPerms.forEach((p) => {
    const pid = `perm_${PERMISSIONS.indexOf(p)}`;
    db.exec(
      `INSERT OR IGNORE INTO role_permissions (id, role_id, permission_id) VALUES ('rp_${supportRoleId}_${pid}', '${supportRoleId}', '${pid}')`
    );
  });
}
