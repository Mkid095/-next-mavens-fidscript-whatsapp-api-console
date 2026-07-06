/**
 * ProviderList — renders the filtered provider cards list.
 */
import { AnimatePresence } from 'motion/react';
import { ViewMode } from './types';
import { ProviderCard } from './ProviderCard';

interface Provider {
  id: string; name: string; provider_type: string; base_url: string; enabled: number;
  is_default: number; is_shared: number; api_key_last4: string;
}

interface Props {
  providers: Provider[];
  expandedId: string | null;
  view: ViewMode;
  testingId: string | null;
  deletingId: string | null;
  setDefaultId: string | null;
  togglingSharedId: string | null;
  togglingEnabledId: string | null;
  onToggleExpand: (id: string) => void;
  onEdit: (p: Provider) => void;
  onTest: (p: Provider) => void;
  onDelete: (p: Provider) => void;
  onSetDefault: (p: Provider) => void;
  onToggleShared: (p: Provider) => void;
  onToggleEnabled: (p: Provider, next: boolean) => void;
}

export function ProviderList({
  providers, expandedId, view,
  testingId, deletingId, setDefaultId, togglingSharedId, togglingEnabledId,
  onToggleExpand, onEdit, onTest, onDelete, onSetDefault, onToggleShared, onToggleEnabled,
}: Props) {
  return (
    <div className={view === 'grid' ? 'space-y-3' : 'space-y-1.5'}>
      <AnimatePresence>
        {providers.map((p) => (
          <ProviderCard key={p.id} provider={p as any} isExpanded={expandedId === p.id}
            onToggleExpand={() => onToggleExpand(p.id)}
            onEdit={() => onEdit(p as any)} onTest={() => onTest(p as any)} onDelete={() => onDelete(p as any)}
            onSetDefault={() => onSetDefault(p as any)} onToggleShared={() => onToggleShared(p as any)}
            onToggleEnabled={(next) => onToggleEnabled(p as any, next)}
            testing={testingId === p.id} deleting={deletingId === p.id} settingDefault={setDefaultId === p.id}
            togglingShared={togglingSharedId === p.id} togglingEnabled={togglingEnabledId === p.id} view={view}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
