/**
 * ConnectorsPanel - UI for workspace connector management.
 *
 * Lists available integrations (Shopify, WooCommerce, etc.), shows install status,
 * and provides credential management (OAuth flow / API key entry).
 *
 * API: /api/platform/connectors
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Plug, Plus, Trash2, Check, ChevronDown, ChevronUp,
  Loader2, ExternalLink, Key, RefreshCw, AlertCircle,
} from 'lucide-react';
import { connectorsApi, type ConnectorSummary, type ConnectorDetail } from '../../services/connectors';

interface ConnectorCardProps {
  slug: string;
  onInstall: (slug: string) => void;
  onRevoke: (slug: string) => void;
  clientToken: string;
}

function ConnectorCard({ slug, onInstall, onRevoke, clientToken }: ConnectorCardProps) {
  const [detail, setDetail] = useState<ConnectorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showCredForm, setShowCredForm] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [shopInput, setShopInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await connectorsApi.get(slug);
      if (d.success && d.data) setDetail(d.data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!tokenInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const data: Record<string, unknown> = { access_token: tokenInput.trim() };
      if (shopInput.trim()) data.shop = shopInput.trim();
      const res = await connectorsApi.saveCredentials(slug, data as Parameters<typeof connectorsApi.saveCredentials>[1]);
      if (res) {
        setTokenInput('');
        setShopInput('');
        setShowCredForm(false);
        await load();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke() {
    if (!confirm('Revoke credentials for this connector?')) return;
    setSaving(true);
    try {
      await connectorsApi.revoke(slug);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4 flex items-center gap-2">
        <Loader2 size={12} className="text-[#3d3a1e] animate-spin" />
        <span className="text-xs text-[#3d3a1e]">Loading…</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-[#1a1915] border border-red-900/40 rounded-2xl p-4 text-xs text-red-400">
        Failed to load connector "{slug}"
      </div>
    );
  }

  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-[#2d2813] flex items-center justify-center shrink-0">
          <Plug size={14} className={detail.installed ? 'text-green-400' : 'text-[#6e684a]'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-white">{detail.slug}</p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${detail.installed ? 'bg-green-900/40 text-green-400' : 'bg-[#2d2813] text-[#6e684a]'}`}>
              {detail.installed ? 'installed' : 'not installed'}
            </span>
            <span className="text-[9px] bg-[#2d2813] text-[#6e684a] px-1.5 py-0.5 rounded">{detail.authType}</span>
          </div>
          <p className="text-[10px] text-[#6e684a]">{detail.triggers.length} trigger{detail.triggers.length !== 1 ? 's' : ''} · {detail.actions.length} action{detail.actions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {detail.docsUrl && (
            <a href={detail.docsUrl} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-[#6e684a] hover:text-white">
              <ExternalLink size={12} />
            </a>
          )}
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-[#6e684a] hover:text-white">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#2d2813] px-4 py-3 space-y-4">

          {/* Status line */}
          {detail.installed && (
            <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-900/40 rounded-lg">
              <Check size={11} className="text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-green-400 font-bold">Connected</p>
                {detail.expiresAt && (
                  <p className="text-[9px] text-green-400/60">Expires {new Date(detail.expiresAt).toLocaleDateString()}</p>
                )}
              </div>
              <button
                onClick={handleRevoke}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400 border border-red-900/40 rounded-lg hover:bg-red-900/20 disabled:opacity-50"
              >
                <Trash2 size={10} /> revoke
              </button>
            </div>
          )}

          {/* Triggers */}
          {detail.triggers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#6e684a] uppercase mb-1">Triggers</p>
              <div className="space-y-1">
                {detail.triggers.map(t => (
                  <div key={t.event} className="flex items-start gap-2 p-2 bg-[#181711] rounded-lg">
                    <RefreshCw size={10} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-white">{t.label}</p>
                      <p className="text-[9px] text-[#6e684a] font-mono">{t.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {detail.actions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#6e684a] uppercase mb-1">Actions</p>
              <div className="space-y-1">
                {detail.actions.map(a => (
                  <div key={a.name} className="flex items-start gap-2 p-2 bg-[#181711] rounded-lg">
                    <Key size={10} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-white">{a.label}</p>
                      <p className="text-[9px] text-[#6e684a] font-mono">{a.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credential form */}
          {!detail.installed && (
            <div>
              {showCredForm ? (
                <div className="space-y-2 p-3 border border-[#2d2813] rounded-xl">
                  <p className="text-[10px] font-bold text-[#6e684a] uppercase">Configure credentials</p>
                  <input
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder={detail.authType === 'oauth2' ? 'Access token' : 'API key'}
                    className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50 font-mono"
                  />
                  {detail.slug === 'shopify' && (
                    <input
                      value={shopInput}
                      onChange={e => setShopInput(e.target.value)}
                      placeholder="mystore.myshopify.com"
                      className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50 font-mono"
                    />
                  )}
                  {error && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400">
                      <AlertCircle size={10} /> {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !tokenInput.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-[#181711] rounded-lg text-xs font-bold hover:bg-green-400 disabled:opacity-50"
                    >
                      {saving && <Loader2 size={11} className="animate-spin" />} Connect
                    </button>
                    <button
                      onClick={() => { setShowCredForm(false); setError(null); setTokenInput(''); setShopInput(''); }}
                      className="px-3 py-1.5 text-[#6e684a] text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCredForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-[#181711] rounded-lg text-xs font-bold hover:bg-yellow-400"
                >
                  <Plus size={11} /> Connect
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConnectorsPanel({ clientToken }: { clientToken: string }) {
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connectorsApi.list().then(res => {
      if (res.success && res.data) setConnectors(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Loader2 size={14} className="animate-spin text-[#3d3a1e]" />
        <span className="text-xs text-[#3d3a1e]">Loading connectors…</span>
      </div>
    );
  }

  if (connectors.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-[#3d3a1e]">
        No connectors available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6e684a]">
          Connect external services - AI tools can use their APIs in conversations.
        </p>
        <span className="text-[10px] text-[#3d3a1e]">{connectors.filter(c => c.installed).length}/{connectors.length} installed</span>
      </div>
      {connectors.map(c => (
        <ConnectorCard
          key={c.slug}
          slug={c.slug}
          onInstall={slug => console.log('install', slug)}
          onRevoke={slug => console.log('revoke', slug)}
          clientToken={clientToken}
        />
      ))}
    </div>
  );
}
