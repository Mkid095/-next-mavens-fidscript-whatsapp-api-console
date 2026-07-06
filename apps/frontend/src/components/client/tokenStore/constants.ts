import {
  MessagesSquare, Image as ImageIcon, FileText, Video,
} from 'lucide-react';

export const PER_TOKEN_RATE = 0.11;

export const MESSAGE_TYPES = [
  { label: 'Text', Icon: MessagesSquare, perMsg: 1 },
  { label: 'Image', Icon: ImageIcon, perMsg: 2 },
  { label: 'Document', Icon: FileText, perMsg: 2 },
  { label: 'Video', Icon: Video, perMsg: 3 },
];

export function calcCost(tokens: number) {
  return {
    total: Math.ceil(tokens * PER_TOKEN_RATE),
    perToken: PER_TOKEN_RATE,
    label: 'Custom',
    displayTokens: tokens,
  };
}
