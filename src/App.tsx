import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProviders } from './data';
import {
  authApi, adminApi, clientsApi, instancesApi, plansApi, paymentsApi,
  type Instance, type Client, type Plan, type ApiLog, type AnalyticsData,
  type TokenPackage, type DailyUsage, type TokenTransaction, type ClientMessage,
} from './data';
import { LoadingScreen } from './components/shared/LoadingScreen';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import TermsPage from './components/landing/TermsPage';
import PrivacyPage from './components/landing/PrivacyPage';
import FeaturesPage from './components/landing/FeaturesPage';
import PricingPage from './components/landing/PricingPage';
import DocsPage from './components/landing/DocsPage';
import ChangelogPage from './components/landing/ChangelogPage';
import ChangelogVersionPage from './components/landing/ChangelogVersionPage';
import ContactPage from './components/landing/ContactPage';
import { AdminRoutes } from './components/admin/adminRoutes';
import { ClientRoutes } from './components/client/clientRoutes';
import ConversationInspector from './features/chatbots/ConversationInspector';
import { UpdateToast } from './components/shared/UpdateToast';
import { initDeployNotification } from './services/deployNotification';

function AppContent() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ email: string; role: 'admin' | 'client'; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [clientInstances, setClientInstances] = useState<Instance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [messages, setMessages] = useState<{ id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[]>([]);
  const [keys, setKeys] = useState<{ id: string; name: string; key: string; created: string; lastUsed: string; status: string }[]>([]);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentMessages, setRecentMessages] = useState<ClientMessage[]>([]);
  const [messagesToday, setMessagesToday] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'warn' }[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'warn' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Check for existing session
  useEffect(() => {
    const adminToken = localStorage.getItem('fidscript_admin_token');
    const clientToken = localStorage.getItem('fidscript_client_token');

    if (adminToken) {
      authApi.me().then((res) => {
        if (res.success && res.data) {
          setCurrentUser({ email: res.data.email, role: 'admin', name: res.data.name });
        } else if (res.status === 401) {
          // Only a real auth failure invalidates the session — network blips
          // and 5xx must NOT clear the token, or one transient backend hiccup
          // would force the admin back to /login.
          localStorage.removeItem('fidscript_admin_token');
        }
        setIsLoading(false);
      });
    } else if (clientToken) {
      Promise.all([authApi.clientMe(), instancesApi.getClientInstances()]).then(([meRes, instRes]) => {
        if (meRes.success && meRes.data) {
          setClientData(meRes.data);
          setCurrentUser({ email: meRes.data.email, role: 'client', name: meRes.data.name });
          if (instRes.success && instRes.data) {
            setClientInstances(instRes.data);
          }
        } else if (meRes.status === 401) {
          localStorage.removeItem('fidscript_client_token');
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

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

  const [plans, setPlans] = useState<Plan[]>([]);

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

  // Real-time token balance updates via SSE
  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent).detail as { balance: number };
      setTokenBalance(data.balance);
    };
    window.addEventListener('sse-token-update', handler);
    return () => window.removeEventListener('sse-token-update', handler);
  }, []);

  // Real-time dashboard stats via SSE
  useEffect(() => {
    if (currentUser?.role !== 'client') return;
    const token = localStorage.getItem('fidscript_client_token');
    if (!token) return;

    const es = new EventSource(`/api/sse/dashboard?token=${encodeURIComponent(token)}`);
    es.addEventListener('dashboardUpdate', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setMessagesToday(data.messagesToday);
      setDailyUsage(data.dailyVolume);
      setRecentMessages(data.recentMessages);
    });
    return () => es.close();
  }, [currentUser?.role]);

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
	        <Route path="/client/*" element={<ClientRoutes currentUser={currentUser} clientData={clientData} clientInstances={clientInstances} onInstancesChange={setClientInstances} onLogout={handleLogout} tokenBalance={tokenBalance} tokenPackages={tokenPackages} dailyUsage={dailyUsage} recentMessages={recentMessages} messagesToday={messagesToday} onTokenBalanceChange={setTokenBalance} />} />
        <Route path="/admin/*" element={<AdminRoutes sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} handleLogout={handleLogout} messages={messages} toasts={toasts} setToasts={setToasts} instances={instances} clients={clients} logs={logs} analytics={analytics} keys={keys} handleAddInstance={async (d) => { const r = await instancesApi.create(d); if (r.success && r.data) { setInstances(p => [r.data!, ...p]); addToast(`Instance ${d.name} created`); } else addToast(r.error || 'Failed', 'warn'); }} handleUpdateInstanceStatus={async (n, s) => { if (s === 'disconnected') { const r = await instancesApi.disconnect(n); if (r.success) { setInstances(p => p.map(i => i.name === n ? { ...i, status: 'disconnected' as const } : i)); addToast(`Instance ${n} disconnected`); } } }} handleDeleteInstance={async (n) => { const r = await instancesApi.delete(n); if (r.success) { setInstances(p => p.filter(i => i.name !== n)); addToast(`Instance ${n} deleted`, 'warn'); } }} handleAddClient={async (d) => { const r = await clientsApi.create(d); if (r.success && r.data) { setClients(p => [r.data!, ...p]); addToast(`Client ${d.name} created`); } else addToast(r.error || 'Failed', 'warn'); }} handleToggleClient={async (id) => { const r = await clientsApi.toggle(id); if (r.success) { setClients(p => p.map(c => c.id === id ? { ...c, is_active: r.data!.is_active } : c)); addToast('Client updated'); } }} handleResetClientKey={async (id) => { const r = await clientsApi.resetKey(id); if (r.success) addToast('API key reset'); }} handleDeleteClient={async (id) => { const r = await clientsApi.delete(id); if (r.success) { setClients(p => p.filter(c => c.id !== id)); addToast(`Client deleted`, 'warn'); } }} handleAwardTokens={async (id, newBalance) => { setClients(p => p.map(c => c.id === id ? { ...c, token_balance: newBalance } : c)); addToast('Tokens awarded'); }} handleAddKey={(n) => { const k = { id: `key-${Date.now()}`, name: n, key: `fidscript_live_${Math.random().toString(16).substring(2, 10)}...`, created: new Date().toISOString().split('T')[0], lastUsed: 'Never', status: 'Active' }; setKeys(p => [k, ...p]); addToast(`API key '${n}' generated`); }} handleRevokeKey={(id) => { setKeys(p => p.map(k => k.id === id ? { ...k, status: 'Revoked' } : k)); addToast('API key revoked', 'warn'); }} handleMarkMessageRead={(id) => setMessages(p => p.map(m => m.id === id ? { ...m, read: true } : m))} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdateToast />
    </>
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
