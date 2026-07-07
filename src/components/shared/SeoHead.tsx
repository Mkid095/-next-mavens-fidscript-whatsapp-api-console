/**
 * SeoHead — barrel re-export.
 * Split into: SeoHeadMain, MetaTags, OpenGraph, schemas.
 * @deprecated import from './shared/SeoHead' directly
 */
export { SeoHeadMain as default } from './SeoHead/SeoHeadMain';
export type { SeoHeadProps, PageSchema } from './SeoHead/SeoHeadMain';
