import { Plus, Trash2 } from 'lucide-react';
import { EMOJIS } from '../../sandboxHelpers.js';

export function StatusTypeField({
  fieldKey, bodyValues, onBodyValuesChange, enumVals,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  enumVals: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {enumVals.map(opt => (
        <button
          key={opt}
          onClick={() => onBodyValuesChange({ ...bodyValues, [fieldKey]: opt })}
          className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-colors ${
            bodyValues[fieldKey] === opt
              ? 'bg-forest-deep text-white border-forest-deep'
              : 'border-[#eaebe4] text-stone-600 hover:border-yellow-300'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

export function PollOptionsField({
  pollOptions, onPollOptionsChange,
}: {
  pollOptions: string[];
  onPollOptionsChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {pollOptions.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text" value={opt}
            onChange={e => { const u = [...pollOptions]; u[i] = e.target.value; onPollOptionsChange(u); }}
            placeholder={`Option ${i + 1}`}
            className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
          />
          {pollOptions.length > 2 && (
            <button onClick={() => onPollOptionsChange(pollOptions.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button onClick={() => onPollOptionsChange([...pollOptions, ''])} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800">
        <Plus className="w-3 h-3" /> Add option
      </button>
    </div>
  );
}

export function EmojiField({
  fieldKey, bodyValues, onBodyValuesChange,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map(e => (
          <button
            key={e}
            onClick={() => onBodyValuesChange({ ...bodyValues, [fieldKey]: e })}
            className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${
              bodyValues[fieldKey] === e ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-stone-100 hover:bg-yellow-50'
            }`}
          >{e}</button>
        ))}
      </div>
      <input
        type="text"
        value={bodyValues[fieldKey] || ''}
        onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
        placeholder="Or type emoji"
        className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
      />
    </div>
  );
}

export function EnumField({
  fieldKey, bodyValues, onBodyValuesChange, enumVals,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  enumVals: string[];
}) {
  return (
    <select
      value={bodyValues[fieldKey] || ''}
      onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
      className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
    >
      <option value="">-- Select --</option>
      {enumVals.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}
