import React, { useState } from 'react';
import { Client } from '../services/api';
import { Search, Mail, Phone, Calendar, Building, UserPlus, X, ToggleLeft, ToggleRight, Key, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (data: { name: string; email: string; phone?: string; plan_id?: string }) => void;
  onToggleClient?: (id: string) => void;
  onResetKey?: (id: string) => void;
  onDeleteClient?: (id: string) => void;
}

export default function ClientsView({ clients, onAddClient, onToggleClient, onResetKey, onDeleteClient }: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    let formattedPhone = phone.trim();
    if (formattedPhone && !formattedPhone.startsWith('+') && !formattedPhone.startsWith('254')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.slice(1);
      } else {
        formattedPhone = '254' + formattedPhone;
      }
    }

    onAddClient({ name, email, phone: formattedPhone || undefined });
    setName('');
    setEmail('');
    setPhone('');
    setIsModalOpen(false);
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#272c30]">
            Clients
          </h1>
          <p className="text-xs text-[#60737a] mt-1">
            Manage client accounts and their WhatsApp API access.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cli) => (
          <div
            key={cli.id}
            className="bg-white border border-[#eaebe4]/80 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
          >
            {/* Card header */}
            <div className="p-5 border-b border-[#eaebe4]/60 flex items-start justify-between gap-3 bg-[#f9f9f2]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-yellow-600 shrink-0" />
                  <h3 className="font-bold text-[#272c30] text-sm truncate">
                    {cli.name}
                  </h3>
                </div>
                <p className="font-mono text-[9px] text-[#7d8071] uppercase tracking-wider">
                  ID: {cli.id}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                  cli.is_active === 1
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-stone-100 text-stone-500 border border-stone-200'
                }`}>
                  {cli.is_active === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Card details */}
            <div className="p-5 space-y-3 text-xs text-[#525345] flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#8a8c80] shrink-0" />
                <span className="truncate font-medium">{cli.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#8a8c80] shrink-0" />
                <span className="font-mono">{cli.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#8a8c80] shrink-0" />
                <span className="text-[#6a6c5d]">Joined: {new Date(cli.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Card footer with actions */}
            <div className="p-4 border-t border-[#eaebe4]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleClient?.(cli.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    cli.is_active === 1
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-stone-400 hover:bg-stone-50'
                  }`}
                  title={cli.is_active === 1 ? 'Disable client' : 'Enable client'}
                >
                  {cli.is_active === 1 ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => onResetKey?.(cli.id)}
                  className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                  title="Reset API key"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteClient?.(cli.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#272c30]">{cli.total_messages.toLocaleString()}</p>
                <p className="text-[9px] text-[#7d8071]">messages sent</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/35" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] w-full max-w-sm rounded-3xl shadow-xl p-6 relative z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-[14px] font-bold text-[#272c30]">Add Client</h3>
                  <p className="text-[10px] text-[#60737a]">Create a new client account</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-stone-50 rounded-lg text-[#60737a]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Kenya Ltd"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ops@company.co.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-stone-500 font-semibold hover:text-black hover:bg-stone-50 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#272c30] text-white font-semibold rounded-xl text-xs hover:bg-[#33301a] transition-all"
                  >
                    Create Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
