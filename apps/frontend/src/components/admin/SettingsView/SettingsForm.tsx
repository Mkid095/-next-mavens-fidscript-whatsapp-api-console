import React from 'react';
import { Save } from 'lucide-react';
import { BrandingSection, LimitsSection, FlagsSection } from './SettingsSections.js';

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

interface SettingsFormProps {
  settings: PlatformSettings;
  saved: boolean;
  onSave: (e: React.FormEvent) => void;
  onUpdate: (key: keyof PlatformSettings, value: unknown) => void;
}

export function SettingsForm({ settings, saved, onSave, onUpdate }: SettingsFormProps) {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <BrandingSection settings={settings} onUpdate={onUpdate} />
      <LimitsSection settings={settings} onUpdate={onUpdate} />
      <FlagsSection settings={settings} onUpdate={onUpdate} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-[#181711] rounded-xl text-xs font-bold transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-xs text-emerald-400">Settings updated successfully.</span>
        )}
      </div>
    </form>
  );
}
