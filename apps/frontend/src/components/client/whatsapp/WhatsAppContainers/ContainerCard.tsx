import React from 'react';
import { Smartphone } from 'lucide-react';
import type { Instance } from '../../../../services/api';
import InstanceCard from '../InstanceCard';

interface ContainerCardProps {
  inst: Instance;
  onConnect: (inst: Instance) => void;
  onDisconnect: (inst: Instance) => void;
  onDelete: (inst: Instance) => void;
  onSettings: (inst: Instance) => void;
  onSyncGroups: (inst: Instance) => void;
}

export function ContainerCard(props: ContainerCardProps) {
  return <InstanceCard {...props} />;
}

export function EmptyContainerState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-12 text-center space-y-3">
      <Smartphone className="w-12 h-12 text-yellow-500 mx-auto" />
      <p className="font-bold text-[#a8a99e]">No containers provisioned yet.</p>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl transition-all"
      >
        Create your first container
      </button>
    </div>
  );
}
