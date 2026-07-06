/**
 * DataConnectionsStep — Step 5 of the Chatbot Builder.
 * Thin shell: owns state callbacks, delegates to sub-components.
 */
import React, { useState } from 'react';
import { Database, Plus } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { DataConnection } from '../../types';
import { DataConnectionItem } from './DataConnectionItem';
import { DataConnectionForm } from './DataConnectionForm';

export default function DataConnectionsStep() {
  const { draft, updateDataConnections } = useChatbotBuilderStore();
  const { connections } = draft.dataConnections;
  const [showAddModal, setShowAddModal] = useState(false);

  const addConnection = (conn: Omit<DataConnection, 'id'>) => {
    const newConn: DataConnection = { ...conn, id: `conn_${Date.now()}` };
    updateDataConnections({ connections: [...connections, newConn] });
  };

  const removeConnection = (id: string) => {
    updateDataConnections({ connections: connections.filter(c => c.id !== id) });
  };

  const testConnection = async (conn: DataConnection) => {
    updateDataConnections({
      connections: connections.map(c =>
        c.id === conn.id ? { ...c, status: 'connected' as const } : c
      ),
    });
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <Database className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Data Connections</p>
            {connectedCount > 0 && (
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                {connectedCount} connected
              </span>
            )}
          </div>
          <p className="text-xs text-[#8f834a] mt-0.5">
            Connect databases, APIs, and external services. Your chatbot can query these in real-time to provide dynamic answers.
          </p>
        </div>
      </div>

      {/* Connections list */}
      {connections.length > 0 && (
        <div className="space-y-2">
          {connections.map(c => (
            <DataConnectionItem
              key={c.id}
              conn={c}
              onRemove={() => removeConnection(c.id)}
              onTest={() => testConnection(c)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {connections.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <Database className="w-12 h-12 mx-auto mb-3 text-[#3d3823]" />
          <p className="text-sm font-semibold text-[#6e684a]">No data connections yet</p>
          <p className="text-xs text-[#5a554a] mt-1 max-w-sm mx-auto">
            Connect a database or API to enable real-time, dynamic data in your chatbot responses.
          </p>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0c0a] border border-dashed border-[#3d3823] hover:border-yellow-500/30 rounded-xl text-sm font-semibold text-[#8f834a] hover:text-white transition"
      >
        <Plus className="w-4 h-4" />
        Add Data Connection
      </button>

      {showAddModal && (
        <DataConnectionForm
          onClose={() => setShowAddModal(false)}
          onAdd={addConnection}
        />
      )}
    </div>
  );
}
