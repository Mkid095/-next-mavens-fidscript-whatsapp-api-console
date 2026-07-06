import { LayoutRoute } from './AppRoutes/LayoutRoute.js';
import type { Client, Instance, DailyUsage, ClientMessage } from './data';
import type { ApiLog, AnalyticsData } from './data';

interface AppRoutesProps {
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  clientData: Client | null;
  clientInstances: Instance[];
  onInstancesChange: (instances: Instance[]) => void;
  onLogout: () => void;
  tokenBalance: number;
  tokenPackages: import('./data').TokenPackage[];
  dailyUsage: DailyUsage[];
  recentMessages: ClientMessage[];
  messagesToday: number;
  onTokenBalanceChange: (balance: number) => void;
  toasts: { id: string; text: string; type: 'success' | 'warn' }[];
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; text: string; type: 'success' | 'warn' }[]>>;
  messages: { id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[];
  logs: ApiLog[];
  analytics: AnalyticsData | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleLoginSuccess: (email: string, role: 'admin' | 'client') => void;
  handleShowClientDashboard: () => void;
  addToast: (text: string, type?: 'success' | 'warn') => void;
}

export function AppRoutes(props: AppRoutesProps) {
  return <LayoutRoute {...props} />;
}
