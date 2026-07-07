/**
 * DebugSidebar — "What happened" panel showing trigger, rule, knowledge, performance.
 */
import React from 'react';
import {
  Zap,
  Lightbulb,
  BookOpen,
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Brain,
} from 'lucide-react';
import type { DebugPayload } from './TestResultsMain';

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function DebugRow({
  icon,
  label,
  value,
  sub,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  status: 'matched' | 'none' | 'fired';
}) {
  const colorClass =
    status === 'matched'
      ? 'text-green-400'
      : status === 'none'
      ? 'text-[#6e684a]'
      : 'text-yellow-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-[#6e684a]">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-1.5 pl-4">
        {status === 'matched' && (
          <CheckCircle2 className={`w-3 h-3 ${colorClass} shrink-0`} />
        )}
        {status === 'none' && (
          <XCircle className={`w-3 h-3 ${colorClass} shrink-0`} />
        )}
        <span
          className={`text-xs ${status === 'none' ? 'text-[#6e684a]' : 'text-white'} truncate`}
        >
          {value}
        </span>
      </div>
      {sub && <p className="text-[9px] text-[#5a554a] pl-7">{sub}</p>}
    </div>
  );
}

export function DebugSidebar({
  debug,
  expanded,
  onToggleExpanded,
}: {
  debug: DebugPayload;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  return (
    <div className="w-64 shrink-0 bg-[#0d0c0a] border border-[#2d2813] rounded-2xl overflow-hidden flex flex-col max-h-[460px]">
      <div className="px-4 py-3 border-b border-[#2d2813] bg-[#1a1915] flex items-center gap-2 shrink-0">
        <Brain className="w-4 h-4 text-yellow-400" />
        <p className="text-xs font-semibold text-white">What happened</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Trigger */}
        {debug.matched_trigger ? (
          <DebugRow
            icon={<Zap className="w-3.5 h-3.5 text-yellow-400" />}
            label="Trigger"
            value={debug.matched_trigger}
            sub={debug.trigger_type ? `type: ${debug.trigger_type}` : undefined}
            status="matched"
          />
        ) : (
          <DebugRow
            icon={<XCircle className="w-3.5 h-3.5 text-[#6e684a]" />}
            label="Trigger"
            value="No trigger matched"
            status="none"
          />
        )}

        {/* Rule */}
        {debug.matched_rule && (
          <DebugRow
            icon={<Lightbulb className="w-3.5 h-3.5 text-blue-400" />}
            label="Rule"
            value={debug.matched_rule}
            sub={
              debug.rule_confidence !== undefined
                ? `confidence: ${Math.round(debug.rule_confidence * 100)}%`
                : undefined
            }
            status="matched"
          />
        )}

        {/* Knowledge sources */}
        {debug.knowledge_sources && debug.knowledge_sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-[#6e684a]">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Knowledge used
            </div>
            {debug.knowledge_sources.map((src, i) => (
              <div key={i} className="flex items-center gap-1.5 pl-4">
                <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                <span className="text-xs text-white truncate">{src}</span>
              </div>
            ))}
          </div>
        )}

        {/* Performance */}
        {(debug.latency_ms !== undefined || debug.tokens_used !== undefined) && (
          <div className="space-y-1">
            <div className="text-[10px] text-[#6e684a] uppercase tracking-wide">
              Performance
            </div>
            {debug.latency_ms !== undefined && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#6e684a]" />
                <span className="text-xs text-white">
                  {formatLatency(debug.latency_ms)}
                </span>
              </div>
            )}
            {debug.tokens_used !== undefined && (
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#6e684a]" />
                <span className="text-xs text-white">
                  {debug.tokens_used.toLocaleString()} tokens
                </span>
              </div>
            )}
          </div>
        )}

        {/* Confidence */}
        {debug.confidence !== undefined && (
          <div className="space-y-1">
            <div className="text-[10px] text-[#6e684a] uppercase tracking-wide">
              AI Confidence
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#2d2813] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    debug.confidence >= 0.8
                      ? 'bg-green-400'
                      : debug.confidence >= 0.5
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.round(debug.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-white font-mono">
                {Math.round(debug.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Full debug toggle */}
      <div className="p-3 border-t border-[#2d2813] shrink-0">
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between text-[10px] text-[#6e684a] hover:text-white transition"
        >
          <span>Full debug output</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
        {expanded && (
          <pre className="mt-2 text-[9px] text-[#6e684a] font-mono bg-[#1a1915] p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(debug.raw ?? debug, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
