// Generate static /terms HTML page for Google OAuth verification crawlers
// and users who hit the URL without JS. Keeps content in sync with React TermsPage.
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://whatsapp.fidscript.com';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using FIDScript ("the Service"), a product of Next Mavens ("we," "us," or "our"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use the Service.`,
  },
  {
    title: '2. Description of Service',
    content: `FIDScript provides a WhatsApp API gateway for Kenyan businesses. The Service allows users to send and receive WhatsApp messages programmatically, manage multiple WhatsApp instances, and integrate with third-party applications via our REST API.`,
  },
  {
    title: '3. Account Registration',
    content: `You must register for an account to access the Service. You agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`,
  },
  {
    title: '4. Token-Based Billing',
    content: `The Service uses a token-based billing system. Tokens are consumed when sending messages through the API. Package purchases are final and non-refundable unless otherwise stated. Token balances have no cash value and expire after 12 months of account inactivity.`,
  },
  {
    title: '5. Acceptable Use',
    content: `You agree NOT to use the Service to:
• Send unsolicited bulk messages or spam
• Harass, defame, or threaten any person
• Distribute illegal or prohibited content
• Violate WhatsApp's Terms of Service
• Attempt to reverse engineer or exploit the API
• Use the Service for any unlawful purpose

We reserve the right to suspend or terminate accounts that violate these restrictions.`,
  },
  {
    title: '6. API Usage & Rate Limits',
    content: `Your use of the API is subject to rate limits as defined in your selected plan. Exceeding rate limits may result in temporary throttling. We reserve the right to adjust rate limits with reasonable notice.`,
  },
  {
    title: '7. Third-Party Services',
    content: `The Service integrates with M-Pesa (via Tuma API) for payments, WhatsApp/Meta for message delivery, and Google APIs (Contacts API and OAuth 2.0) for the optional contact-import feature. We are not responsible for the availability, accuracy, or reliability of third-party services.

By using the Google Contacts import feature, you acknowledge that:
• You authorize FIDScript to access your Google account via Google OAuth 2.0
• We only request read-only access to your contacts (scope: contacts.readonly)
• Imported contact data is used solely within FIDScript and is not shared with third parties
• You may revoke FIDScript's access at any time via your Google Account permissions page`,
  },
  {
    title: '8. Data & Privacy',
    content: `Your use of the Service is also governed by our Privacy Policy. We collect phone numbers, message content, and contact information solely for providing the Service. We do not sell personal data to third parties.`,
  },
  {
    title: '9. Liability',
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. NEXT MAVENS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE. IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNTS PAID BY YOU IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.`,
  },
  {
    title: '10. Account Termination',
    content: `We may suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms, or for any other reason at our sole discretion. Upon termination, your right to use the Service ceases immediately.`,
  },
  {
    title: '11. Amendments',
    content: `We may update these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.`,
  },
  {
    title: '12. Governing Law',
    content: `These Terms shall be governed by the laws of Kenya. Any disputes arising from these Terms shall be resolved in the courts of Kenya.`,
  },
  {
    title: '13. Contact',
    content: `For questions about these Terms, contact us at:
Next Mavens
Email: info@nextmavens.com
Phone: +254 746 269 657`,
  },
];

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Next Mavens',
  url: 'https://nextmavens.com',
  logo: `${BASE_URL}/logo.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@nextmavens.com',
    telephone: '+254746269657',
    contactType: 'customer support',
  },
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms & Conditions — FIDScript',
  description: 'FIDScript Terms & Conditions — API usage, token billing, acceptable use policy, third-party integrations including Google OAuth, and governing law.',
  url: `${BASE_URL}/terms`,
  isPartOf: { '@id': `${BASE_URL}/#website` },
  about: { '@id': `${BASE_URL}/#organization` },
  datePublished: '2026-06-01',
  dateModified: new Date().toISOString().split('T')[0],
};

const sectionsHtml = SECTIONS.map(({ title, content }) => `
      <section style="margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.125rem; font-weight: 700; color: #fff; margin-bottom: 0.75rem;">${title}</h2>
        <div style="white-space: pre-line; color: #a8a594;">${content}</div>
      </section>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#0c0b06" />
<meta name="color-scheme" content="dark" />
<title>Terms & Conditions — FIDScript by Next Mavens</title>
<meta name="description" content="FIDScript Terms & Conditions — API usage, token billing, acceptable use policy, third-party integrations including Google OAuth, and governing law for Kenyan businesses." />
<link rel="canonical" href="${BASE_URL}/terms" />
<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<meta property="og:title" content="Terms & Conditions — FIDScript by Next Mavens" />
<meta property="og:description" content="API usage, token billing, acceptable use policy, third-party integrations including Google OAuth, and governing law." />
<meta property="og:type" content="article" />
<meta property="og:url" content="${BASE_URL}/terms" />
<meta property="og:site_name" content="FIDScript WhatsApp API" />
<meta property="og:locale" content="en_KE" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Terms & Conditions — FIDScript by Next Mavens" />
<meta name="twitter:description" content="API usage, token billing, acceptable use policy, third-party integrations including Google OAuth, and governing law." />
<script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>
<script type="application/ld+json">${JSON.stringify(webPageSchema)}</script>
<style>
  body { margin: 0; background: #0c0b06; color: #cbd3cf; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.6; }
  a { color: #eab308; text-decoration: none; }
  a:hover { text-decoration: underline; }
  header { position: sticky; top: 0; z-index: 50; background: rgba(12,11,6,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #262413; }
  main { max-width: 56rem; margin: 0 auto; padding: 3rem 1rem; }
  h1 { font-size: 2rem; color: #fff; margin: 0 0 0.75rem; font-weight: 700; }
  @media (min-width: 768px) { h1 { font-size: 2.25rem; } main { padding: 4rem 1rem; } }
</style>
</head>
<body>
<header>
  <div style="max-width: 56rem; margin: 0 auto; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
    <a href="/" style="color: #8a886a; font-size: 0.875rem;">← Back to Home</a>
    <div style="margin-left: auto; display: flex; align-items: center; gap: 0.75rem;">
      <img src="/logo.png" alt="FIDScript" style="height: 2rem;" />
      <div style="display: flex; flex-direction: column; line-height: 1.1;">
        <span style="font-weight: 700; font-size: 0.875rem; color: #fff;">FIDSCRIPT</span>
        <span style="font-size: 9px; color: #eab308;">by Next Mavens</span>
      </div>
    </div>
  </div>
</header>
<main>
  <div style="margin-bottom: 2.5rem;">
    <h1>Terms & Conditions</h1>
    <p style="color: #8a886a; font-size: 0.875rem;">Last updated: July 2026</p>
  </div>
  <div style="font-size: 0.875rem;">${sectionsHtml}
  </div>
</main>
</body>
</html>
`;

const outDir = path.join(__dirname, '..', 'dist', 'terms');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Static terms page written to', path.join(outDir, 'index.html'));
