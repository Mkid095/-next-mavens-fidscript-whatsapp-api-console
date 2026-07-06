/**
 * Larger shared components: ConfirmDialog, StatMini.
 */
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

// ─── ConfirmDialog ─────────────────────────────────────────────────────────────

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.16 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-[#1a1915] border border-[#2d2813] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-2">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 ${
              danger ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <AlertCircle size={18} className={danger ? 'text-red-400' : 'text-yellow-400'} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-sm font-bold text-[#cbd3cf]">{title}</h3>
              <p className="text-xs text-[#a8a99e] mt-1.5 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#2d2813] px-5 py-3 bg-[#12110c]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-[#a8a99e] hover:text-[#cbd3cf] transition-colors">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/40'
                : 'bg-yellow-500 text-[#11110a] hover:bg-yellow-400 focus:ring-yellow-500/40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── StatMini ─────────────────────────────────────────────────────────────────

export function StatMini({
  icon,
  label,
  value,
  onClick,
  active,
  accent = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  onClick?: () => void;
  active?: boolean;
  accent?: 'default' | 'success' | 'warning' | 'info';
}) {
  const accents: Record<string, string> = {
    default: 'text-[#a8a99e] bg-[#2d2813] border-[#3d3a1e]',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    info:    'text-blue-400 bg-blue-500/10 border-blue-500/30',
  };
  const Wrapper: any = onClick ? motion.button : 'div';
  const wrapperProps = onClick ? { whileHover: { y: -1 }, whileTap: { scale: 0.98 } } : {};

  return (
    <Wrapper
      onClick={onClick}
      {...wrapperProps}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border bg-[#1a1915] transition-all ${
        active ? 'border-yellow-500/40 shadow-md shadow-yellow-500/5' : 'border-[#2d2813] hover:border-[#3d3a1e]'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`flex items-center justify-center w-9 h-9 rounded-xl border ${accents[accent]}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e684a]">{label}</span>
        <span className="text-lg font-bold text-[#cbd3cf] leading-tight">{value}</span>
      </div>
    </Wrapper>
  );
}
