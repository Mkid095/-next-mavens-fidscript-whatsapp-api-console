// Inbox shared helpers — time formatting + status/priority/AI styling.
// Centralized so list/header/drawer render consistently.

import type { ConversationPriority } from '../../data';

export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface PriorityStyle { dot: string; text: string; label: string; }

export function priorityStyle(priority: ConversationPriority | null | undefined): PriorityStyle {
  switch (priority) {
    case 'urgent': return { dot: 'bg-red-500', text: 'text-red-600', label: 'Urgent' };
    case 'high': return { dot: 'bg-orange-500', text: 'text-orange-600', label: 'High' };
    case 'medium': return { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Medium' };
    case 'low': return { dot: 'bg-stone-300', text: 'text-stone-500', label: 'Low' };
    default: return { dot: 'bg-stone-300', text: 'text-stone-500', label: '—' };
  }
}

export interface AiStateMeta { label: string; badge: string; }

export function aiStateMeta(state: string | null | undefined): AiStateMeta {
  switch (state) {
    case 'ai_active': return { label: 'AI active', badge: 'bg-forest-deep text-white' };
    case 'ai_paused': return { label: 'AI paused', badge: 'bg-stone-200 text-stone-600' };
    case 'escalated': return { label: 'Escalated', badge: 'bg-red-100 text-red-700' };
    case 'human_active':
    default: return { label: 'Human', badge: 'bg-stone-100 text-stone-600' };
  }
}

// Timeline event type → (icon key, human label)
export function timelineEntryLabel(type: string): { label: string; tone: string } {
  if (type.startsWith('message.')) return { label: 'Message', tone: 'text-stone-600' };
  if (type.startsWith('conversation.created')) return { label: 'Conversation started', tone: 'text-forest-deep' };
  if (type.startsWith('conversation.')) return { label: 'Conversation updated', tone: 'text-stone-600' };
  if (type.startsWith('customer.')) return { label: 'Customer', tone: 'text-forest-deep' };
  if (type.startsWith('ai.')) return { label: 'AI activity', tone: 'text-amber-600' };
  if (type.startsWith('order.')) return { label: 'Order', tone: 'text-yellow-600' };
  if (type.startsWith('integration.')) return { label: 'Integration', tone: 'text-stone-500' };
  return { label: type, tone: 'text-stone-500' };
}
