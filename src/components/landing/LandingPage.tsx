import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { authApi } from '../../services/api';
import Header from './Header';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import CliInstallSection from './CliInstallSection';
import SeoHead from '../shared/SeoHead';

interface Stats {
  totalClients: number;
  totalMessages: number;
  deliveryRate: number;
  uptime: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalClients: 0, totalMessages: 0, deliveryRate: 0, uptime: '99.9%' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authApi.adminStats();
        if (res.success && res.data) {
          setStats({
            totalClients: res.data.total_clients || 0,
            totalMessages: res.data.total_messages || 0,
            deliveryRate: res.data.delivery_rate || 98,
            uptime: res.data.uptime || '99.9%',
          });
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };
    fetchStats();
  }, []);

  const handleScroll = () => setScrolled(window.scrollY > 50);

  return (
    <div className="min-h-screen bg-[#11110a] text-[#cbd3cf] font-suisse-intl antialiased selection:bg-yellow-250 selection:text-stone-950">
      <SeoHead
        title="FIDScript — WhatsApp API & AI Chatbots for Kenyan Businesses"
        description="Send WhatsApp messages and automate responses with AI chatbots. FIDScript provides WhatsApp API, AI chatbot builders, M-Pesa billing, REST API, webhooks, and real-time analytics for Kenyan businesses."
        canonical="/"
        schema="website"
      />
      <Header scrolled={scrolled} onScroll={handleScroll} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-dot-matrix opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[96px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
            >
              WhatsApp API &{' '}
              <span className="gradient-headline-text">AI Chatbots</span> for{' '}
              <span className="gradient-headline-text">Kenyan Businesses</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-[#a8a594] max-w-2xl mx-auto mb-10"
            >
              Send WhatsApp messages programmatically and automate responses with AI chatbots. Connect your business to millions of Kenyan customers through a simple, powerful API.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-[#1b1910] hover:bg-[#262412] border border-[#383416] text-white font-semibold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Login
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.totalClients}</div>
                <div className="text-xs md:text-sm text-[#85826f]">Active Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.totalMessages.toLocaleString()}</div>
                <div className="text-xs md:text-sm text-[#85826f]">Messages Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-500 mb-1">{stats.deliveryRate}%</div>
                <div className="text-xs md:text-sm text-[#85826f]">Delivery Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.uptime}</div>
                <div className="text-xs md:text-sm text-[#85826f]">Uptime</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <FeaturesSection />
      <FAQSection />
      <PricingSection />
      <CliInstallSection />
      <CTASection />
    </div>
  );
}
