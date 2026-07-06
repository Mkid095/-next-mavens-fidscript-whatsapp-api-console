import { Inbox, MessageSquare, Image, Mic, FileText, Send, Bot, Brain, Database, MemoryStick } from 'lucide-react';

const whatsappCosts = [
  { action: 'Text message', cost: '1 token', icon: MessageSquare },
  { action: 'Image / Video / Document', cost: '2 tokens', icon: Image },
  { action: 'Audio / Voice', cost: '2 tokens', icon: Mic },
  { action: 'Sticker', cost: '2 tokens', icon: FileText },
  { action: 'Send Status (story)', cost: '2 tokens', icon: Send },
  { action: 'Location / Contact card', cost: '1 token', icon: Send },
  { action: 'Reaction / Poll / List', cost: '1 token', icon: Send },
];

const aiCosts = [
  { action: 'AI reply generated', cost: '10 units', icon: Brain },
  { action: 'Dataset / knowledge search', cost: '2 units', icon: Database },
  { action: 'Tool call', cost: '2 units', icon: Bot },
  { action: 'Knowledge search', cost: '1 unit', icon: Database },
  { action: 'Memory save / retrieval', cost: '1 unit', icon: MemoryStick },
];

const plans = [
  { name: 'Starter', limit: '5,000' },
  { name: 'Growth', limit: '50,000' },
  { name: 'Business', limit: '250,000' },
  { name: 'Enterprise', limit: '10,000,000' },
];

export default function TokenCosts() {
  return (
    <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Inbox className="w-4 h-4 text-[#eab308]" />
          Token Cost Guide
        </h3>
        <span className="text-[10px] text-[#6e684a]">Complete breakdown</span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-5">
        {/* WhatsApp column */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#6e684a] mb-2">WhatsApp Messages</p>
          <div className="space-y-0.5">
            {whatsappCosts.map((item) => (
              <div key={item.action} className="flex items-center justify-between py-1.5 border-b border-[#2d2813] last:border-0">
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-3 h-3 text-[#6e684a]" />
                  <span className="text-[10px] text-[#a8a99e]">{item.action}</span>
                </div>
                <span className="text-[10px] font-bold text-[#eab308] font-mono shrink-0 ml-2">{item.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chatbot column */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#6e684a] mb-2">AI Chatbot Units</p>
          <div className="space-y-0.5">
            {aiCosts.map((item) => (
              <div key={item.action} className="flex items-center justify-between py-1.5 border-b border-[#2d2813] last:border-0">
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-3 h-3 text-[#6e684a]" />
                  <span className="text-[10px] text-[#a8a99e]">{item.action}</span>
                </div>
                <span className="text-[10px] font-bold text-[#eab308] font-mono shrink-0 ml-2">{item.cost}</span>
              </div>
            ))}
          </div>

          {/* Workspace plans */}
          <div className="mt-3 pt-3 border-t border-[#3d3a1e]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#6e684a] mb-2">Workspace Plans (30d)</p>
            <div className="space-y-1">
              {plans.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#a8a99e]">{plan.name}</span>
                  <span className="text-[10px] font-mono text-white">{plan.limit} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#2d2813] flex items-center justify-between">
        <p className="text-[10px] text-[#6e684a]">
          Token purchase: <span className="text-white font-semibold">KSh 0.11 / token</span>
        </p>
        <p className="text-[10px] text-[#6e684a]">
          Free: groups, contacts, media upload
        </p>
      </div>
    </div>
  );
}
