import { Globe } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-stone-600">
      <Globe size={32} className="mb-2 opacity-40" />
      <p className="text-sm font-medium text-stone-500">No connections yet</p>
      <p className="text-[11px] text-stone-600 mt-0.5">Add your first LLM connection to use custom models in chatbots</p>
    </div>
  );
}
