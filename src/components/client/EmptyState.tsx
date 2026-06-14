import React from 'react';
import { MessageSquare, PenSquare } from 'lucide-react';
import type { Contact } from '../../services/api';

interface EmptyStateProps {
  savedContacts: Contact[];
  onNewChat: () => void;
}

export default function EmptyState({ savedContacts, onNewChat }: EmptyStateProps) {
  const recent = savedContacts.slice(0, 5);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#fafaf5]">
      <div className="text-center space-y-5 max-w-xs">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-forest-deep">Start a conversation</h3>
          <p className="text-xs text-graphite mt-1">Select a chat or find someone new</p>
        </div>
        <button
          onClick={onNewChat}
          className="px-5 py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all inline-flex items-center gap-2"
        >
          <PenSquare className="w-3.5 h-3.5" />
          New Chat
        </button>

        {recent.length > 0 && (
          <div className="pt-4 border-t border-[#eaebe4]">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-3">Recent Contacts</p>
            <div className="space-y-1">
              {recent.map(c => (
                <button
                  key={c.id}
                  onClick={onNewChat}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-forest-deep text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(c.name || c.phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs font-bold text-forest-deep truncate">{c.name || c.phone}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{c.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
