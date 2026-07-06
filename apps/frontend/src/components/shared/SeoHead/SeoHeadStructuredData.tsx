/**
 * SeoHeadStructuredData — renders all JSON-LD structured data scripts.
 * Always injects ORGANIZATION_SCHEMA and SOFTWARE_SCHEMA.
 */
import { Helmet } from 'react-helmet-async';
import {
  BASE_URL,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  SOFTWARE_SCHEMA,
  faqSchema,
  webPageSchema,
  breadcrumbSchema,
  productSchema,
  API_DOC_SCHEMA,
  PRICING_PLANS,
  FEATURES_FAQS,
  PRICING_FAQS,
  CONTACT_FAQS,
  type PageSchema,
} from './constants';

interface Props {
  schema: PageSchema;
  extraSchemas: object[];
  breadcrumbs: { name: string; url: string }[];
  fullTitle: string;
  description: string;
  canonicalUrl: string;
}

export function SeoHeadStructuredData({
  schema,
  extraSchemas,
  breadcrumbs,
  fullTitle,
  description,
  canonicalUrl,
}: Props) {
  const schemas: object[] = [ORGANIZATION_SCHEMA];

  if (schema === 'website') {
    schemas.push({ ...WEBSITE_SCHEMA, '@id': `${BASE_URL}/#website` });
    schemas.push(webPageSchema(fullTitle, description, canonicalUrl));
  } else if (schema === 'features') {
    schemas.push(webPageSchema(fullTitle, description, canonicalUrl), faqSchema(FEATURES_FAQS));
  } else if (schema === 'pricing') {
    schemas.push(
      webPageSchema(fullTitle, description, canonicalUrl),
      productSchema(PRICING_PLANS),
      faqSchema(PRICING_FAQS),
    );
  } else if (schema === 'docs') {
    schemas.push(webPageSchema(fullTitle, description, canonicalUrl), API_DOC_SCHEMA);
  } else if (schema === 'changelog') {
    schemas.push(webPageSchema(fullTitle, description, canonicalUrl), API_DOC_SCHEMA);
  } else if (schema === 'contact') {
    schemas.push(webPageSchema(fullTitle, description, canonicalUrl), faqSchema(CONTACT_FAQS));
  } else if (schema === 'terms' || schema === 'privacy') {
    schemas.push(webPageSchema(fullTitle, description, canonicalUrl));
  }

  schemas.push(...extraSchemas);
  if (breadcrumbs.length > 0) {
    schemas.push(breadcrumbSchema([{ name: 'Home', url: '/' }, ...breadcrumbs]));
  }

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
      <script type="application/ld+json">{JSON.stringify(SOFTWARE_SCHEMA)}</script>
    </>
  );
}
