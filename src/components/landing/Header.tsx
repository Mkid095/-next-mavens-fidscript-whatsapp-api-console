import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        scrolled ? 'bg-white/95 backdrop-blur-lg border-b border-[#e5e5e5] shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/f65o17cm/image/upload/v1785452001/logo_w0ttyq.png"
              alt="FIDScript"
              className="h-10"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors">Pricing</Link>
            <Link to="/docs" className="text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors">Documentation</Link>
            <Link to="/changelog" className="text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors">Changelog</Link>
            <Link to="/contact" className="text-sm text-[#525252] hover:text-[#1a1a1a] transition-colors">Contact</Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-medium text-[#525252] hover:text-[#1a1a1a] transition-colors">
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 bg-[#f97316] hover:bg-[#fb923c] text-[#1a1a1a] font-semibold text-sm rounded-full transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#525252] hover:text-[#1a1a1a]">
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
            className="md:hidden bg-white border-t border-[#e5e5e5]"
          >
            <div className="px-4 py-4 space-y-3">
              <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#525252] hover:text-[#1a1a1a] py-2">Features</Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#525252] hover:text-[#1a1a1a] py-2">Pricing</Link>
              <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#525252] hover:text-[#1a1a1a] py-2">Documentation</Link>
              <Link to="/changelog" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#525252] hover:text-[#1a1a1a] py-2">Changelog</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-[#525252] hover:text-[#1a1a1a] py-2">Contact</Link>
              <div className="pt-3 border-t border-[#e5e5e5] space-y-2">
                <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-sm text-[#525252] hover:text-[#1a1a1a] text-left">Login</button>
                <button onClick={() => navigate('/register')} className="w-full px-4 py-2 bg-[#f97316] hover:bg-[#fb923c] text-[#1a1a1a] font-semibold text-sm rounded-full text-center">
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
