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
		INSERT OR IGNORE INTO instances (id, name, display_name, client_id, instance_token, status, phone_number, evolution_name)
		VALUES ('inst_7754cd12', 'soostori', 'soostori', 'cli_kennedy_001', 'inst_8ab061483be4e0a9c10faaf918ab3cc2', 'disconnected', '+254732203353', 'soostori')
	`);
	db.run(`
		INSERT OR IGNORE INTO instances (id, name, display_name, client_id, instance_token, status, evolution_name)
		VALUES ('inst_8a97129e', 'test', 'test', 'cli_kennedy_001', 'inst_test123', 'disconnected', 'test')
	`);
	// Ensure all instances have evolution_name = name (fixes legacy rows created before this column existed)
	db.run(`UPDATE instances SET evolution_name = name WHERE evolution_name IS NULL OR evolution_name = ''`);
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

	// ────────────────────────────────────────────────────────────────────
	// E-commerce demo: data sources + tools (auto-seeded per workspace)
	//
	// This is DEMO data so users can try the platform immediately without
	// connecting their own system. In production, the user creates a real
	// integration_connection (e.g. Shopify, REST API, Postgres) and
	// replaces these tools with ones that hit their actual API.
	//
	// The chatbot NEVER stores customer data in our DB. It calls TOOLS
	// that call EXTERNAL systems. This demo just uses static_json so it
	// works without an external API.
	// ────────────────────────────────────────────────────────────────────
	const wsRows = db.exec(`SELECT id FROM clients WHERE is_active = 1`);
	if (wsRows.length > 0) {
		for (const row of wsRows[0]!.values) {
			const workspaceId = String(row);
			// Idempotent
			const exists = db.exec(`SELECT 1 FROM data_sources WHERE workspace_id = '${workspaceId}' AND name = 'acme-demo-catalog' LIMIT 1`);
			if (exists.length > 0 && exists[0]!.values.length > 0) continue;

			// Demo customers — phone is the key the chatbot looks up by
			const customers = [
				{ phone: '+254700000001', name: 'Ken Wanjiku', tier: 'gold', last_order: 'ORD-1024' },
				{ phone: '+254700000002', name: 'Achieng Otieno', tier: 'silver', last_order: '' },
				{ phone: '+254746269657', name: 'Joseph N', tier: 'platinum', last_order: 'ORD-1029' },
				{ phone: '+254700000003', name: 'Kith K', tier: 'bronze', last_order: '' },
				{ phone: '+254700000004', name: 'Ian Iraya', tier: 'gold', last_order: 'ORD-1031' },
			];
			// Demo products — searchable by name/category/stock
			const products = [
				{ sku: 'SPO-001', name: 'Stainless steel spoon', category: 'cutlery', price_kes: 250, in_stock: 120 },
				{ sku: 'SPO-002', name: 'Wooden soup spoon', category: 'cutlery', price_kes: 380, in_stock: 45 },
				{ sku: 'FORK-001', name: 'Salad fork set', category: 'cutlery', price_kes: 1200, in_stock: 30 },
				{ sku: 'CUP-001', name: 'Ceramic coffee mug', category: 'kitchenware', price_kes: 850, in_stock: 200 },
				{ sku: 'PAN-001', name: 'Non-stick frying pan', category: 'cookware', price_kes: 3200, in_stock: 18 },
				{ sku: 'KNF-001', name: 'Chef knife', category: 'cookware', price_kes: 2800, in_stock: 22 },
			];
			const dsId = `ds_demo_${workspaceId}`;
			db.run(`INSERT INTO data_sources (id, workspace_id, name, description, type, config_json, is_builtin) VALUES (?, ?, 'acme-demo-catalog', 'Demo data for testing tools. Replace with a real integration_connection in production.', 'demo', ?, 1)`, [dsId, workspaceId, JSON.stringify({ records: [...customers, ...products], keyField: 'phone' })]);
			// Tools
			db.run(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json) VALUES (?, ?, 'lookup_customer_by_phone', 'Look up a customer by phone number. Returns name, tier, last_order. Use to greet the user by name.', 'lookup', '{"type":"object","properties":{"phone":{"type":"string","description":"E.164 phone"}},"required":["phone"]}', '{"keyField":"phone"}')`, [`tool_demo_lookup_${workspaceId}`, dsId]);
			db.run(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json) VALUES (?, ?, 'search_products', 'Search the product catalog. Returns up to 10 matches with name, sku, price, stock.', 'search', '{"type":"object","properties":{"query":{"type":"string","description":"Search term (e.g. spoon)"},"category":{"type":"string"},"in_stock_only":{"type":"boolean"}},"required":["query"]}', '{}')`, [`tool_demo_search_${workspaceId}`, dsId]);
			db.run(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json) VALUES (?, ?, 'add_to_cart', 'Add a product to the callers cart. Demo returns a mock cart ID.', 'action', '{"type":"object","properties":{"phone":{"type":"string"},"sku":{"type":"string"},"qty":{"type":"integer"}},"required":["phone","sku"]}', '{"demoData":{"cart_id":"CART-DEMO","status":"added"}}')`, [`tool_demo_cart_${workspaceId}`, dsId]);
			db.run(`INSERT INTO tools (id, data_source_id, name, description, type, parameters_json, executor_json) VALUES (?, ?, 'place_order', 'Convert cart to order. Demo returns a mock order + payment link.', 'action', '{"type":"object","properties":{"phone":{"type":"string"}},"required":["phone"]}', '{"demoData":{"order_id":"ORD-DEMO","total_kes":1750,"payment_url":"https://pay.example.com/ORD-DEMO"}}')`, [`tool_demo_order_${workspaceId}`, dsId]);
		}
	}
}
