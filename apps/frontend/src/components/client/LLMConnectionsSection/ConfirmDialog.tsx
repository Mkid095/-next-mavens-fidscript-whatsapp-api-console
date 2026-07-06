import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({ title, message, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-red-50">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-sm font-bold text-stone-800">{title}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stone-100 px-5 py-3 bg-stone-50/5">
          <button onClick={onClose} className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-xs font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}
