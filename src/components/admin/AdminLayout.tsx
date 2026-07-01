import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Bell, Clock } from 'lucide-react';
import { Toasts } from '../shared/Toasts';
import { UpdateToast } from '../shared/UpdateToast';
import { AdminSidebar } from './AdminSidebar';
import { getActiveAdminTab } from './adminNavItems';

interface AdminLayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  handleLogout: () => void;
  messages: { id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[];
  toasts: { id: string; text: string; type: 'success' | 'warn' }[];
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; text: string; type: 'success' | 'warn' }[]>>;
}

export function AdminLayout({
  children,
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  handleLogout,
  messages,
  toasts,
  setToasts,
}: AdminLayoutProps) {
  const location = useLocation();
  const currentTab = getActiveAdminTab(location.pathname);
  const activeUnreadInboxes = messages.filter((m) => !m.read).length;

  const addToast = (text: string, type: 'success' | 'warn' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  return (
    <div className="h-screen w-screen bg-[#11110a] text-[#cbd3cf] font-suisse-intl flex flex-col md:flex-row overflow-hidden antialiased selection:bg-yellow-250 selection:text-stone-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-30 md:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        currentUser={currentUser}
        handleLogout={handleLogout}
        currentTab={currentTab}
        activeUnreadInboxes={activeUnreadInboxes}
      />

      {/* Main content */}
      <div className="flex-1 bg-[#181711] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#181711] border-b border-[#2d2813] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#2d2813]"
            >
              <Menu className="w-5 h-5 text-[#a8a99e]" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6e684a]">
              <span className="text-[#eab308] font-medium">FIDScript</span>
              <span>/</span>
              <span className="text-white font-semibold">{currentTab}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#a8a99e] bg-[#1a1915] border border-[#2d2813] px-3.5 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-[#eab308]" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <button
              onClick={() => addToast('All systems operational. 100% SLA uptime.')}
              className="relative p-2 bg-[#1a1915] hover:bg-[#2d2813] border border-[#2d2813] rounded-xl"
            >
              <Bell className="w-4 h-4 text-[#a8a99e]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toasts toasts={toasts} setToasts={setToasts} />
      <UpdateToast />
    </div>
  );
}
