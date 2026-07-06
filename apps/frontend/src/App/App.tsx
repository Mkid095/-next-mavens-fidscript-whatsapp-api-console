/**
 * App — thin shell: auth state restoration, routing setup, layout render.
 * All session logic lives in useAuthInit; route elements in AppRoutes.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProviders } from '../data/providers';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import { useAuthInit } from './useAuthInit';
import { AppRoutes } from './AppRoutes';

function AppContent() {
  const {
    currentUser,
    isLoading,
    clientData,
    setClientData,
    clientInstances,
    setClientInstances,
    tokenBalance,
    tokenPackages,
    dailyUsage,
    recentMessages,
    messagesToday,
    toasts,
    setToasts,
    handleLogout,
    handleLoginSuccess,
    handleShowClientDashboard,
  } = useAuthInit();

  if (isLoading) return <LoadingScreen />;

  return (
    <AppRoutes
      currentUser={currentUser}
      clientData={clientData}
      clientInstances={clientInstances}
      onInstancesChange={setClientInstances}
      onLogout={handleLogout}
      tokenBalance={tokenBalance}
      tokenPackages={tokenPackages}
      dailyUsage={dailyUsage}
      recentMessages={recentMessages}
      messagesToday={messagesToday}
      onTokenBalanceChange={() => {}}
      toasts={toasts}
      setToasts={setToasts}
      messages={[]}
      logs={[]}
      analytics={null}
      sidebarOpen={true}
      setSidebarOpen={() => {}}
      handleLoginSuccess={handleLoginSuccess}
      handleShowClientDashboard={handleShowClientDashboard}
      addToast={() => {}}
    />
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppProviders>
          <AppContent />
        </AppProviders>
      </BrowserRouter>
    </HelmetProvider>
  );
}
