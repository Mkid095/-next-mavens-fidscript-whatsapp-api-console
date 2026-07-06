import { useState } from 'react';
import { Webhook as WebhookIcon, Shield, Activity } from 'lucide-react';
import WebhooksTab from './WebhooksTab.js';
import AuditTab from './AuditTab.js';
import DevLogsTab from './DevLogsTab.js';

type Tab = 'webhooks' | 'audit' | 'logs';

const TABS: { key: Tab; label: string; icon: typeof WebhookIcon }[] = [
  { key: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
  { key: 'audit', label: 'Audit Log', icon: Shield },
  { key: 'logs', label: 'API Logs', icon: Activity },
];

/**
 * Developer ecosystem surface (§14).
 * Three tabs: outbound webhooks, audit log, API request logs.
 * Lives in src/features/developers/ to honor the feature-folder structure (§17).
 */
export default function DevelopersSection() {
  const [tab, setTab] = useState<Tab>('webhooks');
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-forest-deep">Developers</h2>
        <p className="text-[10px] text-graphite">Outbound webhooks, audit trail, and API request logs.</p>
      </div>
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tab === t.key ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'logs' && <DevLogsTab />}
    </div>
  );
}
