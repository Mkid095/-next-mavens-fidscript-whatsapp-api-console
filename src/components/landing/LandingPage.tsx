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

      {/* Hero Section - gradient fallback always visible; image blends in via multiply */}
      <section
        className="relative h-screen flex items-start justify-center overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #fff8f0 0%, #ffe9d1 35%, #fed7aa 70%, #fdba74 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/f65o17cm/image/upload/v1785451807/hero_ks4rrp.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'multiply',
            opacity: 0.9,
          }}
        />

        <div className="absolute top-24 -right-20 w-96 h-96 bg-[#f97316] opacity-15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-32 -left-20 w-[28rem] h-[28rem] bg-[#fb923c] opacity-20 rounded-full blur-3xl pointer-events-none" />

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
            className="text-[clamp(32px,5vw,64px)] font-bold text-[#1a1a1a] leading-[110%] tracking-[-2px] max-w-3xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            WhatsApp API at{' '}
            <span className="text-[#ea580c]">KES 0.11</span> per message
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-[#525252] leading-[150%] max-w-xl font-medium"
          >
            Send WhatsApp messages programmatically. Connect your business to millions of Kenyan customers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3"
          >
            <button
              onClick={() => navigate('/register')}
              className="px-7 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-sm rounded-full transition-colors flex items-center gap-2 shadow-sm"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 text-[#1a1a1a] font-medium text-sm rounded-full transition-colors border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 bg-white/40 hover:bg-white/60 backdrop-blur-sm"
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