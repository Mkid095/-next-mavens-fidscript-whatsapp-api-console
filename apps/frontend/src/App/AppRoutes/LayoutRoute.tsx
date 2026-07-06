import { Routes, Route, Navigate } from 'react-router-dom';
import type { Client, Instance, DailyUsage, ClientMessage } from '../../data';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import LandingPage from '../../components/LandingPage';
import LoginView from '../../components/LoginView';
import TermsPage from '../../components/landing/TermsPage';
import PrivacyPage from '../../components/landing/PrivacyPage';
import FeaturesPage from '../../components/landing/FeaturesPage';
import PricingPage from '../../components/landing/PricingPage';
import DocsPage from '../../components/landing/DocsPage';
import ChangelogPage from '../../components/landing/ChangelogPage';
import ChangelogVersionPage from '../../components/landing/ChangelogVersionPage';
import ContactPage from '../../components/landing/ContactPage';
import { AdminRoutes } from '../../components/admin/adminRoutes';
import { ClientRoutes } from '../../components/client/clientRoutes';
import ConversationInspector from '../../features/chatbots/ConversationInspector';
import { UpdateToast } from '../../components/shared/UpdateToast';
import { instancesApi, clientsApi } from '../../data';
import type { ApiLog, AnalyticsData } from '../../data';

interface LayoutRouteProps {
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  clientData: Client | null;
  clientInstances: Instance[];
  onInstancesChange: (instances: Instance[]) => void;
  onLogout: () => void;
  tokenBalance: number;
  tokenPackages: import('../data').TokenPackage[];
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

export function LayoutRoute({
  currentUser,
  clientData,
  clientInstances,
  onInstancesChange,
  onLogout,
  tokenBalance,
  tokenPackages,
  dailyUsage,
  recentMessages,
  messagesToday,
  onTokenBalanceChange,
  toasts,
  setToasts,
  messages,
  logs,
  analytics,
  sidebarOpen,
  setSidebarOpen,
  handleLoginSuccess,
  handleShowClientDashboard,
  addToast,
}: LayoutRouteProps) {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              currentUser.role === 'client' ? (
                <Navigate to="/client" replace />
              ) : (
                <Navigate to="/admin" replace />
              )
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/changelog/:version" element={<ChangelogVersionPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/login"
          element={
            currentUser ? (
              currentUser.role === 'client' ? (
                <Navigate to="/client" replace />
              ) : (
                <Navigate to="/admin" replace />
              )
            ) : (
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                onShowClientDashboard={handleShowClientDashboard}
              />
            )
          }
        />
        <Route
          path="/register"
          element={
            currentUser ? (
              currentUser.role === 'client' ? (
                <Navigate to="/client" replace />
              ) : (
                <Navigate to="/admin" replace />
              )
            ) : (
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                onShowClientDashboard={handleShowClientDashboard}
                initialMode="register"
              />
            )
          }
        />
        <Route
          path="/client/chatbots/:id/inspector"
          element={
            currentUser && currentUser.role === 'client' ? (
              <ConversationInspector
                clientToken={localStorage.getItem('fidscript_client_token') || ''}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/client/*"
          element={
            <ClientRoutes
              currentUser={currentUser}
              clientData={clientData}
              clientInstances={clientInstances}
              onInstancesChange={onInstancesChange}
              onLogout={onLogout}
              tokenBalance={tokenBalance}
              tokenPackages={tokenPackages}
              dailyUsage={dailyUsage}
              recentMessages={recentMessages}
              messagesToday={messagesToday}
              onTokenBalanceChange={onTokenBalanceChange}
            />
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoutes
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              currentUser={currentUser}
              handleLogout={onLogout}
              messages={messages}
              toasts={toasts}
              setToasts={setToasts}
              instances={[]}
              clients={[]}
              logs={logs}
              analytics={analytics}
              handleAddInstance={async (d) => {
                const r = await instancesApi.create(d);
                if (r.success && r.data) {
                  onInstancesChange((p) => [r.data!, ...p]);
                  addToast(`Instance ${d.name} created`);
                } else addToast(r.error || 'Failed', 'warn');
              }}
              handleUpdateInstanceStatus={async (n, s) => {
                if (s === 'disconnected') {
                  const r = await instancesApi.disconnect(n);
                  if (r.success) {
                    onInstancesChange((p) =>
                      p.map((i) => (i.name === n ? { ...i, status: 'disconnected' as const } : i)),
                    );
                    addToast(`Instance ${n} disconnected`);
                  }
                }
              }}
              handleDeleteInstance={async (n) => {
                const r = await instancesApi.delete(n);
                if (r.success) {
                  onInstancesChange((p) => p.filter((i) => i.name !== n));
                  addToast(`Instance ${n} deleted`, 'warn');
                }
              }}
              handleAddClient={async (d) => {
                const r = await clientsApi.create(d);
                if (r.success && r.data) addToast(`Client ${d.name} created`);
                else addToast(r.error || 'Failed', 'warn');
              }}
              handleToggleClient={async (id) => {
                const r = await clientsApi.toggle(id);
                if (r.success) addToast('Client updated');
              }}
              handleResetClientKey={async (id) => {
                const r = await clientsApi.resetKey(id);
                if (r.success) addToast('API key reset');
              }}
              handleDeleteClient={async (id) => {
                const r = await clientsApi.delete(id);
                if (r.success) addToast(`Client deleted`, 'warn');
              }}
              handleAwardTokens={async (_id, _newBalance) => {
                addToast('Tokens awarded');
              }}
              handleMarkMessageRead={(id) => {
                /* handled by SSE */
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdateToast />
    </>
  );
}
