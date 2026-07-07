import { ArrowLeft, ChevronDown, ChevronUp, ShieldOff, Users, Zap } from 'lucide-react';
import type { ChatListItem } from '../messagesApi';

type ResumePolicy = 'manual' | 'next_message' | 'timeout';

interface ThreadHeaderProps {
  chat: ChatListItem;
  headerPic: string | null;
  onBack: () => void;
  showTakeoverMenu: boolean;
  setShowTakeoverMenu: (v: boolean) => void;
  aiOverride: 'ai' | 'manual' | null;
  hasChatbot: boolean;
  overrideLoading: boolean;
  handleTakeOver: (policy: ResumePolicy) => void;
  handleResumeAi: () => void;
}

export default function ThreadHeader({
  chat,
  headerPic,
  onBack,
  showTakeoverMenu,
  setShowTakeoverMenu,
  aiOverride,
  hasChatbot,
  overrideLoading,
  handleTakeOver,
  handleResumeAi,
}: ThreadHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-[#2d2813] bg-[#181711] px-3 py-2.5 md:px-4">
        <button
          onClick={onBack}
          aria-label="Back to chats"
          className="rounded-lg p-1 text-[#8f834a] hover:bg-[#2d2813] md:hidden"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2d2813] overflow-hidden text-[#8f834a]">
          {headerPic ? (
            <img src={headerPic} alt="" className="h-full w-full object-cover" />
          ) : chat.isGroup ? (
            <Users size={16} />
          ) : (
            <span className="text-xs font-semibold">{(chat.name || chat.jid).slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-white">{chat.name}</h2>
          <p className="truncate text-[11px] text-[#6e684a]">{chat.isGroup ? 'Group · ' + chat.jid : chat.jid}</p>
        </div>
        {/* AI Take Over / Resume AI control */}
        <div className="flex items-center gap-1.5">
          {aiOverride === 'manual' ? (
            <button
              onClick={handleResumeAi}
              disabled={overrideLoading}
              title="Resume AI for this conversation"
              className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
            >
              <Zap size={12} className="text-green-500" />
              {overrideLoading ? '…' : 'Resume AI'}
            </button>
          ) : hasChatbot && !chat.isGroup ? (
            <div className="relative">
              <button
                onClick={() => setShowTakeoverMenu(!showTakeoverMenu)}
                disabled={overrideLoading}
                title="Take over this conversation from the AI"
                className="flex items-center gap-1 rounded-lg border border-[#3d3823] bg-[#1a1915] px-2 py-1 text-[11px] font-medium text-[#8f834a] transition hover:border-[#eab308]/40 hover:text-[#eab308] disabled:opacity-50"
              >
                <ShieldOff size={12} className="text-[#eab308]" />
                {overrideLoading ? '…' : 'Take Over'}
                {showTakeoverMenu ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              {showTakeoverMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-[#2d2813] bg-[#1a1915] py-1 shadow-lg" data-takeover-menu>
                  <button
                    onClick={() => handleTakeOver('manual')}
                    className="flex w-full items-center px-3 py-2 text-left text-[11px] text-[#a8a99e] hover:bg-[#2d2813] hover:text-white"
                  >
                    Until I resume
                  </button>
                  <button
                    onClick={() => handleTakeOver('next_message')}
                    className="flex w-full items-center px-3 py-2 text-left text-[11px] text-[#a8a99e] hover:bg-[#2d2813] hover:text-white"
                  >
                    Resume after my reply
                  </button>
                  <button
                    onClick={() => handleTakeOver('timeout')}
                    className="flex w-full items-center px-3 py-2 text-left text-[11px] text-[#a8a99e] hover:bg-[#2d2813] hover:text-white"
                  >
                    30 minutes
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* AI paused indicator banner */}
      {aiOverride === 'manual' && (
        <div className="flex items-center justify-center gap-2 border-b border-[#3d3823] bg-[#1a1915] px-4 py-1.5">
          <ShieldOff size={12} className="text-[#eab308]" />
          <span className="text-[11px] font-medium text-[#a8a99e]">
            AI paused — you are replying manually
          </span>
          <button
            onClick={handleResumeAi}
            disabled={overrideLoading}
            className="ml-2 text-[11px] font-semibold text-[#eab308] underline hover:text-[#fde047] disabled:opacity-50"
          >
            Resume AI
          </button>
        </div>
      )}
    </>
  );
}
