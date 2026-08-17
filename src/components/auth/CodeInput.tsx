import React, { useRef, useEffect, useCallback } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

const INPUT_BASE =
  'w-11 h-13 text-center text-lg font-bold font-mono text-[#1a1a1a] ' +
  'bg-white border border-[#e5e5e5] rounded-2xl ' +
  'focus:outline-none focus:border-[#f97316] transition-colors ' +
  'disabled:opacity-50';

export default function CodeInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  disabled = false,
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const focusAt = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(length - 1, idx));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  }, [length]);

  const handleChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      // user cleared the box
      const next = value.split('');
      next[idx] = ' ';
      onChange(next.join('').replace(/\s+$/, ''));
      return;
    }
    const chars = cleaned.split('');
    const next = value.split('').map((c) => (c === ' ' ? '' : c));
    // overwrite from idx
    let writeIdx = idx;
    for (const ch of chars) {
      if (writeIdx >= length) break;
      next[writeIdx] = ch;
      writeIdx++;
    }
    const joined = next.join('');
    onChange(joined);
    focusAt(writeIdx);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx] && digits[idx] !== ' ') {
        const next = value.split('');
        next[idx] = ' ';
        onChange(next.join(''));
      } else {
        focusAt(idx - 1);
        const next = value.split('');
        next[idx - 1] = ' ';
        onChange(next.join(''));
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      focusAt(idx - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      focusAt(idx + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      focusAt(pasted.length - 1);
      e.preventDefault();
    }
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={INPUT_BASE}
        />
      ))}
    </div>
  );
}
