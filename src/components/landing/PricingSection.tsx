import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { plansApi } from '../../services/api';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  max_instances: number;
  max_messages_per_month: number;
}

export default function PricingSection() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    plansApi.getAll().then(res => {
      if (res.success && res.data) {
        setPlans(res.data.filter((p: Plan) => p.price_monthly > 0 || p.name === 'Free'));
      }
      setLoading(false);
    });
  }, []);

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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative p-6 rounded-2xl border ${
                    plan.name === 'Professional' ? 'bg-[#1b1910] border-yellow-500/50' : 'bg-[#12110c] border-[#262413]'
                  }`}
                >
                  {plan.name === 'Professional' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-500 text-stone-950 text-xs font-bold rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-[#85826f] mb-4">{plan.description || `${plan.max_instances} instances · ${plan.max_messages_per_month.toLocaleString()} msgs/mo`}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">
                        KSh {plan.price_monthly.toLocaleString()}
                      </span>
                      <span className="text-sm text-[#85826f]">/mo</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#cbd3cf]">{plan.max_instances} WhatsApp instance{plan.max_instances !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#cbd3cf]">{plan.max_messages_per_month.toLocaleString()} messages/mo</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#cbd3cf]">M-Pesa token billing</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#cbd3cf]">REST API + webhooks</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#cbd3cf]">Real-time analytics</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigate('/register')}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                      plan.name === 'Professional'
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
          </>
        )}
      </div>
    </section>
  );
}
