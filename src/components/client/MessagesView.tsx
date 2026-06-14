import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Image as ImageIcon, MapPin, Clock, CheckCircle } from 'lucide-react';
import { clientMessagesApi } from '../../services/api';
import type { ClientMessage } from '../../services/api';

// newMessage events arrive via WhatsAppContainers SSE dispatch (window CustomEvent)

interface ConversationContact {
  phone: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  instanceName: string;
}

interface MessagesViewProps {
  clientToken?: string;
}

export default function MessagesView({ clientToken }: MessagesViewProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'all'>('inbox');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  // Load messages on mount
  useEffect(() => {
    if (!clientToken) return;
    clientMessagesApi.getAll().then((res) => {
      if (res.success && res.data) {
        setMessages(res.data);
      }
    });
  }, [clientToken]);

  // Real-time: prepend new SSE messages
  useEffect(() => {
    const handler = (e: CustomEvent<ClientMessage>) => {
      const msg = e.detail as ClientMessage;
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [msg, ...prev];
      });
    };
    window.addEventListener('sse-new-message', handler as EventListener);
    return () => window.removeEventListener('sse-new-message', handler as EventListener);
  }, []);

  // Build contacts list from messages
  useEffect(() => {
    const map = new Map<string, ConversationContact>();
    messages.forEach(msg => {
      const phone = msg.from_number;
      const key = phone;
      if (!map.has(key)) {
        map.set(key, {
          phone,
          name: msg.from_name || phone,
          lastMessage: msg.content,
          lastTime: msg.timestamp,
          unread: msg.is_read === 0 ? 1 : 0,
          instanceName: msg.instance_name,
        });
      } else {
        const existing = map.get(key)!;
        if (new Date(msg.timestamp) > new Date(existing.lastTime)) {
          map.set(key, { ...existing, lastMessage: msg.content, lastTime: msg.timestamp });
        }
        if (msg.is_read === 0) {
          map.set(key, { ...existing, unread: existing.unread + 1 });
        }
      }
    });
    setContacts(Array.from(map.values()).sort((a, b) =>
      new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    ));
  }, [messages]);

  // Auto-scroll to bottom on conversation change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPhone, messages]);

  const filteredContacts = contacts.filter(c =>
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const conversationMessages = messages
    .filter(m => {
      if (activeTab === 'inbox') return m.from_number === selectedPhone;
      if (activeTab === 'sent') return m.from_number !== selectedPhone;
      return m.from_number === selectedPhone;
    })
    .filter(m => selectedPhone ? m.from_number === selectedPhone : true)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const selectedContact = contacts.find(c => c.phone === selectedPhone);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPhone || !clientToken) return;
    setSending(true);
    // TODO: wire to actual instance send — for now just clear
    setTimeout(() => { setSending(false); setReplyText(''); }, 500);
  };

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex" style={{ height: '600px' }}>
      {/* Left sidebar — contact list */}
      <div className="w-72 border-r border-[#eaebe4] flex flex-col">
        <div className="p-3 border-b border-[#eaebe4] bg-[#f9f9f2]">
          <h3 className="text-sm font-bold text-forest-deep mb-2">Messages</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? filteredContacts.map(contact => (
            <button
              key={contact.phone}
              onClick={() => setSelectedPhone(contact.phone)}
              className={`w-full p-3 flex items-start gap-3 hover:bg-stone-50 transition-all text-left border-b border-[#eaebe4]/50 ${
                selectedPhone === contact.phone ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-xs font-bold text-yellow-800 shrink-0">
                {(contact.name || contact.phone).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-forest-deep truncate">{contact.name || contact.phone}</span>
                  <span className="text-[9px] text-stone-400 shrink-0 ml-1">
                    {new Date(contact.lastTime).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-mono truncate">{contact.phone}</p>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">{contact.lastMessage}</p>
              </div>
              {contact.unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {contact.unread}
                </span>
              )}
            </button>
          )) : (
            <div className="p-8 text-center text-stone-400 space-y-2">
              <Send className="w-8 h-8 mx-auto text-yellow-200" />
              <p className="text-xs font-bold text-forest-deep">No messages yet</p>
              <p className="text-[10px] text-graphite">Received WhatsApp messages will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — conversation */}
      <div className="flex-1 flex flex-col">
        {selectedPhone ? (
          <>
            {/* Conversation header */}
            <div className="p-3 border-b border-[#eaebe4] bg-[#f9f9f2] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-xs font-bold text-yellow-800">
                {(selectedContact?.name || selectedPhone).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-forest-deep">{selectedContact?.name || selectedPhone}</p>
                <p className="text-[10px] text-stone-500 font-mono">{selectedPhone}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f9f9f2]">
              {conversationMessages.length > 0 ? conversationMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                    msg.direction === 'outgoing'
                      ? 'bg-forest-deep text-white rounded-br-md'
                      : 'bg-white border border-[#eaebe4] text-forest-deep rounded-bl-md'
                  }`}>
                    {msg.media_url && (
                      msg.message_type === 'image' ? (
                        <img src={msg.media_url} alt="media" className="rounded-xl w-48 h-48 object-cover mb-2" />
                      ) : msg.message_type === 'video' ? (
                        <video src={msg.media_url} controls className="rounded-xl w-48 mb-2" />
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4" />
                          <a href={msg.media_url} target="_blank" rel="noreferrer" className="underline text-[10px]">View media</a>
                        </div>
                      )
                    )}
                    {msg.message_type === 'location' && (
                      <div className="flex items-center gap-2 mb-2 text-[10px]">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1.5 ${msg.direction === 'outgoing' ? 'justify-end' : ''}`}>
                      <span className={`text-[9px] ${msg.direction === 'outgoing' ? 'text-white/60' : 'text-stone-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.direction === 'outgoing' && (
                        msg.is_read ? <CheckCircle className="w-3 h-3 text-white/60" /> : <Clock className="w-3 h-3 text-white/40" />
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-stone-400 py-12 space-y-2">
                  <Send className="w-8 h-8 mx-auto text-yellow-200" />
                  <p className="text-xs font-bold text-forest-deep">Start the conversation</p>
                  <p className="text-[10px] text-graphite">Send a message to {selectedPhone}</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply composer */}
            <div className="p-3 border-t border-[#eaebe4] bg-white flex items-end gap-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Message ${selectedContact?.name || selectedPhone}...`}
                className="flex-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || sending}
                className="bg-forest-deep hover:bg-[#33301a] text-white p-2.5 rounded-xl disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 space-y-3">
            <Send className="w-12 h-12 text-yellow-200" />
            <div>
              <p className="font-bold text-forest-deep text-sm">Select a conversation</p>
              <p className="text-xs text-graphite">Choose a contact from the left to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
