/**
 * schemas - all JSON-LD structured data helpers for SeoHead.
 * Exported as a separate module so the data constants don't bloat SeoHeadMain.
 */

const BASE_URL = 'https://whatsapp.fidscript.com';
const SITE_NAME = 'FIDScript WhatsApp API';
const DEFAULT_DESC =
  'WhatsApp API platform for Kenyan businesses. Send and receive messages programmatically with REST API, webhooks, M-Pesa billing, and real-time analytics.';

// ─── Organization (used site-wide) ───────────────────────────────────────────
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Next Mavens',
  url: 'https://nextmavens.com',
  logo: `${BASE_URL}/logo.png`,
  description:
    'Next Mavens builds sustainable, affordable developer tools and SaaS solutions for the African market. Products include FIDScript (WhatsApp API) and Next Events.',
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

// ─── WebSite with SearchAction (powers "Site:fidstream" AI queries) ────────────
export const WEBSITE_SCHEMA = {
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
export function faqSchema(questions: { q: string; a: string }[]): object {
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
export function howToSchema(title: string, steps: string[]): object {
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
export function breadcrumbSchema(items: { name: string; url: string }[]): object {
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
export function productSchema(
  plans: { name: string; price: string; desc: string }[],
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: SITE_NAME,
    description: 'WhatsApp API platform - token-based messaging for Kenyan businesses',
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
export function blogPostingSchema(
  versions: { version: string; date: string; summary: string }[],
): object {
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

// ─── ApiDocument (OpenAPI) schema for docs page ───────────────────────────────
export const API_DOC_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  name: 'FIDScript WhatsApp API Reference',
  description:
    'Complete REST API reference for FIDScript WhatsApp platform - messaging, groups, contacts, profile, and instance management.',
  url: `${BASE_URL}/docs`,
  publisher: ORGANIZATION_SCHEMA,
  programmingLanguage: 'REST',
  about: {
    '@type': 'Thing',
    name: 'WhatsApp Business API',
    description: 'Programmatic WhatsApp messaging for businesses',
  },
};

// ─── Perplexity/AI-friendly full page description ───────────────────────────
export function webPageSchema(title: string, desc: string, path: string): object {
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

// ─── Page-specific FAQ content ────────────────────────────────────────────────
export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '100',
    desc: '1,000 tokens. Perfect for trying out the API.',
  },
  {
    name: 'Growth',
    price: '900',
    desc: '11,000 tokens (10,000 + 1,000 bonus). For growing businesses.',
  },
  {
    name: 'Scale',
    price: '4000',
    desc: '60,000 tokens (50,000 + 10,000 bonus). For high-volume messaging.',
  },
  {
    name: 'Enterprise',
    price: '0',
    desc: 'Custom volume. Dedicated support and SLA.',
  },
];

export const FEATURES_FAQS = [
  {
    q: 'How does FIDScript connect to WhatsApp?',
    a: 'FIDScript provides a REST API that connects to WhatsApp through a secure gateway. You link your WhatsApp Business account via QR code pairing and then send and receive messages through our API.',
  },
  {
    q: 'What messaging types are supported?',
    a: 'FIDScript supports text, images, audio, video, documents, locations, contacts, reactions, polls, stickers, and status messages - for both one-on-one and group conversations.',
  },
  {
    q: 'How does M-Pesa billing work?',
    a: 'You purchase token packages via M-Pesa STK Push. Each outbound message consumes one token. There are no monthly fees, and tokens never expire as long as your account is active.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes - new accounts receive 500 free welcome tokens. No payment is required to get started.',
  },
  {
    q: 'Can I use my own WhatsApp number?',
    a: 'Yes. You connect your existing WhatsApp number by scanning a QR code from your phone - no new SIM or number required.',
  },
];

export const PRICING_FAQS = [
  {
    q: 'Do tokens expire?',
    a: 'Tokens expire after 12 months of account inactivity. As long as you log in at least once a year, your token balance remains valid.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Package purchases are final and non-refundable. We recommend starting with the smallest package to test the service before committing.',
  },
  {
    q: 'How are tokens consumed?',
    a: 'Each outbound WhatsApp message consumes 1 token, regardless of type. Inbound messages are always free.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We currently accept M-Pesa via Tuma STK Push for Kenyan businesses. Card payments are not currently supported.',
  },
  {
    q: 'Are there monthly fees?',
    a: 'No. FIDScript has no monthly subscription fees. You only pay for the tokens you purchase.',
  },
];

export const CONTACT_FAQS = [
  {
    q: 'How do I get technical support?',
    a: 'Submit the contact form above or email info@nextmavens.com. We respond to technical questions within 2–3 business days.',
  },
  {
    q: 'Can I request a custom integration?',
    a: 'Yes. Contact us with your requirements and our team will assess feasibility. Custom integrations are handled on a case-by-case basis.',
  },
  {
    q: 'Do you offer onboarding assistance?',
    a: 'Yes. Growth and Scale plan customers receive dedicated onboarding support. Contact us to schedule a session.',
  },
];

export { BASE_URL, SITE_NAME, DEFAULT_DESC };
