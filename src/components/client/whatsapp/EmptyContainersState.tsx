import React from 'react';
import { Smartphone, Plus } from 'lucide-react';

interface EmptyContainersStateProps {
  onCreateClick: () => void;
}

export default function EmptyContainersState({ onCreateClick }: EmptyContainersStateProps) {
  return (
    <div className="py-12 text-center text-graphite space-y-3">
      <Smartphone className="w-12 h-12 text-yellow-300 mx-auto" />
      <p className="font-bold text-forest-deep">No containers provisioned yet.</p>
      <button onClick={onCreateClick} className="px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl">
        Create your first container
      </button>
    </div>
  );
}
