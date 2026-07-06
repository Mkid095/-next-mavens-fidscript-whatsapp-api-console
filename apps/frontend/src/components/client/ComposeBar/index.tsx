import React from 'react';
import { ComposeBarMain } from './ComposeBarMain';

interface ComposeBarProps {
  replyText: string;
  sending: boolean;
  disabled: boolean;
  selectedContactName: string;
  selectedInstance: import('../../../services/api').Instance | undefined;
  savedContacts: import('../../../services/api').Contact[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onReplyTextChange: (v: string) => void;
  onSend: () => void;
  onTokenDeduct?: (n: number) => void;
}

export default function ComposeBar(props: ComposeBarProps) {
  return <ComposeBarMain {...props} />;
}
