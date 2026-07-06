import React from 'react';
import { Building2, Gauge, Shield } from 'lucide-react';

interface PlatformSettings {
  platformName: string;
  platformDomain: string;
  supportEmail: string;
  maxInstancesPerClient: number;
  defaultTokenAllocation: number;
  requireEmailVerification: boolean;
  enableAuditLogging: boolean;
  maintenanceMode: boolean;
}

interface SectionProps {
  settings: PlatformSettings;
  onUpdate: (key: keyof PlatformSettings, value: unknown) => void;
}

export function BrandingSection({ settings, onUpdate }: SectionProps) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-yellow-500" />
        <h2 className="text-sm font-bold text-[#cbd3cf]">Branding & Identity</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
            Platform Name
          </label>
          <input
            type="text"
            value={settings.platformName}
            onChange={(e) => onUpdate('platformName', e.target.value)}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
            Domain
          </label>
          <input
            type="text"
            value={settings.platformDomain}
            onChange={(e) => onUpdate('platformDomain', e.target.value)}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
            Support Email
          </label>
          <input
            type="email"
            value={settings.supportEmail}
            onChange={(e) => onUpdate('supportEmail', e.target.value)}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>
    </div>
  );
}

export function LimitsSection({ settings, onUpdate }: SectionProps) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-yellow-500" />
        <h2 className="text-sm font-bold text-[#cbd3cf]">Resource Limits</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
            Max Instances per Client
          </label>
          <input
            type="number"
            min={1}
            value={settings.maxInstancesPerClient}
            onChange={(e) => onUpdate('maxInstancesPerClient', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
            Default Token Allocation
          </label>
          <input
            type="number"
            min={0}
            value={settings.defaultTokenAllocation}
            onChange={(e) => onUpdate('defaultTokenAllocation', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>
    </div>
  );
}

export function FlagsSection({ settings, onUpdate }: SectionProps) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-yellow-500" />
        <h2 className="text-sm font-bold text-[#cbd3cf]">Security & Access</h2>
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#cbd3cf]">Require email verification</p>
            <p className="text-[10px] text-[#6e684a]">New clients must verify their email before using the platform</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate('requireEmailVerification', !settings.requireEmailVerification)}
            className={`w-10 h-5 rounded-full transition-colors ${settings.requireEmailVerification ? 'bg-yellow-500' : 'bg-[#2d2813]'}`}
          >
            <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${settings.requireEmailVerification ? 'translate-x-4' : ''}`} />
          </button>
        </label>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#cbd3cf]">Enable audit logging</p>
            <p className="text-[10px] text-[#6e684a]">Log all admin actions to the audit trail</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate('enableAuditLogging', !settings.enableAuditLogging)}
            className={`w-10 h-5 rounded-full transition-colors ${settings.enableAuditLogging ? 'bg-yellow-500' : 'bg-[#2d2813]'}`}
          >
            <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${settings.enableAuditLogging ? 'translate-x-4' : ''}`} />
          </button>
        </label>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#cbd3cf]">Maintenance mode</p>
            <p className="text-[10px] text-[#6e684a]">Block all client access — show maintenance notice</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate('maintenanceMode', !settings.maintenanceMode)}
            className={`w-10 h-5 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-[#2d2813]'}`}
          >
            <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${settings.maintenanceMode ? 'translate-x-4' : ''}`} />
          </button>
        </label>
      </div>
    </div>
  );
}
