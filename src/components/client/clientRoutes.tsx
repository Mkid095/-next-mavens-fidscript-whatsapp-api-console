import { Routes, Route, Navigate } from 'react-router-dom';
import ClientDashboard from './ClientDashboard';
import type { Instance, Client, TokenPackage, DailyUsage } from '../../services/api';

interface ClientRouteProps {
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  clientData: Client | null;
  clientInstances: Instance[];
  onInstancesChange: React.Dispatch<React.SetStateAction<Instance[]>>;
  onLogout: () => void;
  tokenBalance: number;
  tokenPackages: TokenPackage[];
  dailyUsage: DailyUsage[];
  onTokenBalanceChange: React.Dispatch<React.SetStateAction<number>>;
}

export function ClientRoutes({
  currentUser, clientData, clientInstances, onInstancesChange, onLogout,
  tokenBalance, tokenPackages, dailyUsage, onTokenBalanceChange,
}: ClientRouteProps) {
  if (!currentUser || currentUser.role !== 'client' || !clientData) {
    if (currentUser?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const dashboardProps = {
    client: clientData,
    clientToken: localStorage.getItem('fidscript_client_token') || '',
    instances: clientInstances,
    onInstancesChange,
    onLogout,
    tokenBalance,
    tokenPackages,
    dailyUsage,
    onTokenBalanceChange,
  };

  return (
    <Routes>
      <Route path="/client" element={<ClientDashboard {...dashboardProps} />} />
      <Route path="/client/:section" element={<ClientDashboard {...dashboardProps} />} />
    </Routes>
  );
}