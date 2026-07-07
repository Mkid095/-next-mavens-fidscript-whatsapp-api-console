import React, { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from '../components/shared/LoadingScreen';
import LandingPage from '../components/LandingPage';
import LoginView from '../components/LoginView';
import TermsPage from '../components/landing/TermsPage';
import PrivacyPage from '../components/landing/PrivacyPage';
import FeaturesPage from '../components/landing/FeaturesPage';
import PricingPage from '../components/landing/PricingPage';
import DocsPage from '../components/landing/DocsPage';
import ChangelogPage from '../components/landing/ChangelogPage';
import ChangelogVersionPage from '../components/landing/ChangelogVersionPage';
import ContactPage from '../components/landing/ContactPage';
import { AdminRoutes } from '../components/admin/adminRoutes';
import { ClientRoutes } from '../components/client/clientRoutes';
import ConversationInspector from '../features/chatbots/ConversationInspector';
import { UpdateToast } from '../components/shared/UpdateToast';
import { initDeployNotification } from '../services/deployNotification';
import {
  authApi,
  adminApi,
  clientsApi,
  instancesApi,
  plansApi,
  paymentsApi,
  type Instance,
  type Client,
  type Plan,
  type ApiLog,
  type AnalyticsData,
  type TokenPackage,
  type DailyUsage,
  type TokenTransaction,
  type ClientMessage,
} from '../data';
import { useAuthInit } from './useAuthInit';
import { useSseTokens } from './useSseTokens';
import { useSseDashboard } from './useSseDashboard';
import { buildAdminRoutesProps } from './adminProps';

export default function AppContent() {
  const { currentUser, clientData, clientInstances, isLoading: authLoading, setCurrentUser, setClientData, setClientInstances } = useAuthInit();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [messages, setMessages] = useState<{ id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[]>([]);
  const [keys, setKeys] = useState<{ id: string; name: string; key: string; created: string; lastUsed: string; status: string }[]>([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentMessages, setRecentMessages] = useState<ClientMessage[]>([]);
  const [messagesToday, setMessagesToday] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'warn' }[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'warn' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Sync isLoading with auth init
  useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);

  // Deploy version polling
  useEffect(() => {
    initDeployNotification();
  }, []);

  // Fetch admin data
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;
    Promise.all([
      adminApi.getInstances(),
      clientsApi.getAll(),
      plansApi.getAll(),
      adminApi.getAnalytics(),
      adminApi.getLogs(1, 50),
    ]).then(([instRes, clientsRes, plansRes, analyticsRes, logsRes]) => {
      if (instRes.success) setInstances(instRes.data || []);
      if (clientsRes.success) setClients(clientsRes.data || []);
      if (plansRes.success) setPlans(plansRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data || null);
      if (logsRes.success) setLogs(logsRes.data || []);
    }).catch(console.error);
  }, [currentUser]);

  // Fetch client data when logged in
  useEffect(() => {
    if (currentUser?.role !== 'client' || !clientData) return;
    Promise.all([
      authApi.clientTokens(),
      paymentsApi.getPackages(),
    ]).then(([balanceRes, packagesRes]) => {
      if (balanceRes.success && balanceRes.data) {
        setTokenBalance(balanceRes.data.balance);
        if (balanceRes.data.history) {
          const usage = balanceRes.data.history.slice(-7).map((t: TokenTransaction) => ({
            date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            messages_sent: t.type === 'debit' ? t.amount : 0,
            tokens_used: t.type === 'debit' ? t.amount : 0,
            messages_delivered: t.type === 'debit' ? Math.floor(t.amount * 0.95) : 0,
          }));
          setDailyUsage(usage);
        }
      }
      if (packagesRes.success && packagesRes.data) setTokenPackages(packagesRes.data);
    }).catch(console.error);
  }, [currentUser?.role, clientData]);

  // SSE token updates
  useSseTokens(setTokenBalance);

  // SSE dashboard updates
  useSseDashboard({
    currentUserRole: currentUser?.role,
    onMessagesToday: setMessagesToday,
    onDailyUsage: setDailyUsage,
    onRecentMessages: setRecentMessages,
  });

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('fidscript_admin_token');
    localStorage.removeItem('fidscript_client_token');
    setCurrentUser(null);
    setClientData(null);
    setClientInstances([]);
    addToast('Logged out successfully');
  };

  // Background fetch after any client login — runs after hard redirect lands on /client
  const handleClientLoginFetch = async () => {
    try {
      const [meRes, instRes, balanceRes, packagesRes] = await Promise.all([
        authApi.clientMe(),
        instancesApi.getClientInstances(),
        authApi.clientTokens(),
        paymentsApi.getPackages(),
      ]);
      if (meRes.success && meRes.data) {
        setClientData(meRes.data);
        setCurrentUser({ email: meRes.data.email, role: 'client', name: meRes.data.name });
        if (instRes.success && instRes.data) setClientInstances(instRes.data);
        if (balanceRes.success && balanceRes.data) {
          setTokenBalance(balanceRes.data.balance);
          if (balanceRes.data.history) {
            const usage = balanceRes.data.history.slice(-7).map((t: TokenTransaction) => ({
              date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              messages_sent: t.type === 'debit' ? t.amount : 0,
              tokens_used: t.type === 'debit' ? t.amount : 0,
              messages_delivered: t.type === 'debit' ? Math.floor(t.amount * 0.95) : 0,
            }));
            setDailyUsage(usage);
          }
        }
        if (packagesRes.success && packagesRes.data) setTokenPackages(packagesRes.data);
      }
    } catch {
      // Silently fail — the /client page already loaded via hard redirect
    }
  };

  // Immediate hard redirect + background fetch for client login
  const handleLoginSuccess = (email: string, role: 'admin' | 'client') => {
    if (role === 'client') {
      window.location.replace('/client');
      handleClientLoginFetch();
    } else {
      setCurrentUser({ email, role, name: email.split('@')[0] });
      addToast('Welcome to FIDScript!');
    }
  };

  // Immediate hard redirect + background fetch for register success
  const handleShowClientDashboard = () => {
    window.location.replace('/client');
    handleClientLoginFetch();
  };

  if (isLoading) return <LoadingScreen />;

  const adminProps = buildAdminRoutesProps({
    sidebarOpen,
    setSidebarOpen,
    currentUser,
    handleLogout,
    instances,
    clients,
    logs,
    analytics,
    keys,
    messages,
    toasts,
    setToasts,
    plans,
    setInstances,
    setClients,
    setKeys,
    setMessages,
    addToast,
  });

  return (
    <>
      <Routes>
        <Route path="/" element={currentUser ? (currentUser.role === 'client' ? <Navigate to="/client" replace /> : <Navigate to="/admin" replace />) : <LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/changelog/:version" element={<ChangelogVersionPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={currentUser ? (currentUser.role === 'client' ? <Navigate to="/client" replace /> : <Navigate to="/admin" replace />) : <LoginView onLoginSuccess={handleLoginSuccess} onShowClientDashboard={handleShowClientDashboard} />} />
        <Route path="/register" element={currentUser ? (currentUser.role === 'client' ? <Navigate to="/client" replace /> : <Navigate to="/admin" replace />) : <LoginView onLoginSuccess={handleLoginSuccess} onShowClientDashboard={handleShowClientDashboard} initialMode="register" />} />
        <Route path="/client/chatbots/:id/inspector" element={currentUser && currentUser.role === 'client' ? <ConversationInspector clientToken={localStorage.getItem('fidscript_client_token') || ''} /> : <Navigate to="/login" replace />} />
        <Route path="/client/*" element={<ClientRoutes currentUser={currentUser} clientData={clientData} clientInstances={clientInstances} onInstancesChange={setClientInstances as Dispatch<SetStateAction<Instance[]>>} onLogout={handleLogout} tokenBalance={tokenBalance} tokenPackages={tokenPackages} dailyUsage={dailyUsage} recentMessages={recentMessages} messagesToday={messagesToday} onTokenBalanceChange={setTokenBalance} />} />
        <Route path="/admin/*" element={<AdminRoutes {...adminProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdateToast />
    </>
  );
}
