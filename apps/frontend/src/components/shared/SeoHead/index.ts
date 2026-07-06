// Re-export the component and all public constants/types from the split modules
export { default, BASE_URL, SITE_NAME, DEFAULT_DESC, type PageSchema, type SeoHeadProps } from './SeoHead';
export { SeoHeadMeta } from './SeoHeadMeta';
export { SeoHeadStructuredData } from './SeoHeadStructuredData';
export { SeoHeadIcons } from './SeoHeadIcons';
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
} from './constants';
export type { SeoHeadProps } from './constants';
