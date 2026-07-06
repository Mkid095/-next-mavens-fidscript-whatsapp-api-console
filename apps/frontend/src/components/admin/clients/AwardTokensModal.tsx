import { useState, useRef } from 'react';
import { X, Coins, AlertCircle } from 'lucide-react';
import { clientsApi } from '../../../services/clients';

interface AwardTokensModalProps {
  isOpen: boolean;
  client: { id: string; name: string; email: string } | null;
  onClose: () => void;
  onAwarded: (id: string, newBalance: number) => void;
}

export default function AwardTokensModal({ isOpen, client, onClose, onAwarded }: AwardTokensModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard against double-submission from React StrictMode or state cascade
  const submittingRef = useRef(false);
  // Stable per-modal-session idempotency key: regenerated only when the modal
  // is opened for a new client, so a double-click of the Award button reuses
  // the same key and the server returns the cached result with no re-charge.
  const idempotencyKeyRef = useRef<string>('');
  if (isOpen && client && idempotencyKeyRef.current === '') {
    idempotencyKeyRef.current = `award-${client.id}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36)}`;
  }

  if (!isOpen || !client) {
    // Reset the idempotency key when the modal fully closes so the next open
    // for the same (or a different) client gets a fresh key.
    idempotencyKeyRef.current = '';
    return null;
  }

  const numAmount = parseInt(amount, 10);
  const isValid = !isNaN(numAmount) && numAmount > 0;

  const submit = async () => {
    if (!isValid || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const res = await clientsApi.awardTokens(client.id, numAmount, idempotencyKeyRef.current, note.trim() || undefined);
      if (res.success && res.data) {
        onAwarded(client.id, res.data.token_balance);
        setAmount('');
        setNote('');
        onClose();
      } else {
        setError(res.error || 'Failed to award tokens');
        submittingRef.current = false;
      }
    } catch {
      setError('Failed to award tokens');
      submittingRef.current = false;
    } finally {
      if (submittingRef.current) setSubmitting(false); // only clear if not already cleared
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-20" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-yellow-600" />
            <h3 className="text-sm font-semibold text-stone-800">Award Tokens</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>

        {/* Client info */}
        <div className="border-b border-stone-100 bg-stone-50 px-4 py-2.5">
          <p className="text-xs font-medium text-stone-800">{client.name}</p>
          <p className="text-[11px] text-stone-400">{client.email}</p>
        </div>

        {/* Form */}
        <div className="space-y-3 p-4">
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Amount</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-yellow-500"
            />
            {isValid && (
              <p className="mt-1 text-[10px] text-yellow-600 font-medium">
                {numAmount.toLocaleString()} tokens will be added
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Note <span className="normal-case font-normal text-stone-400">(optional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note for the client..."
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-4 py-3">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!isValid || submitting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-yellow-500 text-stone-900 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            <Coins size={13} />
            {submitting ? 'Awarding…' : 'Award Tokens'}
          </button>
        </div>
      </div>
    </div>
  );
}
