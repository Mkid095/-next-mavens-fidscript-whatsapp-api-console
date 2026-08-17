import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import Header from './Header';
import ProductIntroSection from './ProductIntroSection';
import TrustBrandsSection from './TrustBrandsSection';
import UseCasesSection from './UseCasesSection';
import StatsSection from './StatsSection';
import FeaturesSection from './FeaturesSection';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import PricingSection from './PricingSection';
import CTASection from './CTASection';
import Footer from './Footer';
import SeoHead from '../shared/SeoHead';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = () => setScrolled(window.scrollY > 50);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] antialiased">
      <SeoHead
        title="FIDScript - WhatsApp API for Kenyan Businesses"
        description="Send WhatsApp messages programmatically at KES 0.11 per message. FIDScript provides WhatsApp API, REST webhooks, M-Pesa billing, and real-time analytics for Kenyan businesses."
        canonical="/"
        schema="website"
      />
      <Header scrolled={scrolled} onScroll={handleScroll} />

      {/* Hero Section */}
      <section className="relative h-screen flex items-start justify-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/f65o17cm/image/upload/v1785451807/hero_ks4rrp.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 flex flex-col items-center text-center">
          <img
            src="https://res.cloudinary.com/f65o17cm/image/upload/v1785452001/logo_w0ttyq.png"
            alt="FIDScript"
            className="h-12 mb-6"
          />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[clamp(24px,4vw,48px)] font-bold text-white leading-[110%] tracking-[-2px] max-w-3xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            WhatsApp API at{' '}
            <span className="text-[#fb923c]">KES 0.11</span> per message
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-white/80 leading-[150%] max-w-xl"
          >
            Send WhatsApp messages programmatically. Connect your business to millions of Kenyan customers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-col sm:flex-row items-center gap-3"
          >
            <button
              onClick={() => navigate('/register')}
              className="px-7 py-3 bg-[#f97316] hover:bg-[#fb923c] text-[#1a1a1a] font-bold text-sm rounded-full transition-colors flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 text-white font-medium text-sm rounded-full transition-colors border border-white/30 hover:border-white/60"
            >
              Login
            </button>
          </motion.div>
        </div>
      </section>

      <ProductIntroSection />
      <TrustBrandsSection />
      <UseCasesSection />
      <StatsSection />
      <TestimonialsSection />
      <FeaturesSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
