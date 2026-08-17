import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Key,
  FileText,
  Bot,
  Send,
  Users,
  CreditCard,
  Settings,
  Megaphone,
} from 'lucide-react';

export type ClientSection =
  | 'dashboard'
  | 'whatsapp'
  | 'api-keys'
  | 'docs'
  | 'sandbox'
  | 'messages'
  | 'campaigns'
  | 'contacts'
  | 'token-store'
  | 'settings';

interface NavItem {
  id: ClientSection;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/client' },
  { id: 'whatsapp', label: 'Containers', icon: <MessageSquare className="w-4 h-4" />, path: '/client/whatsapp' },
  { id: 'api-keys', label: 'API Keys', icon: <Key className="w-4 h-4" />, path: '/client/api-keys' },
  { id: 'docs', label: 'Documentation', icon: <FileText className="w-4 h-4" />, path: '/client/docs' },
  { id: 'sandbox', label: 'API Sandbox', icon: <Bot className="w-4 h-4" />, path: '/client/sandbox' },
  { id: 'messages', label: 'Messages', icon: <Send className="w-4 h-4" />, path: '/client/messages' },
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-4 h-4" />, path: '/client/campaigns' },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-4 h-4" />, path: '/client/contacts' },
  { id: 'token-store', label: 'Token Store', icon: <CreditCard className="w-4 h-4" />, path: '/client/token-store' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, path: '/client/settings' },
];

export const menuItems: NavItem[] = mainNavItems.filter(item =>
  ['whatsapp', 'api-keys', 'docs', 'sandbox', 'messages', 'campaigns', 'contacts', 'token-store'].includes(item.id),
);

const navGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      mainNavItems[0], // Dashboard
      mainNavItems[1], // Containers
      mainNavItems[5], // Messages
    ],
  },
  {
    label: 'Growth',
    items: [
      mainNavItems[6], // Campaigns
      mainNavItems[7], // Contacts
    ],
  },
  {
    label: 'Tools',
    items: [
      mainNavItems[2], // API Keys
      mainNavItems[4], // API Sandbox
      mainNavItems[3], // Documentation
    ],
  },
  {
    label: 'Account',
    items: [
      mainNavItems[8], // Token Store
      mainNavItems[9], // Settings
    ],
  },
];

interface SidebarNavProps {
  activeSection: ClientSection;
  collapsed: boolean;
}

function isActive(item: NavItem, pathname: string): boolean {
  if (item.id === 'dashboard') {
    return pathname === '/client' || pathname === '/client/dashboard';
  }
  return pathname === item.path;
}

export default function SidebarNav({ activeSection, collapsed }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav className="flex-1 overflow-y-auto">
      {navGroups.map((group, gi) => (
        <div key={group.label}>
          {/* Section label - only when expanded */}
          {!collapsed && (
            <div className="px-3 pt-4 pb-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5a554a]">
                {group.label}
              </p>
            </div>
          )}
          <div className={`px-3 ${collapsed ? 'py-1' : 'pb-2'} space-y-0.5`}>
            {group.items.map((item) => {
              const active = isActive(item, location.pathname);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all focus:outline-none ${
                    active
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      : 'text-[#8f834a] hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={active ? 'text-yellow-400' : 'text-[#6e684a]'}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
          {/* Divider between groups - only when expanded */}
          {gi < navGroups.length - 1 && !collapsed && (
            <div className="mx-3 border-b border-[#2d2813]" />
          )}
        </div>
      ))}
    </nav>
  );
}
