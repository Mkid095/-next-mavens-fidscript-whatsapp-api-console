import React from 'react';
import { Cpu } from 'lucide-react';
import { Panel, EmptyState } from './StatCard';
import type { PerProvider } from './types';

interface ProvidersPanelProps { data: PerProvider[]; }

export function ProvidersPanel({ data }: ProvidersPanelProps) {
  return (
    <Panel title="LLM provider / model mix" icon={<Cpu className="w-4 h-4" />}>
      {data.length === 0 ? (
        <EmptyState text="No chatbots have an AI config yet." />
      ) : (
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-[#6a6c5d] border-b border-[#2d2813]">
            <tr><th className="text-left py-1.5">Provider</th><th className="text-left">Model</th><th className="text-right">Chatbots</th><th className="text-right">Workspaces</th></tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={i} className="border-b border-[#2d2813]/50">
                <td className="py-1.5 font-bold text-[#a8a99e]">{p.provider || <span className="text-[#6a6c5d]">—</span>}</td>
                <td className="font-mono text-[#a8a99e]">{p.model || <span className="text-[#6a6c5d]">—</span>}</td>
                <td className="text-right text-yellow-500 font-bold">{p.chatbot_count}</td>
                <td className="text-right text-[#a8a99e]">{p.workspace_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
