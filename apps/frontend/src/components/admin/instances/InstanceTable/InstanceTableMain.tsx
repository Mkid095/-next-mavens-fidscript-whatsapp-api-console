import { Instance } from '../../../../services/api';
import { Smartphone } from 'lucide-react';
import { InstanceTableRow } from './InstanceTableRow';
import { InstanceTableMobileCard } from './InstanceTableMobileCard';

export interface InstanceTableMainProps {
  instances: Instance[];
  onQrConnect: (name: string) => void;
  onDisconnect: (name: string) => void;
  onDelete: (name: string) => void;
}

export default function InstanceTableMain({ instances, onQrConnect, onDisconnect, onDelete }: InstanceTableMainProps) {
  if (instances.length === 0) {
    return (
      <div className="text-center py-12">
        <Smartphone className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
        <p className="text-[#6a6c5d]">No instances found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop table — hidden on mobile */}
      <table className="w-full text-xs hidden md:table">
        <thead>
          <tr className="bg-[#f9f9f2] border-b border-[#eaebe4]">
            <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Instance</th>
            <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Client</th>
            <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Phone</th>
            <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Status</th>
            <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Messages</th>
            <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eaebe4]/60">
          {instances.map((inst) => (
            <tr key={inst.id} className="hover:bg-[#f9f9f2]/50 transition-colors">
              <InstanceTableRow inst={inst} onQrConnect={onQrConnect} onDisconnect={onDisconnect} onDelete={onDelete} />
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card view — hidden on desktop */}
      <div className="md:hidden space-y-3">
        {instances.map((inst) => (
          <InstanceTableMobileCard
            key={inst.id}
            inst={inst}
            onQrConnect={onQrConnect}
            onDisconnect={onDisconnect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
