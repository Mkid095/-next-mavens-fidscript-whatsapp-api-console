import type { Instance, Client, ApiLog, AnalyticsData, Plan } from '../data';
import { instancesApi, clientsApi } from '../data';

export interface AdminRouteProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  handleLogout: () => void;
  instances: Instance[];
  clients: Client[];
  logs: ApiLog[];
  analytics: AnalyticsData | null;
  keys: { id: string; name: string; key: string; created: string; lastUsed: string; status: string }[];
  messages: { id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[];
  toasts: { id: string; text: string; type: 'success' | 'warn' }[];
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; text: string; type: 'success' | 'warn' }[]>>;
  plans: Plan[];
  handleAddInstance: (d: { name: string }) => Promise<void>;
  handleUpdateInstanceStatus: (n: string, s: string) => Promise<void>;
  handleDeleteInstance: (n: string) => Promise<void>;
  handleAddClient: (d: { name: string; email: string; password?: string }) => Promise<void>;
  handleToggleClient: (id: string) => Promise<void>;
  handleResetClientKey: (id: string) => Promise<void>;
  handleDeleteClient: (id: string) => Promise<void>;
  handleAwardTokens: (id: string, newBalance: number) => Promise<void>;
  handleAddKey: (name: string) => void;
  handleRevokeKey: (id: string) => void;
  handleMarkMessageRead: (id: string) => void;
}

export function buildAdminRoutesProps(opts: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  handleLogout: () => void;
  instances: Instance[];
  clients: Client[];
  logs: ApiLog[];
  analytics: AnalyticsData | null;
  keys: { id: string; name: string; key: string; created: string; lastUsed: string; status: string }[];
  messages: { id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[];
  toasts: { id: string; text: string; type: 'success' | 'warn' }[];
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; text: string; type: 'success' | 'warn' }[]>>;
  plans: Plan[];
  setInstances: React.Dispatch<React.SetStateAction<Instance[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setKeys: React.Dispatch<React.SetStateAction<{ id: string; name: string; key: string; created: string; lastUsed: string; status: string }[]>>;
  setMessages: React.Dispatch<React.SetStateAction<{ id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[]>>;
  addToast: (text: string, type?: 'success' | 'warn') => void;
}): AdminRouteProps {
  const { addToast, setInstances, setClients, setKeys, setMessages } = opts;

  return {
    sidebarOpen: opts.sidebarOpen,
    setSidebarOpen: opts.setSidebarOpen,
    currentUser: opts.currentUser,
    handleLogout: opts.handleLogout,
    instances: opts.instances,
    clients: opts.clients,
    logs: opts.logs,
    analytics: opts.analytics,
    keys: opts.keys,
    messages: opts.messages,
    toasts: opts.toasts,
    setToasts: opts.setToasts,
    plans: opts.plans,
    handleAddInstance: async (d) => {
      const r = await instancesApi.create(d);
      if (r.success && r.data) {
        setInstances((p) => [r.data!, ...p]);
        addToast(`Instance ${d.name} created`);
      } else addToast(r.error || 'Failed', 'warn');
    },
    handleUpdateInstanceStatus: async (n, s) => {
      if (s === 'disconnected') {
        const r = await instancesApi.disconnect(n);
        if (r.success) {
          setInstances((p) => p.map((i) => (i.name === n ? { ...i, status: 'disconnected' as const } : i)));
          addToast(`Instance ${n} disconnected`);
        }
      }
    },
    handleDeleteInstance: async (n) => {
      const r = await instancesApi.delete(n);
      if (r.success) {
        setInstances((p) => p.filter((i) => i.name !== n));
        addToast(`Instance ${n} deleted`, 'warn');
      }
    },
    handleAddClient: async (d) => {
      const r = await clientsApi.create(d);
      if (r.success && r.data) {
        setClients((p) => [r.data!, ...p]);
        addToast(`Client ${d.name} created`);
      } else addToast(r.error || 'Failed', 'warn');
    },
    handleToggleClient: async (id) => {
      const r = await clientsApi.toggle(id);
      if (r.success) {
        setClients((p) => p.map((c) => (c.id === id ? { ...c, is_active: r.data!.is_active } : c)));
        addToast('Client updated');
      }
    },
    handleResetClientKey: async (id) => {
      const r = await clientsApi.resetKey(id);
      if (r.success) addToast('API key reset');
    },
    handleDeleteClient: async (id) => {
      const r = await clientsApi.delete(id);
      if (r.success) {
        setClients((p) => p.filter((c) => c.id !== id));
        addToast(`Client deleted`, 'warn');
      }
    },
    handleAwardTokens: async (id, newBalance) => {
      setClients((p) => p.map((c) => (c.id === id ? { ...c, token_balance: newBalance } : c)));
      addToast('Tokens awarded');
    },
    handleAddKey: (n) => {
      const k = {
        id: `key-${Date.now()}`,
        name: n,
        key: `fidscript_live_${Math.random().toString(16).substring(2, 10)}...`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never',
        status: 'Active',
      };
      setKeys((p) => [k, ...p]);
      addToast(`API key '${n}' generated`);
    },
    handleRevokeKey: (id) => {
      setKeys((p) => p.map((k) => (k.id === id ? { ...k, status: 'Revoked' } : k)));
      addToast('API key revoked', 'warn');
    },
    handleMarkMessageRead: (id) => setMessages((p) => p.map((m) => (m.id === id ? { ...m, read: true } : m))),
  };
}
