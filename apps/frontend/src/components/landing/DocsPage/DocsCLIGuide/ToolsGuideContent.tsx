import React from 'react';
import { motion } from 'motion/react';
import { Callout } from '../shared.js';
import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.js';
import { PUBLIC_API_BASE } from '../../../../data/apiEndpoints/index.js';

/* ── Tools & Integrations ── */
export function ToolsGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Tools &amp; Integrations</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        FIDScript is an <strong className="text-[#cbd3cf]">AI orchestration layer</strong> that sits on
        top of your business systems. The chatbot never stores your customer data  -  it calls{' '}
        <strong className="text-[#cbd3cf]">tools</strong> that hit your external APIs, databases, or
        e-commerce platforms in real time. This means the bot always answers with live, accurate data.
      </p>
      <Callout type="info"><p><strong className="text-white">Data-first principle:</strong> When a tool exists that could answer the user's question, the bot MUST use the tool before relying on its own knowledge. Never guess inventory, pricing, customer details, or order status  -  always call the tool first.</p></Callout>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">The 6-layer architecture</h2>
      <DocsCodeBlock code={`External Systems (Shopify, Postgres, REST API, ERP, CRM)\n       ↓\n1. integration_connections   -  encrypted credentials to external systems\n       ↓\n2. data_sources              -  datasets exposed by a connection\n       ↓\n3. tools                     -  individual LLM-callable operations:\n                               lookup (single-record fetch)\n                               search (free-text filter)\n                               query  (HTTP GET)\n                               action (HTTP POST/PUT/DELETE)\n                               workflow (multi-step chain)\n       ↓\n4. chatbot_tools             -  attach tools to chatbots + per-tool limits\n       ↓\n5. tool_execution_logs       -  every call logged for audit\n       ↓\nLLM → WhatsApp reply`} lang="text" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 1: Create a data source</h2>
      <p className="text-xs text-[#8a886a] mb-3">A data source is the link between your external system and FIDScript. It can be a static JSON dataset (for demos), an API endpoint, or a SQL query.</p>
      <DocsCodeBlock code={`# Demo data source (e-commerce sample  -  works immediately)\nfidscript data-source create my-catalog --type demo --description "Sample products + customers"\n\n# Real API data source (your production system)\nfidscript data-source create shopify-prod \\\n  --type api_endpoint \\\n  --description "Shopify product catalog" \\\n  --config '{"endpoint":"https://my-store.myshopify.com/api/products.json"}'\n\n# Or via the API:\ncurl -X POST https://whatsapp.fidscript.com/api/platform/data-sources \\\n  -H "Authorization: Bearer $FIDSCRIPT_JWT" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"my-catalog","type":"demo","config_json":"{}"}'`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 2: Add tools to the data source</h2>
      <p className="text-xs text-[#8a886a] mb-3">Tools are the operations the LLM can call. Each tool has a name, description, parameter schema, and a type that determines how it executes.</p>
      <DocsCodeBlock code={`# Each workspace auto-seeds 4 demo tools. See them:\nfidscript tool list\n\n# Execute a tool directly (test before attaching to a bot):\nfidscript tool exec <data-source-id> <tool-id> \\\n  --args '{"query":"spoon"}'\n\n# Example: search the demo catalog for "spoon"\n# Returns: [{ sku: "SPO-001", name: "Stainless steel spoon", price_kes: 250, in_stock: 120 }]`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 3: Attach tools to a chatbot</h2>
      <DocsCodeBlock code={`# See a chatbot's current tools\nfidscript chatbot tools <chatbot-id>\n\n# Attach a tool (the LLM will now be able to call it)\nfidscript chatbot tools <chatbot-id> attach <tool-id>\n\n# Detach\nfidscript chatbot tools <chatbot-id> detach <tool-id>`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 4: How the tool-calling engine works</h2>
      <p className="text-xs text-[#8a886a] mb-3">When the chatbot receives a message, the inference loop:</p>
      <DocsCodeBlock code={`1. Build system prompt listing all attached tools + their parameters\n2. Call the LLM with the user's message\n3. Parse the LLM reply for tool calls:\n   <tool_call name="search_products">{"query":"spoon"}</tool_call>\n4. Execute each tool → calls the external API or reads demo data\n5. Append the result back into the conversation context\n6. Re-call the LLM with the enriched context\n7. Loop until the LLM produces a final answer (no more tool calls)\n   Max 5 iterations.`} lang="text" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">E-commerce demo walkthrough</h2>
      <p className="text-xs text-[#8a886a] mb-3">Every workspace is auto-seeded with a demo catalog. Here's what happens when a user texts your WhatsApp:</p>
      <DocsCodeBlock code={`User:  "Do you have spoons?"\n  → LLM calls search_products({"query":"spoon"})\n  → Tool returns: [{name:"Stainless steel spoon", price_kes:250, in_stock:120}]\n  → LLM uses the result to answer\n\nBot:  "Yes! We have stainless steel spoons at KES 250 each.\n       We currently have 120 in stock. Would you like to order some?"\n\nUser:  "Yes, order 5"\n  → LLM calls add_to_cart({"phone":"+254700000001","sku":"SPO-001","qty":5})\n  → Then calls place_order({"phone":"+254700000001"})\n  → Returns: {order_id:"ORD-DEMO", total_kes:1750, payment_url:"..."}\n\nBot:  "Order placed! 5 spoons for KES 1,750.\n       Pay here: https://pay.example.com/ORD-DEMO"\n\nUser:  "Who am I?"\n  → LLM calls lookup_customer_by_phone({"phone":"+254700000001"})\n  → Returns: {name:"Ken Wanjiku", tier:"gold"}\n\nBot:  "Hello Ken! You're a Gold tier customer."`} lang="text" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Connecting a real system</h2>
      <p className="text-xs text-[#8a886a] mb-3">Replace the demo data source with your production API:</p>
      <DocsCodeBlock code={`# 1. Create a real data source pointing at your API\nfidscript data-source create shopify-api \\\n  --type api_endpoint \\\n  --config '{"endpoint":"https://my-store.myshopify.com/api/2024-01/products.json"}'\n\n# 2. Create a tool that queries it\nfidscript api POST /api/platform/data-sources/<ds-id>/tools \\\n  --auth jwt \\\n  -d '{\n    "name": "search_shopify_products",\n    "description": "Search the Shopify product catalog",\n    "type": "query",\n    "parameters_json": "{\\"type\\":\\"object\\",\\"properties\\":{\\"query\\":{\\"type\\":\\"string\\"}}}",\n    "executor_json": "{\\"endpoint\\":\\"https://my-store.myshopify.com/api/2024-01/products.json\\"}"\n  }'\n\n# 3. Attach it to your chatbot\nfidscript chatbot tools <chatbot-id> attach <tool-id>\n\n# The chatbot now answers with REAL data from your Shopify store.`} lang="bash" />
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Tool types reference</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1910]">
            <tr>{['Type', 'What it does', 'When to use'].map(h => <th key={h} className="text-left px-4 py-2 font-bold text-[#8a886a]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#262413]">
            <tr><td className="px-4 py-2 font-mono text-yellow-500">lookup</td><td className="px-4 py-2 text-[#a8a594]">Single-record fetch by key (phone, ID, SKU)</td><td className="px-4 py-2 text-[#a8a594]">Customer identification, order lookup</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">search</td><td className="px-4 py-2 text-[#a8a594]">Free-text + filtered search returning multiple records</td><td className="px-4 py-2 text-[#a8a594]">Product search, inventory check</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">query</td><td className="px-4 py-2 text-[#a8a594]">HTTP GET to a remote API</td><td className="px-4 py-2 text-[#a8a594]">Read from Shopify, WooCommerce, custom REST</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">action</td><td className="px-4 py-2 text-[#a8a594]">HTTP POST/PUT/DELETE (mutating)</td><td className="px-4 py-2 text-[#a8a594]">Create order, add to cart, push STK payment</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">workflow</td><td className="px-4 py-2 text-[#a8a594]">Multi-step chain calling other tools in sequence</td><td className="px-4 py-2 text-[#a8a594]">Full checkout: search → cart → order → pay → confirm</td></tr>
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Agent-driven setup</h2>
      <p className="text-xs text-[#8a886a] mb-3">The entire tool platform is CLI-accessible. An AI agent (Claude Code, Cursor, etc.) can set up a full chatbot with tools from scratch:</p>
      <DocsCodeBlock code={`# Agent prompt: "Use fidscript to set up a WhatsApp chatbot\n# connected to my Shopify store."\n\n# The agent runs:\nfidscript login --email owner@store.com --code 123456\nfidscript instance create store-bot\nfidscript instance qr store-bot          # → QR for the user to scan\nfidscript data-source create shopify \\\n  --type api_endpoint \\\n  --config '{"endpoint":"https://mystore.myshopify.com/api/products.json"}'\nfidscript chatbot create store-assistant --instance store-bot \\\n  --prompt "You are a helpful store assistant. Always check inventory before answering."\nfidscript chatbot tools <bot-id> attach <tool-id>\nfidscript chatbot publish <bot-id>\n\n# Done  -  the bot is live and answering with real product data.`} lang="bash" />
    </motion.div>
  );
}
