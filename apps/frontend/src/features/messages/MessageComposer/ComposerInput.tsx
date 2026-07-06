import type { Ref } from 'react';
import type { Instance } from '../../../services/api';

interface ComposerInputProps {
  text: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  disabled: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
  charCount: number;
  segments: number;
  instance: Instance | null;
}

export default function ComposerInput({
  text,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  textareaRef,
  charCount,
  segments,
  instance,
}: ComposerInputProps) {
  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{ minHeight: '40px', maxHeight: '144px' }}
        className="w-full resize-none rounded-xl border border-[#2d2813] bg-[#1a1915] px-3 py-2 pr-16 text-sm text-[#a8a99e] placeholder:text-[#5a554a] outline-none transition-colors focus:border-[#eab308]/50 disabled:opacity-50"
      />
      <div className="absolute bottom-2 right-2.5 flex items-center gap-1.5 text-[10px]">
        {charCount > 150 && (
          <span className="font-mono text-[#6e684a]">
            {charCount}{segments > 1 && <span className="ml-1 text-[#5a554a]">({segments} seg)</span>}
          </span>
        )}
        {instance && (
          <span
            title={instance.status}
            className={`h-1.5 w-1.5 rounded-full ${
              instance.status === 'connected' ? 'bg-green-400'
                : instance.status === 'connecting' ? 'bg-[#eab308]'
                : 'bg-[#6e684a]'
            }`}
          />
        )}
      </div>
    </div>
  );
}
