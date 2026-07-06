/**
 * SeoHead — composes SeoHeadMeta + SeoHeadStructuredData + SeoHeadIcons.
 * Thin component; all meta tag rendering delegated to sub-components.
 */
import { BASE_URL, SITE_NAME, DEFAULT_DESC, type PageSchema } from './constants';
import { SeoHeadMeta } from './SeoHeadMeta';
import { SeoHeadStructuredData } from './SeoHeadStructuredData';
import { SeoHeadIcons } from './SeoHeadIcons';

export type { PageSchema } from './constants';
export { BASE_URL, SITE_NAME, DEFAULT_DESC };

export interface SeoHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  schema?: PageSchema;
  extraSchemas?: object[];
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

  return (
    <>
      <SeoHeadMeta
        fullTitle={fullTitle}
        description={description}
        canonicalUrl={canonicalUrl}
        ogImage={ogImage}
        ogType={ogType}
        noindex={noindex}
      />
      <SeoHeadStructuredData
        schema={schema}
        extraSchemas={extraSchemas}
        breadcrumbs={breadcrumbs}
        fullTitle={fullTitle}
        description={description}
        canonicalUrl={canonicalUrl}
      />
      <SeoHeadIcons />
    </>
  );
}
