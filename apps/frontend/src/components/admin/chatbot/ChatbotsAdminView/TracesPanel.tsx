import React from 'react';
import { History } from 'lucide-react';
import { Panel, EmptyState, truncate } from './StatCard';
import type { RecentTrace } from './types';

interface TracesPanelProps { traces: RecentTrace[]; }

export function TracesPanel({ traces }: TracesPanelProps) {
  return (
    <Panel title="Recent traces (last 10)" icon={<History className="w-4 h-4" />}>
      {traces.length === 0 ? (
        <EmptyState text="No traces yet." />
      ) : (
        <ol className="space-y-3">
          {traces.map((t) => (
            <li key={t.id} className="bg-[#181711] border border-[#2d2813] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold">
                  {t.chatbot_name ?? t.chatbot_id} · {t.provider ?? '?'} · {t.model ?? '?'}
                </div>
                <div className="text-[10px] text-[#6a6c5d]">{new Date(t.created_at).toLocaleString()}</div>
              </div>
              <p className="text-xs text-[#cbd3cf]"><span className="text-[#6a6c5d]">›</span> {truncate(t.prompt, 220)}</p>
              <p className="text-xs text-[#a8a99e] mt-1"><span className="text-yellow-500">‹</span> {truncate(t.response, 220)}</p>
              <div className="text-[10px] text-[#6a6c5d] mt-1.5 flex gap-3">
                <span>in <span className="text-[#a8a99e]">{t.input_tokens}</span> tok</span>
                <span>out <span className="text-[#a8a99e]">{t.output_tokens}</span> tok</span>
                <span>${(t.cost_usd ?? 0).toFixed(4)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
