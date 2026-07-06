import React, { useState } from 'react';
import { SendHorizontal, RefreshCw, Smile, Plus } from 'lucide-react';
import type { Instance, Contact } from '../../../services/api';
import AttachmentSheet, { AttachmentType } from '../AttachmentSheet';
import { ComposeInlineEditors } from './ComposeInlineEditors';

type ActiveEditor = AttachmentType | null;

interface ComposeBarMainProps {
  replyText: string;
  sending: boolean;
  disabled: boolean;
  selectedContactName: string;
  selectedInstance: Instance | undefined;
  savedContacts: Contact[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onReplyTextChange: (v: string) => void;
  onSend: () => void;
  onTokenDeduct?: (n: number) => void;
}

export function ComposeBarMain({
  replyText, sending, disabled, selectedContactName, selectedInstance,
  savedContacts, textareaRef, onReplyTextChange, onSend, onTokenDeduct,
}: ComposeBarMainProps) {
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);

  const handleSend = (tokenCost?: number) => {
    if (tokenCost) onTokenDeduct?.(tokenCost);
    setActiveEditor(null);
  };

  const handleCancel = () => setActiveEditor(null);
  const showInlineEditor = activeEditor !== null && selectedInstance;

  return (
    <div className="shrink-0">
      <AttachmentSheet open={activeEditor === null} onSelect={(t) => setActiveEditor(t)} onClose={() => setActiveEditor(null)} />

      {showInlineEditor && selectedInstance && (
        <ComposeInlineEditors
          activeEditor={activeEditor as AttachmentType}
          selectedInstance={selectedInstance}
          selectedContactName={selectedContactName}
          savedContacts={savedContacts}
          onSend={handleSend}
          onCancel={handleCancel}
        />
      )}

      {!showInlineEditor && (
        <div className="p-3 border-t border-[#eaebe4] bg-white">
          <div className="flex items-end gap-2">
            <button onClick={() => setActiveEditor('photo')}
              className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-2.5 rounded-2xl transition-all flex items-center justify-center" title="Attach">
              <Plus className="w-4 h-4" />
            </button>
            <div className="flex-1 relative">
              <textarea ref={textareaRef} rows={1} value={replyText}
                onChange={e => onReplyTextChange(e.target.value)}
                placeholder={`Message ${selectedContactName}...`}
                className="w-full px-3 py-2 pr-10 text-xs border border-[#eaebe4] rounded-2xl focus:outline-none focus:border-yellow-500 resize-none bg-stone-50"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
              <button className="absolute right-2.5 bottom-2.5 w-5 h-5 text-stone-400 hover:text-stone-600 transition-all">
                <Smile className="w-4 h-4" />
              </button>
            </div>
            <button onClick={onSend} disabled={!replyText.trim() || sending || disabled}
              className="bg-forest-deep hover:bg-[#33301a] text-white p-2.5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[9px] text-stone-400">1 token per text</span>
          </div>
        </div>
      )}
    </div>
  );
}
