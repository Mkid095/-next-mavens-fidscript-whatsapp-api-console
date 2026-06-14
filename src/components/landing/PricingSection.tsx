import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

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

export default function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, transparent <span className="gradient-headline-text">token pricing</span>
          </h2>
          <p className="text-[#a8a594] max-w-2xl mx-auto">
            Pay for what you use. Each token sends one WhatsApp message. No monthly fees, no hidden costs.
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
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.popular
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950'
                    : 'bg-[#1b1910] hover:bg-[#262412] text-white border border-[#383416]'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl max-w-2xl mx-auto">
          <p className="text-sm text-yellow-200">
            <strong>New!</strong> Sign up today and get <span className="text-yellow-400 font-bold">500 free welcome tokens</span> — no payment required!
          </p>
        </div>
      </div>
    </section>
  );
}
