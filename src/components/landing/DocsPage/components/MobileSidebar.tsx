import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Zap, MessageSquare, Settings, Users,
  Bell, Shield, Globe, Bot,
} from 'lucide-react';
import type { Lang } from '../types.ts';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Getting Started': <Zap size={13} />,
  'Messaging':       <MessageSquare size={13} />,
  'Instances':       <Settings size={13} />,
  'Contacts':        <Users size={13} />,
  'Platform':        <Globe size={13} />,
  'Groups':          <Users size={13} />,
  'Settings':        <Settings size={13} />,
  'Payments':        <Bell size={13} />,
  'Security':        <Shield size={13} />,
  'AI Providers':    <Bot size={13} />,
};

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  activeTab: 'guides' | 'api-reference' | 'changelog';
  setActiveTab: (t: 'guides' | 'api-reference' | 'changelog') => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  onSelectGuide: (id: string) => void;
  onSelectEndpoint: (ep: { method: string; path: string; name: string; desc?: string; params: unknown[]; cost?: number }) => void;
  guides: { id: string; label: string }[];
  docGroups: {
    name: string;
    endpoints: { method: string; path: string; name: string; desc?: string; params: unknown[]; cost?: number }[];
  }[];
  methodColors: Record<string, string>;
}

export function MobileSidebar({
  open, onClose,
  activeTab, setActiveTab,
  activeSection, setActiveSection,
  onSelectGuide, onSelectEndpoint,
  guides, docGroups, methodColors,
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-64 h-full bg-[#11110a] border-r border-[#262413] pt-[52px] overflow-y-auto"
          >
            <div className="py-3">
              <div className="px-3 mb-2">
                <div className="flex bg-[#1a1910] rounded-xl p-1">
                  {(['guides', 'api-reference'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        activeTab === tab
                          ? 'bg-yellow-500 text-stone-950'
                          : 'text-[#8a886a]'
                      }`}
                    >
                      {tab === 'guides' ? 'Guides' : 'API Ref'}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'guides' ? (
                <div>
                  {guides.map(g => (
                    <button
                      key={g.id}
                      onClick={() => { onSelectGuide(g.id); onClose(); }}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-[#1e1c10] ${
                        activeSection === g.id ? 'text-yellow-500 font-semibold' : 'text-[#8a886a]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              ) : (
                docGroups.map(group => (
                  <div key={group.name}>
                    <button
                      onClick={() => setActiveSection(group.name === activeSection ? '' : group.name)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b border-[#1e1c10] ${
                        activeSection === group.name ? 'text-yellow-500' : 'text-[#6a6c5d]'
                      }`}
                    >
                      {SECTION_ICONS[group.name] || <BookOpen size={13} />}
                      {group.name}
                      <span className="ml-auto text-[10px]">{group.endpoints.length}</span>
                    </button>
                    {activeSection === group.name && group.endpoints.map(ep => (
                      <button
                        key={ep.path}
                        onClick={() => { onSelectEndpoint(ep); onClose(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 pl-8 text-xs text-[#8a886a] hover:text-white border-b border-[#1a1910]"
                      >
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${methodColors[ep.method] || 'bg-gray-600 text-white'}`}>
                          {ep.method}
                        </span>
                        <span className="truncate">{ep.name}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
