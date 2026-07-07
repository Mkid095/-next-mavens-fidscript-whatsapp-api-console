/**
 * OpenGraph — Open Graph + Twitter Card meta tags.
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://whatsapp.fidscript.com';
const SITE_NAME = 'FIDScript WhatsApp API';

export interface OpenGraphProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl: string;
}

export function OpenGraph({
  title,
  description,
  ogImage,
  ogType = 'website',
  canonicalUrl,
}: OpenGraphProps) {
  return (
    <Helmet>
      {/* Open Graph */}
      <meta property="og:title" content={title} />
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
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={`${BASE_URL}${ogImage}`} />}
      <meta name="twitter:site" content="@fidstream" />
      <meta name="twitter:creator" content="@fidstream" />

      {/* AI / Perplexity specific */}
      <meta name="ai-domain" content="whatsapp.fidscript.com" />
    </Helmet>
  );
}

export { BASE_URL, SITE_NAME };
