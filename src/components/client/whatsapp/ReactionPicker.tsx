import React, { useRef } from 'react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { TOKEN_COST } from '../../../utils/tokenCosts';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  instance: Instance;
  to: string;
  messageId: string;
  position: { x: number; y: number };
  onSelect: (tokenCost: number) => void;
  onClose: () => void;
}

export default function ReactionPicker({ instance, to, messageId, position, onSelect, onClose }: ReactionPickerProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = async (emoji: string) => {
    try {
      const remoteJid = `${to}@s.whatsapp.net`;
      await instancesApi.sendReaction(instance.name, to, { remoteJid, fromMe: true, id: messageId }, emoji);
      onSelect(TOKEN_COST.REACTION);
    } catch {
      // silent — reaction is best-effort
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{ top: position.y, left: position.x }}
        className="absolute z-50 bg-white border border-[#eaebe4] rounded-2xl shadow-xl p-2 flex items-center gap-1"
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.stopPropagation()}
      >
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className="w-9 h-9 rounded-xl hover:bg-stone-100 flex items-center justify-center text-lg transition-all active:scale-110"
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </>
  );
}
