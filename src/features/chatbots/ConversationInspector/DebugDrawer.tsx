import React from 'react';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import ConfidenceBadge from '../../../components/shared/ConfidenceBadge';

interface AIMetadata {
  confidence: number;
  model: string;
  promptVersion: string | null;
  botVersion: string | null;
  sources: Array<{ sourceName: string; sourceType: string; relevanceScore?: number }> | null;
  tools: Array<{ toolId: string; toolName: string; resultSummary?: string; input?: unknown; output?: unknown; durationMs?: number }> | null;
  matchedTrigger: string | null;
  matchedRule: string | null;
  skipReason: string | null;
}

interface Trace {
  messageId: string;
  step: string;
  durationMs: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface DebugDrawerProps {
  selectedMsg: { id: string; aiMetadata: AIMetadata | null } | undefined;
  selectedMsgTraces: Trace[];
  selectedConvId: string | null;
  engineVersion: string;
}

export default function DebugDrawer({ selectedMsg, selectedMsgTraces, selectedConvId, engineVersion }: DebugDrawerProps) {
  if (!selectedMsg || !selectedMsg.aiMetadata) return null;
  const md = selectedMsg.aiMetadata;
  const maxDuration = Math.max(...selectedMsgTraces.map(x => x.durationMs), 1);

  return (
    <div className="w-60 shrink-0 border-l border-[#2d2813] overflow-y-auto bg-[#11100b]">
      <div className="p-4 space-y-4">

        {/* Trigger / Rule */}
        {(md.matchedTrigger || md.matchedRule) && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Match</p>
            <div className="space-y-1">
              {md.matchedTrigger && (
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <span className="text-[#6e684a]">Trigger:</span>
                  <span className="font-mono text-yellow-400">{md.matchedTrigger}</span>
                </div>
              )}
              {md.matchedRule && (
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <span className="text-[#6e684a]">Rule:</span>
                  <span>{md.matchedRule}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confidence */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Confidence</p>
          <ConfidenceBadge confidence={md.confidence} />
        </div>

        {/* Sources */}
        {md.sources && md.sources.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Knowledge Sources</p>
            <div className="space-y-1">
              {md.sources.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <div>
                    <p className="text-white">{s.sourceName}</p>
                    {s.relevanceScore !== undefined && (
                      <p className="text-[10px] text-[#6e684a]">{Math.round(s.relevanceScore * 100)}% relevant</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        {md.tools && md.tools.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Tools Called</p>
            <div className="space-y-2">
              {md.tools.map((t, i) => (
                <div key={i} className="bg-[#1a1915] border border-[#2d2813] rounded-lg p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{t.toolName}</span>
                    {t.durationMs !== undefined && (
                      <span className="text-[9px] text-[#6e684a] flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{t.durationMs}ms
                      </span>
                    )}
                  </div>
                  {t.input && (
                    <div>
                      <p className="text-[9px] text-[#6e684a]">input:</p>
                      <pre className="text-[9px] text-white font-mono bg-[#181711] p-1 rounded overflow-auto">
                        {JSON.stringify(t.input as unknown, null, 2) as string}
                      </pre>
                    </div>
                  )}
                  {t.output && (
                    <div>
                      <p className="text-[9px] text-[#6e684a]">output:</p>
                      <pre className="text-[9px] text-white font-mono bg-[#181711] p-1 rounded overflow-auto">
                        {typeof t.output === 'string' ? t.output : JSON.stringify(t.output as unknown, null, 2) as string}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model / Version info */}
        {md.model && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Model</p>
            <p className="text-xs text-white">{md.model}</p>
            <p className="text-[10px] text-[#6e684a] mt-0.5">
              {md.botVersion && `Bot v${md.botVersion}`}
              {md.botVersion && md.promptVersion && ' · '}
              {md.promptVersion && `Prompt v${md.promptVersion}`}
              {' · '}
              Engine {engineVersion}
            </p>
          </div>
        )}

        {/* Traces */}
        {selectedMsgTraces.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6e684a] mb-1.5">Traces</p>
            <div className="space-y-1">
              {selectedMsgTraces.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-20 shrink-0 bg-[#1a1915] rounded px-1.5 py-0.5 text-[9px] text-[#6e684a] font-mono truncate">
                    {t.step}
                  </div>
                  <div className="flex-1 h-1 bg-[#2d2813] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${Math.min(100, (t.durationMs / maxDuration) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#6e684a] w-10 text-right shrink-0">
                    {t.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Customer */}
        {selectedConvId && (
          <a
            href={`/client/messages?conversationId=${selectedConvId}`}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#1a1915] border border-[#2d2813] hover:border-yellow-500/30 text-xs text-[#6e684a] hover:text-yellow-400 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Customer
          </a>
        )}
      </div>
    </div>
  );
}
