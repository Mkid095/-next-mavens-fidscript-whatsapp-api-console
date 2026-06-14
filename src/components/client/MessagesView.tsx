import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Image as ImageIcon, MapPin, CheckCircle, CheckCheck,
  MoreVertical, Phone, Video, ChevronDown, X, MessageSquare,
  RefreshCw, Smile, Paperclip, SendHorizontal, Users, Clock,
  Plus, Calendar, Trash2, Play, Pause, Zap, AlertCircle, Check,
  MessageCircle, PenSquare, SlidersHorizontal, User, Mail, Tag,
  ChevronRight, ArrowLeft, Globe, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clientMessagesApi, contactsApi, instancesApi } from '../../services/api';
import type { ClientMessage, Contact, Instance } from '../../services/api';
import ContactProfilePanel from './contacts/ContactProfilePanel';
import BulkMessagingPanel from './BulkMessagingPanel';

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

type SidebarView = 'chats' | 'bulk';

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
  const [sendingError, setSendingError] = useState('');
  const [sidebarView, setSidebarView] = useState<SidebarView>('chats');
  const [showNewChatInline, setShowNewChatInline] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const connectedInstances = instances.filter(i => i.status === 'connected');
  const selectedInstanceConnected = connectedInstances.some(i => i.name === selectedInstance);

  useEffect(() => {
    if (connectedInstances.length > 0 && !selectedInstance) {
      setSelectedInstance(connectedInstances[0].name);
    }
  }, [connectedInstances, selectedInstance]);

  useEffect(() => {
    if (!clientToken) return;
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
  const selectedContactDetails = savedContacts.find(c => c.phone === selectedPhone);

  const handleSendReply = async () => {
    // Only send if a connected instance is selected
    const instanceIsConnected = connectedInstances.some(i => i.name === selectedInstance);
    if (!replyText.trim() || !selectedPhone || !selectedInstance || !instanceIsConnected || !clientToken) return;
    setSending(true);
    setSendingError('');
    try {
      const res = await instancesApi.sendText(selectedInstance, selectedPhone, replyText.trim());
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

  const handleSelectConversation = (phone: string) => {
    setSelectedPhone(phone);
    setSidebarView('chats');
    setShowContactProfile(false);
  };

  const handleOpenContactProfile = () => {
    if (selectedPhone) setShowContactProfile(true);
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

  const formatDateSeparator = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getStatusIcon = (msg: ClientMessage) => {
    if (msg.direction !== 'outgoing') return null;
    return msg.is_read
      ? <CheckCheck className="w-3 h-3 text-blue-400" />
      : <CheckCircle className="w-3 h-3 text-white/40" />;
  };

  const groupedMessages: { date: string; messages: ClientMessage[] }[] = [];
  let lastDate = '';
  conversationMessages.forEach(msg => {
    const dateKey = formatDateSeparator(msg.timestamp);
    if (dateKey !== lastDate) {
      groupedMessages.push({ date: dateKey, messages: [msg] });
      lastDate = dateKey;
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  const unreadCount = contacts.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex" style={{ height: '640px' }}>
      {/* Left sidebar */}
      <div className="w-80 border-r border-[#eaebe4] flex flex-col bg-[#fafaf5] shrink-0">
        {/* Sidebar header */}
        <div className="p-4 border-b border-[#eaebe4]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-forest-deep">Chats</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-[9px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarView('chats')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${sidebarView === 'chats' ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                title="Chats"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowNewChatInline(true)}
                className="w-7 h-7 rounded-lg bg-forest-deep text-white flex items-center justify-center hover:bg-[#33301a] transition-all"
                title="New chat"
              >
                <PenSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSidebarView('bulk')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${sidebarView === 'bulk' ? 'bg-yellow-500 text-stone-950' : 'bg-yellow-500 text-stone-950 hover:bg-yellow-400'}`}
                title="Bulk messages"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {sidebarView === 'chats' && !showNewChatInline && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Container filter chips */}
        {sidebarView === 'chats' && connectedInstances.length > 1 && (
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

        {/* Sidebar content */}
        {sidebarView === 'chats' && (
          showNewChatInline ? (
            <NewChatPanelInline
              savedContacts={savedContacts}
              clientToken={clientToken}
              onSelectContact={(phone) => {
                setSelectedPhone(phone);
                setShowNewChatInline(false);
              }}
              onContactCreated={(contact) => {
                setSavedContacts(prev => [contact, ...prev]);
                setSelectedPhone(contact.phone);
                setShowNewChatInline(false);
              }}
              onClose={() => setShowNewChatInline(false)}
            />
          ) : (
            <ChatList
              contacts={filteredContacts}
              selectedPhone={selectedPhone}
              onSelect={handleSelectConversation}
              formatTime={formatTime}
            />
          )
        )}

        {sidebarView === 'bulk' && (
          <BulkMessagingPanel
            instances={connectedInstances}
            savedContacts={savedContacts}
            clientToken={clientToken}
            onTokenDeduct={onTokenDeduct}
            onClose={() => setSidebarView('chats')}
          />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPhone ? (
          <ChatPanel
            selectedContact={selectedContact}
            selectedPhone={selectedPhone}
            selectedContactDetails={selectedContactDetails}
            conversationMessages={conversationMessages}
            groupedMessages={groupedMessages}
            selectedInstance={selectedInstance}
            selectedInstanceConnected={selectedInstanceConnected}
            connectedInstances={connectedInstances}
            showInstancePicker={showInstancePicker}
            sendingError={sendingError}
            replyText={replyText}
            sending={sending}
            textareaRef={textareaRef}
            bottomRef={bottomRef}
            onBack={() => setSelectedPhone(null)}
            onOpenContactProfile={handleOpenContactProfile}
            onToggleInstancePicker={() => setShowInstancePicker(!showInstancePicker)}
            onSelectInstance={(name) => { setSelectedInstance(name); setShowInstancePicker(false); }}
            onClearError={() => setSendingError('')}
            onReplyTextChange={setReplyText}
            onSend={handleSendReply}
            formatTime={formatTime}
            formatFullTime={formatFullTime}
            getStatusIcon={getStatusIcon}
          />
        ) : (
          <EmptyState onNewChat={() => setShowNewChatInline(true)} />
        )}
      </div>

      {/* Contact profile panel */}
      <AnimatePresence>
        {showContactProfile && selectedPhone && (
          <ContactProfilePanel
            contact={selectedContactDetails}
            phone={selectedPhone}
            onClose={() => setShowContactProfile(false)}
            messages={conversationMessages}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Sub-components ----

interface ChatListProps {
  contacts: ConversationContact[];
  selectedPhone: string | null;
  onSelect: (phone: string) => void;
  formatTime: (ts: string) => string;
}

function ChatList({ contacts, selectedPhone, onSelect, formatTime }: ChatListProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 space-y-3 bg-[#fafaf5]">
        <MessageSquare className="w-12 h-12 text-yellow-200" />
        <div className="text-center">
          <p className="font-bold text-forest-deep text-sm">No conversations yet</p>
          <p className="text-xs text-graphite mt-1">Incoming messages will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {contacts.map(contact => (
        <button
          key={contact.phone}
          onClick={() => onSelect(contact.phone)}
          className={`w-full p-3 flex items-start gap-2.5 hover:bg-stone-100 transition-all text-left border-b border-[#eaebe4]/40 ${
            selectedPhone === contact.phone ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
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
            <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {contact.unread > 9 ? '9+' : contact.unread}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface NewChatPanelInlineProps {
  savedContacts: Contact[];
  clientToken?: string;
  onSelectContact: (phone: string) => void;
  onContactCreated: (contact: Contact) => void;
  onClose: () => void;
}

function NewChatPanelInline({ savedContacts, clientToken, onSelectContact, onContactCreated, onClose }: NewChatPanelInlineProps) {
  const [tab, setTab] = useState<'contacts' | 'newnumber'>('contacts');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('+254');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = savedContacts.filter(c =>
    !contactSearch || c.phone.includes(contactSearch) || (c.name || '').toLowerCase().includes(contactSearch.toLowerCase())
  );

  const COUNTRY_CODES = [
    { code: '+1', country: 'US/CA' }, { code: '+44', country: 'UK' },
    { code: '+254', country: 'Kenya' }, { code: '+255', country: 'Tanzania' },
    { code: '+256', country: 'Uganda' }, { code: '+250', country: 'Rwanda' },
    { code: '+251', country: 'Ethiopia' }, { code: '+91', country: 'India' },
    { code: '+92', country: 'Pakistan' }, { code: '+880', country: 'Bangladesh' },
    { code: '+60', country: 'Malaysia' }, { code: '+65', country: 'Singapore' },
    { code: '+234', country: 'Nigeria' }, { code: '+233', country: 'Ghana' },
    { code: '+27', country: 'South Africa' }, { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' }, { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' }, { code: '+61', country: 'Australia' },
  ];

  const selectedCountryData = COUNTRY_CODES.find(c => c.code === selectedCountry);

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setPhoneInput(selectedCountry + digits);
  };

  const handleStartChat = async () => {
    if (!phoneInput.trim()) return;
    setLoading(true);
    try {
      const phone = phoneInput.replace(/\D/g, '');
      const isKnown = savedContacts.some(c => c.phone === phone);
      if (!isKnown) {
        const res = await contactsApi.importBatch([{ phone, name: nameInput.trim() }]);
        if (res.success && res.data?.count > 0) {
          onContactCreated({ id: `new_${Date.now()}`, phone, name: nameInput.trim() || phone, tags: '', created_at: new Date().toISOString() });
        }
      } else {
        const contact = savedContacts.find(c => c.phone === phone)!;
        onSelectContact(phone);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b border-[#eaebe4] shrink-0 items-center">
        <button
          onClick={() => setTab('contacts')}
          className={`flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2 ${tab === 'contacts' ? 'border-forest-deep text-forest-deep' : 'border-transparent text-stone-400'}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Existing
          </div>
        </button>
        <button
          onClick={() => setTab('newnumber')}
          className={`flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2 ${tab === 'newnumber' ? 'border-forest-deep text-forest-deep' : 'border-transparent text-stone-400'}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            New Number
          </div>
        </button>
        <button onClick={onClose} className="px-3 py-2 text-stone-400 hover:text-stone-600 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'contacts' && (
          savedContacts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="w-8 h-8 mx-auto text-stone-200" />
              <p className="text-xs font-bold text-forest-deep">No saved contacts</p>
              <p className="text-[10px] text-graphite">Switch to "New Number" to message anyone</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
                />
              </div>
              <div className="space-y-1">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onSelectContact(c.phone)}
                    className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-stone-50 flex items-center gap-3 transition-all border border-transparent hover:border-[#eaebe4]"
                  >
                    <div className="w-9 h-9 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(c.name || c.phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-forest-deep truncate">{c.name || c.phone}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{c.phone}</p>
                    </div>
                    {c.tags && <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 rounded-full text-stone-500 shrink-0">{c.tags}</span>}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-center text-[11px] text-stone-400 py-4">No contacts match your search</p>}
              </div>
            </>
          )
        )}

        {tab === 'newnumber' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Country</label>
              <div className="relative mt-1">
                <button
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white flex items-center justify-between"
                >
                  <span className="font-bold text-forest-deep">{selectedCountryData?.code} {selectedCountryData?.country}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>
                {showCountryPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {COUNTRY_CODES.map(c => (
                      <button
                        key={c.code}
                        onClick={() => { setSelectedCountry(c.code); setShowCountryPicker(false); setPhoneInput(''); }}
                        className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedCountry === c.code ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                      >
                        <span className="font-mono text-[10px] text-stone-400 w-10">{c.code}</span>
                        <span>{c.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
              <div className="mt-1 flex rounded-xl border border-[#eaebe4] overflow-hidden focus-within:border-yellow-500">
                <div className="px-3 py-2 bg-stone-50 text-xs font-bold text-stone-500 font-mono flex items-center border-r border-[#eaebe4] shrink-0">
                  {selectedCountry}
                </div>
                <input
                  type="tel"
                  value={phoneInput.replace(selectedCountry, '')}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none bg-white"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Name (optional)</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Display name for this contact"
                className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
              />
            </div>

            {phoneInput && (
              <div className="px-3 py-2 bg-stone-50 rounded-xl flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-mono text-forest-deep">{phoneInput}</span>
              </div>
            )}

            <button
              onClick={handleStartChat}
              disabled={!phoneInput.trim() || loading}
              className="w-full py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {loading ? 'Starting...' : 'Open Chat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatPanelProps {
  selectedContact: ConversationContact | undefined;
  selectedPhone: string;
  selectedContactDetails: Contact | undefined;
  conversationMessages: ClientMessage[];
  groupedMessages: { date: string; messages: ClientMessage[] }[];
  selectedInstance: string;
  selectedInstanceConnected: boolean;
  connectedInstances: Instance[];
  showInstancePicker: boolean;
  sendingError: string;
  replyText: string;
  sending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onOpenContactProfile: () => void;
  onToggleInstancePicker: () => void;
  onSelectInstance: (name: string) => void;
  onClearError: () => void;
  onReplyTextChange: (v: string) => void;
  onSend: () => void;
  formatTime: (ts: string) => string;
  formatFullTime: (ts: string) => string;
  getStatusIcon: (msg: ClientMessage) => React.ReactNode;
}

function ChatPanel({
  selectedContact,
  selectedPhone,
  selectedContactDetails,
  conversationMessages,
  groupedMessages,
  selectedInstance,
  selectedInstanceConnected,
  connectedInstances,
  showInstancePicker,
  sendingError,
  replyText,
  sending,
  textareaRef,
  bottomRef,
  onBack,
  onOpenContactProfile,
  onToggleInstancePicker,
  onSelectInstance,
  onClearError,
  onReplyTextChange,
  onSend,
  formatTime,
  formatFullTime,
  getStatusIcon,
}: ChatPanelProps) {
  return (
    <>
      {/* Fixed header */}
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
          <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Call">
            <Phone className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Video call">
            <Video className="w-3.5 h-3.5" />
          </button>
          <button onClick={onOpenContactProfile} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Contact info">
            <User className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="More options">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Instance selector */}
      <div className="px-4 py-2 border-b border-[#eaebe4] bg-white flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-stone-400 font-medium">Sending from:</span>
        <div className="relative">
          <button
            onClick={onToggleInstancePicker}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-forest-deep transition-all"
          >
            <SmartphoneIcon className="w-3 h-3" />
            {selectedInstance || 'All containers'}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showInstancePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 min-w-[180px]">
              <button
                onClick={() => onSelectInstance('')}
                className="w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 border-b border-[#eaebe4] font-bold text-forest-deep"
              >
                All containers
              </button>
              {connectedInstances.map(inst => (
                <button
                  key={inst.name}
                  onClick={() => onSelectInstance(inst.name)}
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

      {/* Scrollable messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#f4f4ef]">
        {groupedMessages.length > 0 ? groupedMessages.map((group, gi) => (
          <div key={gi}>
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-0.5 bg-white/80 backdrop-blur-sm rounded-full text-[9px] font-bold text-stone-500 shadow-sm border border-[#eaebe4]/50">
                {group.date}
              </span>
            </div>
            {group.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-1`}
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
            ))}
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
        <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-red-600">{sendingError}</span>
          <button onClick={onClearError}><X className="w-3 h-3 text-red-400" /></button>
        </div>
      )}

      {/* Fixed composer */}
      <div className="p-3 border-t border-[#eaebe4] bg-white shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={replyText}
              onChange={e => onReplyTextChange(e.target.value)}
              placeholder={`Message ${selectedContactDetails?.name || selectedContact?.name || selectedPhone}...`}
              className="w-full px-3 py-2 pr-10 text-xs border border-[#eaebe4] rounded-2xl focus:outline-none focus:border-yellow-500 resize-none bg-stone-50"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            />
            <button className="absolute right-2.5 bottom-2.5 w-5 h-5 text-stone-400 hover:text-stone-600 transition-all">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={!replyText.trim() || sending || !selectedInstanceConnected}
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
  );
}

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#fafaf5]">
      <div className="text-center space-y-4 max-w-xs">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-forest-deep">Welcome to Messages</h3>
          <p className="text-xs text-graphite mt-1">Select a conversation from the list or start a new chat to begin.</p>
        </div>
        <button
          onClick={onNewChat}
          className="px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all inline-flex items-center gap-2"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Start New Chat
        </button>
      </div>
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
