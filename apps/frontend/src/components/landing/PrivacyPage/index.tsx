/**
 * PrivacyPage — thin shell with page chrome and motion wrapper.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import SeoHead from '../../shared/SeoHead.js';
import { PrivacyContent } from './PrivacyContent.js';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Privacy Policy"
        description="FIDScript Privacy Policy — data collection, M-Pesa payment handling, third-party sharing disclosures, Kenyan DPA compliance, and your data rights."
        canonical="/privacy"
        schema="privacy"
        breadcrumbs={[{ name: 'Privacy', url: '/privacy' }]}
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
            <p className="text-[#8a886a] text-sm">Last updated: July 2026</p>
          </div>
          <PrivacyContent />
        </motion.div>
      </main>
    </div>
  );
}
