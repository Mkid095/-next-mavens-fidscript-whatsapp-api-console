import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Image as ImageIcon, MapPin, CheckCircle, CheckCheck,
  MoreVertical, Phone, Video, ChevronDown, X, MessageSquare,
  RefreshCw, Smile, Paperclip, SendHorizontal
} from 'lucide-react';
import { clientMessagesApi, clientKeysApi, instancesApi } from '../../services/api';
import type { ClientMessage, ClientApiKey, Instance } from '../../services/api';

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
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

export default function MessagesView({ clientToken, instances, onTokenDeduct }: MessagesViewProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [showInstancePicker, setShowInstancePicker] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [sendingError, setSendingError] = useState('');
  const [activeApiKey, setActiveApiKey] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const connectedInstances = instances.filter(i => i.status === 'connected');

  useEffect(() => {
    if (connectedInstances.length > 0 && !selectedInstance) {
      setSelectedInstance(connectedInstances[0].name);
    }
  }, [connectedInstances, selectedInstance]);

  useEffect(() => {
    if (!clientToken) return;
    clientKeysApi.getAll().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        const active = res.data.find((k: ClientApiKey) => k.is_active);
        setActiveApiKey(active?.api_key || res.data[0].api_key || '');
      }
    });
  }, [clientToken]);

  useEffect(() => {
    if (!clientToken) return;
    clientMessagesApi.getAll().then((res) => {
      if (res.success && res.data) {
        setMessages(res.data);
      }
    });
  }, [clientToken]);

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

  useEffect(() => {
    const map = new Map<string, ConversationContact>();
    messages.forEach(msg => {
      const phone = msg.from_number;
      const key = phone;
      if (!map.has(key)) {
        map.set(key, {
          phone,
          name: msg.from_name || phone,
          lastMessage: msg.content || `[${msg.message_type}]`,
          lastTime: msg.timestamp,
          unread: msg.is_read === 0 ? 1 : 0,
          instanceName: msg.instance_name,
        });
      } else {
        const existing = map.get(key)!;
        if (new Date(msg.timestamp) > new Date(existing.lastTime)) {
          map.set(key, { ...existing, lastMessage: msg.content || `[${msg.message_type}]`, lastTime: msg.timestamp });
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPhone, messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [replyText]);

  const filteredContacts = contacts.filter(c =>
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const conversationMessages = messages
    .filter(m => selectedPhone ? m.from_number === selectedPhone : true)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const selectedContact = contacts.find(c => c.phone === selectedPhone);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPhone || !selectedInstance || !clientToken) return;
    setSending(true);
    setSendingError('');

    try {
      const res = await instancesApi.sendText(
        selectedInstance,
        selectedPhone,
        replyText.trim(),
        activeApiKey
      );

      if (res.success && res.data) {
        const sentMsg: ClientMessage = {
          id: res.data.messageId,
          from_number: selectedPhone,
          from_name: selectedContact?.name || selectedPhone,
          message_type: 'text',
          content: replyText.trim(),
          media_url: null,
          is_read: 1,
          timestamp: res.data.timestamp || new Date().toISOString(),
          direction: 'outgoing',
          instance_name: selectedInstance,
        };
        setMessages(prev => [sentMsg, ...prev]);
        setReplyText('');
        onTokenDeduct?.(1);
      } else {
        setSendingError(res.error || 'Failed to send message');
      }
    } catch (err: any) {
      setSendingError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = () => {
    if (!newChatPhone.trim()) return;
    const phone = newChatPhone.replace(/\D/g, '');
    setSelectedPhone(phone);
    setNewChatPhone('');
    setShowNewChat(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatFullTime = (ts: string) => {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (msg: ClientMessage) => {
    if (msg.direction !== 'outgoing') return null;
    return msg.is_read
      ? <CheckCheck className="w-3 h-3 text-blue-400" />
      : <CheckCircle className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex" style={{ height: '640px' }}>
      {/* Left sidebar */}
      <div className="w-72 border-r border-[#eaebe4] flex flex-col bg-[#fafaf5]">
        <div className="p-4 border-b border-[#eaebe4]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-forest-deep">Conversations</h3>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-7 h-7 rounded-lg bg-forest-deep text-white flex items-center justify-center hover:bg-[#33301a] transition-all"
              title="New chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? filteredContacts.map(contact => (
            <button
              key={contact.phone}
              onClick={() => setSelectedPhone(contact.phone)}
              className={`w-full p-3 flex items-start gap-2.5 hover:bg-stone-100 transition-all text-left border-b border-[#eaebe4]/40 ${
                selectedPhone === contact.phone ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(contact.name || contact.phone).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-forest-deep truncate">{contact.name || contact.phone}</span>
                  <span className="text-[9px] text-stone-400 shrink-0 ml-1">{formatTime(contact.lastTime)}</span>
                </div>
                <p className="text-[10px] text-stone-500 font-mono truncate">{contact.phone}</p>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">{contact.lastMessage}</p>
              </div>
              {contact.unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {contact.unread}
                </span>
              )}
            </button>
          )) : (
            <div className="p-8 text-center text-stone-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-yellow-200" />
              <p className="text-xs font-bold text-forest-deep">No conversations yet</p>
              <p className="text-[10px] text-graphite">Incoming messages will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        {selectedPhone ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-[#eaebe4] bg-[#fafaf5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white">
                  {(selectedContact?.name || selectedPhone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-forest-deep">{selectedContact?.name || selectedPhone}</p>
                  <p className="text-[10px] text-stone-500 font-mono">{selectedPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Call">
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Video call">
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="More options">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Instance selector */}
            <div className="px-4 py-2 border-b border-[#eaebe4] bg-white flex items-center gap-2">
              <span className="text-[10px] text-stone-400 font-medium">Sending from:</span>
              <div className="relative">
                <button
                  onClick={() => setShowInstancePicker(!showInstancePicker)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-forest-deep transition-all"
                >
                  <SmartphoneIcon className="w-3 h-3" />
                  {selectedInstance || 'Select container'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showInstancePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 min-w-[180px]">
                    {connectedInstances.length > 0 ? connectedInstances.map(inst => (
                      <button
                        key={inst.name}
                        onClick={() => { setSelectedInstance(inst.name); setShowInstancePicker(false); }}
                        className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedInstance === inst.name ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-green-500' : 'bg-stone-300'}`} />
                        {inst.display_name || inst.name}
                        {inst.phone_number && <span className="text-stone-400 font-mono ml-auto">{inst.phone_number}</span>}
                      </button>
                    )) : (
                      <div className="px-3 py-2 text-[11px] text-stone-400">No connected containers</div>
                    )}
                  </div>
                )}
              </div>
              {connectedInstances.length === 0 && (
                <span className="text-[10px] text-red-500">Connect a container to send messages</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f4f4ef]">
              {conversationMessages.length > 0 ? conversationMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                  title={formatFullTime(msg.timestamp)}
                >
                  <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                    msg.direction === 'outgoing'
                      ? 'bg-forest-deep text-white rounded-br-md'
                      : 'bg-white border border-[#eaebe4] text-forest-deep rounded-bl-md'
                  }`}>
                    {msg.media_url && (
                      msg.message_type === 'image' ? (
                        <img src={msg.media_url} alt="media" className="rounded-xl w-52 h-52 object-cover mb-2" />
                      ) : msg.message_type === 'video' ? (
                        <video src={msg.media_url} controls className="rounded-xl w-52 mb-2" />
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4" />
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
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1.5 ${msg.direction === 'outgoing' ? 'justify-end' : ''}`}>
                      <span className={`text-[9px] ${msg.direction === 'outgoing' ? 'text-white/50' : 'text-stone-400'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                      {getStatusIcon(msg)}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-stone-400 py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-yellow-200" />
                  <p className="text-xs font-bold text-forest-deep">Start the conversation</p>
                  <p className="text-[10px] text-graphite">Send a message to {selectedPhone}</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error */}
            {sendingError && (
              <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
                <span className="text-[10px] text-red-600">{sendingError}</span>
                <button onClick={() => setSendingError('')} className="ml-auto"><X className="w-3 h-3 text-red-400" /></button>
              </div>
            )}

            {/* Composer */}
            <div className="p-3 border-t border-[#eaebe4] bg-white">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Message ${selectedContact?.name || selectedPhone}...`}
                    className="w-full px-3 py-2 pr-10 text-xs border border-[#eaebe4] rounded-2xl focus:outline-none focus:border-yellow-500 resize-none bg-stone-50"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <button className="absolute right-2.5 bottom-2.5 w-5 h-5 text-stone-400 hover:text-stone-600 transition-all">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending || !selectedInstance || connectedInstances.length === 0}
                  className="bg-forest-deep hover:bg-[#33301a] text-white p-2.5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[9px] text-stone-400">1 token per text message</span>
                {!selectedInstance && connectedInstances.length > 0 && (
                  <span className="text-[9px] text-yellow-600">Select a container above to send</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 space-y-3 bg-[#fafaf5]">
            <MessageSquare className="w-12 h-12 text-yellow-200" />
            <div>
              <p className="font-bold text-forest-deep text-sm">Select a conversation</p>
              <p className="text-xs text-graphite">Choose a contact from the left to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-forest-deep">New Conversation</h3>
              <button onClick={() => setShowNewChat(false)} className="w-6 h-6 rounded-lg hover:bg-stone-100 flex items-center justify-center">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                value={newChatPhone}
                onChange={e => setNewChatPhone(e.target.value)}
                placeholder="254712345678"
                className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleStartNewChat(); }}
              />
            </div>
            <button
              onClick={handleStartNewChat}
              disabled={!newChatPhone.trim()}
              className="w-full py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 transition-all"
            >
              Open Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}
