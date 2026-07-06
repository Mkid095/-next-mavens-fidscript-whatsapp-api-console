import { useEffect } from 'react';
import { useChatbotBuilderStore, scheduleAutosave } from '../store/chatbotBuilderStore';

export function useAutosave(clientToken: string) {
  const draft = useChatbotBuilderStore(s => s.draft);

  useEffect(() => {
    if (draft.isDirty && !draft.isSaving) {
      scheduleAutosave(clientToken, 2000);
    }
  }, [draft, clientToken]);
}
