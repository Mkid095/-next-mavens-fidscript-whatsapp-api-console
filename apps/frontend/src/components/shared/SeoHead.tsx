// Backward-compatibility re-export — all implementation lives in components/shared/SeoHead/
export { default, BASE_URL, SITE_NAME, DEFAULT_DESC, type PageSchema, type SeoHeadProps } from './SeoHead/SeoHead';
export { SeoHeadMeta } from './SeoHead/SeoHeadMeta';
export { SeoHeadStructuredData } from './SeoHead/SeoHeadStructuredData';
export { SeoHeadIcons } from './SeoHead/SeoHeadIcons';
export {
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  API_DOC_SCHEMA,
  SOFTWARE_SCHEMA,
  faqSchema,
  howToSchema,
  breadcrumbSchema,
  productSchema,
  blogPostingSchema,
  webPageSchema,
  PRICING_PLANS,
  FEATURES_FAQS,
  PRICING_FAQS,
  CONTACT_FAQS,
} from './SeoHead/constants';
export type { SeoHeadProps } from './SeoHead/constants';
