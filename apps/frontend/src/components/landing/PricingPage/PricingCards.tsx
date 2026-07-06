import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PricingPlan {
  name: string;
  price: string;
  tokens: string;
  bonus: string;
  description: string;
  features: string[];
  popular: boolean;
}

interface PricingCardsProps {
  plans: PricingPlan[];
}

export default function PricingCards({ plans }: PricingCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {plans.map((plan, idx) => (
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
  );
}
