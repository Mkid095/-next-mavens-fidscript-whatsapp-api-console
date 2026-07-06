/**
 * LLMConnectionsSection — client-side BYOK management.
 * Owns all state; renders layout and delegates to child components.
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { fetchApi } from '../../data/api/client.js';
import LLMConnectionCard from './LLMConnectionCard';
import LLMConnectionForm from './LLMConnectionForm';
import ConfirmDialog from './ConfirmDialog';
import ProviderList from './ProviderList';
import EmptyState from './EmptyState';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LlmConnection {
  id: string;
  name: string;
  provider: string;
  api_key_last4: string;
  model: string;
  endpoint: string;
  enabled: number;
  is_default: number;
  created_at: string;
}

interface FidscriptProvider {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function LLMConnectionsSection({ clientToken }: { clientToken?: string }) {
  const [connections, setConnections] = useState<LlmConnection[]>([]);
  const [fidscriptProviders, setFidscriptProviders] = useState<FidscriptProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ name: string; ok: boolean; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LlmConnection | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [connRes, provRes] = await Promise.all([
        fetchApi<LlmConnection[]>('/api/platform/llm-connections'),
        fetchApi<FidscriptProvider[]>('/api/platform/llm-connections/available-providers'),
      ]);
      if (connRes.success && connRes.data) setConnections(connRes.data);
      if (provRes.success && provRes.data) setFidscriptProviders(provRes.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTest = async (conn: LlmConnection) => {
    setTestingId(conn.id);
    setTestResult(null);
    try {
      const res = await fetchApi<{ success: boolean; message?: string; error?: string }>(
        `/api/platform/llm-connections/${conn.id}/test`, { method: 'POST' }
      );
      setTestResult({
        name: conn.name,
        ok: res.success,
        message: res.success ? (res.data?.message ?? 'Connection successful') : (res.error ?? 'Test failed'),
      });
    } catch (e) {
      setTestResult({ name: conn.name, ok: false, message: String(e) });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const conn = deleteConfirm;
    setDeletingId(conn.id);
    try {
      const res = await fetchApi(`/api/platform/llm-connections/${conn.id}`, { method: 'DELETE' });
      if (res.success) {
        setConnections((prev) => prev.filter((c) => c.id !== conn.id));
        setDeleteConfirm(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h2 className="text-lg font-bold text-stone-100">LLM Connections</h2>
          <p className="text-xs text-stone-500 mt-0.5">Add your own API keys to use custom LLMs with chatbots.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-yellow-500 text-stone-900 rounded-xl hover:bg-yellow-400 transition-colors shrink-0">
          <Plus size={13} /> Add Connection
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-300">
          {error} <button onClick={load} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {fidscriptProviders.length > 0 && <ProviderList fidscriptProviders={fidscriptProviders} />}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-stone-600" /></div>
      ) : connections.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <LLMConnectionCard key={conn.id} conn={conn} testingId={testingId} deletingId={deletingId}
              onTest={() => handleTest(conn)} onDelete={() => setDeleteConfirm(conn)} />
          ))}
        </div>
      )}

      {showAdd && <LLMConnectionForm onClose={() => setShowAdd(false)} onSaved={load} />}
      {deleteConfirm && (
        <ConfirmDialog title={`Delete "${deleteConfirm.name}"?`}
          message="This will remove the connection and its API key. Chatbots using this connection will need to be reconfigured."
          onConfirm={handleDelete} onClose={() => { if (!deletingId) setDeleteConfirm(null); }} />
      )}
    </div>
  );
}
