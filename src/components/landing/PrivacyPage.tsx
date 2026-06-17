import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[#8a886a] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <img src="/logo.png" alt="FIDScript" className="h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">FIDSCRIPT</span>
              <span className="text-[9px] text-yellow-500">by Next Mavens</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
            <p className="text-[#8a886a] text-sm">Last updated: June 2026</p>
          </div>

          <div className="space-y-10 leading-relaxed text-sm md:text-base text-[#a8a594]">
            {[
              {
                title: '1. Introduction',
                content: `Next Mavens ("we," "us," or "our") operates FIDScript, a WhatsApp API platform for Kenyan businesses. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.`
              },
              {
                title: '2. Information We Collect',
                content: `We collect the following types of information:

(a) Account Information: name, email address, phone number, and business details provided during registration.

(b) Usage Data: messages sent and received, API call logs, instance connection status, token usage, and analytics data.

(c) Contact Information: phone numbers and contact details you import into the platform.

(d) Payment Information: M-Pesa transaction references processed via Tuma API. We do not store full payment card details.

(e) Device & Connection Data: IP addresses, browser type, and device identifiers for security and analytics.`
              },
              {
                title: '3. How We Use Your Information',
                content: `We use your information to:
• Provide and maintain the Service
• Process token purchases and manage billing
• Send and receive WhatsApp messages on your behalf
• Notify you of account-related updates and security alerts
• Improve, personalise, and analyse the Service
• Detect, prevent, and address technical issues or fraud
• Comply with legal obligations`
              },
              {
                title: '4. How We Share Your Information',
                content: `We do not sell your personal data. We may share information with:

(a) Evolution API: Your message content and phone numbers are processed by the Evolution WhatsApp gateway to deliver messages.

(b) Tuma API (M-Pesa): Payment-related data is shared with Tuma to process STK Push payments.

(c) Service Providers: Third-party vendors who assist with email delivery (Resend), cloud hosting, and analytics.

(d) Legal Requirements: When required by Kenyan law, court order, or to protect our legal rights.

All third parties are contractually bound to use your data only for the purpose of providing services to us.`
              },
              {
                title: '5. Data Retention',
                content: `We retain your data for as long as your account is active or as needed to provide Services. Message content is retained for 90 days. Analytics data is retained for 12 months. Payment records are retained for 7 years per Kenyan tax law requirements. You may request deletion of your data at any time by contacting info@nextmavens.com.`
              },
              {
                title: '6. Data Security',
                content: `We implement industry-standard security measures including SSL/TLS encryption in transit, role-based access controls, regular security audits, and secure storage of credentials. No method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`
              },
              {
                title: '7. Cookies & Tracking',
                content: `We use minimal cookies for authentication and session management. We use anonymised analytics to understand Service usage patterns. You may disable cookies in your browser, but some features may not function properly.`
              },
              {
                title: '8. WhatsApp / Meta Data',
                content: `Messages sent through FIDScript are subject to WhatsApp's Business Solution terms and Meta's Privacy Policy. We encourage you to review WhatsApp's policies regarding data handling for business accounts.`
              },
              {
                title: '9. Your Rights (Kenyan Data Protection)',
                content: `Under Kenya's Data Protection Act, 2019, you have the right to:
• Access your personal data
• Request correction of inaccurate data
• Request deletion of your data (subject to legal retention requirements)
• Withdraw consent where processing is consent-based
• Lodge a complaint with the Office of the Data Protection Commissioner

To exercise any of these rights, contact us at info@nextmavens.com.`
              },
              {
                title: "10. Children's Privacy",
                content: `The Service is not intended for persons under the age of 18. We do not knowingly collect data from minors.`
              },
              {
                title: '11. International Transfers',
                content: `Our servers are located in Kenya. Some third-party processors (including Resend and Evolution API) may process data outside Kenya. We ensure appropriate safeguards are in place for such transfers.`
              },
              {
                title: '12. Changes to This Policy',
                content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this Policy periodically.`
              },
              {
                title: '13. Contact Us',
                content: `For privacy-related questions, data access requests, or to report a security issue:

Next Mavens
Email: info@nextmavens.com
Phone: +254 746 269 657
Website: whatsapp.fidscript.com`
              },
            ].map(({ title, content }) => (
              <section key={title}>
                <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
                <div className="whitespace-pre-line text-[#a8a594]">{content}</div>
              </section>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
