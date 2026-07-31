import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section id="contact" className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-8 md:p-12 bg-[#1a1a1a] rounded-[32px] relative overflow-hidden"
        >
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#eab308]/10 border border-[#eab308]/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#eab308]" />
              <span className="text-xs font-semibold text-[#eab308]">500 free welcome tokens</span>
            </div>
            <h2
              className="text-[clamp(48px,6vw,74px)] font-bold text-white leading-[110%] tracking-[-2px] mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to transform your <span className="text-[#eab308]">customer communication</span>?
            </h2>
            <p className="text-[20px] text-white/75 leading-[150%] mb-8 max-w-xl mx-auto">
              Join Kenyan businesses already using FIDScript to connect with their customers on WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-[#eab308] hover:bg-[#facc15] text-[#1a1a1a] font-bold text-base rounded-full transition-colors flex items-center justify-center gap-2"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 text-white/75 hover:text-white font-medium text-base transition-colors flex items-center justify-center gap-2"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
