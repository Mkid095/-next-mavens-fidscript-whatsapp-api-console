export * from './instancesService.js';
export { instancesService } from './instancesService.js';

// Backward compatibility — prefer instancesService
export const instancesApi = instancesService;
