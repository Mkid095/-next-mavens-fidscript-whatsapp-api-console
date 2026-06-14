import { Navigate } from 'react-router-dom';
import ClientDashboard from './ClientDashboard';
import type { Instance, Client, TokenPackage, DailyUsage, ClientMessage } from '../../services/api';

interface ClientRouteProps {
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  clientData: Client | null;
  clientInstances: Instance[];
  onInstancesChange: React.Dispatch<React.SetStateAction<Instance[]>>;
  onLogout: () => void;
  tokenBalance: number;
  tokenPackages: TokenPackage[];
  dailyUsage: DailyUsage[];
  recentMessages: ClientMessage[];
  messagesToday: number;
  onTokenBalanceChange: React.Dispatch<React.SetStateAction<number>>;
}

export function ClientRoutes({
  currentUser, clientData, clientInstances, onInstancesChange, onLogout,
  tokenBalance, tokenPackages, dailyUsage, recentMessages, messagesToday, onTokenBalanceChange,
}: ClientRouteProps) {
  // Guard: must be an authenticated client with loaded profile data
  if (!currentUser || currentUser.role !== 'client' || !clientData) {
    if (currentUser?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Render dashboard directly. The parent route is `/client/*`, so this
  // component mounts for any /client path. ClientDashboard reads the current
  // location via useLocation() to determine which section to display.
  return (
    <ClientDashboard
      client={clientData}
      clientToken={localStorage.getItem('fidscript_client_token') || ''}
      instances={clientInstances}
      onInstancesChange={onInstancesChange}
      onLogout={onLogout}
      tokenBalance={tokenBalance}
      tokenPackages={tokenPackages}
      dailyUsage={dailyUsage}
      recentMessages={recentMessages}
      messagesToday={messagesToday}
      onTokenBalanceChange={onTokenBalanceChange}
    />
  );
}
