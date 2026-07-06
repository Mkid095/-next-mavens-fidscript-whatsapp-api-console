/**
 * DataConnectionItem — individual connection row with status, actions.
 */
import React from 'react';
import {
  Database,
  Plug,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingCart,
  Server,
  Store,
  Settings,
  Link,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { DataConnection, DbType } from '../../types';

const TYPE_ICONS: Record<string, ElementType> = {
  postgresql: Database,
  mysql: Server,
  'rest-api': Link,
  shopify: ShoppingCart,
  woocommerce: Store,
  custom: Settings,
};

export function DataConnectionItem({
  conn,
  onRemove,
  onTest,
}: {
  conn: DataConnection;
  onRemove: () => void;
  onTest: () => void;
}) {
  const statusIcon = {
    connected: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-400" />,
    disconnected: <span className="w-3.5 h-3.5 rounded-full bg-[#3d3823] inline-block" />,
  };

  const typeLabel: Record<string, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    'rest-api': 'REST API',
    shopify: 'Shopify',
    woocommerce: 'WooCommerce',
    custom: 'Custom',
  };

  const config = conn.config ?? {};

  return (
    <div className="flex items-start gap-3 p-4 bg-[#0d0c0a] border border-[#2d2813] rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-[#1a1915] flex items-center justify-center text-base shrink-0">
        {(() => {
          const Icon = TYPE_ICONS[conn.type] ?? Plug;
          return <Icon size={18} className="text-[#6e684a]" />;
        })()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{conn.name}</p>
          {statusIcon[conn.status]}
        </div>
        <p className="text-[10px] text-[#6e684a] mt-0.5 truncate">
          {typeLabel[conn.type] ?? conn.type}
          {conn.tables && conn.tables.length > 0 && ` · ${conn.tables.length} tables exposed`}
        </p>
        {/* Connection details */}
        {conn.type === 'postgresql' || conn.type === 'mysql' ? (
          <p className="text-[9px] text-[#5a554a] font-mono mt-0.5 truncate">
            {config.username}@{config.host}:{config.port}/{config.database}
          </p>
        ) : conn.type === 'rest-api' ? (
          <p className="text-[9px] text-[#5a554a] font-mono mt-0.5 truncate">{config.baseUrl}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onTest}
          title="Re-test connection"
          className="p-1.5 text-[#6e684a] hover:text-yellow-400 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          title="Remove connection"
          className="p-1.5 text-[#6e684a] hover:text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
