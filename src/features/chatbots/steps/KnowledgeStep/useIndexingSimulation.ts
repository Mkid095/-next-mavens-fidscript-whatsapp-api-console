import { useEffect } from 'react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { KnowledgeSource } from '../../types';

export function useIndexingSimulation(sources: KnowledgeSource[]) {
  const { updateKnowledge } = useChatbotBuilderStore();

  useEffect(() => {
    sources.forEach(source => {
      if (source.status === 'indexing') {
        // Simulate indexing delay: 1.5–4s based on source type
        const delay = source.type === 'pdf' || source.type === 'database'
          ? 3500
          : source.type === 'csv' || source.type === 'json'
          ? 2000
          : 1200;

        const timer = setTimeout(() => {
          // Simulate 90% success rate
          const succeeded = Math.random() > 0.1;
          const mockChunks = Math.floor(Math.random() * 80) + 10;
          updateKnowledge({
            sources: useChatbotBuilderStore.getState().draft.knowledge.sources.map(s =>
              s.id === source.id
                ? {
                    ...s,
                    status: succeeded ? 'active' : 'error',
                    chunkCount: succeeded ? mockChunks : s.chunkCount,
                    errorMessage: succeeded ? undefined : 'Failed to reach URL or parse content',
                    updatedAt: new Date().toISOString(),
                  }
                : s
            ),
          });
        }, delay);

        return () => clearTimeout(timer);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.map(s => s.status).join(',')]);
}
