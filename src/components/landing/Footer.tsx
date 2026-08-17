import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-12 bg-[#f8f8f8] border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://res.cloudinary.com/f65o17cm/image/upload/v1785452001/logo_w0ttyq.png"
                alt="FIDScript"
                className="h-8"
              />
            </div>
            <p className="text-sm text-[#525252] leading-[150%]">
              WhatsApp API for Kenyan businesses. Connect with your customers on Africa is most popular messaging platform.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li><Link to="/features" className="hover:text-[#f97316] transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-[#f97316] transition-colors">Pricing</Link></li>
              <li><Link to="/docs" className="hover:text-[#f97316] transition-colors">Documentation</Link></li>
              <li><Link to="/docs" className="hover:text-[#f97316] transition-colors">API Reference</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li><Link to="/contact" className="hover:text-[#f97316] transition-colors">Contact</Link></li>
              <li><Link to="/changelog" className="hover:text-[#f97316] transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[#525252]">
              <li><Link to="/privacy" className="hover:text-[#f97316] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#f97316] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#e5e5e5] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#a0a0a0]">© 2026 FIDScript. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://twitter.com/fidstream" target="_blank" rel="noopener noreferrer" className="text-sm text-[#525252] hover:text-[#f97316] transition-colors">Twitter</a>
            <a href="https://linkedin.com/company/next-mavens" target="_blank" rel="noopener noreferrer" className="text-sm text-[#525252] hover:text-[#f97316] transition-colors">LinkedIn</a>
            <a href="https://github.com/nextmavens" target="_blank" rel="noopener noreferrer" className="text-sm text-[#525252] hover:text-[#f97316] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
