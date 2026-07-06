/**
 * SeoHeadIcons — favicon, apple-touch-icon, and manifest link tags.
 *
 * Note: most icon links are rendered in index.html <head> so they are
 * consistent across all pages.  This component is available for page-level
 * overrides when a specific route needs custom icons.
 */
import { Helmet } from 'react-helmet-async';
import { BASE_URL } from './constants';

export function SeoHeadIcons() {
  return (
    <Helmet>
      {/* Add per-page icon overrides here if needed, e.g.:
      <link rel="icon" type="image/png" href={`${BASE_URL}/favicon-custom.png`} />
      <link rel="apple-touch-icon" href={`${BASE_URL}/apple-touch-icon.png`} />
      <link rel="manifest" href={`${BASE_URL}/manifest.json`} />
      */}
    </Helmet>
  );
}
