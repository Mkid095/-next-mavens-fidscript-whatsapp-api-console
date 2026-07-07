import React from 'react';
import { AlertTriangle, Bot as BotIcon, MessageSquare, RefreshCw } from 'lucide-react';
import ConfidenceBadge from '../../../components/shared/ConfidenceBadge';
import { formatTime } from './helpers';

interface ThreadMessage {
  id: string;
  direction: 'incoming' | 'outgoing' | 'system';
  content: string;
  timestamp: string;
  fromName: string;
  fromNumber: string;
  aiMetadata: {
    confidence: number;
    model: string;
    promptVersion: string | null;
    botVersion: string | null;
    sources: Array<{ sourceName: string; sourceType: string; relevanceScore?: number }> | null;
    tools: Array<{ toolId: string; toolName: string; resultSummary?: string; input?: unknown; output?: unknown; durationMs?: number }> | null;
    matchedTrigger: string | null;
    matchedRule: string | null;
    skipReason: string | null;
  } | null;
}

interface ReplayResult {
  matchedTrigger: string | null;
  matchedRule: string | null;
  confidence: number;
  shouldRespond: boolean;
  skipReason: string | null;
}

interface MessageDetailProps {
  messages: ThreadMessage[];
  selectedMsgId: string | null;
  isReplaying: boolean;
  loadingThread: boolean;
  replayResult: ReplayResult | null;
  onSelectMsg: (id: string) => void;
  onReplay: (msgId: string) => void;
}

const SKIP_LABELS: Record<string, string> = {
  confidence_threshold: 'AI confidence below threshold',
  no_trigger_matched: 'No trigger matched this message',
  handoff_active: 'Human handoff was active',
  bot_disabled: 'Chatbot was disabled',
  rule_skip: 'Response rule returned skip',
  workflow_stop: 'Workflow execution stopped',
  manual_override: 'Manual override was active',
};

export default function MessageDetail({
  messages,
  selectedMsgId,
  isReplaying,
  loadingThread,
  replayResult,
  onSelectMsg,
  onReplay,
}: MessageDetailProps) {
  if (loadingThread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#6e684a]">
          <div className="w-5 h-5 border-2 border-[#6e684a] border-t-[#eab308] rounded-full animate-spin" />
          <span className="text-sm">Loading thread…</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[#6e684a]">No messages in this conversation</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map(msg => (
        <div key={msg.id} onClick={() => onSelectMsg(msg.id)}>
          {msg.direction === 'incoming' ? (
            <div className="flex justify-end">
              <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-yellow-400 text-black">
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center gap-1.5 mt-1 justify-end">
                  <span className="text-[9px] text-black/40">{formatTime(msg.timestamp)}</span>
                  {msg.aiMetadata === null && (
                    <button
                      onClick={e => { e.stopPropagation(); onSelectMsg(msg.id); }}
                      className="flex items-center gap-1 text-[9px] text-red-500 hover:text-red-400"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Bot didn't respond
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : msg.direction === 'outgoing' ? (
            <div className="flex justify-start">
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-bl-md cursor-pointer transition ${
                  selectedMsgId === msg.id
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3a1e]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <BotIcon className="w-3 h-3 text-yellow-400 shrink-0" />
                  <span className="text-[10px] font-bold text-[#6e684a]">{msg.fromName || 'Bot'}</span>
                  <span className="text-[9px] text-[#5a554a]">{formatTime(msg.timestamp)}</span>
                  {selectedMsgId === msg.id && (
                    <button
                      onClick={e => { e.stopPropagation(); onReplay(msg.id); }}
                      disabled={isReplaying}
                      className="ml-auto flex items-center gap-1 text-[9px] text-yellow-400 hover:text-yellow-300 disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${isReplaying ? 'animate-spin' : ''}`} />
                      Replay
                    </button>
                  )}
                </div>
                <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>

                {/* AI metadata badges */}
                {msg.aiMetadata && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <ConfidenceBadge confidence={msg.aiMetadata.confidence} />
                    {msg.aiMetadata.matchedTrigger && (
                      <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                        {msg.aiMetadata.matchedTrigger}
                      </span>
                    )}
                    {msg.aiMetadata.sources && msg.aiMetadata.sources.length > 0 && (
                      <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                        {msg.aiMetadata.sources[0].sourceName}
                        {msg.aiMetadata.sources.length > 1 ? ` +${msg.aiMetadata.sources.length - 1}` : ''}
                      </span>
                    )}
                    {msg.aiMetadata.tools && msg.aiMetadata.tools.length > 0 && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                        {msg.aiMetadata.tools[0].toolName}
                        {msg.aiMetadata.tools.length > 1 ? ` +${msg.aiMetadata.tools.length - 1}` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-full text-[10px] text-[#6e684a]">
                {msg.content}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Replay result bubble */}
      {replayResult && (
        <div className="flex justify-start mt-2">
          <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-green-900/20 border border-green-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <RefreshCw className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-bold text-green-400">REPLAY (current config)</span>
            </div>
            {replayResult.shouldRespond ? (
              <>
                <p className="text-sm text-white">Bot would respond</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <ConfidenceBadge confidence={replayResult.confidence} />
                  {replayResult.matchedTrigger && (
                    <span className="text-[9px] text-yellow-400">Trigger: {replayResult.matchedTrigger}</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-red-400 text-sm">
                <AlertTriangle className="w-3 h-3" />
                {replayResult.skipReason
                  ? (SKIP_LABELS[replayResult.skipReason] ?? replayResult.skipReason)
                  : 'Bot would not respond'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
