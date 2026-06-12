import React, { useState, useEffect, useCallback } from 'react';
import {
  adminApi,
  clientsApi,
  instancesApi,
  plansApi,
  authApi,
  Instance,
  Client,
  Plan,
  ApiLog,
  AnalyticsData,
} from './services/api';
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
  LogOut,
  Menu,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Search,
  ChevronDown,
  Sparkles,
  Plus,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sub-views
import DashboardOverview from './components/DashboardOverview';
import InstancesView from './components/InstancesView';
import ClientsView from './components/ClientsView';
import ApiConsoleView from './components/ApiConsoleView';
import LogsAndAnalyticsView from './components/LogsAndAnalyticsView';
import InboxView from './components/InboxView';
import SecurityKeysView from './components/SecurityKeysView';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import ClientDashboard from './components/ClientDashboard';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<{ email: string; role: 'admin' | 'client'; name: string } | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Data state from API
  const [instances, setInstances] = useState<Instance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [messages, setMessages] = useState<{ id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[]>([]);
  const [keys, setKeys] = useState<{ id: string; name: string; key: string; created: string; lastUsed: string; status: string }[]>([]);

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'warn' }[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'warn' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return;

    try {
      const [instancesRes, clientsRes, plansRes, analyticsRes, logsRes] = await Promise.all([
        adminApi.getInstances(),
        clientsApi.getAll(),
        plansApi.getAll(),
        adminApi.getAnalytics(),
        adminApi.getLogs(1, 50),
      ]);

      if (instancesRes.success) setInstances(instancesRes.data || []);
      if (clientsRes.success) setClients(clientsRes.data || []);
      if (plansRes.success) setPlans(plansRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data || null);
      if (logsRes.success) setLogs(logsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [currentUser]);

  // Initial data load
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('fidscript_admin_token');
    if (token) {
      authApi.me().then((res) => {
        if (res.success && res.data) {
          setCurrentUser({ email: res.data.email, role: 'admin', name: res.data.name });
          setShowLanding(false);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Handlers
  const handleAddInstance = async (data: { name: string; display_name?: string; client_id?: string }) => {
    const res = await instancesApi.create(data);
    if (res.success && res.data) {
      setInstances((prev) => [res.data!, ...prev]);
      addToast(`Instance ${data.name} created successfully`);
      fetchData();
    } else {
      addToast(res.error || 'Failed to create instance', 'warn');
    }
  };

  const handleUpdateInstanceStatus = async (name: string, status: string) => {
    if (status === 'disconnected') {
      const res = await instancesApi.disconnect(name);
      if (res.success) {
        setInstances((prev) => prev.map((i) => i.name === name ? { ...i, status: 'disconnected' as const } : i));
        addToast(`Instance ${name} disconnected`);
        fetchData();
      }
    }
  };

  const handleDeleteInstance = async (name: string) => {
    const res = await instancesApi.delete(name);
    if (res.success) {
      setInstances((prev) => prev.filter((i) => i.name !== name));
      addToast(`Instance ${name} deleted`, 'warn');
      fetchData();
    }
  };

  const handleAddClient = async (data: { name: string; email: string; phone?: string; plan_id?: string }) => {
    const res = await clientsApi.create(data);
    if (res.success && res.data) {
      setClients((prev) => [res.data!, ...prev]);
      addToast(`Client ${data.name} created successfully`);
      fetchData();
    } else {
      addToast(res.error || 'Failed to create client', 'warn');
    }
  };

  const handleToggleClient = async (id: string) => {
    const res = await clientsApi.toggle(id);
    if (res.success) {
      setClients((prev) => prev.map((c) => c.id === id ? { ...c, is_active: res.data!.is_active } : c));
      addToast(`Client status updated`);
      fetchData();
    }
  };

  const handleResetClientKey = async (id: string) => {
    const res = await clientsApi.resetKey(id);
    if (res.success) {
      addToast('API key reset successfully');
      fetchData();
    }
  };

  const handleDeleteClient = async (id: string) => {
    const res = await clientsApi.delete(id);
    if (res.success) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      addToast('Client deleted', 'warn');
      fetchData();
    }
  };

  const handleAddKey = (name: string) => {
    const newKey = {
      id: `key-${Date.now()}`,
      name,
      key: `fidscript_live_${Math.random().toString(16).substring(2, 10)}...`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'Active',
    };
    setKeys((prev) => [newKey, ...prev]);
    addToast(`API key '${name}' generated`);
  };

  const handleRevokeKey = (id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'Revoked' } : k));
    addToast('API key revoked', 'warn');
  };

  const handleMarkMessageRead = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
  };

  const handleLogout = () => {
    localStorage.removeItem('fidscript_admin_token');
    setCurrentUser(null);
    setShowLanding(true);
    addToast('Logged out successfully');
  };

  // Sidebar navigation items
  const sidebarNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Instances', icon: Radio },
    { name: 'Clients', icon: Users },
    { name: 'API Console', icon: Terminal },
    { name: 'Logs', icon: FileText },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Inbox', icon: Mail },
    { name: 'Audit Logs', icon: History },
    { name: 'Security & Keys', icon: Key },
  ];

  const activeUnreadInboxes = messages.filter((m) => !m.read).length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#11110a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-[3.5px] items-end h-[24px]">
            <span className="w-[4px] bg-yellow-500 h-4 rounded-full animate-pulse" />
            <span className="w-[4px] bg-yellow-500 h-[24px] rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            <span className="w-[4px] bg-yellow-500 h-[18px] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
          <p className="text-[#85826f] text-sm">Loading FIDScript...</p>
        </div>
      </div>
    );
  }

  // Landing page
  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() => setShowLanding(false)}
        onViewDemo={() => setShowLanding(false)}
      />
    );
  }

  // Login page
  if (!currentUser) {
    return (
      <LoginView
        clients={clients}
        onLoginSuccess={(email, role) => {
          setCurrentUser({ email, role, name: email.split('@')[0] });
          addToast(`Welcome to FIDScript!`);
        }}
        onRegisterClient={(name, email, phone, plan) => {
          handleAddClient({ name, email, phone, plan_id: plans.find(p => p.name === plan)?.id });
          setCurrentUser({ email, role: 'client', name });
        }}
      />
    );
  }

  // Client portal
  if (currentUser.role === 'client') {
    const activeClient = clients.find((c) => c.email.toLowerCase() === currentUser.email.toLowerCase()) || {
      id: 'temp',
      name: currentUser.name,
      email: currentUser.email,
      phone: '',
      api_key: '',
      plan_id: null,
      is_active: 1,
      msg_count_today: 0,
      total_messages: 0,
      last_reset: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    return (
      <div className="h-screen w-screen bg-[#11110a] flex flex-col p-4 md:p-8 overflow-y-auto font-suisse-intl">
        <div className="max-w-6xl w-full mx-auto space-y-6">
          <header className="flex items-center justify-between py-2 border-b border-[#2d2b14] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-[3.5px] items-end h-[18px]">
                <span className="w-[3px] bg-yellow-500 h-3 rounded-full" />
                <span className="w-[3px] bg-yellow-500 h-[18px] rounded-full" />
                <span className="w-[3px] bg-yellow-500 h-[14px] rounded-full" />
              </div>
              <div className="font-sans font-bold text-[18px] text-white tracking-tight leading-none">
                FIDScript <span className="text-yellow-400 font-mono text-xs ml-1 font-normal select-none px-1.5 py-0.5 bg-yellow-950/80 rounded border border-yellow-500/20">Client Portal</span>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('fidscript_admin_token');
                setCurrentUser(null);
              }}
              className="text-[10px] bg-stone-900 hover:bg-stone-850 border border-stone-800 text-yellow-500 font-bold px-3 py-1.5 rounded-lg font-mono transition-colors"
            >
              Logout
            </button>
          </header>

          <ClientDashboard
            client={activeClient as any}
            instances={instances.filter((i) => i.client_id === activeClient.id)}
            onUpdateClient={() => {}}
            onAddInstance={() => {}}
            onDeleteInstance={() => {}}
            onUpdateInstanceStatus={() => {}}
            onAddSystemLog={() => {}}
            onLogout={handleLogout}
          />

          <footer className="text-center py-6 text-[10px] text-yellow-600/60 border-t border-[#2d2b14]">
            <p>© 2026 Next Mavens. FIDScript WhatsApp API Platform.</p>
          </footer>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="h-screen w-screen bg-[#11110a] text-[#cbd3cf] font-suisse-intl flex flex-col md:flex-row overflow-hidden antialiased selection:bg-yellow-250 selection:text-stone-950">

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-30 md:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 md:relative md:translate-x-0 z-40 md:z-20 h-screen flex flex-col justify-between transition-all duration-300 shrink-0 border-r border-[#262413] bg-[#12110c] ${
        sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
      }`}>
        <div className="flex-1 overflow-y-auto space-y-4 pt-4 pb-4">
          {/* Logo */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-[3.5px] items-end h-[18px]">
                <span className="w-[3px] bg-yellow-500 h-3 rounded-full" />
                <span className="w-[3px] bg-yellow-500 h-[18px] rounded-full" />
                <span className="w-[3px] bg-yellow-500 h-[14px] rounded-full" />
              </div>
              {sidebarOpen && (
                <div className="font-sans font-bold text-[17px] text-white tracking-tight leading-none">
                  FIDScript
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Home link */}
          <div className="px-2.5">
            <button
              onClick={() => setShowLanding(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] text-[#a8a594] hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              {sidebarOpen && <span>Home</span>}
            </button>
          </div>

          {/* Navigation label */}
          {sidebarOpen && (
            <div className="px-4 pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8e8555]">Navigation</span>
            </div>
          )}

          {/* Nav items */}
          <nav className="px-2.5 space-y-1">
            {sidebarNavItems.map((item) => {
              const isSelected = activeTab === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] transition-colors ${
                    isSelected ? 'text-white font-semibold' : 'text-[#a8a594] hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.span layoutId="activeSidebarTab" className="absolute inset-0 bg-[#1b1a11] rounded-lg border border-[#33301a]" />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 relative z-10 ${isSelected ? 'text-yellow-400' : ''}`} />
                  {sidebarOpen && <span className="relative z-10">{item.name}</span>}
                  {sidebarOpen && item.name === 'Inbox' && activeUnreadInboxes > 0 && (
                    <span className="ml-auto bg-yellow-500 text-stone-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeUnreadInboxes}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-[#262413]">
          {sidebarOpen ? (
            <div className="space-y-1.5">
              <div className="p-2.5 bg-[#1a1910] rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-white font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-yellow-500">Admin</p>
                </div>
                <button onClick={handleLogout} className="text-[#b0ae9f] hover:text-white p-1">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-300 font-bold text-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className="p-1 text-red-400 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-[#f9f9f2] rounded-none md:rounded-[1.75rem] md:m-3 flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <header className="h-16 bg-white/70 backdrop-blur border-b border-[#e1e9e5]/80 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-[#e3e8ea]">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#60737a]">
              <span className="text-yellow-700 font-medium">FIDScript</span>
              <span>/</span>
              <span className="text-[#272c30] font-semibold">{activeTab}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#45524c] bg-white border border-[#e1e9e5] px-3.5 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <button onClick={() => addToast('All systems operational. 100% SLA uptime.')} className="relative p-2 bg-white hover:bg-[#f9f9f2] border border-[#e1e9e5] rounded-xl">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full space-y-6">
              {activeTab === 'Dashboard' && (
                <DashboardOverview instances={instances} clients={clients} logs={logs.map(l => ({
                  id: l.id,
                  timestamp: l.timestamp,
                  level: l.response_status === 200 ? 'SUCCESS' : 'WARNING',
                  source: l.endpoint,
                  message: `${l.method} ${l.endpoint}`,
                }))} onNavigate={setActiveTab} />
              )}
              {activeTab === 'Instances' && (
                <InstancesView
                  instances={instances}
                  clientsList={clients.map((c) => c.name)}
                  onAddInstance={handleAddInstance}
                  onUpdateStatus={handleUpdateInstanceStatus}
                  onDeleteInstance={handleDeleteInstance}
                />
              )}
              {activeTab === 'Clients' && (
                <ClientsView
                  clients={clients}
                  onAddClient={handleAddClient}
                  onToggleClient={handleToggleClient}
                  onResetKey={handleResetClientKey}
                  onDeleteClient={handleDeleteClient}
                />
              )}
              {activeTab === 'API Console' && <ApiConsoleView />}
              {(activeTab === 'Logs' || activeTab === 'Audit Logs') && (
                <LogsAndAnalyticsView logs={logs.map(l => ({
                  id: l.id,
                  timestamp: l.timestamp,
                  level: l.response_status === 200 ? 'SUCCESS' : 'WARNING',
                  source: l.client_name || 'System',
                  message: `${l.method} ${l.endpoint} - ${l.response_status || 'pending'}`,
                }))} onAddLog={() => {}} />
              )}
              {activeTab === 'Analytics' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
                    <p className="text-xs text-[#60737a] font-semibold">Total Clients</p>
                    <p className="text-2xl font-bold text-[#272c30]">{analytics.total_clients}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
                    <p className="text-xs text-[#60737a] font-semibold">Active Instances</p>
                    <p className="text-2xl font-bold text-[#272c30]">{analytics.connected_instances}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
                    <p className="text-xs text-[#60737a] font-semibold">Messages Today</p>
                    <p className="text-2xl font-bold text-[#272c30]">{analytics.messages_today.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#e1e9e5]">
                    <p className="text-xs text-[#60737a] font-semibold">Delivery Rate</p>
                    <p className="text-2xl font-bold text-emerald-600">{analytics.delivery_rate}%</p>
                  </div>
                </div>
              )}
              {activeTab === 'Inbox' && (
                <InboxView messages={messages} onMarkRead={handleMarkMessageRead} />
              )}
              {activeTab === 'Security & Keys' && (
                <SecurityKeysView keys={keys} onAddKey={handleAddKey} onRevokeKey={handleRevokeKey} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-3.5 rounded-md border flex items-center justify-between bg-white shadow-xl ${t.type === 'warn' ? 'border-amber-200 text-amber-900' : 'border-yellow-200 text-yellow-950'}`}>
              <div className="flex items-center gap-2.5">
                {t.type === 'warn' ? <AlertCircle className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-yellow-600" />}
                <span className="text-xs">{t.text}</span>
              </div>
              <button onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
