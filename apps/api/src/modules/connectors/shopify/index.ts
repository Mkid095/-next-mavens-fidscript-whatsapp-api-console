/**
 * connectors/shopify/index.ts — Shopify integration connector.
 *
 * Auth: OAuth2 (store access token per workspace).
 * Tools generated:
 *   shopify.get_order    — look up order by reference
 *   shopify.search_products — search product catalog
 *   shopify.get_customer  — customer profile
 *
 * Webhook trigger (when Shopify app is installed):
 *   shopify.order.created
 */
import { ConnectorRegistry } from '../../ai/connectors/registry.js';
import type { ConnectorConfig } from '../../ai/connectors/types.js';

const cfg: ConnectorConfig = {
  id: 'conn_shopify',
  slug: 'shopify',
  authType: 'oauth2',
  installUrl: 'https://shopify.example.com/oauth/authorize',
  docsUrl: 'https://shopify.dev/docs/api',
  sharedCredentials: false,
  triggers: [
    {
      event: 'shopify.order.created',
      label: 'New order placed',
      description: 'Fires when a new order is created in Shopify',
      payloadSchema: JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          customer: { type: 'string' },
          total: { type: 'number' },
          currency: { type: 'string' },
        },
      }),
    },
  ],
  actions: [
    {
      name: 'shopify.get_order',
      label: 'Look up order',
      description: 'Retrieve order status and details by order reference',
      parametersSchema: JSON.stringify({
        type: 'object',
        required: ['orderId'],
        properties: {
          orderId: { type: 'string', description: 'Shopify order ID or order name' },
        },
      }),
    },
    {
      name: 'shopify.search_products',
      label: 'Search products',
      description: 'Search the product catalog by name or SKU',
      parametersSchema: JSON.stringify({
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Product name or SKU to search' },
          limit: { type: 'integer', default: 10 },
        },
      }),
    },
    {
      name: 'shopify.get_customer',
      label: 'Get customer',
      description: 'Retrieve customer profile by email or phone',
      parametersSchema: JSON.stringify({
        type: 'object',
        properties: {
          email: { type: 'string' },
          phone: { type: 'string' },
        },
      }),
    },
  ],
  tools: [
    {
      name: 'shopify_get_order',
      description: 'Look up a Shopify order by its order ID or reference number',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: {
          order_id: { type: 'string' },
        },
        required: ['order_id'],
      }),
    },
    {
      name: 'shopify_search_products',
      description: 'Search the Shopify product catalog',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'integer', default: 10 },
        },
        required: ['query'],
      }),
    },
    {
      name: 'shopify_get_customer',
      description: 'Get customer details by email or phone',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: {
          email: { type: 'string' },
          phone: { type: 'string' },
        },
      }),
    },
  ],
};

ConnectorRegistry.register(cfg);
export { cfg };
