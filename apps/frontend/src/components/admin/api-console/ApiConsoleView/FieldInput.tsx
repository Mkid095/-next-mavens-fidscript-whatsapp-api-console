import type { BodyField } from '../../../../data/apiEndpoints/index';

interface FieldInputProps {
  field: BodyField;
  value: string;
  onChange: (v: string) => void;
}

export function FieldInput({ field, value, onChange }: FieldInputProps) {
  if (field.type === 'text' || field.type === 'string') {
    return (
      <div key={field.key}>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase tracking-wider mb-1">
          {field.label} {field.required ? '*' : ''}
        </label>
        {field.enum ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs focus:outline-none"
          >
            <option value="">Select…</option>
            {field.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={field.type === 'text' ? 3 : 1}
            placeholder={field.placeholder}
            className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs font-mono focus:outline-none resize-none"
          />
        )}
        {field.desc && <p className="mt-0.5 text-[9px] text-[#5a554a]">{field.desc}</p>}
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div key={field.key}>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase tracking-wider mb-1">
          {field.label} {field.required ? '*' : ''}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs font-mono focus:outline-none"
        />
      </div>
    );
  }
  if (field.type === 'boolean') {
    return (
      <div key={field.key} className="flex items-center gap-2">
        <input
          type="checkbox"
          id={field.key}
          checked={value === 'true'}
          onChange={(e) => onChange(String(e.target.checked))}
          className="w-3.5 h-3.5 rounded border-[#2d2813] text-yellow-500 focus:ring-yellow-500"
        />
        <label htmlFor={field.key} className="text-xs text-[#a8a99e]">{field.label}</label>
      </div>
    );
  }
  return null;
}
