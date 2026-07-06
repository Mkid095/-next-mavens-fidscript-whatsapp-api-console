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

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':  return <CheckCircle className="w-3.5 h-3.5" />;
    case 'connecting': return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
    case 'error':      return <AlertTriangle className="w-3.5 h-3.5" />;
    default:           return <Radio className="w-3.5 h-3.5" />;
  }
}

export interface InstanceTableMobileCardProps {
  inst: Instance;
  onQrConnect: (name: string) => void;
  onDisconnect: (name: string) => void;
  onDelete: (name: string) => void;
}

export function InstanceTableMobileCard({ inst, onQrConnect, onDisconnect, onDelete }: InstanceTableMobileCardProps) {
  return (
    <div className="bg-white border border-[#eaebe4] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="font-bold text-[#272c30]">{inst.display_name || inst.name}</p>
            <p className="text-[9px] text-[#7d8071] font-mono">{inst.name}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(inst.status)}`}>
          {getStatusIcon(inst.status)}
          {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[9px] text-[#7d8071] uppercase tracking-wider">Client</p>
          <p className="font-medium text-[#525345]">{inst.client_name || '—'}</p>
        </div>
        <div>
          <p className="text-[9px] text-[#7d8071] uppercase tracking-wider">Phone</p>
          <p className="font-mono text-[#525345]">{inst.phone_number || '—'}</p>
        </div>
        <div>
          <p className="text-[9px] text-[#7d8071] uppercase tracking-wider">Messages</p>
          <p className="font-bold text-[#272c30]">{inst.total_messages.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-[#eaebe4]/50">
        {inst.status === 'disconnected' && (
          <button
            onClick={() => onQrConnect(inst.name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors text-xs font-semibold"
          >
            <QrCode className="w-4 h-4" /> Connect
          </button>
        )}
        {inst.status === 'connected' && (
          <button
            onClick={() => onDisconnect(inst.name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors text-xs font-semibold"
          >
            <Unlink className="w-4 h-4" /> Disconnect
          </button>
        )}
        <button
          onClick={() => onDelete(inst.name)}
          className="flex items-center justify-center p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
