import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://whatsapp.fidscript.com';
const SITE_NAME = 'FIDScript WhatsApp API';
const DEFAULT_DESC = 'WhatsApp API platform for Kenyan businesses. Send and receive messages programmatically with REST API, webhooks, M-Pesa billing, and real-time analytics.';

// ─── Organization (used site-wide) ───────────────────────────────────────────
// Next Mavens is the parent company. FIDScript is one of its developer solutions.
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Next Mavens',
  url: 'https://nextmavens.com',
  logo: `${BASE_URL}/logo.png`,
  description: 'Next Mavens builds sustainable, affordable developer tools and SaaS solutions for the African market. Products include FIDScript (WhatsApp API) and Next Events.',
  foundingDate: '2024',
  foundingLocation: 'Nairobi, Kenya',
  areaServed: 'Kenya',
  sameAs: [
    'https://twitter.com/fidstream',
    'https://linkedin.com/company/next-mavens',
    'https://github.com/nextmavens',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@nextmavens.com',
    telephone: '+254746269657',
    contactType: 'customer support',
    areaServed: 'KE',
    availableLanguage: ['English', 'Swahili'],
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  knowsAbout: [
    'WhatsApp Business API',
    'REST API Development',
    'M-Pesa Integration',
    'SaaS Platform Development',
    'Developer Tools',
    'Business Process Automation',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Next Mavens Solutions',
    description: 'Affordable, sustainable developer tools built for the African market',
    url: BASE_URL,
  },
};

// ─── WebSite with SearchAction (powers "Site:fidstream" AI queries) ─────────
const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  description: DEFAULT_DESC,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/docs?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: ORGANIZATION_SCHEMA,
};

// ─── FAQ schema builder ──────────────────────────────────────────────────────
function faqSchema(questions: { q: string; a: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };
}

// ─── HowTo schema for guide pages ────────────────────────────────────────────
function howToSchema(title: string, steps: string[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description: DEFAULT_DESC,
    publisher: ORGANIZATION_SCHEMA,
    step: steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  };
}

// ─── BreadcrumbList schema helper ────────────────────────────────────────────
function breadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${BASE_URL}${url}`,
    })),
  };
}

// ─── Product/Offer schema for pricing ────────────────────────────────────────
function productSchema(plans: { name: string; price: string; desc: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: SITE_NAME,
    description: 'WhatsApp API platform — token-based messaging for Kenyan businesses',
    brand: { '@type': 'Brand', name: 'FIDScript' },
    provider: ORGANIZATION_SCHEMA,
    offers: plans.map(({ name, price, desc }) => ({
      '@type': 'Offer',
      name,
      price,
      priceCurrency: 'KES',
      description: desc,
      availability: 'https://schema.org/InStock',
    })),
  };
}

// ─── BlogPosting schema for changelog ────────────────────────────────────────
function blogPostingSchema(versions: { version: string; date: string; summary: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'FIDScript Changelog',
    description: 'FIDScript deployment history and product updates',
    url: `${BASE_URL}/changelog`,
    publisher: ORGANIZATION_SCHEMA,
    blogPost: versions.slice(0, 10).map(({ version, date, summary }) => ({
      '@type': 'BlogPosting',
      headline: `Version ${version} released`,
      datePublished: date,
      description: summary,
      url: `${BASE_URL}/changelog`,
      author: ORGANIZATION_SCHEMA,
    })),
  };
}

// ─── ApiDocument (OpenAPI) schema for docs page ──────────────────────────────
const API_DOC_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  name: 'FIDScript WhatsApp API Reference',
  description: 'Complete REST API reference for FIDScript WhatsApp platform — messaging, groups, contacts, profile, and instance management.',
  url: `${BASE_URL}/docs`,
  publisher: ORGANIZATION_SCHEMA,
  programmingLanguage: 'REST',
  about: {
    '@type': 'Thing',
    name: 'WhatsApp Business API',
    description: 'Programmatic WhatsApp messaging for businesses',
  },
};

// ─── Perplexity/AI-friendly full page description ─────────────────────────
function webPageSchema(title: string, desc: string, path: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url: `${BASE_URL}${path}`,
    isPartOf: { ...WEBSITE_SCHEMA, '@id': `${BASE_URL}/#website` },
    about: { ...ORGANIZATION_SCHEMA, '@id': `${BASE_URL}/#organization` },
    datePublished: '2026-06-01',
    dateModified: new Date().toISOString().split('T')[0],
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type PageSchema =
  | 'website'       // Landing page
  | 'features'      // Features + FAQ
  | 'pricing'       // Pricing + Product
  | 'docs'          // API reference docs
  | 'changelog'     // Blog/changelog
  | 'contact'        // Contact + FAQ
  | 'terms'         // Legal
  | 'privacy'        // Legal
  | 'login'          // Auth
  | 'none';          // No extra schema (just og tags)

interface SeoHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  schema?: PageSchema;
  /** Override or supplement the default schemas with extra ones */
  extraSchemas?: object[];
  /** Breadcrumb items — first item is always the site root */
  breadcrumbs?: { name: string; url: string }[];
}

export default function SeoHead({
  title,
  description = DEFAULT_DESC,
  canonical = '/',
  ogImage,
  ogType = 'website',
  noindex = false,
  schema = 'none',
  extraSchemas = [],
  breadcrumbs = [],
}: SeoHeadProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
  const canonicalUrl = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;

  // Build the schema list based on page type
  const schemas: object[] = [ORGANIZATION_SCHEMA];

  if (schema === 'website') {
    schemas.push({ ...WEBSITE_SCHEMA, '@id': `${BASE_URL}/#website` });
    schemas.push(webPageSchema(fullTitle, description, canonical));
  } else if (schema === 'features') {
    schemas.push(
      webPageSchema(fullTitle, description, canonical),
      faqSchema(FEATURES_FAQS),
    );
  } else if (schema === 'pricing') {
    schemas.push(
      webPageSchema(fullTitle, description, canonical),
      productSchema(PRICING_PLANS),
      faqSchema(PRICING_FAQS),
    );
  } else if (schema === 'docs') {
    schemas.push(
      webPageSchema(fullTitle, description, canonical),
      API_DOC_SCHEMA,
    );
  } else if (schema === 'changelog') {
    schemas.push(
      webPageSchema(fullTitle, description, canonical),
      API_DOC_SCHEMA,
    );
  } else if (schema === 'contact') {
    schemas.push(
      webPageSchema(fullTitle, description, canonical),
      faqSchema(CONTACT_FAQS),
    );
  } else if (schema === 'terms' || schema === 'privacy') {
    schemas.push(webPageSchema(fullTitle, description, canonical));
  }

  schemas.push(...extraSchemas);

  // Breadcrumbs schema if provided
  if (breadcrumbs.length > 0) {
    schemas.push(breadcrumbSchema([{ name: 'Home', url: '/' }, ...breadcrumbs]));
  }

  return (
    <Helmet>
      {/* Primary meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      {ogImage && <meta property="og:image" content={`${BASE_URL}${ogImage}`} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter / X Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={`${BASE_URL}${ogImage}`} />}
      <meta name="twitter:site" content="@fidstream" />
      <meta name="twitter:creator" content="@fidstream" />

      {/* AI / Perplexity specific */}
      <meta name="ai-domain" content="whatsapp.fidscript.com" />

      {/* Structured Data — all schemas for this page */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}

      {/* FIDScript — explicit product schema under Next Mavens */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'FIDScript WhatsApp API',
          url: BASE_URL,
          description: 'Sustainable, affordable WhatsApp Business API for Kenyan developers. Send and receive messages programmatically via REST API with M-Pesa billing, webhooks, and real-time analytics.',
          applicationCategory: 'DeveloperApplication',
          applicationSubCategory: 'CommunicationAPI',
          operatingSystem: 'REST API (platform-independent)',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'KES',
            description: 'Free trial — 500 welcome tokens. No credit card required.',
            availability: 'https://schema.org/InStock',
          },
          isPartOf: {
            '@type': 'Product',
            name: 'FIDScript API Solutions',
            description: 'FIDScript is a developer-focused WhatsApp API platform. Part of the Next Mavens suite of sustainable, affordable tools built for the African market.',
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
          keywords: 'whatsapp api, kenya, mpesa, developer tools, automation, messaging api, business communication, rest api, kenyan developers',
          about: {
            '@type': 'Thing',
            name: 'WhatsApp Business API for Africa',
            description: 'Programmatic WhatsApp messaging for Kenyan and African businesses — affordable, sustainable, built by Kenyan developers',
          },
        })}
      </script>
    </Helmet>
  );
}

// ─── Pricing plans data (for Schema.org product schema) ───────────────────────
const PRICING_PLANS = [
  { name: 'Starter', price: '100', desc: '1,000 tokens. Perfect for trying out the API.' },
  { name: 'Growth', price: '900', desc: '11,000 tokens (10,000 + 1,000 bonus). For growing businesses.' },
  { name: 'Scale', price: '4000', desc: '60,000 tokens (50,000 + 10,000 bonus). For high-volume messaging.' },
  { name: 'Enterprise', price: '0', desc: 'Custom volume. Dedicated support and SLA.' },
];

// ─── Page-specific FAQ content ────────────────────────────────────────────────
const FEATURES_FAQS = [
  { q: 'How does FIDScript connect to WhatsApp?', a: 'FIDScript provides a REST API that connects to WhatsApp through a secure gateway. You link your WhatsApp Business account via QR code pairing and then send and receive messages through our API.' },
  { q: 'What messaging types are supported?', a: 'FIDScript supports text, images, audio, video, documents, locations, contacts, reactions, polls, stickers, and status messages — for both one-on-one and group conversations.' },
  { q: 'How does M-Pesa billing work?', a: 'You purchase token packages via M-Pesa STK Push. Each outbound message consumes one token. There are no monthly fees, and tokens never expire as long as your account is active.' },
  { q: 'Is there a free trial?', a: 'Yes — new accounts receive 500 free welcome tokens. No payment is required to get started.' },
  { q: 'Can I use my own WhatsApp number?', a: 'Yes. You connect your existing WhatsApp number by scanning a QR code from your phone — no new SIM or number required.' },
];

const PRICING_FAQS = [
  { q: 'Do tokens expire?', a: 'Tokens expire after 12 months of account inactivity. As long as you log in at least once a year, your token balance remains valid.' },
  { q: 'Can I get a refund?', a: 'Package purchases are final and non-refundable. We recommend starting with the smallest package to test the service before committing.' },
  { q: 'How are tokens consumed?', a: 'Each outbound WhatsApp message consumes 1 token, regardless of type. Inbound messages are always free.' },
  { q: 'What payment methods do you accept?', a: 'We currently accept M-Pesa via Tuma STK Push for Kenyan businesses. Card payments are not currently supported.' },
  { q: 'Are there monthly fees?', a: 'No. FIDScript has no monthly subscription fees. You only pay for the tokens you purchase.' },
];

const CONTACT_FAQS = [
  { q: 'How do I get technical support?', a: 'Submit the contact form above or email info@nextmavens.com. We respond to technical questions within 2–3 business days.' },
  { q: 'Can I request a custom integration?', a: 'Yes. Contact us with your requirements and our team will assess feasibility. Custom integrations are handled on a case-by-case basis.' },
  { q: 'Do you offer onboarding assistance?', a: 'Yes. Growth and Scale plan customers receive dedicated onboarding support. Contact us to schedule a session.' },
];
