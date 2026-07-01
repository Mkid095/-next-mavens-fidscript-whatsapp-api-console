import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { messagesApi, type OutboundUsage } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

// Outbound usage indicator — shows "47 / 250 new contacts today" + the
// upgrade-threshold progress bar so the user can plan toward the 50% tier-
// upgrade target. Refreshes on instance change + every 30s via the shared
// gate (coalesced with other refreshes).

interface Props {
  instanceName: string | null;
}

export default function OutboundUsageIndicator({ instanceName }: Props) {
  const [usage, setUsage] = useState<OutboundUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!instanceName) { setUsage(null); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getOutboundUsage(instanceName);
    setLoading(false);
    if (res.success && res.data) setUsage(res.data);
    else setError(res.error || 'Could not load usage');
  };

  useEffect(() => { void refresh(); }, [instanceName]);
  useEffect(() => {
    if (!instanceName) return;
    const poll = setInterval(() => scheduleRefresh(() => { void refresh(); }), 30000);
    return () => clearInterval(poll);
  }, [instanceName]);

  if (!instanceName || !usage) {
    return (
      <button onClick={() => void refresh()} className="text-[#6e684a] hover:text-[#a8a99e]" title={error || 'Refresh usage'}>
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      </button>
    );
  }

  const isUnlimited = usage.tier === 4;
  const tierLabel = `Tier ${usage.tier}`;
  const barColor = usage.pct >= 90 ? 'bg-red-500' : usage.pct >= 70 ? 'bg-amber-500' : 'bg-[#eab308]';
  const overLimit = !isUnlimited && usage.uniqueInitiationsToday >= usage.tierLimit;
  const nearUpgrade = !isUnlimited && usage.uniqueInitiationsToday >= usage.upgradeThreshold && !overLimit;

  return (
    <div className="flex items-center gap-2" title={
      isUnlimited
        ? 'Unlimited (Tier 4)'
        : `${usage.uniqueInitiationsToday} unique contacts messaged in the last 24h (limit ${usage.tierLimit}). Window resets ${new Date(usage.resetsAt).toLocaleString()}.`
    }>
      <span className={`text-[10px] font-medium ${overLimit ? 'text-red-400' : 'text-[#6e684a]'}`}>
        {tierLabel}
      </span>
      {!isUnlimited && (
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#2d2813]">
            <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(100, usage.pct)}%` }} />
          </div>
          <span className="font-mono text-[10px] text-[#a8a99e]">
            {usage.uniqueInitiationsToday} / {usage.tierLimit}
          </span>
          {nearUpgrade && (
            <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-green-400" title={`≥${usage.upgradeThreshold} messages/day for 7 days triggers the next tier`}>
              upgrade ready
            </span>
          )}
          {overLimit && (
            <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-400">
              at limit
            </span>
          )}
        </div>
      )}
      <button onClick={() => void refresh()} className="text-[#6e684a] hover:text-[#a8a99e]" title="Refresh">
        <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}