import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Shield,
  Globe,
  MessageCircle,
  QrCode,
  Webhook,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  Users,
  Database,
  Sparkles,
  Play,
  X,
  Menu,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted?: () => void;
  onViewDemo?: () => void;
}

export default function LandingPage({ onGetStarted, onViewDemo }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Instant API Integration',
      description: 'Send WhatsApp messages with a single HTTP request. Full REST API with comprehensive documentation and SDKs.',
      code: `curl -X POST https://api.evolution.io/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"to": "+254712345678", "message": "Hello!"}'`,
    },
    {
      icon: QrCode,
      title: 'QR Code Connection',
      description: 'Connect WhatsApp instances in seconds. No complex setup — just scan and start sending.',
      code: `// Generate QR code for connection
const qr = await evolution.instances.connect('my-instance');
// Display qr.qrCodeImage to user`,
    },
    {
      icon: Webhook,
      title: 'Real-time Webhooks',
      description: 'Receive incoming messages and connection events instantly via webhooks. Build responsive chatbots and automation flows.',
      code: `{
  "event": "message",
  "instance": "my-instance",
  "data": {
    "from": "+254712345678",
    "text": "Hello there!"
  }
}`,
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track message delivery, open rates, and engagement. Full visibility into your WhatsApp operations.',
      code: `// Fetch analytics
const stats = await evolution.analytics.get({
  period: '7d',
  groupBy: 'instance'
});`,
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'KSh 2,500',
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: [
        '3 WhatsApp Instances',
        '5,000 messages/month',
        '5 msg/min rate limit',
        'Email support',
        'Basic analytics',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: 'KSh 7,500',
      period: '/month',
      description: 'For growing businesses with higher volume needs',
      features: [
        '10 WhatsApp Instances',
        '25,000 messages/month',
        '20 msg/min rate limit',
        'Priority support',
        'Advanced analytics',
        'Webhook integrations',
        'Custom rate limits',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored solutions for large organizations',
      features: [
        'Unlimited Instances',
        'Unlimited messages',
        'Dedicated infrastructure',
        '24/7 support',
        'Custom integrations',
        'SLA guarantee',
        'Dedicated account manager',
      ],
      popular: false,
    },
  ];

  const stats = [
    { value: '99.98%', label: 'Delivery Success Rate' },
    { value: '2M+', label: 'Messages Sent Monthly' },
    { value: '500+', label: 'Active Businesses' },
    { value: '24/7', label: 'Platform Uptime' },
  ];

  return (
    <div className="min-h-screen bg-[#11110a] text-[#cbd3cf] font-suisse-intl antialiased selection:bg-yellow-250 selection:text-stone-950">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#11110a]/95 backdrop-blur-lg border-b border-[#262413]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex gap-[3.5px] items-end h-[18px]">
                <span className="w-[3px] bg-yellow-500 h-3 rounded-full" />
                <span className="w-[3px] bg-yellow-500 h-[18px] rounded-full" />
                <span className="w-[3px] bg-yellow-500 h-[14px] rounded-full" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">FIDScript</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[#a8a594] hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-[#a8a594] hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#docs" className="text-sm text-[#a8a594] hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#contact" className="text-sm text-[#a8a594] hover:text-white transition-colors">
                Contact
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onViewDemo}
                className="px-4 py-2 text-sm font-medium text-[#a8a594] hover:text-white transition-colors"
              >
                View Demo
              </button>
              <button
                onClick={onGetStarted}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#a8a594] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#12110c] border-t border-[#262413]"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#features" className="block text-sm text-[#a8a594] hover:text-white py-2">
                  Features
                </a>
                <a href="#pricing" className="block text-sm text-[#a8a594] hover:text-white py-2">
                  Pricing
                </a>
                <a href="#docs" className="block text-sm text-[#a8a594] hover:text-white py-2">
                  Documentation
                </a>
                <a href="#contact" className="block text-sm text-[#a8a594] hover:text-white py-2">
                  Contact
                </a>
                <div className="pt-3 border-t border-[#262413] space-y-2">
                  <button
                    onClick={onViewDemo}
                    className="w-full px-4 py-2 text-sm text-[#a8a594] hover:text-white text-left"
                  >
                    View Demo
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-semibold text-sm rounded-lg text-center"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-dot-matrix opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[96px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-8"
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-yellow-500">Now serving Kenyan businesses</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
            >
              WhatsApp API for{' '}
              <span className="gradient-headline-text">Kenyan Businesses</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-[#a8a594] max-w-2xl mx-auto mb-10"
            >
              Send and receive WhatsApp messages programmatically. Connect your business to millions of Kenyan customers through a simple, powerful API.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onViewDemo}
                className="w-full sm:w-auto px-8 py-4 bg-[#1b1910] hover:bg-[#262412] border border-[#383416] text-white font-semibold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 text-yellow-500" />
                Watch Demo
              </button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-[#85826f]">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-[#262413] bg-[#12110c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[#85826f] uppercase tracking-widest mb-8">
            Trusted by leading Kenyan businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {['Safaricom', 'Equity Bank', 'KCB', 'Carrefour', 'Jumia'].map((brand) => (
              <span key={brand} className="text-sm md:text-base font-semibold text-[#6a6c5d]">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to{' '}
              <span className="gradient-headline-text">scale</span>
            </h2>
            <p className="text-[#a8a594] max-w-2xl mx-auto">
              Powerful features designed for Kenyan businesses. From instant API access to real-time webhooks, we've got you covered.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  onClick={() => setActiveFeature(idx)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    activeFeature === idx
                      ? 'bg-[#1b1910] border-yellow-500/30'
                      : 'bg-[#12110c] border-[#262413] hover:border-[#383416]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        activeFeature === idx ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#1b1910] text-[#85826f]'
                      }`}
                    >
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-[#85826f]">{feature.description}</p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        activeFeature === idx ? 'text-yellow-500 rotate-90' : 'text-[#6a6c5d]'
                      }`}
                    />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Code Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[#0b0a07] rounded-2xl border border-[#262413] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262413]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#3d3520]" />
                  <span className="w-3 h-3 rounded-full bg-[#3d3520]" />
                  <span className="w-3 h-3 rounded-full bg-[#3d3520]" />
                </div>
                <span className="text-xs text-[#6a6c5d] font-mono ml-2">
                  {features[activeFeature].title.toLowerCase().replace(/\s+/g, '-')}.js
                </span>
              </div>
              <pre className="p-5 text-sm font-mono text-[#cbd3cf] overflow-x-auto">
                <code>{features[activeFeature].code}</code>
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-[#12110c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get started in{' '}
              <span className="gradient-headline-text">minutes</span>
            </h2>
            <p className="text-[#a8a594] max-w-2xl mx-auto">
              No complex setup required. Connect your WhatsApp and start sending messages in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create an Account',
                description: 'Sign up and choose a plan that fits your business needs. Start with a free trial.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Connect via QR Code',
                description: 'Link your WhatsApp number by scanning a QR code. No technical knowledge required.',
                icon: QrCode,
              },
              {
                step: '03',
                title: 'Start Sending',
                description: 'Use our REST API to send messages instantly. Full documentation and SDK support.',
                icon: Zap,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative p-6 bg-[#11110a] rounded-2xl border border-[#262413]"
              >
                <div className="absolute -top-4 left-6 px-3 py-1 bg-yellow-500 text-stone-950 text-xs font-bold rounded-full">
                  {item.step}
                </div>
                <div className="pt-2">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[#85826f]">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, transparent{' '}
              <span className="gradient-headline-text">pricing</span>
            </h2>
            <p className="text-[#a8a594] max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include our core features and 1 KSh per 8 messages billing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  plan.popular
                    ? 'bg-[#1b1910] border-yellow-500/50'
                    : 'bg-[#12110c] border-[#262413]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-500 text-stone-950 text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#85826f] mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-[#85826f]">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#cbd3cf]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.popular
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950'
                      : 'bg-[#1b1910] hover:bg-[#262412] text-white border border-[#383416]'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-[#85826f] mt-8">
            All plans include 1 KSh per 8 messages. Volume discounts available for high-volume users.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 md:py-24 bg-[#12110c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 md:p-12 bg-[#11110a] rounded-3xl border border-[#262413] relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-[96px] pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-semibold text-yellow-500">14-day free trial</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to transform your{' '}
                <span className="gradient-headline-text">customer communication</span>?
              </h2>
              <p className="text-[#a8a594] mb-8 max-w-xl mx-auto">
                Join hundreds of Kenyan businesses already using FIDScript to connect with their customers on WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="#contact"
                  className="w-full sm:w-auto px-8 py-4 text-[#a8a594] hover:text-white font-medium text-base transition-colors flex items-center justify-center gap-2"
                >
                  Talk to Sales
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#262413]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-[3.5px] items-end h-[18px]">
                  <span className="w-[3px] bg-yellow-500 h-3 rounded-full" />
                  <span className="w-[3px] bg-yellow-500 h-[18px] rounded-full" />
                  <span className="w-[3px] bg-yellow-500 h-[14px] rounded-full" />
                </div>
                <span className="font-bold text-lg text-white tracking-tight">FIDScript</span>
              </div>
              <p className="text-sm text-[#85826f]">
                WhatsApp API for Kenyan businesses. Connect with your customers on Africa's most popular messaging platform.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#85826f]">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[#85826f]">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#85826f]">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#262413] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#6a6c5d]">
              © 2026 FIDScript. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-[#6a6c5d] hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-sm text-[#6a6c5d] hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-sm text-[#6a6c5d] hover:text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
