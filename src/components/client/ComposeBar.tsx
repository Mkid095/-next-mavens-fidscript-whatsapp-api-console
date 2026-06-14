import React, { useState, useRef } from 'react';
import { SendHorizontal, RefreshCw, Smile, Plus, Paperclip, MapPin, User, BarChart2, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type MessageType = 'media' | 'location' | 'contact' | 'poll' | 'list';

interface ComposeBarProps {
  replyText: string;
  sending: boolean;
  disabled: boolean;
  selectedContactName: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onReplyTextChange: (v: string) => void;
  onSend: () => void;
  onTokenDeduct?: (n: number) => void;
  onSelectMessageType: (type: MessageType) => void;
}

const MENU_ITEMS: { type: MessageType; label: string; icon: React.ReactNode }[] = [
  { type: 'media', label: 'Media', icon: <Paperclip className="w-4 h-4" /> },
  { type: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
  { type: 'contact', label: 'Contact', icon: <User className="w-4 h-4" /> },
  { type: 'poll', label: 'Poll', icon: <BarChart2 className="w-4 h-4" /> },
  { type: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
];

export default function ComposeBar({
  replyText, sending, disabled, selectedContactName, textareaRef,
  onReplyTextChange, onSend, onSelectMessageType
}: ComposeBarProps) {
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="p-3 border-t border-[#eaebe4] bg-white shrink-0">
      <div className="flex items-end gap-2">
        {/* Plus menu button */}
        <div className="relative">
          <button
            ref={plusBtnRef}
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-2.5 rounded-2xl transition-all flex items-center justify-center"
            title="More message types"
          >
            <Plus className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showPlusMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPlusMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  className="absolute bottom-full left-0 mb-2 bg-white border border-[#eaebe4] rounded-2xl shadow-lg z-50 w-44 overflow-hidden"
                >
                  <div className="py-1">
                    {MENU_ITEMS.map(item => (
                      <button
                        key={item.type}
                        onClick={() => { onSelectMessageType(item.type); setShowPlusMenu(false); }}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-stone-50 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center text-forest-deep shrink-0">
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold text-forest-deep">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={replyText}
            onChange={e => onReplyTextChange(e.target.value)}
            placeholder={`Message ${selectedContactName}...`}
            className="w-full px-3 py-2 pr-10 text-xs border border-[#eaebe4] rounded-2xl focus:outline-none focus:border-yellow-500 resize-none bg-stone-50"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          />
          <button className="absolute right-2.5 bottom-2.5 w-5 h-5 text-stone-400 hover:text-stone-600 transition-all">
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!replyText.trim() || sending || disabled}
          className="bg-forest-deep hover:bg-[#33301a] text-white p-2.5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[9px] text-stone-400">1 token per text</span>
      </div>
    </div>
  );
}
