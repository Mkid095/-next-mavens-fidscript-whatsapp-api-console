/**
 * GeneralStep — Step 1 of the Chatbot Builder.
 *
 * Fields: Name, Description, Template (cards), Priority, Enabled
 */
import React from 'react';
import {
  Bot,
  Headphones,
  MessageSquare,
  HelpCircle,
  Target,
  Calendar,
  ShoppingBag,
  Settings,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { TEMPLATE_META, type ChatbotTemplate } from '../types';

// Icon lookup — maps template icon name to Lucide component
const TEMPLATE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Headphones,
  MessageSquare,
  HelpCircle,
  Target,
  Calendar,
  ShoppingBag,
  Settings,
};

export default function GeneralStep() {
  const { draft, updateGeneral } = useChatbotBuilderStore();
  const { general } = draft;

  return (
    <div className="space-y-8">
      {/* ── Name ───────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Chatbot Name <span className="text-yellow-400">*</span>
        </label>
        <div className="relative">
          <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a] pointer-events-none" />
          <input
            type="text"
            value={general.name}
            onChange={(e) => updateGeneral({ name: e.target.value })}
            placeholder="e.g. Sales Assistant, FAQ Bot, Support Bot"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none transition"
            maxLength={64}
            autoFocus
          />
        </div>
        <p className="text-[10px] text-[#6e684a] mt-1.5">
          This name is internal only — customers won't see it.
        </p>
      </div>

      {/* ── Description ───────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Description
        </label>
        <textarea
          value={general.description}
          onChange={(e) => updateGeneral({ description: e.target.value })}
          placeholder="What does this chatbot do? Who is it for?"
          rows={3}
          className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none transition resize-none"
          maxLength={500}
        />
        <p className="text-[10px] text-[#6e684a] mt-1.5">
          Optional — helps your team understand this bot's purpose.
        </p>
      </div>

      {/* ── Template ──────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-3">
          Start from a Template
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(TEMPLATE_META) as ChatbotTemplate[]).map((key) => {
            const meta = TEMPLATE_META[key];
            const isSelected = general.template === key;
            return (
              <button
                key={key}
                onClick={() => updateGeneral({ template: key })}
                className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <span className={isSelected ? 'text-yellow-400' : 'text-[#6e684a]'}>
                  {(() => {
                    const Icon = TEMPLATE_ICONS[meta.icon];
                    return Icon ? <Icon size={18} /> : <Bot size={18} />;
                  })()}
                </span>
                <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>
                  {meta.label}
                </p>
                <p className={`text-[10px] leading-tight ${isSelected ? 'text-[#8f834a]' : 'text-[#6e684a]'}`}>
                  {meta.description}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Priority ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Priority
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={general.priority}
            onChange={(e) => updateGeneral({ priority: Number(e.target.value) })}
            className="w-full accent-yellow-400"
          />
          <div className="flex justify-between text-[10px] text-[#6e684a]">
            <span>Low (0)</span>
            <span className="text-yellow-400 font-mono font-bold">{general.priority}</span>
            <span>High (100)</span>
          </div>
          <p className="text-[10px] text-[#6e684a]">
            When multiple bots match a conversation, higher priority bots handle it first.
          </p>
        </div>
      </div>

      {/* ── Enable / Disable ───────────────────────────────────────────── */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              {general.enabled ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Active
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#3d3823]" />
                  Disabled
                </>
              )}
            </p>
            <p className="text-[10px] text-[#6e684a] mt-0.5">
              {general.enabled ? 'Bot will respond to matching conversations.' : 'Bot is paused and will not respond.'}
            </p>
          </div>
          <button
            onClick={() => updateGeneral({ enabled: !general.enabled })}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              general.enabled ? 'bg-yellow-400' : 'bg-[#2d2813]'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                general.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
