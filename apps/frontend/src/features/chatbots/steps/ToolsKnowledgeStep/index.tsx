/* ToolsKnowledgeStep/index.tsx — Thin shell: owns tools/knowledge state, renders form */
import React, { useState, useCallback } from 'react';
import { BookOpen, Database, Wrench, Plus } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { KnowledgeSource, DataConnection } from '../../types';
import { SectionWrapper } from './SectionWrapper';
import { AddSourceForm } from './AddSourceForm';
import { AddConnectionForm } from './AddConnectionForm';
import { HumanHandoffSection } from './HumanHandoffSection';
import { KnowledgeSourceItem } from './KnowledgeSourceItem';
import { Trash2 } from 'lucide-react';

export default function ToolsKnowledgeStep() {
  const { draft, updateKnowledge, updateDataConnections, botId } = useChatbotBuilderStore();
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddConn, setShowAddConn] = useState(false);

  const addSource = useCallback((type: string, name: string, content: string) => {
    const newSource: KnowledgeSource = {
      id: `src_${Date.now()}`,
      type: type as KnowledgeSource['type'],
      name,
      status: 'indexing',
      chunkCount: 0,
      content,
      ref: type === 'url' ? content : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateKnowledge({ sources: [...draft.knowledge.sources, newSource] });
    setShowAddSource(false);
    setTimeout(() => {
      const success = Math.random() > 0.1;
      useChatbotBuilderStore.getState().updateKnowledge({
        sources: useChatbotBuilderStore.getState().draft.knowledge.sources.map(s =>
          s.id === newSource.id
            ? { ...s, status: success ? 'active' : 'error', chunkCount: success ? Math.floor(Math.random() * 80) + 10 : 0, errorMessage: success ? undefined : 'Failed to parse content' }
            : s
        ),
      });
    }, 1500);
  }, [draft.knowledge.sources, updateKnowledge]);

  const removeSource = (id: string) => {
    updateKnowledge({ sources: draft.knowledge.sources.filter(s => s.id !== id) });
  };

  const addConnection = (type: string, name: string, config: Record<string, string>) => {
    const newConn: DataConnection = {
      id: `conn_${Date.now()}`,
      type: type as DataConnection['type'],
      name,
      status: 'connected',
      config,
    };
    updateDataConnections({ connections: [...draft.dataConnections.connections, newConn] });
    setShowAddConn(false);
  };

  const removeConnection = (id: string) => {
    updateDataConnections({ connections: draft.dataConnections.connections.filter(c => c.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold text-white">Tools & Knowledge</h2>
        <p className="text-xs text-[#8f834a] mt-1">All optional — skip to Test & Deploy if you just want a basic bot.</p>
      </div>

      {/* Knowledge Sources */}
      <SectionWrapper icon={BookOpen} title="Knowledge Sources"
        description="Give your bot information to answer from" count={draft.knowledge.sources.length}>
        {draft.knowledge.sources.length === 0 ? (
          <p className="text-[11px] text-[#6e684a] text-center py-2">No sources added yet</p>
        ) : (
          <div className="space-y-1.5">
            {draft.knowledge.sources.map(src => (
              <KnowledgeSourceItem key={src.id} src={src} onRemove={removeSource} />
            ))}
          </div>
        )}
        {showAddSource ? (
          <AddSourceForm onAdd={addSource} onCancel={() => setShowAddSource(false)} />
        ) : (
          <button onClick={() => setShowAddSource(true)}
            className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300">
            <Plus size={12} /> Add Source
          </button>
        )}
      </SectionWrapper>

      {/* Data Connections */}
      <SectionWrapper icon={Database} title="Data Connections"
        description="Connect databases & APIs the bot can query" count={draft.dataConnections.connections.length}>
        {draft.dataConnections.connections.length === 0 ? (
          <p className="text-[11px] text-[#6e684a] text-center py-2">No connections added yet</p>
        ) : (
          <div className="space-y-1.5">
            {draft.dataConnections.connections.map(conn => (
              <div key={conn.id} className="flex items-center gap-2 p-2.5 bg-[#1a1915] rounded-lg border border-[#2d2813]">
                <Database size={14} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{conn.name}</p>
                  <p className="text-[10px] text-[#6e684a]">{conn.type}</p>
                </div>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px]">Connected</span>
                <button onClick={() => removeConnection(conn.id)} className="p-1 text-[#6e684a] hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {showAddConn ? (
          <AddConnectionForm onAdd={addConnection} onCancel={() => setShowAddConn(false)} />
        ) : (
          <button onClick={() => setShowAddConn(true)}
            className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300">
            <Plus size={12} /> Add Connection
          </button>
        )}
      </SectionWrapper>

      {/* Tools (info) */}
      <SectionWrapper icon={Wrench} title="Tools"
        description="Auto-generated tools from your data connections" count={draft.tools.tools.length}>
        {!botId ? (
          <div className="flex items-start gap-2 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-[11px] text-blue-300">
              Save your bot first (click Save Draft), then tools from your data connections will appear here for attachment.
            </p>
          </div>
        ) : draft.tools.tools.length === 0 ? (
          <p className="text-[11px] text-[#6e684a] text-center py-2">
            No tools attached. Add a data connection above, then tools will be generated automatically.
          </p>
        ) : (
          <div className="space-y-1.5">
            {draft.tools.tools.map(tool => (
              <div key={tool.id} className="flex items-center gap-2 p-2.5 bg-[#1a1915] rounded-lg border border-[#2d2813]">
                <Wrench size={14} className="text-yellow-400 shrink-0" />
                <p className="text-xs font-medium text-white flex-1 truncate">{tool.name || tool.id}</p>
                <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-[9px]">{tool.type}</span>
              </div>
            ))}
          </div>
        )}
      </SectionWrapper>

      {/* Human Handoff */}
      <HumanHandoffSection />
    </div>
  );
}
