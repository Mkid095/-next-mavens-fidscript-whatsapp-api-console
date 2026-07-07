/**
 * connectors/woocommerce/index.ts — WooCommerce integration connector.
 *
 * Auth: API Key (REST API consumer key/secret per workspace).
 * Tools generated:
 *   woocommerce.get_order     — look up order by ID
 *   woocommerce.search_products — search product catalog
 *   woocommerce.get_customer   — customer profile by email
 *
 * Webhook trigger (when WooCommerce plugin is configured):
 *   woocommerce.order.created
 */
import { ConnectorRegistry } from '../../ai/connectors/registry.js';
import type { ConnectorConfig } from '../../ai/connectors/types.js';

const cfg: ConnectorConfig = {
  id: 'conn_woocommerce',
  slug: 'woocommerce',
  authType: 'api_key',
  installUrl: 'https://woocommerce.com/document/woocommerce-rest-api/',
  docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  sharedCredentials: false,
  triggers: [
    {
      event: 'woocommerce.order.created',
      label: 'New order placed',
      description: 'Fires when a new WooCommerce order is created',
      payloadSchema: JSON.stringify({
        type: 'object',
        properties: {
          orderId: { type: 'number' },
          customerEmail: { type: 'string' },
          total: { type: 'string' },
          currency: { type: 'string' },
        },
      }),
    },
  ],
  actions: [
    {
      name: 'woocommerce.get_order',
      label: 'Look up order',
      description: 'Retrieve order status and details by order ID',
      parametersSchema: JSON.stringify({
        type: 'object',
        required: ['orderId'],
        properties: {
          orderId: { type: 'integer', description: 'WooCommerce order ID' },
        },
      }),
    },
    {
      name: 'woocommerce.search_products',
      label: 'Search products',
      description: 'Search the product catalog by name or SKU',
      parametersSchema: JSON.stringify({
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Product name or SKU to search' },
          per_page: { type: 'integer', default: 10 },
        },
      }),
    },
    {
      name: 'woocommerce.get_customer',
      label: 'Get customer',
      description: 'Retrieve customer profile by email',
      parametersSchema: JSON.stringify({
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email address' },
        },
      }),
    },
  ],
  tools: [
    {
      name: 'woocommerce_get_order',
      description: 'Look up a WooCommerce order by its numeric ID',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: {
          order_id: { type: 'integer' },
        },
        required: ['order_id'],
      }),
    },
    {
      name: 'woocommerce_search_products',
      description: 'Search the WooCommerce product catalog',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: {
          query: { type: 'string' },
          per_page: { type: 'integer', default: 10 },
        },
        required: ['query'],
      }),
    },
    {
      name: 'woocommerce_get_customer',
      description: 'Get customer details by email address',
      parameters_json: JSON.stringify({
        type: 'object',
        properties: {
          email: { type: 'string' },
        },
      }),
    },
  ],
};

ConnectorRegistry.register(cfg);
export { cfg };
