import React from 'react';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import type { Client } from '../../services/api';
import { TeamsPanel } from '../../features/workspace/index.js';
import { SLAPolicyEditor, AutomationList } from '../../features/automation/index.js';
import { AgentList, KeywordRuleEditor } from '../../features/agents/index.js';

interface SettingsSectionProps {
  client: Client;
  onLogout: () => void;
}

export default function SettingsSection({ client, onLogout }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
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

      {/* Phase 3 — workspace configuration */}
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-forest-deep">Workspace</h3>
          <p className="text-xs text-graphite mt-0.5">Teams, customer ownership, and service-level agreements.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><TeamsPanel /></div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><SLAPolicyEditor /></div>
        </div>
      </div>

      {/* Phase 4 — AI agents, keyword rules, automations */}
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-forest-deep">AI &amp; automation</h3>
          <p className="text-xs text-graphite mt-0.5">Governed agents, keyword rules, and trigger→condition→action flows.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><AgentList /></div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><KeywordRuleEditor /></div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 md:col-span-2"><AutomationList /></div>
        </div>
      </div>
    </div>
  );
}
