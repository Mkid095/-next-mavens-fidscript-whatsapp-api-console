/**
 * ToolsStep — Step 6 of the Chatbot Builder.
 * Thin shell: owns state, loads data, delegates list to sub-component.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, RefreshCw } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { ToolItem } from './ToolItem';

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
      const attRes = await fetch(`/api/platform/chatbots/${botId}/tools`, {
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      const attData = await attRes.json();
      setAttached(attData.success && Array.isArray(attData.data) ? attData.data : []);

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
    } catch { /* network error */ } finally { setLoading(false); }
  }, [botId, clientToken]);

  useEffect(() => { load(); }, [load]);

  const handleAttach = async (toolId: string) => {
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

  const handleDetach = async (toolId: string) => {
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

  const handleApprove = async (dsId: string, toolId: string) => {
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

  const attachedIds = new Set(attached.map(t => t.id));
  const unattached = available.filter(t => !attachedIds.has(t.id) && t.enabled === 1);
  const pendingCount = attached.filter(t => t.approved === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#6e684a]">
        <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2" />
        Loading tools…
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
            Attach tools from your data sources. The AI will call these during conversations to access real-time data from your systems.
          </p>
          {pendingCount > 0 && (
            <p className="text-[11px] text-yellow-400 mt-1 font-bold">
              {pendingCount} tool(s) pending approval — approve before they activate.
            </p>
          )}
        </div>
      </div>

      {/* Tool list */}
      <ToolList
        attached={attached}
        unattached={unattached}
        busy={busy}
        showAvailable={showAvailable}
        onDetach={handleDetach}
        onAttach={handleAttach}
        onApprove={handleApprove}
        onToggleAvailable={() => setShowAvailable(v => !v)}
        botId={botId}
      />
    </div>
  );
}

function ToolList({
  attached,
  unattached,
  busy,
  showAvailable,
  onDetach,
  onAttach,
  onApprove,
  onToggleAvailable,
  botId,
}: {
  attached: AttachedTool[];
  unattached: AvailableTool[];
  busy: string | null;
  showAvailable: boolean;
  onDetach: (id: string) => void;
  onAttach: (id: string) => void;
  onApprove: (dsId: string, toolId: string) => void;
  onToggleAvailable: () => void;
  botId: string | null;
}) {
  if (attached.length === 0 && unattached.length === 0) {
    return (
      <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl text-xs text-blue-300">
        <div className="flex items-start gap-2">
          <span className="w-4 h-4 shrink-0">ℹ</span>
          <div>
            No tools found. Create data sources and tools via the CLI:
            <code className="block mt-2 font-mono text-[10px] bg-[#0d0c0a] p-2 rounded-lg">
              fidscript data-source create my-catalog --type demo<br />
              fidscript tool list<br />
              fidscript chatbot tools {botId ?? '<bot-id>'} attach &lt;tool-id&gt;
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {attached.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#6e684a] uppercase tracking-wide">Attached ({attached.length})</p>
          {attached.map(tool => (
            <ToolItem
              key={tool.id}
              tool={tool}
              isAttached
              busy={busy === tool.id}
              onDetach={() => onDetach(tool.id)}
              onAttach={() => {}}
              onApprove={() => onApprove(tool.data_source_id, tool.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-[#3d3823]" />
          <p className="text-sm font-semibold text-[#6e684a]">No tools attached yet</p>
          <p className="text-xs text-[#5a554a] mt-1">Attach tools from your data sources so the AI can access real-time data.</p>
        </div>
      )}

      {unattached.length > 0 && (
        <>
          <button
            onClick={onToggleAvailable}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0c0a] border border-dashed border-[#3d3823] hover:border-yellow-500/30 rounded-xl text-sm font-semibold text-[#8f834a] hover:text-white transition"
          >
            <span className="w-4 h-4">+</span>
            {showAvailable ? 'Hide available tools' : `Browse available tools (${unattached.length})`}
          </button>
          {showAvailable && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#6e684a] uppercase tracking-wide">Available to attach</p>
              {unattached.map(tool => (
                <ToolItem
                  key={tool.id}
                  tool={{ ...tool, data_source_name: '' }}
                  isAttached={false}
                  busy={busy === tool.id}
                  onDetach={() => {}}
                  onAttach={() => onAttach(tool.id)}
                  onApprove={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
