/**
 * useAuthInit — restores admin/client session from localStorage on mount.
 * Also manages SSE listeners for token updates and dashboard stats.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authApi,
  instancesApi,
  paymentsApi,
  type Client,
  type Instance,
  type TokenPackage,
  type DailyUsage,
  type TokenTransaction,
} from '../../data';

export interface AuthState {
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  isLoading: boolean;
  clientData: Client | null;
  clientInstances: Instance[];
  tokenBalance: number;
  tokenPackages: TokenPackage[];
  dailyUsage: DailyUsage[];
  recentMessages: import('../../data').ClientMessage[];
  messagesToday: number;
}

export function useAuthInitImpl() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthState['currentUser']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [clientInstances, setClientInstances] = useState<Instance[]>([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentMessages, setRecentMessages] = useState<import('../data').ClientMessage[]>([]);
  const [messagesToday, setMessagesToday] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'warn' }[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'warn' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Session restoration ───────────────────────────────────────────────────────
  useEffect(() => {
    const adminToken = localStorage.getItem('fidscript_admin_token');
    const clientToken = localStorage.getItem('fidscript_client_token');

    if (adminToken) {
      authApi.me().then((res) => {
        if (res.success && res.data) {
          setCurrentUser({ email: res.data.email, role: 'admin', name: res.data.name });
        } else if (res.status === 401) {
          localStorage.removeItem('fidscript_admin_token');
        }
        setIsLoading(false);
      });
    } else if (clientToken) {
      Promise.all([authApi.clientMe(), instancesApi.getClientInstances()]).then(
        ([meRes, instRes]) => {
          if (meRes.success && meRes.data) {
            setClientData(meRes.data);
            setCurrentUser({ email: meRes.data.email, role: 'client', name: meRes.data.name });
            if (instRes.success && instRes.data) setClientInstances(instRes.data);
          } else if (meRes.status === 401) {
            localStorage.removeItem('fidscript_client_token');
          }
          setIsLoading(false);
        },
      );
    } else {
      setIsLoading(false);
    }
  }, []);

  // ── Client data fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser?.role !== 'client' || !clientData) return;
    Promise.all([authApi.clientTokens(), paymentsApi.getPackages()]).then(
      ([balanceRes, packagesRes]) => {
        if (balanceRes.success && balanceRes.data) {
          setTokenBalance(balanceRes.data.balance);
          if (balanceRes.data.history) {
            const usage = balanceRes.data.history.slice(-7).map((t: TokenTransaction) => ({
              date: new Date(t.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              messages_sent: t.type === 'debit' ? t.amount : 0,
              tokens_used: t.type === 'debit' ? t.amount : 0,
              messages_delivered: t.type === 'debit' ? Math.floor(t.amount * 0.95) : 0,
            }));
            setDailyUsage(usage);
          }
        }
        if (packagesRes.success && packagesRes.data) setTokenPackages(packagesRes.data);
      },
    );
  }, [currentUser?.role, clientData]);

  // ── Real-time token balance via SSE ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent).detail as { balance: number };
      setTokenBalance(data.balance);
    };
    window.addEventListener('sse-token-update', handler);
    return () => window.removeEventListener('sse-token-update', handler);
  }, []);

  // ── Real-time dashboard stats via SSE ───────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('fidscript_admin_token');
    localStorage.removeItem('fidscript_client_token');
    setCurrentUser(null);
    setClientData(null);
    setClientInstances([]);
    addToast('Logged out successfully');
  };

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
              date: new Date(t.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
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

  const handleLoginSuccess = useCallback(
    (email: string, role: 'admin' | 'client') => {
      if (role === 'client') {
        window.location.replace('/client');
        handleClientLoginFetch();
      } else {
        setCurrentUser({ email, role, name: email.split('@')[0] });
        addToast('Welcome to FIDScript!');
      }
    },
    [addToast],
  );

  const handleShowClientDashboard = useCallback(() => {
    window.location.replace('/client');
    handleClientLoginFetch();
  }, []);

  return {
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
    addToast,
    handleLogout,
    handleLoginSuccess,
    handleShowClientDashboard,
  };
}
