import React, { useState, useRef } from 'react';
import { SendHorizontal, RefreshCw, Smile, Plus } from 'lucide-react';
import type { Instance, Contact } from '../../services/api';
import AttachmentSheet, { AttachmentType } from './AttachmentSheet';
import MediaInlineEditor from './MediaInlineEditor';
import LocationInlineEditor from './LocationInlineEditor';
import ContactPickerPanel from './ContactPickerPanel';
import PollInlineEditor from './PollInlineEditor';
import ListInlineEditor from './ListInlineEditor';

type ActiveEditor = AttachmentType | null;

interface ComposeBarProps {
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

export default function ComposeBar({
  replyText, sending, disabled, selectedContactName, selectedInstance,
  savedContacts, textareaRef, onReplyTextChange, onSend, onTokenDeduct
}: ComposeBarProps) {
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);

  const handleAttachmentSelect = (type: AttachmentType) => {
    setActiveEditor(type);
  };

  const handleSend = (tokenCost?: number) => {
    if (tokenCost) onTokenDeduct?.(tokenCost);
    setActiveEditor(null);
  };

  const handleCancel = () => {
    setActiveEditor(null);
  };

  const showInlineEditor = activeEditor !== null && selectedInstance;

  return (
    <div className="shrink-0">
      {/* Attachment sheet */}
      <AttachmentSheet
        open={activeEditor === null}
        onSelect={handleAttachmentSelect}
        onClose={() => setActiveEditor(null)}
      />

      {/* Inline editors */}
      {showInlineEditor && selectedInstance && (
        <>
          {activeEditor === 'photo' && (
            <MediaInlineEditor
              instance={selectedInstance}
              to={selectedContactName}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
          {activeEditor === 'document' && (
            <MediaInlineEditor
              instance={selectedInstance}
              to={selectedContactName}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
          {activeEditor === 'location' && (
            <LocationInlineEditor
              instance={selectedInstance}
              to={selectedContactName}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
          {activeEditor === 'contact' && (
            <ContactPickerPanel
              contacts={savedContacts}
              instance={selectedInstance}
              to={selectedContactName}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
          {activeEditor === 'poll' && (
            <PollInlineEditor
              instance={selectedInstance}
              to={selectedContactName}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
          {activeEditor === 'list' && (
            <ListInlineEditor
              instance={selectedInstance}
              to={selectedContactName}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
        </>
      )}

      {/* Text composer - only shown when no inline editor is active */}
      {!showInlineEditor && (
        <div className="p-3 border-t border-[#eaebe4] bg-white">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setActiveEditor('photo')}
              className="bg-stone-100 hover:bg-stone-200 text-stone-500 p-2.5 rounded-2xl transition-all flex items-center justify-center"
              title="Attach"
            >
              <Plus className="w-4 h-4" />
            </button>

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
      )}
    </div>
  );
}
