/**
 * SeoHeadMeta — renders all <meta> tags: description, Open Graph, Twitter Card.
 */
import { Helmet } from 'react-helmet-async';
import { BASE_URL, SITE_NAME } from './constants';

interface Props {
  fullTitle: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

export function SeoHeadMeta({
  fullTitle,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noindex = false,
}: Props) {
  return (
    <Helmet>
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

      {/* AI / Perplexity */}
      <meta name="ai-domain" content="whatsapp.fidscript.com" />
    </Helmet>
  );
}
