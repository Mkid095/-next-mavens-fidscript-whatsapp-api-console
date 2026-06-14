import React from 'react';
import { X, Phone, Mail, Tag, Calendar, MessageSquare, Edit2, User } from 'lucide-react';
import { motion } from 'motion/react';
import type { Contact } from '../../../services/api';
import type { ClientMessage } from '../../../services/api';

interface ContactProfilePanelProps {
  contact?: Contact;
  phone: string;
  onClose: () => void;
  messages: ClientMessage[];
}

export default function ContactProfilePanel({ contact, phone, onClose, messages }: ContactProfilePanelProps) {
  const totalMessages = messages.length;
  const firstContact = messages.length > 0
    ? new Date(messages[0].timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const lastActive = messages.length > 0
    ? new Date(messages[messages.length - 1].timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-72 border-l border-[#eaebe4] bg-[#fafaf5] flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#eaebe4] flex items-center justify-between">
        <h3 className="text-sm font-bold text-forest-deep">Contact Info</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-stone-200 flex items-center justify-center transition-all">
          <X className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Profile */}
      <div className="p-4 border-b border-[#eaebe4]">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-forest-deep flex items-center justify-center text-xl font-bold text-white mb-3">
            {(contact?.name || phone).charAt(0).toUpperCase()}
          </div>
          <h4 className="text-sm font-bold text-forest-deep">{contact?.name || phone}</h4>
          <p className="text-[11px] text-stone-500 font-mono mt-0.5">{phone}</p>
          {contact?.tags && (
            <div className="flex items-center gap-1 mt-2">
              {contact.tags.split(',').map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-medium text-stone-600">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-[#eaebe4]">
        <h5 className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-3">Conversation Stats</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-[#eaebe4] text-center">
            <p className="text-lg font-bold text-forest-deep">{totalMessages}</p>
            <p className="text-[9px] text-stone-500">Messages</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-[#eaebe4] text-center">
            <p className="text-lg font-bold text-forest-deep">
              {firstContact ? (lastActive === firstContact ? '1' : '2+') : '0'}
            </p>
            <p className="text-[9px] text-stone-500">Sessions</p>
          </div>
        </div>
        {firstContact && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-stone-500">
            <Calendar className="w-3 h-3" />
            <span>First contact: {firstContact}</span>
          </div>
        )}
        {lastActive && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500">
            <MessageSquare className="w-3 h-3" />
            <span>Last active: {lastActive}</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="p-4 border-b border-[#eaebe4]">
        <h5 className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-3">Quick Actions</h5>
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 transition-all text-left">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-yellow-700" />
            </div>
            <span className="text-xs font-bold text-forest-deep">Send Message</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 transition-all text-left">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-xs font-bold text-forest-deep">Call</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 transition-all text-left">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-xs font-bold text-forest-deep">Edit Contact</span>
          </button>
        </div>
      </div>

      {/* Contact details */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h5 className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-3">Details</h5>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-stone-400" />
            <div>
              <p className="text-[10px] text-stone-500">Phone</p>
              <p className="text-[11px] font-bold text-forest-deep font-mono">{phone}</p>
            </div>
          </div>
          {contact?.name && (
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-[10px] text-stone-500">Name</p>
                <p className="text-[11px] font-bold text-forest-deep">{contact.name}</p>
              </div>
            </div>
          )}
          {contact?.created_at && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-[10px] text-stone-500">Added</p>
                <p className="text-[11px] font-bold text-forest-deep">
                  {new Date(contact.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
