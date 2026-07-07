import { useEffect } from 'react';
import type { ClientMessage, DailyUsage } from '../data';

export function useSseDashboard(opts: {
  currentUserRole: 'admin' | 'client' | undefined;
  onMessagesToday: (count: number) => void;
  onDailyUsage: (usage: DailyUsage[]) => void;
  onRecentMessages: (messages: ClientMessage[]) => void;
}) {
  const { currentUserRole, onMessagesToday, onDailyUsage, onRecentMessages } = opts;

  useEffect(() => {
    if (currentUserRole !== 'client') return;
    const token = localStorage.getItem('fidscript_client_token');
    if (!token) return;

    const es = new EventSource(`/api/sse/dashboard?token=${encodeURIComponent(token)}`);
    es.addEventListener('dashboardUpdate', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      onMessagesToday(data.messagesToday);
      onDailyUsage(data.dailyVolume);
      onRecentMessages(data.recentMessages);
    });
    return () => es.close();
  }, [currentUserRole, onMessagesToday, onDailyUsage, onRecentMessages]);
}
