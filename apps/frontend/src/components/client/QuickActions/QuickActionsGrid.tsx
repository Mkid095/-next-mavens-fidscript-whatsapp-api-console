import { useNavigate } from 'react-router-dom';
import {
  CreditCard, MessageSquare, Megaphone, Send, Bot, Zap, Users, FileText, Settings,
} from 'lucide-react';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  path: string;
  accent?: boolean;
}

const mainActions: QuickAction[] = [
  { icon: <CreditCard size={18} />, label: 'Buy Tokens', sublabel: 'Top up your balance', path: '/client/token-store', accent: true },
  { icon: <MessageSquare size={18} />, label: 'Add Container', sublabel: 'Connect WhatsApp', path: '/client/whatsapp' },
  { icon: <Megaphone size={18} />, label: 'Create Campaign', sublabel: 'Bulk send messages', path: '/client/campaigns' },
  { icon: <Send size={18} />, label: 'Send Message', sublabel: 'Individual or group', path: '/client/messages' },
  { icon: <Bot size={18} />, label: 'Create Chatbot', sublabel: 'AI-powered replies', path: '/client/chatbots/new' },
  { icon: <Zap size={18} />, label: 'API Sandbox', sublabel: 'Test endpoints live', path: '/client/sandbox' },
];

const secondaryActions: QuickAction[] = [
  { icon: <Users size={18} />, label: 'Manage Contacts', sublabel: 'Import or export', path: '/client/contacts' },
  { icon: <FileText size={18} />, label: 'Documentation', sublabel: 'API reference & guides', path: '/client/docs' },
  { icon: <Settings size={18} />, label: 'Settings', sublabel: 'Account & preferences', path: '/client/settings' },
];

function ActionCard({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4 text-left group hover:border-[#eab308]/30 hover:bg-[#1a1915] transition-all duration-200 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        action.accent ? 'bg-[#eab308]/10 text-[#eab308]' : 'bg-[#2d2813] text-[#a8a99e] group-hover:text-[#eab308]'
      }`}>
        {action.icon}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-white group-hover:text-[#eab308] transition-colors">{action.label}</p>
        <p className="text-[10px] text-[#6e684a] mt-0.5">{action.sublabel}</p>
      </div>
    </button>
  );
}

export function QuickActionsGrid() {
  const navigate = useNavigate();
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {mainActions.map((action) => (
          <ActionCard key={action.label} action={action} onClick={() => navigate(action.path)} />
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {secondaryActions.map((action) => (
          <button key={action.label} onClick={() => navigate(action.path)}
            className="shrink-0 flex items-center gap-2 bg-[#1a1915] border border-[#2d2813] rounded-xl px-3 py-2 hover:border-[#eab308]/30 transition-all group">
            <span className="w-7 h-7 rounded-lg bg-[#2d2813] flex items-center justify-center text-[#6e684a] group-hover:text-[#eab308] transition-colors">
              {action.icon}
            </span>
            <div>
              <p className="text-[11px] font-semibold text-[#a8a99e] group-hover:text-white transition-colors whitespace-nowrap">{action.label}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
