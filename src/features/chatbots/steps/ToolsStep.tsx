/**
 * ToolsStep — Step 6 of the Chatbot Builder.
 *
 * Connects to the REAL tool platform (not inline definitions).
 * Shows:
 *   - Tools currently attached to this chatbot (from chatbot_tools table)
 *   - Available tools from all data sources (to attach)
 *   - Approval status + dangerous-action badges
 *   - Approve/reject for pending tools
 *   - Attach/detach via API
 *
 * Single source of truth: GET /api/platform/chatbots/:id/tools
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Plus, Trash2, ShieldCheck, ShieldAlert,
  Check, X, RefreshCw, Loader2, AlertCircle, Search,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';

interface AttachedTool {
  id: string;
  name: string;
  description: string;
  type: string;
  implementation?: string;
  parameters_json: string;
  enabled: number;
  approved?: number;
  requires_confirmation?: number;
  tool_enabled?: number;
  attached_enabled?: number;
  data_source_id: string;
  data_source_name: string;
}

interface AvailableTool {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters_json: string;
  enabled: number;
  approved?: number;
  requires_confirmation?: number;
  data_source_id: string;
}

const TYPE_BADGES: Record<string, string> = {
  lookup: 'text-blue-400 bg-blue-900/30 border-blue-900/50',
  search: 'text-cyan-400 bg-cyan-900/30 border-cyan-900/50',
  query: 'text-green-400 bg-green-900/30 border-green-900/50',
  action: 'text-orange-400 bg-orange-900/30 border-orange-900/50',
  workflow: 'text-purple-400 bg-purple-900/30 border-purple-900/50',
  'http-request': 'text-orange-400 bg-orange-900/30 border-orange-900/50',
  'database-query': 'text-green-400 bg-green-900/30 border-green-900/50',
};

export default function ToolsStep() {
  const { botId, clientToken } = useChatbotBuilderStore();
  const [attached, setAttached] = useState<AttachedTool[]>([]);
  const [available, setAvailable] = useState<AvailableTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!botId || !clientToken) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch attached tools
      const attRes = await fetch(`/api/platform/chatbots/${botId}/tools`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const attData = await attRes.json();
      setAttached(attData.success && Array.isArray(attData.data) ? attData.data : []);

      // Fetch all data sources + their tools (for the "available" list)
      const dsRes = await fetch('/api/platform/data-sources', {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const dsData = await dsRes.json();
      const allTools: AvailableTool[] = [];
      if (dsData.success && Array.isArray(dsData.data)) {
        for (const ds of dsData.data) {
          const tRes = await fetch(`/api/platform/data-sources/${ds.id}/tools`, {
            headers: { Authorization: `Bearer ${clientToken}` },
          });
          const tData = await tRes.json();
          if (tData.success && Array.isArray(tData.data)) {
            for (const t of tData.data) {
              allTools.push({ ...t, data_source_id: ds.id });
            }
          }
        }
      }
      setAvailable(allTools);
    } catch {
      /* network error — keep empty state */
    } finally {
      setLoading(false);
    }
  }, [botId, clientToken]);

  useEffect(() => { load(); }, [load]);

  const handleAttach = async (toolId: string): Promise<void> => {
    if (!botId || !clientToken) return;
    setBusy(toolId);
    try {
      await fetch(`/api/platform/chatbots/${botId}/tools`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_ids: [toolId] }),
      });
      await load();
    } finally { setBusy(null); }
  };

  const handleDetach = async (toolId: string): Promise<void> => {
    if (!botId || !clientToken) return;
    setBusy(toolId);
    try {
      await fetch(`/api/platform/chatbots/${botId}/tools/${toolId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      await load();
    } finally { setBusy(null); }
  };

  const handleApprove = async (dsId: string, toolId: string): Promise<void> => {
    if (!clientToken) return;
    setBusy(toolId);
    try {
      await fetch(`/api/platform/data-sources/${dsId}/tools/${toolId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      await load();
    } finally { setBusy(null); }
  };

  const attachedIds = new Set(attached.map((t) => t.id));
  const unattached = available.filter((t) => !attachedIds.has(t.id) && t.enabled === 1);
  const pendingCount = attached.filter((t) => t.approved === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#6e684a]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tools…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <Wrench className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Tools &amp; Actions</p>
            <button onClick={load} className="ml-auto shrink-0">
              <RefreshCw className="w-3.5 h-3.5 text-[#6e684a] hover:text-white" />
            </button>
          </div>
          <p className="text-xs text-[#8f834a] mt-0.5">
            Attach tools from your data sources. The AI will call these during conversations to
            access real-time data from your systems.
          </p>
          {pendingCount > 0 && (
            <p className="text-[11px] text-yellow-400 mt-1 font-bold">
              ⚠ {pendingCount} tool(s) pending approval — approve before they activate.
            </p>
          )}
        </div>
      </div>

      {/* Attached tools */}
      {attached.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#6e684a] uppercase tracking-wide">
            Attached ({attached.length})
          </p>
          {attached.map((tool) => {
            const isPending = tool.approved === 0;
            const isDangerous = Boolean(tool.requires_confirmation);
            const typeBadge = TYPE_BADGES[tool.type] ?? TYPE_BADGES[tool.implementation ?? ''] ?? 'text-[#6e684a] bg-[#181711] border-[#2d2813]';

            return (
              <div key={tool.id} className="flex items-start gap-3 p-4 bg-[#0d0c0a] border border-[#2d2813] rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Wrench className="w-4 h-4 text-yellow-400 shrink-0" />
                    <p className="text-sm font-semibold text-white truncate">{tool.name}</p>
                    <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border uppercase ${typeBadge}`}>
                      {tool.type}
                    </span>
                    {isDangerous && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-red-900/50 bg-red-900/30 text-red-400 uppercase">
                        <ShieldAlert className="w-2.5 h-2.5" /> Confirm
                      </span>
                    )}
                    {isPending ? (
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-yellow-900/50 bg-yellow-900/30 text-yellow-400 uppercase">
                        Pending
                      </span>
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#6e684a] mt-0.5 line-clamp-2">{tool.description}</p>
                  <p className="text-[9px] text-[#5a554a] font-mono mt-0.5">📁 {tool.data_source_name}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {isPending && (
                    <button
                      onClick={() => handleApprove(tool.data_source_id, tool.id)}
                      disabled={busy === tool.id}
                      className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-[9px] font-bold rounded-lg disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDetach(tool.id)}
                    disabled={busy === tool.id}
                    className="flex items-center gap-1 px-2 py-1 text-[#6e684a] hover:text-red-400 text-[9px] font-bold rounded-lg transition disabled:opacity-50"
                  >
                    {busy === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Detach
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-[#3d3823]" />
          <p className="text-sm font-semibold text-[#6e684a]">No tools attached yet</p>
          <p className="text-xs text-[#5a554a] mt-1">
            Attach tools from your data sources so the AI can access real-time data.
          </p>
        </div>
      )}

      {/* Attach tools toggle */}
      {unattached.length > 0 && (
        <>
          <button
            onClick={() => setShowAvailable(!showAvailable)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0c0a] border border-dashed border-[#3d3823] hover:border-yellow-500/30 rounded-xl text-sm font-semibold text-[#8f834a] hover:text-white transition"
          >
            <Plus className="w-4 h-4" />
            {showAvailable ? 'Hide available tools' : `Browse available tools (${unattached.length})`}
          </button>

          {showAvailable && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#6e684a] uppercase tracking-wide">
                Available to attach
              </p>
              {unattached.map((tool) => {
                const isPending = tool.approved === 0;
                const typeBadge = TYPE_BADGES[tool.type] ?? 'text-[#6e684a] bg-[#181711] border-[#2d2813]';
                return (
                  <div key={tool.id} className="flex items-start gap-3 p-3 bg-[#0d0c0a] border border-[#2d2813] rounded-xl opacity-80 hover:opacity-100 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#cbd3cf] truncate">{tool.name}</p>
                        <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border uppercase ${typeBadge}`}>
                          {tool.type}
                        </span>
                        {isPending && (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-yellow-900/50 bg-yellow-900/30 text-yellow-400 uppercase">
                            Needs approval
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6e684a] mt-0.5 line-clamp-1">{tool.description}</p>
                    </div>
                    <button
                      onClick={() => handleAttach(tool.id)}
                      disabled={busy === tool.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-[10px] font-bold rounded-lg shrink-0"
                    >
                      {busy === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Attach
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {unattached.length === 0 && attached.length === 0 && (
        <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl text-xs text-blue-300">
          <AlertCircle className="w-4 h-4 inline mr-1.5" />
          No tools found. Create data sources and tools via the CLI:
          <code className="block mt-2 font-mono text-[10px] bg-[#0d0c0a] p-2 rounded-lg">
            fidscript data-source create my-catalog --type demo<br />
            fidscript tool list<br />
            fidscript chatbot tools {botId ?? '<bot-id>'} attach &lt;tool-id&gt;
          </code>
        </div>
      )}
    </div>
  );
}