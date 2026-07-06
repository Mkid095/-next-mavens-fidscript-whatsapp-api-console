import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Panel, EmptyState } from './StatCard';
import type { ConfidenceRow } from './types';

interface ConfidenceTableProps { rows: ConfidenceRow[]; }

export function ConfidenceTable({ rows }: ConfidenceTableProps) {
  return (
    <Panel title="Confidence thresholds (calibration)" icon={<ShieldCheck className="w-4 h-4" />}>
      {rows.length === 0 ? <EmptyState text="No policies set yet." /> : (
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-[#6a6c5d] border-b border-[#2d2813]">
            <tr><th className="text-left py-1.5">Chatbot</th><th className="text-right">Threshold</th><th className="text-right">Escalate?</th><th className="text-left">Fallback</th></tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#2d2813]/50">
                <td className="py-1.5 text-[#a8a99e]">{row.chatbot_name ?? row.chatbot_id}</td>
                <td className="text-right font-mono text-yellow-500">{(row.confidence_threshold ?? 0).toFixed(2)}</td>
                <td className="text-right text-[#a8a99e]">
                  {row.escalate_on_low_confidence ? <span className="text-green-400">yes</span> : <span className="text-[#6a6c5d]">no</span>}
                </td>
                <td className="text-[#a8a99e] truncate max-w-xs" title={row.fallback_reply ?? ''}>
                  {row.fallback_reply || <span className="text-[#6a6c5d]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
