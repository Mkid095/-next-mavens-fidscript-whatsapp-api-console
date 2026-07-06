/**
 * ProviderCard — individual provider card with expandable models section.
 */
import { motion } from 'motion/react';
import { ChevronDown, Bot, Star, Globe } from 'lucide-react';
import { LLMProvider, PROVIDER_META, PROVIDER_COLORS, DEFAULT_COLORS } from './types';
import { CopyText } from './shared';
import { ProviderModelsSection } from './ProviderModelsSection';
import { ProviderActionButtons } from './ProviderActionButtons';

export function ProviderCard({
  provider, isExpanded, onToggleExpand, onEdit, onTest, onDelete,
  onSetDefault, onToggleShared, onToggleEnabled,
  testing, deleting, settingDefault, togglingShared, togglingEnabled, view,
}: {
  provider: LLMProvider;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onTest: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onToggleShared: () => void;
  onToggleEnabled: (next: boolean) => void;
  testing: boolean;
  deleting: boolean;
  settingDefault: boolean;
  togglingShared: boolean;
  togglingEnabled: boolean;
  view: 'grid' | 'list';
}) {
  const meta = PROVIDER_META[provider.provider_type];
  const color = PROVIDER_COLORS[provider.provider_type] ?? DEFAULT_COLORS;
  const isList = view === 'list';
  const iconSize = isList ? 16 : 19;
  const iconWrap = isList ? 'w-9 h-9' : 'w-11 h-11';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`group relative rounded-2xl border bg-[#1a1915] transition-all overflow-hidden ${
        isExpanded ? `${color.border} shadow-lg ${color.glow}` : 'border-[#2d2813] hover:border-[#3d3a1e] hover:shadow-md hover:shadow-black/30'
      } ${provider.enabled ? '' : 'opacity-70'}`}
    >
      <button type="button" onClick={onToggleExpand} aria-expanded={isExpanded}
        className={`w-full flex items-center ${isList ? 'gap-3 px-3 py-2.5' : 'gap-3 p-4'} text-left hover:bg-[#1b1a11] transition-colors`}
      >
        <div className={`flex items-center justify-center ${iconWrap} rounded-xl border shrink-0 ${color.bg} ${color.border}`}>
          <Bot size={iconSize} className={color.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-[#cbd3cf] text-sm truncate">{provider.name}</p>
            {provider.is_default ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 rounded-full text-[9px] font-bold uppercase tracking-wider">
                <Star size={9} fill="currentColor" /> Default
              </span>
            ) : null}
            {provider.is_shared ? (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full text-[9px] font-bold uppercase tracking-wider">
                <Globe size={9} /> Shared
              </span>
            ) : null}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
              provider.enabled ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-[#2d2813] text-[#6e684a] border-[#3d3a1e]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${provider.enabled ? 'bg-emerald-400' : 'bg-[#6e684a]'}`} />
              {provider.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <p className="text-[10px] text-[#6e684a] shrink-0">{meta?.label ?? provider.provider_type}</p>
            {provider.base_url && (
              <>
                <span className="text-[10px] text-[#3d3a1e]">·</span>
                <CopyText text={provider.base_url} className="min-w-0 flex-1" />
              </>
            )}
          </div>
        </div>

        <ProviderActionButtons
          provider={provider} onToggleEnabled={onToggleEnabled} onToggleShared={onToggleShared}
          onSetDefault={onSetDefault} onTest={onTest} onEdit={onEdit} onDelete={onDelete}
          togglingEnabled={togglingEnabled} togglingShared={togglingShared}
          settingDefault={settingDefault} testing={testing} deleting={deleting}
        />

        <div className="shrink-0 ml-1 text-[#6e684a]">
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-[#2d2813]">
            <ProviderModelsSection providerId={provider.id} providerName={provider.name} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
