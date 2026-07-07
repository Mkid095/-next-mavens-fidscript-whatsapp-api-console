import React from 'react';
import {
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Globe,
  ExternalLink,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import type { KnowledgeSource } from '../../types';
import { SOURCE_TYPES, STATUS_CONFIG, type SourceStatus } from './sourceTypes';

interface SourceCardProps {
  source: KnowledgeSource;
  onRemove: () => void;
  onReindex: () => void;
  onToggle: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function SourceCard({
  source,
  onRemove,
  onReindex,
  onToggle,
  isExpanded,
  onToggleExpand,
}: SourceCardProps) {
  const statusCfg = STATUS_CONFIG[source.status as SourceStatus];
  const typeMeta = SOURCE_TYPES.find(t => t.value === source.type);

  const chunkBarPct = Math.min((source.chunkCount / 100) * 100, 100);

  return (
    <div className={`border rounded-xl overflow-hidden transition ${
      source.status === 'error'
        ? 'border-red-400/20 bg-red-400/5'
        : source.status === 'active'
        ? 'border-[#2d2813] bg-[#0d0c0a]'
        : 'border-[#2d2813] bg-[#0d0c0a]'
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          source.status === 'active' ? 'bg-[#1a1915] text-[#6e684a]' : 'bg-[#1a1915] opacity-60 text-[#5a554a]'
        }`}>
          {(() => { const Icon = typeMeta?.icon ?? FileText; return <Icon size={18} />; })()}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-sm font-semibold text-white text-left truncate hover:text-yellow-300 transition"
            >
              {source.name}
            </button>
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
              {source.status === 'indexing' ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Indexing
                </span>
              ) : statusCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-[#6e684a]">{typeMeta?.label}</span>
            {source.status === 'active' && source.chunkCount > 0 && (
              <>
                <span className="text-[10px] text-[#5a554a]">·</span>
                <span className="text-[10px] text-[#6e684a]">{source.chunkCount} chunks</span>
              </>
            )}
            {source.ref && (
              <>
                <span className="text-[10px] text-[#5a554a]">·</span>
                <span className="text-[10px] text-[#5a554a] truncate max-w-[160px] font-mono">{source.ref}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {source.status !== 'indexing' && (
            <button
              onClick={onReindex}
              title="Re-index source"
              className="p-1.5 text-[#6e684a] hover:text-yellow-400 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            title={source.status === 'disabled' ? 'Enable source' : 'Disable source'}
            className={`p-1.5 transition ${source.status === 'disabled' ? 'text-[#6e684a] hover:text-green-400' : 'text-[#6e684a] hover:text-red-400'}`}
          >
            {source.status === 'disabled' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onRemove}
            title="Remove source"
            className="p-1.5 text-[#6e684a] hover:text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#2d2813] pt-3 space-y-3">
          {/* Error message */}
          {source.status === 'error' && source.errorMessage && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{source.errorMessage}</span>
            </div>
          )}

          {/* Chunk health bar */}
          {source.status === 'active' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#6e684a]">Index coverage</span>
                <span className="text-white font-mono">{source.chunkCount} chunks</span>
              </div>
              <div className="h-1.5 bg-[#2d2813] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    source.chunkCount >= 60
                      ? 'bg-green-400'
                      : source.chunkCount >= 20
                      ? 'bg-yellow-400'
                      : 'bg-orange-400'
                  }`}
                  style={{ width: `${chunkBarPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-[#6e684a]">
              <Clock className="w-3 h-3" />
              <span>Added {new Date(source.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#6e684a]">
              <RefreshCw className="w-3 h-3" />
              <span>Updated {new Date(source.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content preview (for text/faq/json) */}
          {source.content && (
            <div className="space-y-1">
              <p className="text-[10px] text-[#6e684a] uppercase tracking-wide">Content preview</p>
              <p className="text-xs text-[#a8a99e] font-mono bg-[#1a1915] p-2 rounded-lg max-h-20 overflow-hidden leading-relaxed">
                {source.content.slice(0, 300)}{source.content.length > 300 ? '…' : ''}
              </p>
            </div>
          )}

          {/* Ref URL */}
          {source.ref && (source.type === 'url' || source.type === 'api') && (
            <div className="flex items-center gap-1.5">
              {source.type === 'url' ? (
                <Globe className="w-3 h-3 text-[#6e684a] shrink-0" />
              ) : (
                <Database className="w-3 h-3 text-[#6e684a] shrink-0" />
              )}
              <a
                href={source.ref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-400 hover:text-yellow-300 truncate font-mono"
              >
                {source.ref}
              </a>
              <ExternalLink className="w-3 h-3 text-[#6e684a] shrink-0" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
