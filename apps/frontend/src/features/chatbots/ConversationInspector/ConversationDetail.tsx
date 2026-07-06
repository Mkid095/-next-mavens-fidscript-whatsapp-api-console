import React from 'react';
import { ExternalLink } from 'lucide-react';
import ConfidenceBadge from '../../../components/shared/ConfidenceBadge';
import type { ThreadMessage, Trace } from './types';
import { ENGINE_VERSION } from './types';

function MatchInfo({ meta }: { meta: ThreadMessage['aiMetadata'] }) {
  if (!meta || (!meta.matchedTrigger && !meta.matchedRule)) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Match</p>
      <div className="space-y-1">
        {meta.matchedTrigger && (
          <div className="flex items-center gap-1.5 text-xs text-white">
            <span className="text-[#6e684a]">Trigger:</span>
            <span className="font-mono text-yellow-400">{meta.matchedTrigger}</span>
          </div>
        )}
        {meta.matchedRule && (
          <div className="flex items-center gap-1.5 text-xs text-white">
            <span className="text-[#6e684a]">Rule:</span><span>{meta.matchedRule}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SourcesInfo({ sources }: { sources: ThreadMessage['aiMetadata'] extends { sources: infer S } ? S : never }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Knowledge Sources</p>
      <div className="space-y-1">
        {sources.map((s: { sourceName: string; relevanceScore?: number }, i: number) => (
          <div key={i} className="flex items-start gap-1.5 text-xs">
            <span className="text-blue-400 mt-0.5">•</span>
            <div>
              <p className="text-white">{s.sourceName}</p>
              {s.relevanceScore !== undefined && <p className="text-[10px] text-[#6e684a]">{Math.round(s.relevanceScore * 100)}% relevant</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolsInfo({ tools }: { tools: ThreadMessage['aiMetadata'] extends { tools: infer T } ? T : never }) {
  if (!tools || tools.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Tools Called</p>
      <div className="space-y-2">
        {tools.map((t: { toolName: string; durationMs?: number; input?: unknown; output?: unknown }, i: number) => (
          <div key={i} className="bg-[#1a1915] border border-[#2d2813] rounded-lg p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">{t.toolName}</span>
              {t.durationMs !== undefined && <span className="text-[9px] text-[#6e684a]">{t.durationMs}ms</span>}
            </div>
            {t.input && <pre className="text-[9px] text-white font-mono bg-[#181711] p-1 rounded overflow-auto">{JSON.stringify(t.input, null, 2)}</pre>}
            {t.output && <pre className="text-[9px] text-white font-mono bg-[#181711] p-1 rounded overflow-auto">{typeof t.output === 'string' ? t.output : JSON.stringify(t.output, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TracesPanel({ traces }: { traces: Trace[] }) {
  if (traces.length === 0) return null;
  const max = Math.max(...traces.map(t => t.durationMs));
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Traces</p>
      <div className="space-y-1">
        {traces.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-20 shrink-0 bg-[#1a1915] rounded px-1.5 py-0.5 text-[9px] text-[#6e684a] font-mono truncate">{t.step}</div>
            <div className="flex-1 h-1 bg-[#2d2813] rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (t.durationMs / max) * 100)}%` }} />
            </div>
            <span className="text-[9px] text-[#6e684a] w-10 text-right shrink-0">{t.durationMs}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  selectedMsg: ThreadMessage | undefined;
  selectedMsgTraces: Trace[];
  selectedConvId: string | null;
}

export default function ConversationDetail({ selectedMsg, selectedMsgTraces, selectedConvId }: Props) {
  if (!selectedMsg || !selectedMsg.aiMetadata) return null;
  const m = selectedMsg.aiMetadata;

  return (
    <div className="w-60 shrink-0 border-l border-[#2d2813] overflow-y-auto bg-[#11100b]">
      <div className="p-4 space-y-4">
        <MatchInfo meta={m} />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Confidence</p>
          <ConfidenceBadge confidence={m.confidence} />
        </div>
        <SourcesInfo sources={m.sources} />
        <ToolsInfo tools={m.tools} />
        {m.model && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Model</p>
            <p className="text-xs text-white">{m.model}</p>
            <p className="text-[10px] text-[#6e684a] mt-0.5">
              {m.botVersion && `Bot v${m.botVersion}`}{m.botVersion && m.promptVersion && ' · '}{m.promptVersion && `Prompt v${m.promptVersion}`}{' · '}Engine {ENGINE_VERSION}
            </p>
          </div>
        )}
        <TracesPanel traces={selectedMsgTraces} />
        {selectedConvId && (
          <a href={`/client/messages?conversationId=${selectedConvId}`}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#1a1915] border border-[#2d2813] hover:border-yellow-500/30 text-xs text-[#6e684a] hover:text-yellow-400 rounded-lg transition">
            <ExternalLink className="w-3.5 h-3.5" />Open Customer
          </a>
        )}
      </div>
    </div>
  );
}
