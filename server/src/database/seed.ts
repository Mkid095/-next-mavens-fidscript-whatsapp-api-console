import type { Database } from 'sql.js';

export async function seedData(db: Database): Promise<void> {
  // Seed default plans if none exist
  const planCount = db.exec('SELECT COUNT(*) as count FROM plans')[0]?.values[0]?.[0] as number;
  if (!planCount || planCount === 0) {
    db.run(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES ('plan_starter', 'Starter', 'Perfect for small businesses', 3, 5000, 5, 2500, 24000)
    `);
    db.run(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES ('plan_professional', 'Professional', 'For growing businesses', 10, 25000, 20, 7500, 72000)
    `);
    db.run(`
      INSERT INTO plans (id, name, description, max_instances, max_messages_per_month, msg_per_min, price_monthly, price_yearly)
      VALUES ('plan_enterprise', 'Enterprise', 'Unlimited everything', 50, 100000, 100, 25000, 240000)
    `);

    // Seed default token packages
    db.run(`
      INSERT INTO token_packages (id, name, tokens, price_kes, bonus_tokens)
      VALUES ('pkg_starter', 'Starter', 1000, 100, 0)
    `);
    db.run(`
      INSERT INTO token_packages (id, name, tokens, price_kes, bonus_tokens)
      VALUES ('pkg_growth', 'Growth', 10000, 900, 1000)
    `);
    db.run(`
      INSERT INTO token_packages (id, name, tokens, price_kes, bonus_tokens)
      VALUES ('pkg_scale', 'Scale', 50000, 4000, 10000)
    `);
  }

  // Seed default admin user if none exist — no password (passwordless auth)
  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] as number;
  if (!userCount || userCount === 0) {
    db.run(`
      INSERT INTO users (id, email, name, role)
      VALUES ('admin_1', 'admin@fidscript.io', 'Admin', 'admin')
    `);
  }
}
