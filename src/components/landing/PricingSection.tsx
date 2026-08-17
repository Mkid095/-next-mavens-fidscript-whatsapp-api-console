import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { usePricingPlans } from './usePricingPlans';

export default function PricingSection() {
  const navigate = useNavigate();
  const { plans, loading } = usePricingPlans();
  const filteredPlans = plans.filter((p) => p.price_monthly > 0 || p.name === 'Free');

  return (
    <section id="pricing" className="py-12 md:py-20 bg-[#f8f8f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2
            className="text-[clamp(24px,3vw,40px)] font-bold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Simple, transparent <span className="text-[#f97316]">pricing</span>
          </h2>
          <p className="mt-6 text-[20px] text-[#1a1a1a]/75 leading-[150%] max-w-2xl mx-auto">
            Pay for what you use. No monthly fees, no hidden costs. KES 0.11 per message.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {filteredPlans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`relative p-6 bg-white rounded-[28px] border ${
                  plan.name === 'Professional' ? 'border-[#f97316] shadow-lg' : 'border-[#e5e5e5]'
                }`}
              >
                {plan.name === 'Professional' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#f97316] text-[#1a1a1a] text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#525252] mb-4">
                    {plan.description || `${plan.max_instances} instances · ${plan.max_messages_per_month.toLocaleString()} msgs/mo`}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#1a1a1a]">
                      KSh {plan.price_monthly.toLocaleString()}
                    </span>
                    <span className="text-sm text-[#525252]">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                    <span className="text-[#525252]">{plan.max_instances} WhatsApp instance{plan.max_instances !== 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                    <span className="text-[#525252]">{plan.max_messages_per_month.toLocaleString()} messages/mo</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                    <span className="text-[#525252]">M-Pesa token billing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                    <span className="text-[#525252]">REST API + webhooks</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                    <span className="text-[#525252]">Real-time analytics</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-full font-semibold text-sm transition-colors ${
                    plan.name === 'Professional'
                      ? 'bg-[#f97316] hover:bg-[#fb923c] text-[#1a1a1a]'
                      : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white'
                  }`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 p-4 bg-[#fb923c]/10 border border-[#f97316]/20 rounded-[28px] max-w-2xl mx-auto">
          <p className="text-sm text-[#525252]">
            <strong>New!</strong> Sign up today and get <span className="text-[#f97316] font-bold">500 free welcome tokens</span> — no payment required!
          </p>
        </div>
      </div>
    </section>
  );
}
