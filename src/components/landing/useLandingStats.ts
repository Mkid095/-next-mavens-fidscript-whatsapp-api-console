import { useEffect, useState } from 'react';
import { authApi } from '../../services/api';

interface LandingStats {
  totalClients: number;
  totalMessages: number;
  deliveryRate: number;
  uptime: string;
}

const defaultStats: LandingStats = {
  totalClients: 0,
  totalMessages: 0,
  deliveryRate: 0,
  uptime: '99.9%',
};

export function useLandingStats() {
  const [stats, setStats] = useState<LandingStats>(defaultStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authApi.adminStats();
        if (res.success && res.data) {
          setStats({
            totalClients: res.data.total_clients || 0,
            totalMessages: res.data.total_messages || 0,
            deliveryRate: res.data.delivery_rate || 98,
            uptime: res.data.uptime || '99.9%',
          });
        }
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };
    fetchStats();
  }, []);

  return stats;
}
