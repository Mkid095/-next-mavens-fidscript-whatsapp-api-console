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
  Zap,
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

export const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/client' },
  { id: 'whatsapp', label: 'WhatsApp Containers', icon: <MessageSquare className="w-4 h-4" />, path: '/client/whatsapp' },
  { id: 'api-keys', label: 'API Keys', icon: <Key className="w-4 h-4" />, path: '/client/api-keys' },
  { id: 'docs', label: 'Documentation', icon: <FileText className="w-4 h-4" />, path: '/client/docs' },
  { id: 'sandbox', label: 'API Sandbox', icon: <Bot className="w-4 h-4" />, path: '/client/sandbox' },
  { id: 'messages', label: 'Messages', icon: <Send className="w-4 h-4" />, path: '/client/messages' },
  { id: 'campaigns', label: 'Campaigns', icon: <Zap className="w-4 h-4" />, path: '/client/campaigns' },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-4 h-4" />, path: '/client/contacts' },
  { id: 'token-store', label: 'Token Store', icon: <CreditCard className="w-4 h-4" />, path: '/client/token-store' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, path: '/client/settings' },
];

export const menuItems: NavItem[] = mainNavItems.filter(item =>
  ['whatsapp', 'api-keys', 'docs', 'sandbox', 'messages', 'campaigns', 'contacts', 'token-store'].includes(item.id),
);

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
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {mainNavItems.map((item) => {
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
    </nav>
  );
}
