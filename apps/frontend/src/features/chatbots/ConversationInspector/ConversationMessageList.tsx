import React from 'react';
import { MessageSquare, Loader2, Bot as BotIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import ConfidenceBadge from '../../../components/shared/ConfidenceBadge';
import type { ThreadMessage, ReplayResult } from './types';
import { formatTime } from './utils';
import { SKIP_LABELS } from './types';

interface Props {
  messages: ThreadMessage[];
  loadingThread: boolean;
  selectedConvId: string | null;
  selectedMsgId: string | null;
  replayResult: ReplayResult | null;
  isReplaying: boolean;
  onSelectMsg: (id: string) => void;
  onReplay: (msgId: string) => void;
}

function ReplayResultBubble({ result }: { result: ReplayResult }) {
  return (
    <div className="flex justify-start mt-2">
      <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-green-900/20 border border-green-500/30">
        <div className="flex items-center gap-1.5 mb-1">
          <RefreshCw className="w-3 h-3 text-green-400" />
          <span className="text-[10px] font-bold text-green-400">REPLAY (current config)</span>
        </div>
        {result.shouldRespond ? (
          <>
            <p className="text-sm text-white">Bot would respond</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <ConfidenceBadge confidence={result.confidence} />
              {result.matchedTrigger && (
                <span className="text-[9px] text-yellow-400">Trigger: {result.matchedTrigger}</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-red-400 text-sm">
            <AlertTriangle className="w-3 h-3" />
            {result.skipReason ? (SKIP_LABELS[result.skipReason] ?? result.skipReason) : 'Bot would not respond'}
          </div>
        )}
      </div>
    </div>
  );
}

function AIMetadataBadges({ msg }: { msg: ThreadMessage }) {
  if (!msg.aiMetadata) return null;
  const { aiMetadata } = msg;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <ConfidenceBadge confidence={aiMetadata.confidence} />
      {aiMetadata.matchedTrigger && (
        <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">{aiMetadata.matchedTrigger}</span>
      )}
      {aiMetadata.sources && aiMetadata.sources.length > 0 && (
        <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
          {aiMetadata.sources[0].sourceName}{aiMetadata.sources.length > 1 ? ` +${aiMetadata.sources.length - 1}` : ''}
        </span>
      )}
      {aiMetadata.tools && aiMetadata.tools.length > 0 && (
        <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
          {aiMetadata.tools[0].toolName}{aiMetadata.tools.length > 1 ? ` +${aiMetadata.tools.length - 1}` : ''}
        </span>
      )}
    </div>
  );
}

function BotBubble({ msg, selectedMsgId, isReplaying, onSelectMsg, onReplay }: { msg: ThreadMessage } & Pick<Props, 'selectedMsgId' | 'isReplaying' | 'onSelectMsg' | 'onReplay'>) {
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-bl-md cursor-pointer transition ${
          selectedMsgId === msg.id ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3a1e]'
        }`}
        onClick={() => onSelectMsg(msg.id)}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <BotIcon className="w-3 h-3 text-yellow-400 shrink-0" />
          <span className="text-[10px] font-bold text-[#6e684a]">{msg.fromName || 'Bot'}</span>
          <span className="text-[9px] text-[#5a554a]">{formatTime(msg.timestamp)}</span>
          {selectedMsgId === msg.id && (
            <button onClick={e => { e.stopPropagation(); onReplay(msg.id); }} disabled={isReplaying}
              className="ml-auto flex items-center gap-1 text-[9px] text-yellow-400 hover:text-yellow-300 disabled:opacity-40">
              <RefreshCw className={`w-3 h-3 ${isReplaying ? 'animate-spin' : ''}`} />Replay
            </button>
          )}
        </div>
        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
        <AIMetadataBadges msg={msg} />
      </div>
    </div>
  );
}

export default function ConversationMessageList({ messages, loadingThread, selectedConvId, selectedMsgId, replayResult, isReplaying, onSelectMsg, onReplay }: Props) {
  if (!selectedConvId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <MessageSquare className="w-10 h-10 text-[#3d3813] mb-3" />
        <p className="text-sm font-semibold text-[#6e684a]">Select a conversation</p>
        <p className="text-xs text-[#5a554a] mt-1">Choose from the list on the left to inspect the full thread</p>
      </div>
    );
  }
  if (loadingThread) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#6e684a]" /></div>;
  if (messages.length === 0) return <div className="flex-1 flex items-center justify-center"><p className="text-sm text-[#6e684a]">No messages</p></div>;

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
                    <button onClick={e => { e.stopPropagation(); onSelectMsg(msg.id); }}
                      className="flex items-center gap-1 text-[9px] text-red-500 hover:text-red-400">
                      <AlertTriangle className="w-3 h-3" />Bot didn't respond
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : msg.direction === 'outgoing' ? (
            <BotBubble msg={msg} selectedMsgId={selectedMsgId} isReplaying={isReplaying} onSelectMsg={onSelectMsg} onReplay={onReplay} />
          ) : (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-full text-[10px] text-[#6e684a]">{msg.content}</div>
            </div>
          )}
        </div>
      ))}
      {replayResult && <ReplayResultBubble result={replayResult} />}
    </div>
  );
}
