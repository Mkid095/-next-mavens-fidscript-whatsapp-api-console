import { Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminContent } from './AdminContent';
import type { Instance, Client, ApiLog, AnalyticsData } from '../../services/api';

interface AdminRouteProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  handleLogout: () => void;
  messages: { id: string; from_number: string; from_name: string; content: string; timestamp: string; read: boolean }[];
  toasts: { id: string; text: string; type: 'success' | 'warn' }[];
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; text: string; type: 'success' | 'warn' }[]>>;
  instances: Instance[];
  clients: Client[];
  logs: ApiLog[];
  analytics: AnalyticsData | null;
  keys: { id: string; name: string; key: string; created: string; lastUsed: string; status: string }[];
  handleAddInstance: (data: { name: string; display_name?: string; client_id?: string }) => Promise<void>;
  handleUpdateInstanceStatus: (name: string, status: string) => Promise<void>;
  handleDeleteInstance: (name: string) => Promise<void>;
  handleAddClient: (data: { name: string; email: string; phone?: string; plan_id?: string }) => Promise<void>;
  handleToggleClient: (id: string) => Promise<void>;
  handleResetClientKey: (id: string) => Promise<void>;
  handleDeleteClient: (id: string) => Promise<void>;
  handleAddKey: (name: string) => void;
  handleRevokeKey: (id: string) => void;
  handleMarkMessageRead: (id: string) => void;
}

export function AdminRoutes({
  sidebarOpen, setSidebarOpen, currentUser, handleLogout,
  messages, toasts, setToasts,
  instances, clients, logs, analytics, keys,
  handleAddInstance, handleUpdateInstanceStatus, handleDeleteInstance,
  handleAddClient, handleToggleClient, handleResetClientKey, handleDeleteClient,
  handleAddKey, handleRevokeKey, handleMarkMessageRead,
}: AdminRouteProps) {
  // Guard: must be an authenticated admin
  if (currentUser?.role !== 'admin') {
    if (currentUser?.role === 'client') {
      return <Navigate to="/client" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Render layout directly. The parent route is `/admin/*`, so this component
  // mounts for any /admin path. AdminContent reads the current location via
  // useLocation() to determine which tab to display.
  return (
    <AdminLayout
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      currentUser={currentUser}
      handleLogout={handleLogout}
      messages={messages}
      toasts={toasts}
      setToasts={setToasts}
    >
      <AdminContent
        instances={instances}
        clients={clients}
        logs={logs}
        analytics={analytics}
        messages={messages}
        keys={keys}
        handleAddInstance={handleAddInstance}
        handleUpdateInstanceStatus={handleUpdateInstanceStatus}
        handleDeleteInstance={handleDeleteInstance}
        handleAddClient={handleAddClient}
        handleToggleClient={handleToggleClient}
        handleResetClientKey={handleResetClientKey}
        handleDeleteClient={handleDeleteClient}
        handleAddKey={handleAddKey}
        handleRevokeKey={handleRevokeKey}
        handleMarkMessageRead={handleMarkMessageRead}
      />
    </AdminLayout>
  );
}
