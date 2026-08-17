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
  activeTab: 'guides' | 'api-reference';
  setActiveTab: (t: 'guides' | 'api-reference') => void;
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
            className="w-64 h-full bg-white border-r border-[#e5e5e5] pt-[52px] overflow-y-auto"
          >
            <div className="py-3">
              <div className="px-3 mb-2">
                <div className="flex bg-[#f8f8f8] rounded-xl p-1">
                  {(['guides', 'api-reference'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        activeTab === tab
                          ? 'bg-[#f97316] text-white'
                          : 'text-[#525252]'
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
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-[#f0f0f0] ${
                        activeSection === g.id ? 'text-[#f97316] font-semibold' : 'text-[#525252]'
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
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b border-[#f0f0f0] ${
                        activeSection === group.name ? 'text-[#f97316]' : 'text-[#a0a0a0]'
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
                        className="w-full flex items-center gap-2 px-4 py-2 pl-8 text-xs text-[#525252] hover:text-[#f97316] border-b border-[#f8f8f8]"
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
