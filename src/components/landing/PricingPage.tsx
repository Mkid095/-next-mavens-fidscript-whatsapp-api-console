import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import Header from './Header';
import { usePricingPlans } from './usePricingPlans';

const pricingPlans = [
  {
    name: 'Starter',
    price: 'KSh 100',
    tokens: '1,000',
    bonus: '',
    description: 'Perfect for trying out the API',
    features: [
      '1,000 tokens',
      'No time limit',
      'QR Code connection',
      'REST API access',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    price: 'KSh 900',
    tokens: '10,000',
    bonus: '+1,000 bonus',
    description: 'For growing businesses with regular messaging',
    features: [
      '11,000 tokens total',
      'No time limit',
      'QR Code connection',
      'REST API access',
      'Priority support',
      'Webhook integrations',
    ],
    popular: true,
  },
  {
    name: 'Scale',
    price: 'KSh 4,000',
    tokens: '50,000',
    bonus: '+10,000 bonus',
    description: 'High-volume messaging at the best rate',
    features: [
      '60,000 tokens total',
      'No time limit',
      'QR Code connection',
      'REST API access',
      'Dedicated support',
      'Webhook integrations',
      'Custom rate limits',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { loading } = usePricingPlans();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] antialiased">
      <SeoHead
        title="Pricing - Token Plans for WhatsApp API"
        description="Simple, transparent token pricing for FIDScript WhatsApp API. KSh 100 for 1,000 tokens, KSh 900 for 11,000 tokens, KSh 4,000 for 60,000 tokens. M-Pesa STK Push payment. No monthly fees."
        canonical="/pricing"
        schema="pricing"
        breadcrumbs={[{ name: 'Pricing', url: '/pricing' }]}
      />

      <Header scrolled={scrolled} onScroll={() => setScrolled(window.scrollY > 10)} />

      <main>
        {/* Hero */}
        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fff7ed] border border-[#fed7aa] rounded-full mb-6"
            >
              <span className="text-xs font-semibold text-[#f97316]">Transparent Pricing</span>
            </div>
            <h1
              className="text-[clamp(28px,4vw,48px)] font-bold text-[#1a1a1a] leading-tight tracking-[-1px] mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Pay for what you <span className="text-[#f97316]">use</span>
            </h1>
            <p className="text-base text-[#525252] max-w-2xl mx-auto mb-3 leading-relaxed">
              Each token sends one WhatsApp message. No monthly fees, no hidden costs, no expiry on your balance.
            </p>
            <p className="text-sm text-[#525252]">
              New accounts receive{' '}
              <span className="text-[#f97316] font-semibold">500 free welcome tokens</span>{' '}
              - no payment required.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-12 md:pb-20">
          <div className="max-w-5xl mx-auto px-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {pricingPlans.map((plan, idx) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className={`relative p-6 rounded-2xl border ${
                      plan.popular
                        ? 'bg-white border-[#f97316] shadow-lg'
                        : 'bg-white border-[#e5e5e5]'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#f97316] text-white text-xs font-bold rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">{plan.name}</h3>
                      <p className="text-sm text-[#525252] mb-4">{plan.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[#1a1a1a]">{plan.price}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-base font-bold text-[#f97316]">{plan.tokens} tokens</span>
                        {plan.bonus && (
                          <span className="text-sm text-[#16a34a] ml-2">{plan.bonus}</span>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                          <span className="text-[#525252]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/register"
                      className={`w-full py-3 rounded-full font-semibold text-sm transition-colors flex items-center justify-center ${
                        plan.popular
                          ? 'bg-[#f97316] hover:bg-[#fb923c] text-white'
                          : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white'
                      }`}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-14 max-w-2xl mx-auto"
            >
              <h2 className="text-xl font-bold text-center text-[#1a1a1a] mb-4">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {[
                  { q: 'Do tokens expire?', a: 'Tokens expire after 12 months of account inactivity. As long as you log in at least once a year, your tokens remain valid.' },
                  { q: 'Can I get a refund?', a: 'Package purchases are final and non-refundable. We recommend starting with the smallest package to test the service.' },
                  { q: 'How are tokens consumed?', a: 'Each outbound WhatsApp message consumes 1 token, regardless of message type (text, media, etc.). Inbound messages are free.' },
                  { q: 'What payment methods do you accept?', a: 'We currently accept M-Pesa via Tuma STK Push for Kenyan businesses.' },
                ].map(({ q, a }) => (
                  <div key={q} className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-2xl p-4">
                    <div className="text-sm font-semibold text-[#1a1a1a] mb-1">{q}</div>
                    <div className="text-xs text-[#525252] leading-relaxed">{a}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-center text-[#525252] mt-6">
                More questions?{' '}
                <Link to="/contact" className="text-[#f97316] font-semibold hover:underline">
                  Contact our team
                </Link>{' '}
                - we respond within 1–2 business days.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
