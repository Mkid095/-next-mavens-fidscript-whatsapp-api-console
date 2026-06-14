import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Image as ImageIcon, MapPin, CheckCircle, CheckCheck,
  MoreVertical, Phone, Video, ChevronDown, X, MessageSquare,
  RefreshCw, Smile, Paperclip, SendHorizontal, Users, Clock,
  Plus, Calendar, Trash2, Play, Pause, Zap, AlertCircle, Check
} from 'lucide-react';
import { clientMessagesApi, clientKeysApi, contactsApi, campaignsApi, instancesApi } from '../../services/api';
import type { ClientMessage, ClientApiKey, Contact, Instance, Campaign } from '../../services/api';

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
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [showInstancePicker, setShowInstancePicker] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [sendingError, setSendingError] = useState('');
  const [activeApiKey, setActiveApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'bulk'>('chat');
  const [showBulkModal, setShowBulkModal] = useState(false);
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
    contactsApi.getAll().then((res) => {
      if (res.success && res.data) setSavedContacts(res.data);
    });
  }, [clientToken]);

  useEffect(() => {
    if (!clientToken) return;
    clientMessagesApi.getAll(selectedInstance || undefined).then((res) => {
      if (res.success && res.data) setMessages(res.data);
    });
  }, [clientToken, selectedInstance]);

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
      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: msg.from_name || phone,
          lastMessage: msg.content || `[${msg.message_type}]`,
          lastTime: msg.timestamp,
          unread: msg.is_read === 0 ? 1 : 0,
          instanceName: msg.instance_name,
        });
      } else {
        const existing = map.get(phone)!;
        if (new Date(msg.timestamp) > new Date(existing.lastTime)) {
          map.set(phone, { ...existing, lastMessage: msg.content || `[${msg.message_type}]`, lastTime: msg.timestamp });
        }
        if (msg.is_read === 0) {
          map.set(phone, { ...existing, unread: existing.unread + 1 });
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
      const res = await instancesApi.sendText(selectedInstance, selectedPhone, replyText.trim(), activeApiKey);
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
    setNewChatName('');
    setShowNewChat(false);
  };

  const handleSelectSavedContact = (contact: Contact) => {
    setNewChatPhone(contact.phone);
    setNewChatName(contact.name);
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
        {/* Header */}
        <div className="p-4 border-b border-[#eaebe4]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-forest-deep">Conversations</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('chat'); setShowNewChat(true); }}
                className="w-7 h-7 rounded-lg bg-forest-deep text-white flex items-center justify-center hover:bg-[#33301a] transition-all"
                title="New chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setActiveTab('bulk'); setShowBulkModal(true); }}
                className="w-7 h-7 rounded-lg bg-yellow-500 text-stone-950 flex items-center justify-center hover:bg-yellow-400 transition-all"
                title="Bulk messages"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
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

        {/* Container filter chips */}
        {connectedInstances.length > 1 && (
          <div className="px-3 py-2 border-b border-[#eaebe4] flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedInstance('')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${!selectedInstance ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              All
            </button>
            {connectedInstances.map(inst => (
              <button
                key={inst.name}
                onClick={() => setSelectedInstance(inst.name)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${selectedInstance === inst.name ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-green-400' : 'bg-stone-300'}`} />
                {inst.display_name || inst.name}
              </button>
            ))}
          </div>
        )}

        {/* Contact list */}
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
                  {selectedInstance || 'All containers'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showInstancePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 min-w-[180px]">
                    <button
                      onClick={() => { setSelectedInstance(''); setShowInstancePicker(false); }}
                      className="w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 border-b border-[#eaebe4] font-bold text-forest-deep"
                    >
                      All containers
                    </button>
                    {connectedInstances.map(inst => (
                      <button
                        key={inst.name}
                        onClick={() => { setSelectedInstance(inst.name); setShowInstancePicker(false); }}
                        className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedInstance === inst.name ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-green-500' : 'bg-stone-300'}`} />
                        {inst.display_name || inst.name}
                        {inst.phone_number && <span className="text-stone-400 font-mono ml-auto">{inst.phone_number}</span>}
                      </button>
                    ))}
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
                  disabled={!replyText.trim() || sending || connectedInstances.length === 0}
                  className="bg-forest-deep hover:bg-[#33301a] text-white p-2.5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[9px] text-stone-400">1 token per text</span>
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
        <NewChatModal
          savedContacts={savedContacts}
          value={newChatPhone}
          name={newChatName}
          onChangePhone={setNewChatPhone}
          onChangeName={setNewChatName}
          onSelectContact={handleSelectSavedContact}
          onClose={() => setShowNewChat(false)}
          onSubmit={handleStartNewChat}
        />
      )}

      {/* Bulk message modal */}
      {showBulkModal && (
        <BulkMessageModal
          instances={connectedInstances}
          savedContacts={savedContacts}
          clientToken={clientToken}
          onClose={() => setShowBulkModal(false)}
          onTokenDeduct={onTokenDeduct}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

interface NewChatModalProps {
  savedContacts: Contact[];
  value: string;
  name: string;
  onChangePhone: (v: string) => void;
  onChangeName: (v: string) => void;
  onSelectContact: (c: Contact) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function NewChatModal({ savedContacts, value, name, onChangePhone, onChangeName, onSelectContact, onClose, onSubmit }: NewChatModalProps) {
  const [contactSearch, setContactSearch] = useState('');
  const filtered = savedContacts.filter(c =>
    !contactSearch || c.phone.includes(contactSearch) || (c.name || '').toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-forest-deep">New Conversation</h3>
          <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-stone-100 flex items-center justify-center">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Saved contacts */}
        {savedContacts.length > 0 && (
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">Or select a saved contact</label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
              <input
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-7 pr-2 py-1 text-[10px] border border-[#eaebe4] rounded-lg focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1">
              {filtered.slice(0, 8).map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelectContact(c)}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-yellow-50 flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-600">
                    {(c.name || c.phone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-forest-deep">{c.name || c.phone}</p>
                    <p className="text-[9px] text-stone-400 font-mono">{c.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#eaebe4] pt-3 space-y-2">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
            <input
              type="tel"
              value={value}
              onChange={e => onChangePhone(e.target.value)}
              placeholder="254712345678"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => onChangeName(e.target.value)}
              placeholder="Display name"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
              onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
            />
          </div>
        </div>
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="w-full py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 transition-all"
        >
          Open Chat
        </button>
      </div>
    </div>
  );
}

interface BulkMessageModalProps {
  instances: Instance[];
  savedContacts: Contact[];
  clientToken?: string;
  onClose: () => void;
  onTokenDeduct?: (n: number) => void;
}

function BulkMessageModal({ instances, savedContacts, clientToken, onClose, onTokenDeduct }: BulkMessageModalProps) {
  const [step, setStep] = useState<'setup' | 'preview' | 'sending'>('setup');
  const [campaignName, setCampaignName] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.name || '');
  const [messageText, setMessageText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [phoneInput, setPhoneInput] = useState('');
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const allPhones = [
    ...Array.from(selectedContacts),
    ...extraPhones.map(p => p.replace(/\D/g, '')).filter(Boolean),
  ];

  const toggleContact = (phone: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const addPhone = () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (phone && !allPhones.includes(phone)) {
      setExtraPhones(prev => [...prev, phone]);
      setPhoneInput('');
    }
  };

  const totalCost = messageText.trim() ? allPhones.length : 0;

  const handleCreateAndSend = async () => {
    if (!campaignName.trim() || !selectedInstance || allPhones.length === 0 || !messageText.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await campaignsApi.create({
        name: campaignName,
        instance_name: selectedInstance,
        message_type: 'text',
        content: messageText,
        scheduled_at: scheduledAt || undefined,
        phone_numbers: allPhones,
      });
      if (res.success && res.data) {
        const sendRes = await campaignsApi.send(res.data.id);
        if (sendRes.success) {
          onTokenDeduct?.(sendRes.data?.tokens_deducted || totalCost);
          setStep('sending');
        } else {
          setError(sendRes.error || 'Failed to start campaign');
        }
      } else {
        setError(res.error || 'Failed to create campaign');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[560px] max-h-[85vh] flex flex-col">
        {/* Modal header */}
        <div className="p-5 border-b border-[#eaebe4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-stone-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Bulk Message Campaign</h3>
              <p className="text-[10px] text-graphite">Send to multiple contacts with smart queuing</p>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-stone-100 flex items-center justify-center">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'setup' && (
            <>
              {/* Campaign name */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Campaign Name</label>
                <input
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g. June Promotion"
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Container */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Container</label>
                <div className="relative mt-1">
                  <select
                    value={selectedInstance}
                    onChange={e => setSelectedInstance(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white appearance-none"
                  >
                    {instances.map(inst => (
                      <option key={inst.name} value={inst.name}>
                        {inst.display_name || inst.name}{inst.phone_number ? ` (${inst.phone_number})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Message</label>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-stone-400">{allPhones.length} recipients</span>
                  <span className="text-[9px] text-stone-400">{totalCost} tokens</span>
                </div>
              </div>

              {/* Recipients — saved contacts */}
              {savedContacts.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">
                    Select from saved contacts
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-[#eaebe4] rounded-xl">
                    {savedContacts.map(c => (
                      <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer border-b border-[#eaebe4]/50 last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(c.phone)}
                          onChange={() => toggleContact(c.phone)}
                          className="w-3.5 h-3.5 rounded accent-yellow-500"
                        />
                        <div>
                          <p className="text-[11px] font-bold text-forest-deep">{c.name || c.phone}</p>
                          <p className="text-[9px] text-stone-400 font-mono">{c.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra phones */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Add phone numbers</label>
                <div className="flex gap-1.5 mt-1">
                  <input
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="254712345678"
                    className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhone(); } }}
                  />
                  <button onClick={addPhone} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-bold text-stone-600 transition-all">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {extraPhones.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {extraPhones.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-mono flex items-center gap-1">
                        {p}
                        <button onClick={() => setExtraPhones(prev => prev.filter(x => x !== p))}>
                          <X className="w-2.5 h-2.5 text-stone-400" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                />
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                <p className="text-[11px] font-bold text-forest-deep">Campaign: {campaignName}</p>
                <p className="text-[10px] text-stone-500">Container: {selectedInstance}</p>
                <p className="text-[10px] text-stone-500">Recipients: {allPhones.length}</p>
                <p className="text-[10px] text-stone-500">Tokens: {totalCost}</p>
                {scheduledAt && <p className="text-[10px] text-stone-500">Scheduled: {new Date(scheduledAt).toLocaleString()}</p>}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-yellow-800 mb-1">Message preview:</p>
                <p className="text-[11px] text-yellow-900 whitespace-pre-wrap">{messageText}</p>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {allPhones.map(p => (
                  <div key={p} className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-[11px] font-mono text-stone-600">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-bold text-forest-deep">Campaign created and queued!</p>
              <p className="text-xs text-graphite">{allPhones.length} messages queued for delivery</p>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="p-5 border-t border-[#eaebe4] flex items-center justify-between shrink-0">
          {step === 'setup' && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 transition-all">
                Cancel
              </button>
              <button
                onClick={() => { if (allPhones.length > 0 && messageText.trim() && campaignName.trim()) setStep('preview'); }}
                disabled={!allPhones.length || !messageText.trim() || !campaignName.trim()}
                className="px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 transition-all"
              >
                Preview ({allPhones.length})
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('setup')} className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 transition-all">
                Back
              </button>
              <button
                onClick={handleCreateAndSend}
                disabled={creating || !selectedInstance}
                className="px-4 py-2 bg-yellow-500 text-stone-950 text-xs font-bold rounded-xl hover:bg-yellow-400 disabled:opacity-30 transition-all flex items-center gap-2"
              >
                {creating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {creating ? 'Sending...' : `Send Campaign (${totalCost} tokens)`}
              </button>
            </>
          )}
          {step === 'sending' && (
            <button onClick={onClose} className="px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all mx-auto">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
