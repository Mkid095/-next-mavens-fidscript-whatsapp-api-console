import React from 'react';
import { Phone, Video, User, MoreVertical, ArrowLeft } from 'lucide-react';
import type { Contact } from '../../services/api';

interface ChatPanelHeaderProps {
  selectedPhone: string;
  selectedContactDetails: Contact | undefined;
  selectedContact: { name: string } | undefined;
  onBack: () => void;
  onOpenContactProfile: () => void;
}

export default function ChatPanelHeader({
  selectedPhone, selectedContactDetails, selectedContact, onBack, onOpenContactProfile
}: ChatPanelHeaderProps) {
  return (
    <div className="p-3 border-b border-[#eaebe4] bg-[#fafaf5] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <button onClick={onBack} className="w-7 h-7 rounded-lg hover:bg-stone-200 flex items-center justify-center shrink-0 transition-all">
          <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
          {(selectedContactDetails?.name || selectedContact?.name || selectedPhone).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-forest-deep truncate">{selectedContactDetails?.name || selectedContact?.name || selectedPhone}</p>
          <p className="text-[10px] text-stone-500 font-mono truncate">{selectedPhone}</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Call"><Phone className="w-3.5 h-3.5" /></button>
        <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Video call"><Video className="w-3.5 h-3.5" /></button>
        <button onClick={onOpenContactProfile} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Contact info"><User className="w-3.5 h-3.5" /></button>
        <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="More options"><MoreVertical className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}
