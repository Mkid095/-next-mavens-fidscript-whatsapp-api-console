import React from 'react';
import {
  CheckCircle,
  XCircle,
  Globe,
  Smartphone,
  Monitor,
  Shield,
  Key,
  Clock,
} from 'lucide-react';
import type { AuditEvent } from '../../../../services/admin';

function parseUserAgent(ua: string | null): { icon: React.ReactNode; label: string } {
  if (!ua) return { icon: <Globe className="w-3 h-3" />, label: 'Unknown device' };
  const lower = ua.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone'))
    return { icon: <Smartphone className="w-3 h-3" />, label: 'Mobile' };
  if (lower.includes('tablet') || lower.includes('ipad'))
    return { icon: <Smartphone className="w-3 h-3" />, label: 'Tablet' };
  return { icon: <Monitor className="w-3 h-3" />, label: 'Desktop' };
}

function actorLabel(event: AuditEvent): string {
  if (!event.actorId) return 'System';
  if (event.actorType === 'api_key') return `API Key`;
  if (event.actorType === 'system') return 'System';
  const email = (event.metadata as Record<string, unknown>)?.email as string | undefined;
  return email || event.actorId.slice(0, 8);
}

function StatusBadge({ eventType }: { eventType: string }) {
  const failed = eventType.includes('failed') || eventType.includes('error');
  return failed ? (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> Success
    </span>
  );
}

function ActorChip({ event }: { event: AuditEvent }) {
  const isSystem = !event.actorId || event.actorType === 'system';
  const isApiKey = event.actorType === 'api_key';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
        isSystem ? 'bg-stone-100 text-stone-500' : isApiKey ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'
      }`}>
        {isSystem ? <Shield className="w-3 h-3" /> : isApiKey ? <Key className="w-3 h-3" /> : <span className="text-[8px] font-bold uppercase">{actorLabel(event).slice(0, 1)}</span>}
      </div>
      <span className="text-[10px] font-semibold text-stone-700 truncate max-w-[120px]" title={actorLabel(event)}>
        {actorLabel(event)}
      </span>
    </div>
  );
}

interface AuditRowProps {
  event: AuditEvent;
}

export default function AuditRow({ event }: AuditRowProps) {
  const device = parseUserAgent(event.userAgent);
  const failed = event.type.includes('failed') || event.type.includes('error');

  return (
    <div className={`flex items-start gap-4 px-4 py-3 hover:bg-stone-50/60 transition-colors border-b border-stone-100 ${
      failed ? 'bg-rose-50/20' : ''
    }`}>
      {/* Status */}
      <div className="shrink-0 mt-0.5">
        {failed
          ? <XCircle className="w-4 h-4 text-rose-500" />
          : <CheckCircle className="w-4 h-4 text-emerald-500" />
        }
      </div>

      {/* Actor */}
      <div className="w-36 shrink-0">
        <ActorChip event={event} />
        <div className="text-[8px] text-stone-400 mt-0.5 capitalize">{event.actorType || 'unknown'}</div>
      </div>

      {/* Action / Event type */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-semibold text-emerald-800 leading-tight">
          {event.type}
        </div>
        {event.resourceType && (
          <div className="text-[9px] text-stone-400 mt-0.5">
            {event.resourceType}
            {event.resourceId && <span className="font-mono"> / {event.resourceId.slice(0, 8)}…</span>}
          </div>
        )}
      </div>

      {/* IP */}
      <div className="w-28 shrink-0">
        {event.ipAddress ? (
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="text-[9px] font-mono text-stone-600">{event.ipAddress}</span>
          </div>
        ) : (
          <span className="text-[9px] text-stone-300">-</span>
        )}
      </div>

      {/* Device */}
      <div className="w-20 shrink-0">
        <div className="flex items-center gap-1 text-[9px] text-stone-500" title={event.userAgent || ''}>
          {device.icon}
          <span className="truncate">{device.label}</span>
        </div>
      </div>

      {/* Time */}
      <div className="w-36 shrink-0 text-right">
        <div className="flex items-center justify-end gap-1 text-[9px] text-stone-400">
          <Clock className="w-3 h-3" />
          <span>{new Date(event.timestamp).toLocaleString()}</span>
        </div>
        <div className="text-[8px] text-stone-300 mt-0.5">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Status badge */}
      <div className="w-20 shrink-0 flex justify-end">
        <StatusBadge eventType={event.type} />
      </div>
    </div>
  );
}
