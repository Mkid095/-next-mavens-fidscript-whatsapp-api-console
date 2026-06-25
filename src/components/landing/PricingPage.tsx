import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import SeoHead from '../shared/SeoHead';

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
  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Pricing — Token Plans for WhatsApp API"
        description="Simple, transparent token pricing for FIDScript WhatsApp API. KSh 100 for 1,000 tokens, KSh 900 for 11,000 tokens, KSh 4,000 for 60,000 tokens. M-Pesa STK Push payment. No monthly fees."
        canonical="/pricing"
        schema="pricing"
        breadcrumbs={[{ name: 'Pricing', url: '/pricing' }]}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
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

      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-dot-matrix opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-yellow-500/8 rounded-full blur-[128px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
                <span className="text-xs font-semibold text-yellow-500">Transparent Pricing</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
                Pay for what you <span className="text-yellow-500">use</span>
              </h1>
              <p className="text-lg text-[#a8a594] max-w-2xl mx-auto mb-4">
                Each token sends one WhatsApp message. No monthly fees, no hidden costs, no expiry on your balance.
              </p>
              <p className="text-sm text-[#6a6c5d]">
                New accounts receive <span className="text-yellow-500 font-semibold">500 free welcome tokens</span> — no payment required.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 md:pb-28">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {pricingPlans.map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative p-6 rounded-2xl border ${
                    plan.popular ? 'bg-[#1b1910] border-yellow-500/50' : 'bg-[#12110c] border-[#262413]'
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
                    </div>
                    <div className="mt-1">
                      <span className="text-lg font-bold text-yellow-500">{plan.tokens} tokens</span>
                      {plan.bonus && <span className="text-sm text-emerald-400 ml-2">{plan.bonus}</span>}
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
                  <Link
                    to="/register"
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center ${
                      plan.popular
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950'
                        : 'bg-[#1b1910] hover:bg-[#262412] text-white border border-[#383416]'
                    }`}
                  >
                    Get Started
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* FAQ teaser */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 max-w-2xl mx-auto text-center"
            >
              <h2 className="text-xl font-bold text-white mb-3">Frequently Asked Questions</h2>
              <div className="space-y-4 text-left mt-6">
                {[
                  { q: 'Do tokens expire?', a: 'Tokens expire after 12 months of account inactivity. As long as you log in at least once a year, your tokens remain valid.' },
                  { q: 'Can I get a refund?', a: 'Package purchases are final and non-refundable. We recommend starting with the smallest package to test the service.' },
                  { q: 'How are tokens consumed?', a: 'Each outbound WhatsApp message consumes 1 token, regardless of message type (text, media, etc.). Inbound messages are free.' },
                  { q: 'What payment methods do you accept?', a: 'We currently accept M-Pesa via Tuma STK Push for Kenyan businesses.' },
                ].map(({ q, a }) => (
                  <div key={q} className="bg-[#11110a] border border-[#262413] rounded-xl p-4">
                    <div className="text-sm font-semibold text-white mb-1">{q}</div>
                    <div className="text-xs text-[#8a886a]">{a}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#6a6c5d] mt-6">
                More questions?{' '}
                <Link to="/contact" className="text-yellow-500 hover:text-yellow-400 font-semibold">Contact our team</Link>
                {' '}— we respond within 1–2 business days.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
