import React from 'react';
import { Plus } from 'lucide-react';
import type { Instance } from '../../../../services/api';
import { ContainerCard, EmptyContainerState } from './ContainerCard';

interface ContainerGridProps {
  instances: Instance[];
  onConnect: (inst: Instance) => void;
  onDisconnect: (inst: Instance) => void;
  onDelete: (inst: Instance) => void;
  onSettings: (inst: Instance) => void;
  onSyncGroups: (inst: Instance) => void;
  onCreateNew: () => void;
}

export function ContainerGrid({
  instances,
  onConnect,
  onDisconnect,
  onDelete,
  onSettings,
  onSyncGroups,
  onCreateNew,
}: ContainerGridProps) {
  if (instances.length === 0) {
    return <EmptyContainerState onCreate={onCreateNew} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {instances.map((inst) => (
        <ContainerCard
          key={inst.id}
          inst={inst}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onDelete={onDelete}
          onSettings={onSettings}
          onSyncGroups={onSyncGroups}
        />
      ))}
    </div>
  );
}
