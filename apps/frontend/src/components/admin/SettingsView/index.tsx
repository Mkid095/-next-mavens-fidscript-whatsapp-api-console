import React, { useState } from 'react';
import { SettingsForm } from './SettingsForm.js';

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

export default function SettingsView() {
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: 'FIDScript WhatsApp',
    platformDomain: 'whatsapp.fidscript.com',
    supportEmail: 'support@fidscript.com',
    maxInstancesPerClient: 10,
    defaultTokenAllocation: 500,
    requireEmailVerification: false,
    enableAuditLogging: true,
    maintenanceMode: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (key: keyof PlatformSettings, value: unknown) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#cbd3cf]">Platform Settings</h1>
        <p className="text-xs text-[#a8a99e] mt-1">
          Configure global platform behaviour, limits, and branding.
        </p>
      </div>
      <SettingsForm settings={settings} saved={saved} onSave={handleSave} onUpdate={update} />
    </div>
  );
}
