/**
 * TestForm — message input + quick-phrase buttons for TestStep.
 */
import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TestFormProps {
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
  loading: boolean;
  disabled: boolean;
}

export function TestForm({ input, onInputChange, onSend, loading, disabled }: TestFormProps) {
  return (
    <div className="p-3 border-t border-[#2d2813] bg-[#1a1915] shrink-0">
      <div className="flex gap-2 items-center">
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !loading && input.trim()) {
              onSend(input);
            }
          }}
          disabled={disabled || loading}
          placeholder={disabled ? 'Save chatbot first...' : 'Type a message...'}
          className="flex-1 bg-[#0d0c0a] border border-[#2d2813] rounded-full px-4 py-2.5 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none disabled:opacity-40 transition"
        />
        <button
          onClick={() => onSend(input)}
          disabled={disabled || loading || !input.trim()}
          className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-30 text-black flex items-center justify-center transition shrink-0"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
