import React from 'react';
import { Settings as SettingsIcon, LogOut } from 'lucide-react';
import type { Client } from '../../services/api';
import { TeamsPanel } from '../../features/workspace/index.js';
import { SLAPolicyEditor, AutomationList } from '../../features/automation/index.js';
import { AgentList, KeywordRuleEditor } from '../../features/agents/index.js';
import DataSourcesPanel from '../../features/settings/DataSourcesPanel';
import ConnectorsPanel from '../../features/settings/ConnectorsPanel';

interface SettingsSectionProps {
  client: Client;
  clientToken?: string;
  onLogout: () => void;
}

/**
 * SettingsSection — account info + workspace + AI/automation panels.
 * Dark-mode consistent with the rest of the client dashboard.
 */
export default function SettingsSection({ client, clientToken, onLogout }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Account card */}
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#a8a99e] flex items-center gap-1.5">
            <SettingsIcon className="w-4 h-4 text-yellow-500" />
            Account Settings
          </h3>
          <p className="text-xs text-[#6e684a] mt-0.5">Manage your account details.</p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Name', value: client.name },
            { label: 'Email', value: client.email },
            { label: 'Phone', value: client.phone || 'Not set', mono: true },
            { label: 'Member Since', value: new Date(client.created_at).toLocaleDateString() },
          ].map((row) => (
            <div key={row.label} className="p-3 sm:p-4 bg-[#181711] border border-[#2d2813] rounded-2xl">
              <p className="text-[10px] font-bold text-[#6e684a] uppercase mb-1">{row.label}</p>
              <p className={`text-sm font-bold text-[#cbd3cf] ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      {/* Workspace */}
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#cbd3cf]">Workspace</h3>
          <p className="text-xs text-[#6e684a] mt-0.5">Teams, customer ownership, and service-level agreements.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="rounded-2xl border border-[#2d2813] bg-[#181711] p-4"><TeamsPanel /></div>
          <div className="rounded-2xl border border-[#2d2813] bg-[#181711] p-4"><SLAPolicyEditor /></div>
        </div>
      </div>

      {/* AI & automation */}
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#cbd3cf]">AI &amp; automation</h3>
          <p className="text-xs text-[#6e684a] mt-0.5">Governed agents, keyword rules, and trigger→condition→action flows.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="rounded-2xl border border-[#2d2813] bg-[#181711] p-4"><AgentList /></div>
          <div className="rounded-2xl border border-[#2d2813] bg-[#181711] p-4"><KeywordRuleEditor /></div>
          <div className="rounded-2xl border border-[#2d2813] bg-[#181711] p-4 lg:col-span-2"><AutomationList /></div>
        </div>
      </div>

      {/* Data Sources */}
      {clientToken && (
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-4 sm:p-6 shadow-sm">
          <DataSourcesPanel clientToken={clientToken} />
        </div>
      )}

      {/* Connectors */}
      {clientToken && (
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#cbd3cf]">Integrations</h3>
            <p className="text-xs text-[#6e684a] mt-0.5">Connect external services for AI tools and automations.</p>
          </div>
          <ConnectorsPanel clientToken={clientToken} />
        </div>
      )}
    </div>
  );
}