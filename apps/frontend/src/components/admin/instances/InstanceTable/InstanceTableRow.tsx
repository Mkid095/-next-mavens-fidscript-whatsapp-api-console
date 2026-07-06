import React from 'react';
import {
  Smartphone,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Radio,
  QrCode,
  Trash2,
  Unlink,
} from 'lucide-react';
import { Instance } from '../../../../services/api';

function getStatusColor(status: string): string {
  switch (status) {
    case 'connected':    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'connecting':  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'disconnected':return 'bg-stone-100 text-stone-500 border-stone-200';
    case 'error':       return 'bg-red-100 text-red-700 border-red-200';
    default:            return 'bg-stone-100 text-stone-500 border-stone-200';
  }
}

function getStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'connected':  return <CheckCircle className="w-3.5 h-3.5" />;
    case 'connecting': return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
    case 'error':      return <AlertTriangle className="w-3.5 h-3.5" />;
    default:           return <Radio className="w-3.5 h-3.5" />;
  }
}

export interface InstanceTableRowProps {
  inst: Instance;
  onQrConnect: (name: string) => void;
  onDisconnect: (name: string) => void;
  onDelete: (name: string) => void;
}

export function InstanceTableRow({ inst, onQrConnect, onDisconnect, onDelete }: InstanceTableRowProps) {
  return (
    <>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="font-bold text-[#272c30]">{inst.display_name || inst.name}</p>
            <p className="text-[9px] text-[#7d8071] font-mono">{inst.name}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-[#525345]">{inst.client_name || '—'}</span>
      </td>
      <td className="px-5 py-4">
        <span className="font-mono text-[#525345]">{inst.phone_number || '—'}</span>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(inst.status)}`}>
          {getStatusIcon(inst.status)}
          {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
        </span>
      </td>
      <td className="px-5 py-4">
        <div>
          <p className="font-bold text-[#272c30]">{inst.total_messages.toLocaleString()}</p>
          <p className="text-[9px] text-[#7d8071]">total</p>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {inst.status === 'disconnected' && (
            <button
              onClick={() => onQrConnect(inst.name)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Connect via QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}
          {inst.status === 'connected' && (
            <button
              onClick={() => onDisconnect(inst.name)}
              className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
              title="Disconnect"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(inst.name)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Delete instance"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </>
  );
}
