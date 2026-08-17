/**
 * SeoHeadMain - the main SeoHead component that composes MetaTags, OpenGraph,
 * and all structured-data schemas.
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MetaTags } from './MetaTags';
import { OpenGraph } from './OpenGraph';
import {
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  faqSchema,
  howToSchema,
  breadcrumbSchema,
  productSchema,
  blogPostingSchema,
  API_DOC_SCHEMA,
  webPageSchema,
  PRICING_PLANS,
  FEATURES_FAQS,
  PRICING_FAQS,
  CONTACT_FAQS,
  BASE_URL,
  SITE_NAME,
} from './schemas';

export type PageSchema =
  | 'website'
  | 'features'
  | 'pricing'
  | 'docs'
  | 'changelog'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'login'
  | 'none';

export interface SeoHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  schema?: PageSchema;
  /** Override or supplement the default schemas with extra ones */
  extraSchemas?: object[];
  /** Breadcrumb items - first item is always the site root */
  breadcrumbs?: { name: string; url: string }[];
}

export function SeoHeadMain({
  title,
  description,
  canonical = '/',
  ogImage,
  ogType = 'website',
  noindex = false,
  schema = 'none',
  extraSchemas = [],
  breadcrumbs = [],
}: SeoHeadProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} - ${SITE_NAME}`;
  const canonicalUrl = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;

  // Build the schema list based on page type
  const schemas: object[] = [ORGANIZATION_SCHEMA];

  if (schema === 'website') {
    schemas.push({ ...WEBSITE_SCHEMA, '@id': `${BASE_URL}/#website` });
    schemas.push(webPageSchema(fullTitle, description ?? '', canonical));
  } else if (schema === 'features') {
    schemas.push(
      webPageSchema(fullTitle, description ?? '', canonical),
      faqSchema(FEATURES_FAQS),
    );
  } else if (schema === 'pricing') {
    schemas.push(
      webPageSchema(fullTitle, description ?? '', canonical),
      productSchema(PRICING_PLANS),
      faqSchema(PRICING_FAQS),
    );
  } else if (schema === 'docs') {
    schemas.push(
      webPageSchema(fullTitle, description ?? '', canonical),
      API_DOC_SCHEMA,
    );
  } else if (schema === 'changelog') {
    schemas.push(
      webPageSchema(fullTitle, description ?? '', canonical),
      API_DOC_SCHEMA,
    );
  } else if (schema === 'contact') {
    schemas.push(
      webPageSchema(fullTitle, description ?? '', canonical),
      faqSchema(CONTACT_FAQS),
    );
  } else if (schema === 'terms' || schema === 'privacy') {
    schemas.push(webPageSchema(fullTitle, description ?? '', canonical));
  }

  schemas.push(...extraSchemas);

  // Breadcrumbs schema if provided
  if (breadcrumbs.length > 0) {
    schemas.push(breadcrumbSchema([{ name: 'Home', url: '/' }, ...breadcrumbs]));
  }

  return (
    <>
      <MetaTags
        title={title}
        description={description}
        canonical={canonical}
        noindex={noindex}
      />
      <OpenGraph
        title={fullTitle}
        description={description ?? ''}
        ogImage={ogImage}
        ogType={ogType}
        canonicalUrl={canonicalUrl}
      />

      <Helmet>
        {/* Structured Data - all schemas for this page */}
        {schemas.map((s, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(s)}
          </script>
        ))}

        {/* FIDScript - explicit product schema under Next Mavens */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'FIDScript WhatsApp API',
            url: BASE_URL,
            description:
              'Sustainable, affordable WhatsApp Business API for Kenyan developers. Send and receive messages programmatically via REST API with M-Pesa billing, webhooks, and real-time analytics.',
            applicationCategory: 'DeveloperApplication',
            applicationSubCategory: 'CommunicationAPI',
            operatingSystem: 'REST API (platform-independent)',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'KES',
              description: 'Free trial - 500 welcome tokens. No credit card required.',
              availability: 'https://schema.org/InStock',
            },
            isPartOf: {
              '@type': 'Product',
              name: 'FIDScript API Solutions',
              description:
                'FIDScript is a developer-focused WhatsApp API platform. Part of the Next Mavens suite of sustainable, affordable tools built for the African market.',
              url: BASE_URL,
              brand: {
                '@type': 'Brand',
                name: 'FIDScript',
                description: 'WhatsApp API solutions for development and automation',
              },
              manufacturer: ORGANIZATION_SCHEMA,
            },
            provider: ORGANIZATION_SCHEMA,
            runtimePlatform: 'REST',
            programmingLanguage: ['cURL', 'Node.js', 'Python', 'PHP', 'Go'],
            keywords:
              'whatsapp api, kenya, mpesa, developer tools, automation, messaging api, business communication, rest api, kenyan developers',
            about: {
              '@type': 'Thing',
              name: 'WhatsApp Business API for Africa',
              description:
                'Programmatic WhatsApp messaging for Kenyan and African businesses - affordable, sustainable, built by Kenyan developers',
            },
          })}
        </script>
      </Helmet>
    </>
  );
}
