/**
 * SetupStep — Step 1 of the Chatbot Builder.
 *
 * Fields: Container (WhatsApp instance), Name, Description, Template, Priority, Enabled
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
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { TEMPLATE_META, type ChatbotTemplate } from '../types';
import type { Instance } from '../../../services/api';

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Headphones,
  MessageSquare,
  HelpCircle,
  Target,
  Calendar,
  ShoppingBag,
  Settings,
};

export default function SetupStep({ instances = [] }: { instances?: Instance[] }) {
  const { draft, updateGeneral, updateDraft } = useChatbotBuilderStore();
  const { general, instanceId } = draft;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-3">
          <Bot className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Set up your WhatsApp AI agent</h2>
        <p className="text-xs text-[#8f834a] mt-1">Pick a container, give it a name, and choose a template to start.</p>
      </div>

      {/* ── Container / Instance ──────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          WhatsApp Container <span className="text-yellow-400">*</span>
        </label>
        {instances.length === 0 ? (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300">No containers available</p>
              <p className="text-[10px] text-amber-400/70 mt-0.5">
                Create a WhatsApp container first in the Containers page, then come back to set up your chatbot.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a] pointer-events-none" />
              <select
                value={instanceId}
                onChange={(e) => updateDraft({ instanceId: e.target.value })}
                className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-yellow-500/50 outline-none transition appearance-none cursor-pointer"
              >
                <option value="">Select a container...</option>
                {instances.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.display_name || inst.name}
                    {inst.status === 'connected' ? ' (Connected)' : inst.status ? ` (${inst.status})` : ''}
                    {inst.phone_number ? ` — ${inst.phone_number}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-[#6e684a] mt-1.5">
              The WhatsApp number this bot will operate on. You can't change this after creating the bot.
            </p>
          </>
        )}
      </div>

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
          />
        </div>
        <p className="text-[10px] text-[#6e684a] mt-1.5">
          This name is internal only — customers won't see it.
        </p>
      </div>

      {/* ── Description ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Description <span className="text-[#5a554a] font-normal">(optional)</span>
        </label>
        <textarea
          value={general.description}
          onChange={(e) => updateGeneral({ description: e.target.value })}
          placeholder="What does this bot do? Who is it for?"
          className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none transition resize-none"
          rows={2}
          maxLength={500}
        />
      </div>

      {/* ── Template ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
          Template
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(TEMPLATE_META) as [ChatbotTemplate, typeof TEMPLATE_META[ChatbotTemplate]][]).map(([id, tpl]) => {
            const isSelected = general.template === id;
            const Icon = TEMPLATE_ICONS[tpl.icon] ?? Settings;
            return (
              <button
                key={id}
                onClick={() => updateGeneral({ template: id })}
                className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <span className={isSelected ? 'text-yellow-400' : 'text-[#6e684a]'}>
                  <Icon size={18} />
                </span>
                <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#a8a99e]'}`}>
                  {tpl.label}
                </p>
                <p className="text-[10px] text-[#6e684a] leading-tight">{tpl.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Priority + Enabled ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-[#8f834a] uppercase tracking-wider">Priority</label>
            <span className="text-yellow-400 text-sm font-bold">{general.priority}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={general.priority}
            onChange={(e) => updateGeneral({ priority: parseInt(e.target.value) })}
            className="w-full accent-yellow-400"
          />
          <p className="text-[9px] text-[#6e684a] mt-1">Higher priority wins when multiple bots match</p>
        </div>

        <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
          <label className="text-[10px] font-bold text-[#8f834a] uppercase tracking-wider mb-2 block">Status</label>
          <button
            onClick={() => updateGeneral({ enabled: !general.enabled })}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              general.enabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-stone-500/10 text-stone-400 border border-stone-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${general.enabled ? 'bg-emerald-400' : 'bg-stone-400'}`} />
            {general.enabled ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
}
