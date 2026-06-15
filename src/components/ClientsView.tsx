import React, { useState } from 'react';
import { Client } from '../services/api';
import { Search, UserPlus, Building } from 'lucide-react';
import ClientTable from './admin/clients/ClientTable';
import CreateClientModal from './admin/clients/CreateClientModal';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (data: { name: string; email: string; phone?: string; plan_id?: string }) => void;
  onToggleClient?: (id: string) => void;
  onResetKey?: (id: string) => void;
  onDeleteClient?: (id: string) => void;
}

export default function ClientsView({
  clients,
  onAddClient,
  onToggleClient,
  onResetKey,
  onDeleteClient,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#272c30]">Clients</h1>
          <p className="text-xs text-[#60737a] mt-1">
            Manage client accounts and their messaging API access.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#272c30] hover:bg-[#33301a] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm border border-[#3d3a1e] transition-colors"
        >
          <UserPlus className="w-4 h-4 text-yellow-400" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="p-4 bg-white border border-[#eaebe4]/80 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8c80] pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f9f9f2] border border-[#eaebe4] text-[#181711] placeholder-[#8a8c80] text-xs rounded-xl focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-colors"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <ClientTable
        clients={filtered}
        onToggleClient={onToggleClient}
        onResetKey={onResetKey}
        onDeleteClient={onDeleteClient}
      />

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
          <p className="text-[#6a6c5d]">No clients found</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-semibold"
          >
            Add your first client
          </button>
        </div>
      )}

      {/* Add Client Modal */}
      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddClient}
      />
    </div>
  );
}
