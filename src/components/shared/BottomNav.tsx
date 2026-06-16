import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Settings, Menu, ChevronDown, Search } from 'lucide-react';
import { mainNavItems, menuItems, ClientSection } from './SidebarNav';
import { useCommandK } from '../../features/search/index.js';

interface BottomNavProps {
  activeMenuItem: ClientSection;
  onMenuItemChange: (item: ClientSection) => void;
  onLogout: () => void;
}

function isActive(item: { id: ClientSection; path: string }, pathname: string): boolean {
  if (item.id === 'dashboard') {
    return pathname === '/client' || pathname === '/client/dashboard';
  }
  return pathname === item.path;
}

export default function BottomNav({
  activeMenuItem,
  onMenuItemChange,
  onLogout,
}: BottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { openPalette } = useCommandK();

  const handleMenuSelect = (item: { id: ClientSection }) => {
    onMenuItemChange(item.id);
    setMenuOpen(false);
  };

  const currentLabel = mainNavItems.find(item => item.id === activeMenuItem)?.label || 'Menu';

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[72px] left-0 right-0 bg-[#13120d] border-t border-[#2d2813] z-50 lg:hidden max-h-[60vh] overflow-y-auto"
          >
            <div className="p-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => handleMenuSelect(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(item, location.pathname)
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'text-[#8f834a] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={() => { onLogout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
              >
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#13120d] border-t border-[#2d2813] z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
          <Link
            to="/client"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
              isActive({ id: 'dashboard', path: '/client' }, location.pathname) ? 'text-yellow-400' : 'text-[#6e684a]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold">Home</span>
          </Link>

          <button
            onClick={openPalette}
            aria-label="Search"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[#6e684a] transition-all hover:text-white"
          >
            <Search className="w-5 h-5" />
            <span className="text-[9px] font-bold">Search</span>
          </button>

          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
              menuItems.some(i => isActive(i, location.pathname)) ? 'text-yellow-400' : 'text-[#6e684a]'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {menuItems.some(i => isActive(i, location.pathname)) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </div>
            <span className="text-[9px] font-bold">{currentLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <Link
            to="/client/settings"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
              isActive({ id: 'settings', path: '/client/settings' }, location.pathname) ? 'text-yellow-400' : 'text-[#6e684a]'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-bold">Settings</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
