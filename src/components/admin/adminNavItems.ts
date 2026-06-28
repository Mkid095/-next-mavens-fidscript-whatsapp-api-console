import {
  LayoutDashboard,
  Radio,
  Users,
  Terminal,
  FileText,
  BarChart2,
  Mail,
  History,
  Key,
  Bot,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  icon: typeof LayoutDashboard;
  path: string;
}

export const adminNavItems: AdminNavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { name: 'Instances', icon: Radio, path: '/admin/instances' },
  { name: 'Clients', icon: Users, path: '/admin/clients' },
  { name: 'API Console', icon: Terminal, path: '/admin/api-console' },
  { name: 'Logs', icon: FileText, path: '/admin/logs' },
  { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
  { name: 'Inbox', icon: Mail, path: '/admin/inbox' },
  { name: 'Audit Logs', icon: History, path: '/admin/audit-logs' },
  { name: 'Security & Keys', icon: Key, path: '/admin/keys' },
  { name: 'LLM Providers', icon: Bot, path: '/admin/providers' },
];

export function getActiveAdminTab(path: string): string {
  if (path === '/admin') return 'Dashboard';
  const match = adminNavItems.find((item) => item.path === path);
  return match ? match.name : 'Dashboard';
}
