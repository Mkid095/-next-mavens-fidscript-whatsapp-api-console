import { Inbox, Users } from 'lucide-react';
import type { Instance } from '../../../services/api';
import OutboundUsageIndicator from '../OutboundUsageIndicator';

interface InstanceHeaderProps {
  instance: Instance | null;
  instances: Instance[];
  syncState: 'idle' | 'syncing' | 'done' | 'error';
  onSwitchInstance: (next: Instance | null) => void;
  onSyncPhonebook: () => void;
}

export default function InstanceHeader({
  instance,
  instances,
  syncState,
  onSwitchInstance,
  onSyncPhonebook,
}: InstanceHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d2813] bg-[#1a1915] px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Inbox size={16} className="text-[#eab308]" />
        <h1 className="text-sm font-semibold text-white">Messages</h1>
        {instance && instance.status !== 'connected' && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            {instance.status}
          </span>
        )}
        <OutboundUsageIndicator instanceName={instance?.name ?? null} />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => void onSyncPhonebook()}
          disabled={!instance || instance.status !== 'connected' || syncState === 'syncing'}
          title="Sync WhatsApp phonebook (one-way: pulls contacts into your saved list)"
          className="flex items-center gap-1 rounded-lg border border-[#2d2813] bg-[#1a1915] px-2 py-1 text-[11px] text-[#a8a99e] transition hover:bg-[#2d2813] disabled:opacity-50"
        >
          <Users size={12} className={syncState === 'syncing' ? 'animate-pulse' : ''} />
          {syncState === 'syncing' ? 'Syncing…' : 'Sync contacts'}
        </button>
        {instances.length > 1 && (
          <select
            value={instance?.id ?? ''}
            onChange={(e) => onSwitchInstance(instances.find((i) => i.id === e.target.value) ?? null)}
            className="appearance-none rounded-lg border border-[#2d2813] bg-[#1a1915] px-2.5 py-1.5 pr-7 text-xs text-[#a8a99e] outline-none focus:border-[#eab308]"
          >
            {instances.map((i) => (
              <option key={i.id} value={i.id} style={{ background: '#1a1915', color: '#a8a99e' }}>
                {i.name}{i.status === 'connected' ? ' · connected' : ''}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
}
