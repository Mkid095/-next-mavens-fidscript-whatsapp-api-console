/**
 * useLLMProviders — all state + handlers for the providers view.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchApi } from '../../../../data/api/client.js';
import { LLMProvider, PROVIDER_META, StatusFilter, StatFilter, ViewMode, TestResult } from './types';

export function useLLMProviders() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalProvider, setModalProvider] = useState<LLMProvider | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ providerName: string; result: TestResult } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [setDefaultId, setSetDefaultId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingSharedId, setTogglingSharedId] = useState<string | null>(null);
  const [togglingEnabledId, setTogglingEnabledId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ provider: LLMProvider; error?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [statFilter, setStatFilter] = useState<StatFilter>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const res = await fetchApi<LLMProvider[]>('/api/admin/llm-providers/providers');
      if (res.success && res.data) setProviders(res.data);
      else setError(res.error ?? 'Failed to load providers');
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: providers.length,
    active: providers.filter((p) => p.enabled).length,
    default: providers.filter((p) => p.is_default).length,
    shared: providers.filter((p) => p.is_shared).length,
  }), [providers]);

  const filteredProviders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return providers.filter((p) => {
      if (statFilter === 'active' && !p.enabled) return false;
      if (statFilter === 'default' && !p.is_default) return false;
      if (statFilter === 'shared' && !p.is_shared) return false;
      if (statusFilter === 'active' && !p.enabled) return false;
      if (statusFilter === 'disabled' && p.enabled) return false;
      if (typeFilter !== 'all' && p.provider_type !== typeFilter) return false;
      if (term) {
        const hay = `${p.name} ${p.provider_type} ${p.base_url} ${PROVIDER_META[p.provider_type]?.label ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [providers, search, typeFilter, statusFilter, statFilter]);

  const clearFilters = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setStatFilter(null); };

  const handleSave = (saved: LLMProvider) => {
    setProviders((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      return idx >= 0 ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
    });
  };

  const handleTest = async (p: LLMProvider) => {
    setTestingId(p.id);
    try {
      const res = await fetchApi<{ ok: boolean; models?: string[]; total?: number; error?: string }>(
        `/api/admin/llm-providers/${p.id}/test`, { method: 'POST' }
      );
      setTestResult({ providerName: p.name, result: res.data ?? { ok: false, error: res.error } });
    } catch (e) { setTestResult({ providerName: p.name, result: { ok: false, error: String(e) } }); }
    finally { setTestingId(null); }
  };

  const handleSetDefault = async (p: LLMProvider) => {
    if (p.is_default) return;
    setSetDefaultId(p.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${p.id}/set-default`, { method: 'POST' });
      if (res.success) await load(true);
    } finally { setSetDefaultId(null); }
  };

  const handleToggleShared = async (p: LLMProvider) => {
    setTogglingSharedId(p.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${p.id}`, {
        method: 'PATCH', body: JSON.stringify({ is_shared: !p.is_shared }),
      });
      if (res.success) setProviders((prev) => prev.map((x) => x.id === p.id ? { ...x, is_shared: x.is_shared ? 0 : 1 } : x));
    } finally { setTogglingSharedId(null); }
  };

  const handleToggleEnabled = async (p: LLMProvider, next: boolean) => {
    setTogglingEnabledId(p.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${p.id}`, {
        method: 'PATCH', body: JSON.stringify({ enabled: next ? 1 : 0 }),
      });
      if (res.success) setProviders((prev) => prev.map((x) => x.id === p.id ? { ...x, enabled: next ? 1 : 0 } : x));
      else setError(res.error ?? 'Failed to toggle provider');
    } finally { setTogglingEnabledId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const p = deleteConfirm.provider;
    setDeletingId(p.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${p.id}`, { method: 'DELETE' });
      if (res.success) { setProviders((prev) => prev.filter((x) => x.id !== p.id)); setDeleteConfirm(null); }
      else setDeleteConfirm({ provider: p, error: res.error ?? 'Delete failed' });
    } catch (e) { setDeleteConfirm({ provider: p, error: String(e) }); }
    finally { setDeletingId(null); }
  };

  const openModal = (p?: LLMProvider) => { setModalProvider(p); setModalOpen(true); };
  const isFiltering = search !== '' || typeFilter !== 'all' || statusFilter !== 'all' || statFilter !== null;

  return {
    providers, loading, error, refreshing, modalProvider, modalOpen, testResult,
    testingId, deletingId, setDefaultId, expandedId, togglingSharedId, togglingEnabledId,
    deleteConfirm, search, typeFilter, statusFilter, view, statFilter, searchRef,
    stats, filteredProviders, isFiltering,
    load, clearFilters, handleSave, openModal, handleTest, handleSetDefault,
    handleToggleShared, handleToggleEnabled, confirmDelete,
    setExpandedId, setDeleteConfirm,
  };
}
