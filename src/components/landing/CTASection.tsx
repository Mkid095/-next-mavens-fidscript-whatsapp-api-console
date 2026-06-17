import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <>
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
                Ready to transform your <span className="gradient-headline-text">customer communication</span>?
              </h2>
              <p className="text-[#a8a594] mb-8 max-w-xl mx-auto">
                Join hundreds of Kenyan businesses already using FIDScript to connect with their customers on WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
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
                <img src="/logo.png" alt="FIDScript" className="h-8" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white tracking-tight leading-none">FIDSCRIPT WHATSAPP</span>
                  <span className="text-[9px] text-yellow-500">by Next Mavens</span>
                </div>
              </div>
              <p className="text-sm text-[#85826f]">
                WhatsApp API for Kenyan businesses. Connect with your customers on Africa's most popular messaging platform.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#85826f]">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-[#85826f]">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#85826f]">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#262413] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#6a6c5d]">© 2026 FIDScript. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-[#6a6c5d] hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-sm text-[#6a6c5d] hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-sm text-[#6a6c5d] hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
