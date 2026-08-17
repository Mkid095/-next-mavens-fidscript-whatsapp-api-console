/**
 * AI Providers endpoints - public catalog of LLM providers and models.
 *
 * These endpoints are public (clientApiKeyAuth + V1_READ) so integrators
 * can discover available providers without a full chatbot setup.
 */
import type { ApiEndpoint } from './index';

export const aiProviderEndpoints: ApiEndpoint[] = [
  {
    id: 'aiproviders.list', version: 'v1', method: 'GET',
    path: '/api/v1/providers', name: 'List AI Providers', category: 'AI Providers', rateLimit: 'read', auth: 'apikey',
    desc: 'Returns all enabled LLM provider templates available to this workspace. Each entry includes the provider type, display name, base URL, and whether it offers a free tier.',
    pathParams: [],
    bodyFields: [],
    response: {
      success: true,
      data: [
        {
          id: 'prov_openrouter',
          provider_type: 'openrouter',
          name: 'OpenRouter',
          description: 'OpenAI-compatible gateway with free & paid models',
          base_url: 'https://openrouter.ai/api/v1',
          is_free_tier: 1,
        },
        {
          id: 'prov_openai',
          provider_type: 'openai',
          name: 'OpenAI',
          description: 'OpenAI GPT models via OpenAI API',
          base_url: 'https://api.openai.com/v1',
          is_free_tier: 0,
        },
      ],
    },
  },
  {
    id: 'aiproviders.models', version: 'v1', method: 'GET',
    path: '/api/v1/providers/:type/models', name: 'List Provider Models', category: 'AI Providers', rateLimit: 'read', auth: 'apikey',
    desc: 'Returns available models for a specific provider type. Provider type must be one of: openai, openrouter, anthropic, azure, gemini, ollama, custom.',
    pathParams: [
      { name: 'type', desc: 'Provider type (e.g. openrouter, openai, anthropic)' },
    ],
    bodyFields: [],
    response: {
      success: true,
      data: {
        provider: 'openrouter',
        models: [
          { id: 'google/gemini-2.0-flash-free', context_length: 32768, supports_tools: true, latency_class: 'fast', cost_per_1k_input: 0, cost_per_1k_output: 0 },
          { id: 'openai/gpt-4o-mini', context_length: 128000, supports_tools: true, latency_class: 'fast', cost_per_1k_input: 0.00015, cost_per_1k_output: 0.0006 },
        ],
      },
    },
  },
];