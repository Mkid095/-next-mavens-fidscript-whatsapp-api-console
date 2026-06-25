import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import SeoHead from '../shared/SeoHead';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Terms & Conditions"
        description="FIDScript Terms & Conditions — API usage, token billing, acceptable use policy, liability, account termination, and governing law for Kenyan businesses."
        canonical="/terms"
        schema="terms"
        breadcrumbs={[{ name: 'Terms', url: '/terms' }]}
      />
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Terms & Conditions</h1>
            <p className="text-[#8a886a] text-sm">Last updated: June 2026</p>
          </div>

          <div className="space-y-10 text-[#a8a594] leading-relaxed text-sm md:text-base">
            {[
              {
                title: '1. Acceptance of Terms',
                content: `By accessing or using FIDScript ("the Service"), a product of Next Mavens ("we," "us," or "our"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use the Service.`
              },
              {
                title: '2. Description of Service',
                content: `FIDScript provides a WhatsApp API gateway for Kenyan businesses. The Service allows users to send and receive WhatsApp messages programmatically, manage multiple WhatsApp instances, and integrate with third-party applications via our REST API.`
              },
              {
                title: '3. Account Registration',
                content: `You must register for an account to access the Service. You agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`
              },
              {
                title: '4. Token-Based Billing',
                content: `The Service uses a token-based billing system. Tokens are consumed when sending messages through the API. Package purchases are final and non-refundable unless otherwise stated. Token balances have no cash value and expire after 12 months of account inactivity.`
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

We reserve the right to suspend or terminate accounts that violate these restrictions.`
              },
              {
                title: '6. API Usage & Rate Limits',
                content: `Your use of the API is subject to rate limits as defined in your selected plan. Exceeding rate limits may result in temporary throttling. We reserve the right to adjust rate limits with reasonable notice.`
              },
              {
                title: '7. Third-Party Services',
                content: `The Service integrates with M-Pesa (via Tuma API) for payments, and WhatsApp for message delivery. We are not responsible for the availability, accuracy, or reliability of third-party services.`
              },
              {
                title: '8. Data & Privacy',
                content: `Your use of the Service is also governed by our Privacy Policy. We collect phone numbers, message content, and contact information solely for providing the Service. We do not sell personal data to third parties.`
              },
              {
                title: '9. Liability',
                content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. NEXT MAVENS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE. IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNTS PAID BY YOU IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.`
              },
              {
                title: '10. Account Termination',
                content: `We may suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms, or for any other reason at our sole discretion. Upon termination, your right to use the Service ceases immediately.`
              },
              {
                title: '11. Amendments',
                content: `We may update these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.`
              },
              {
                title: '12. Governing Law',
                content: `These Terms shall be governed by the laws of Kenya. Any disputes arising from these Terms shall be resolved in the courts of Kenya.`
              },
              {
                title: '13. Contact',
                content: `For questions about these Terms, contact us at:
Next Mavens
Email: info@nextmavens.com
Phone: +254 746 269 657`
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
