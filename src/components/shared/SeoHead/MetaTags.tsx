/**
 * MetaTags - plain meta tag generation (title, description, canonical, robots).
 * No Open Graph or schema - those live in their own modules.
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://whatsapp.fidscript.com';
const SITE_NAME = 'FIDScript WhatsApp API';
const DEFAULT_DESC =
  'WhatsApp API platform for Kenyan businesses. Send and receive messages programmatically with REST API, webhooks, M-Pesa billing, and real-time analytics.';

export interface MetaTagsProps {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

export function MetaTags({
  title,
  description = DEFAULT_DESC,
  canonical = '/',
  noindex = false,
}: MetaTagsProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} - ${SITE_NAME}`;
  const canonicalUrl = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

export { BASE_URL, SITE_NAME, DEFAULT_DESC };
