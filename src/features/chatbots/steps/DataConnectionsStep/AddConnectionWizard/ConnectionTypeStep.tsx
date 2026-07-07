/**
 * ConnectionTypeStep — Step 1: select which type of connection to add.
 */
import React from 'react';
import type { ElementType } from 'react';
import type { DbType } from '../../../types';
import { ModalShell } from './AddConnectionWizardMain';

const CONNECTION_TYPES: {
  value: DbType;
  label: string;
  icon: ElementType;
  description: string;
}[] = [
  { value: 'postgresql', label: 'PostgreSQL', icon: Database, description: 'Connect to a PostgreSQL database' },
  { value: 'mysql', label: 'MySQL', icon: Store, description: 'Connect to a MySQL database' },
  { value: 'rest-api', label: 'REST API', icon: Link, description: 'Connect to any REST API endpoint' },
  { value: 'shopify', label: 'Shopify', icon: ShoppingCart, description: 'Connect your Shopify store via API' },
  { value: 'woocommerce', label: 'WooCommerce', icon: Store, description: 'Connect your WooCommerce store' },
  { value: 'custom', label: 'Custom', icon: Settings, description: 'Define a custom connection handler' },
];

// ─── Icons need to be imported at the top level of the module that uses them ──
import {
  Database,
  Store,
  Link,
  ShoppingCart,
  Settings,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSelect: (type: DbType) => void;
}

export function ConnectionTypeStep({ onClose, onSelect }: Props) {
  return (
    <ModalShell onClose={onClose} title="Add Connection" step={0} totalSteps={4}>
      <div className="grid grid-cols-2 gap-3">
        {CONNECTION_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className="flex items-start gap-3 p-4 bg-[#0d0c0a] border border-[#2d2813] hover:border-yellow-500/30 rounded-xl text-left transition group"
          >
            <span className="text-2xl shrink-0">
              {(() => {
                const Icon = t.icon;
                return <Icon size={20} />;
              })()}
            </span>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-yellow-300">
                {t.label}
              </p>
              <p className="text-[10px] text-[#6e684a] mt-0.5 leading-snug">
                {t.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
