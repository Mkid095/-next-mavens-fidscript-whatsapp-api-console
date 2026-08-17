import { useEffect, useState } from 'react';
import { plansApi } from '../../services/api';

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  max_instances: number;
  max_messages_per_month: number;
}

export function usePricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await plansApi.getAll();
        if (res.success && res.data) {
          setPlans(res.data as PricingPlan[]);
        }
      } catch (e) {
        console.error('Failed to fetch plans', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return { plans, loading };
}
