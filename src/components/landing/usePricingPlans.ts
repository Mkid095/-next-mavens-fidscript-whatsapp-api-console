import { useEffect, useState } from 'react';
import { plansApi } from '../../services/api';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  tokens: number;
  pricePerToken: number;
  features: string[];
}

export function usePricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await plansApi.getAll();
        if (res.success && res.data) {
          setPlans(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch plans', e);
      }
    };
    fetchPlans();
  }, []);

  return plans;
}
