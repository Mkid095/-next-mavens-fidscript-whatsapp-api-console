export function BooleanField({
  fieldKey, bodyValues, onBodyValuesChange, placeholder,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={bodyValues[fieldKey] === 'true'}
        onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: String(e.target.checked) })}
        className="w-4 h-4 accent-yellow-600"
      />
      <span className="text-xs text-stone-500">{placeholder || 'true / false'}</span>
    </label>
  );
}

export function TextareaField({
  fieldKey, bodyValues, onBodyValuesChange, placeholder,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={bodyValues[fieldKey] || ''}
      onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
      placeholder={placeholder}
      rows={3}
      className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 resize-none"
    />
  );
}
