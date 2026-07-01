/**
 * ToolsStep — Step 6 of the Chatbot Builder.
 *
 * Define actions the chatbot can perform.
 * These are high-level operations the bot can execute during conversations.
 */
import React, { useState } from 'react';
import { Wrench, Plus, Trash2, Check, Zap, Globe, Server, Link, Hexagon, Zap as Lightning } from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { type ToolDefinition, type ToolType } from '../types';

const TOOL_TYPES: { value: ToolType; label: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'http-request',   label: 'HTTP Request',   description: 'Call an external API',         icon: Globe },
  { value: 'database-query', label: 'Database Query', description: 'Query your connected database', icon: Server },
  { value: 'webhook',         label: 'Webhook',         description: 'Send data to a webhook URL',    icon: Link },
  { value: 'graphql',         label: 'GraphQL',          description: 'Query a GraphQL endpoint',     icon: Hexagon },
  { value: 'function',        label: 'Custom Function',  description: 'Run a custom function',         icon: Lightning },
];

function ToolCard({ tool, onRemove }: { tool: ToolDefinition; onRemove: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-[#0d0c0a] border border-[#2d2813] rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold text-white truncate">{tool.name}</p>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            tool.enabled ? 'bg-green-400/10 text-green-400' : 'bg-[#2d2813] text-[#6e684a]'
          }`}>
            {tool.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
        <p className="text-[10px] text-[#6e684a] mt-0.5">
          {TOOL_TYPES.find(t => t.value === tool.type)?.label} · {tool.requireConfirmation ? 'Awaiting confirmation' : 'Auto-execute'}
        </p>
      </div>
      <button onClick={onRemove} className="text-[#6e684a] hover:text-red-400 transition shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddToolModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: ToolDefinition) => void }) {
  const [toolType, setToolType] = useState<ToolType>('http-request');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requireConfirmation, setRequireConfirmation] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `tool_${Date.now()}`,
      name,
      description,
      type: toolType,
      enabled: true,
      requireConfirmation,
      costUnits: 2,
      config: {},
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 max-w-lg w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Add Action</h3>
          <button onClick={onClose} className="text-[#6e684a] hover:text-white text-xl">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TOOL_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setToolType(t.value)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                toolType === t.value ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-[#0d0c0a] border-[#2d2813]'
              }`}
              >
              <span className={toolType === t.value ? 'text-yellow-400' : 'text-[#6e684a]'}>
                {(() => { const Icon = t.icon; return <Icon size={16} />; })()}
              </span>
              <div>
                <p className={`text-xs font-semibold ${toolType === t.value ? 'text-white' : 'text-[#a8a99e]'}`}>{t.label}</p>
                <p className="text-[10px] text-[#6e684a]">{t.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#8f834a] mb-1">Action Name <span className="text-yellow-400">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Check Order Status, Get Inventory"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50" />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#8f834a] mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What does this action do?"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={requireConfirmation}
            onChange={e => setRequireConfirmation(e.target.checked)}
            className="accent-yellow-400 w-4 h-4" />
          <span className="text-xs text-[#a8a99e]">Require customer confirmation before executing</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-xs font-semibold transition">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={!name.trim()}
            className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            Add Action
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ToolsStep() {
  const { draft, updateTools } = useChatbotBuilderStore();
  const { tools } = draft.tools;
  const [showAddModal, setShowAddModal] = useState(false);

  const addTool = (tool: ToolDefinition) => {
    updateTools({ tools: [...tools, tool] });
  };

  const removeTool = (id: string) => {
    updateTools({ tools: tools.filter(t => t.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <Wrench className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Tools & Actions</p>
          <p className="text-xs text-[#8f834a] mt-0.5">
            Define actions your chatbot can perform during conversations — like checking order status, creating bookings, or sending invoices.
          </p>
        </div>
      </div>

      {tools.length > 0 && (
        <div className="space-y-2">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t} onRemove={() => removeTool(t.id)} />
          ))}
        </div>
      )}

      {tools.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-[#3d3823]" />
          <p className="text-sm font-semibold text-[#6e684a]">No actions defined yet</p>
          <p className="text-xs text-[#5a554a] mt-1">Actions let your chatbot perform tasks beyond just answering questions.</p>
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0c0a] border border-dashed border-[#3d3823] hover:border-yellow-500/30 rounded-xl text-sm font-semibold text-[#8f834a] hover:text-white transition"
      >
        <Plus className="w-4 h-4" />
        Add Action
      </button>

      {showAddModal && (
        <AddToolModal onClose={() => setShowAddModal(false)} onAdd={addTool} />
      )}
    </div>
  );
}
