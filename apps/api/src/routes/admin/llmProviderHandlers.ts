/**
 * Admin LLM Provider route handlers — thin re-export layer.
 */
export {
  listProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider,
  setDefaultProvider,
} from './llmProviderCrudHandlers.js';

export {
  testProvider,
  listModels,
  addModel,
  removeModel,
} from './llmProviderTestHandlers.js';
