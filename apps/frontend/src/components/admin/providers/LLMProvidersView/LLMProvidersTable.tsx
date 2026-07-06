/**
 * LLMProvidersTable — provider list table with all per-row actions.
 */
import {
  Pencil, Trash2, TestTube, Star, StarOff,
  ChevronDown, ChevronUp, Bot, Loader2,
} from 'lucide-react';
import { LLMProvider, PROVIDER_META } from './types';

interface Props {
  providers: LLMProvider[];
  sortAsc: boolean;
  testingId: string | null;
  deletingId: string | null;
  setDefaultId: string | null;
  onSort: () => void;
  onEdit: (p: LLMProvider) => void;
  onTest: (p: LLMProvider) => void;
  onSetDefault: (p: LLMProvider) => void;
  onDelete: (p: LLMProvider) => void;
}

export function LLMProvidersTable({
  providers,
  sortAsc,
  testingId,
  deletingId,
  setDefaultId,
  onSort,
  onEdit,
  onTest,
  onSetDefault,
  onDelete,
}: Props) {
  const sorted = [...providers].sort((a, b) => {
    const av = a.name.toLowerCase();
    const bv = b.name.toLowerCase();
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <Bot size={32} className="mb-2 opacity-30" />
        <p className="text-sm font-medium">No providers configured</p>
        <p className="text-[11px]">Add your first LLM provider above</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50">
            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Provider
            </th>
            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">
              Base URL
            </th>
            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">
              Auth
            </th>
            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Tier
            </th>
            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Default
            </th>
            <th className="text-center px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-right px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sorted.map((p) => {
            const meta = PROVIDER_META[p.provider_type];
            return (
              <tr
                key={p.id}
                className="hover:bg-stone-50/60 transition-colors"
              >
                {/* Provider */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-stone-400" />
                    <div>
                      <p className="font-semibold text-stone-800">{p.name}</p>
                      <p className="text-[10px] text-stone-400">
                        {meta?.label ?? p.provider_type}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Base URL */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <p
                    className="text-[10px] font-mono text-stone-500 truncate max-w-[180px]"
                    title={p.base_url}
                  >
                    {p.base_url || '—'}
                  </p>
                </td>

                {/* Auth */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-[10px] text-stone-500 uppercase">
                    {p.auth_type}
                  </span>
                </td>

                {/* Tier */}
                <td className="px-4 py-3 text-center">
                  {p.is_free_tier ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-[10px] font-medium">
                      Paid
                    </span>
                  )}
                </td>

                {/* Default */}
                <td className="px-4 py-3 text-center">
                  {p.is_default ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 rounded-full">
                      <Star size={11} className="text-yellow-600" />
                    </span>
                  ) : (
                    <button
                      onClick={() => onSetDefault(p)}
                      disabled={setDefaultId === p.id}
                      className="inline-flex items-center justify-center w-5 h-5 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-40"
                      title="Set as default"
                    >
                      <StarOff size={11} className="text-stone-300" />
                    </button>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.enabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {p.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onTest(p)}
                      disabled={testingId === p.id}
                      className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Test connection"
                    >
                      {testingId === p.id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <TestTube size={11} />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={11} />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      disabled={deletingId === p.id}
                      className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
