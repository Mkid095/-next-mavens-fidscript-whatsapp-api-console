import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Menu } from 'lucide-react';

interface HeaderProps {
  scrolled: boolean;
  onScroll: () => void;
}

export default function Header({ scrolled, onScroll }: HeaderProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#11110a]/95 backdrop-blur-lg border-b border-[#262413]' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="FIDScript" className="h-10" />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white tracking-tight leading-none">FIDSCRIPT WHATSAPP</span>
                <span className="text-[10px] text-yellow-500">by Next Mavens</span>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-[#a8a594] hover:text-white transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm text-[#a8a594] hover:text-white transition-colors">Pricing</Link>
            <Link to="/docs" className="text-sm text-[#a8a594] hover:text-white transition-colors">Documentation</Link>
            <Link to="/contact" className="text-sm text-[#a8a594] hover:text-white transition-colors">Contact</Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-[#a8a594] hover:text-white transition-colors">
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#a8a594] hover:text-white">
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
              <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#a8a594] hover:text-white py-2">Features</Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#a8a594] hover:text-white py-2">Pricing</Link>
              <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#a8a594] hover:text-white py-2">Documentation</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#a8a594] hover:text-white py-2">Contact</Link>
              <div className="pt-3 border-t border-[#262413] space-y-2">
                <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-sm text-[#a8a594] hover:text-white text-left">Login</button>
                <button onClick={() => navigate('/register')} className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-semibold text-sm rounded-lg text-center">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
