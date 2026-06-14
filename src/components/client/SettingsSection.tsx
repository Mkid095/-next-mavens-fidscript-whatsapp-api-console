import React from 'react';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import type { Client } from '../../services/api';

interface SettingsSectionProps {
  client: Client;
  onLogout: () => void;
}

export default function SettingsSection({ client, onLogout }: SettingsSectionProps) {
  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><SettingsIcon className="w-4 h-4 text-yellow-700" /> Account Settings</h3>
        <p className="text-xs text-graphite mt-0.5">Manage your account details.</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Name</p>
          <p className="text-sm font-bold text-forest-deep">{client.name}</p>
        </div>
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Email</p>
          <p className="text-sm font-bold text-forest-deep">{client.email}</p>
        </div>
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Phone</p>
          <p className="text-sm font-bold text-forest-deep font-mono">{client.phone || 'Not set'}</p>
        </div>
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Member Since</p>
          <p className="text-sm font-bold text-forest-deep">{new Date(client.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all"
      >
        <LogOut className="w-4 h-4" /> Log out
      </button>
    </div>
  );
}
