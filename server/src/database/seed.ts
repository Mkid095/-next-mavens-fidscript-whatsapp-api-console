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

	// Seed Kennedy Mwangi client + instances + API keys (idempotent — INSERT OR IGNORE so it's safe to re-run)
	db.run(`
		INSERT OR IGNORE INTO clients (id, name, email, phone, api_key, plan_id, token_balance, is_active)
		VALUES ('cli_kennedy_001', 'Kennedy Mwangi', 'kennedygithinjioffice@gmail.com', '+254746269657', 'kennedy_api_key', 'plan_starter', 207394, 1)
	`);
	db.run(`
		INSERT OR IGNORE INTO instances (id, name, display_name, client_id, instance_token, status, phone_number)
		VALUES ('inst_7754cd12', 'soostori', 'soostori', 'cli_kennedy_001', 'inst_8ab061483be4e0a9c10faaf918ab3cc2', 'disconnected', '+254732203353')
	`);
	db.run(`
		INSERT OR IGNORE INTO instances (id, name, display_name, client_id, instance_token, status)
		VALUES ('inst_8a97129e', 'test', 'test', 'cli_kennedy_001', 'inst_test123', 'disconnected')
	`);
	db.run(`
		INSERT OR IGNORE INTO client_api_keys (id, client_id, name, api_key, status)
		VALUES ('key_1781528486016_l49mms', 'cli_kennedy_001', 'test', 'fidscript_live_e15f501870ed01861896de5db1c338d7', 'Active')
	`);
	db.run(`
		INSERT OR IGNORE INTO client_api_keys (id, client_id, name, api_key, status)
		VALUES ('key_1781606033013_o2di7o', 'cli_kennedy_001', 'soostori', 'fidscript_live_8f5fa69b65ff12adfe31fc012e01c493', 'Active')
	`);

	// Seed additional clients (idempotent)
	db.run(`
		INSERT OR IGNORE INTO clients (id, name, email, phone, api_key, plan_id, token_balance, is_active)
		VALUES ('cli_joseph_001', 'Joseph N', 'joseph@nextmavens.com', '+254700000001', 'cli_joseph_api_key', 'plan_starter', 500, 1)
	`);
	db.run(`
		INSERT OR IGNORE INTO clients (id, name, email, phone, api_key, plan_id, token_balance, is_active)
		VALUES ('cli_nextmavens_001', 'Next Mavens', 'nextmavensoffice@gmail.com', '+254746269657', 'cli_nextmavens_api_key', 'plan_enterprise', 50000, 1)
	`);
	db.run(`
		INSERT OR IGNORE INTO clients (id, name, email, phone, api_key, plan_id, token_balance, is_active)
		VALUES ('cli_kithk_001', 'Kith K', 'kithk@example.com', '+254700000003', 'cli_kithk_api_key', 'plan_starter', 500, 1)
	`);
	db.run(`
		INSERT OR IGNORE INTO clients (id, name, email, phone, api_key, plan_id, token_balance, is_active)
		VALUES ('cli_ian_001', 'Ian Iraya', 'ian@example.com', '+254700000004', 'cli_ian_api_key', 'plan_professional', 5000, 1)
	`);
}
