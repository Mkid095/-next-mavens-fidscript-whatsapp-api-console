/**
 * Shared code + spec generation for the public API registry.
 *
 * Used by DocsSection, ApiReference, the "Copy everything" exporter, and the
 * `scripts/gen-openapi.ts` build step — so every code sample and the OpenAPI
 * document always agree with the registry.
 */

export * from './codegenCore.js';
