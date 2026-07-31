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
import { useLandingStats } from './useLandingStats';
import { trustedBrands } from './brands-data';
import { useCases } from './useCases-data';
import { stats } from './stats-data';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const landingStats = useLandingStats();

  const handleScroll = () => setScrolled(window.scrollY > 50);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] antialiased">
      <SeoHead
        title="FIDScript — WhatsApp API for Kenyan Businesses"
        description="Send WhatsApp messages programmatically at KES 0.11 per message. FIDScript provides WhatsApp API, REST webhooks, M-Pesa billing, and real-time analytics for Kenyan businesses."
        canonical="/"
        schema="website"
      />
      <Header scrolled={scrolled} onScroll={handleScroll} />

      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex flex-col justify-end pb-0 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/f65o17cm/image/upload/v1785451807/hero_ks4rrp.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="relative pt-32 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <img
              src="https://res.cloudinary.com/f65o17cm/image/upload/v1785452001/logo_w0ttyq.png"
              alt="FIDScript"
              className="h-12 mb-[18px]"
            />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[clamp(48px,6vw,74px)] font-bold text-[#1a1a1a] leading-[110%] tracking-[-2px] max-w-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              WhatsApp API at <span className="text-[#eab308]">KES 0.11</span> per message
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-[20px] text-[#1a1a1a]/75 leading-[150%] max-w-2xl"
            >
              Send WhatsApp messages programmatically. Connect your business to millions of Kenyan customers through a simple, powerful API.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-[34px] flex flex-col sm:flex-row items-start gap-4"
            >
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-[#eab308] hover:bg-[#facc15] text-[#1a1a1a] font-bold text-base rounded-full transition-colors flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 text-[#1a1a1a] font-medium text-base rounded-full transition-colors border border-[#e5e5e5] hover:border-[#d4d4d4]"
              >
                Login
              </button>
            </motion.div>
          </div>
        </div>
        <div className="h-[70px]" />
      </section>

      <ProductIntroSection />
      <TrustBrandsSection brands={trustedBrands} />
      <UseCasesSection useCases={useCases} />
      <StatsSection stats={stats} />
      <TestimonialsSection />
      <FeaturesSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
