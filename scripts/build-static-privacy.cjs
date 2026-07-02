// Generate static /privacy HTML page for Google OAuth verification crawlers
// and users who hit the URL without JS. Keeps content in sync with React PrivacyPage.
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://whatsapp.fidscript.com';

const SECTIONS = [
  {
    title: '1. Introduction',
    content: `Next Mavens ("we," "us," or "our") operates FIDScript, a WhatsApp API platform for Kenyan businesses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.`,
  },
  {
    title: '2. Information We Collect',
    content: `We collect the following types of information:

(a) Account Information: name, email address, phone number, and business details provided during registration.

(b) Usage Data: messages sent and received, API call logs, instance connection status, token usage, and analytics data.

(c) Contact Information: phone numbers and contact details you import into the platform.

(d) Payment Information: M-Pesa transaction references processed via Tuma API. We do not store full payment card details.

(e) Device & Connection Data: IP addresses, browser type, and device identifiers for security and analytics.

(f) Google Account Data (Optional): If you choose to import contacts from Google, we access your Google account profile (name, email, profile picture) and read-only access to your Google Contacts via the Google People API. We do not modify or delete contacts in your Google account.`,
  },
  {
    title: '3. How We Use Your Information',
    content: `We use your information to:
• Provide and maintain the Service
• Process token purchases and manage billing
• Send and receive WhatsApp messages on your behalf
• Import your Google Contacts (with your explicit consent) so you can use them as WhatsApp message recipients
• Notify you of account-related updates and security alerts
• Improve, personalise, and analyse the Service
• Detect, prevent, and address technical issues or fraud
• Comply with legal obligations`,
  },
  {
    title: '4. How We Share Your Information',
    content: `We do not sell your personal data. We may share information with:

(a) WhatsApp Gateway: Your message content and phone numbers are processed by our WhatsApp gateway to deliver messages.

(b) Tuma API (M-Pesa): Payment-related data is shared with Tuma to process STK Push payments.

(c) Google APIs (Limited Use Disclosure): When you link your Google account, we use the Google People API to read your contacts. Our use of data received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We only request read-only access to your contacts and use that data solely to let you select recipients for WhatsApp messages within FIDScript.

(d) Service Providers: Third-party vendors who assist with email delivery (Resend), cloud hosting, and analytics.

(e) Legal Requirements: When required by Kenyan law, court order, or to protect our legal rights.

All third parties are contractually bound to use your data only for the purpose of providing services to us.`,
  },
  {
    title: '5. Google Contacts Import (Limited Use)',
    content: `When you connect your Google account to FIDScript:

• We request the OAuth scope \`https://www.googleapis.com/auth/contacts.readonly\` which grants read-only access to your Google Contacts.

• We also request \`openid\`, \`userinfo.email\`, and \`userinfo.profile\` to identify your Google account.

• We store encrypted OAuth refresh tokens so we can sync contacts again later without re-prompting you.

• Contact data (name, phone number) is imported into your FIDScript account so you can select them as WhatsApp message recipients.

• We do NOT transfer your Google contact data to any third party, advertising network, or data broker.

• We do NOT use your Google contact data for any purpose other than providing the import feature within FIDScript.

• You can revoke our access at any time from your Google Account settings (myaccount.google.com/permissions) or by clicking "Unlink Google Account" in FIDScript.

• Our use of data received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.`,
  },
  {
    title: '6. Data Retention',
    content: `We retain your data for as long as your account is active or as needed to provide Services. Message content is retained for 90 days. Analytics data is retained for 12 months. Payment records are retained for 7 years per Kenyan tax law requirements. Imported Google Contacts are retained until you delete them from FIDScript or unlink your Google account. You may request deletion of all your data at any time by contacting info@nextmavens.com.`,
  },
  {
    title: '7. Data Security',
    content: `We implement industry-standard security measures including SSL/TLS encryption in transit, AES-256 encryption of stored OAuth tokens at rest, role-based access controls, regular security audits, and secure storage of credentials. No method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '8. Cookies & Tracking',
    content: `We use minimal cookies for authentication and session management. We use anonymised analytics to understand Service usage patterns. You may disable cookies in your browser, but some features may not function properly.`,
  },
  {
    title: '9. WhatsApp / Meta Data',
    content: `Messages sent through FIDScript are subject to WhatsApp's Business Solution terms and Meta's Privacy Policy. We encourage you to review WhatsApp's policies regarding data handling for business accounts.`,
  },
  {
    title: '10. Your Rights (Kenyan Data Protection)',
    content: `Under Kenya's Data Protection Act, 2019, you have the right to:
• Access your personal data
• Request correction of inaccurate data
• Request deletion of your data (subject to legal retention requirements)
• Withdraw consent where processing is consent-based (e.g. unlink Google account)
• Lodge a complaint with the Office of the Data Protection Commissioner

To exercise any of these rights, contact us at info@nextmavens.com.`,
  },
  {
    title: '11. Children\'s Privacy',
    content: `The Service is not intended for persons under the age of 18. We do not knowingly collect data from minors.`,
  },
  {
    title: '12. International Transfers',
    content: `Our servers are located in Kenya. Some third-party processors (including Resend and Google APIs) may process data outside Kenya. We ensure appropriate safeguards are in place for such transfers, including Google's standard data processing terms.`,
  },
  {
    title: '13. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this Policy periodically.`,
  },
  {
    title: '14. Contact Us',
    content: `For privacy-related questions, data access requests, or to report a security issue:

Next Mavens
Email: info@nextmavens.com
Phone: +254 746 269 657
Website: whatsapp.fidscript.com
Address: Nairobi, Kenya`,
  },
];

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Next Mavens',
  url: 'https://nextmavens.com',
  logo: `${BASE_URL}/logo.png`,
  description: 'Next Mavens builds sustainable, affordable developer tools and SaaS solutions for the African market.',
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
  name: 'Privacy Policy — FIDScript',
  description: 'Next Mavens / FIDScript Privacy Policy covering data collection, M-Pesa, Google Contacts import, Kenyan DPA compliance, and user rights.',
  url: `${BASE_URL}/privacy`,
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
<title>Privacy Policy — FIDScript by Next Mavens</title>
<meta name="description" content="Next Mavens / FIDScript Privacy Policy — data collection, Google Contacts import (Limited Use), M-Pesa payment handling, third-party sharing disclosures, Kenyan DPA compliance, and your data rights." />
<link rel="canonical" href="${BASE_URL}/privacy" />
<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<meta property="og:title" content="Privacy Policy — FIDScript by Next Mavens" />
<meta property="og:description" content="Data collection, Google Contacts import (Limited Use), M-Pesa billing, Kenyan DPA compliance, and your data rights." />
<meta property="og:type" content="article" />
<meta property="og:url" content="${BASE_URL}/privacy" />
<meta property="og:site_name" content="FIDScript WhatsApp API" />
<meta property="og:locale" content="en_KE" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Privacy Policy — FIDScript by Next Mavens" />
<meta name="twitter:description" content="Data collection, Google Contacts import (Limited Use), M-Pesa billing, Kenyan DPA compliance, and your data rights." />
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
    <h1>Privacy Policy</h1>
    <p style="color: #8a886a; font-size: 0.875rem;">Last updated: July 2026</p>
  </div>
  <div style="font-size: 0.875rem;">${sectionsHtml}
  </div>
</main>
</body>
</html>
`;

const outDir = path.join(__dirname, '..', 'dist', 'privacy');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Static privacy page written to', path.join(outDir, 'index.html'));
