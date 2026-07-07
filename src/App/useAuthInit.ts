import { useState, useEffect, useCallback } from 'react';
import { authApi, instancesApi } from '../data';
import type { Client, Instance } from '../data';

interface User {
  email: string;
  role: 'admin' | 'client';
  name: string;
}

interface AuthInitResult {
  currentUser: User | null;
  clientData: Client | null;
  clientInstances: Instance[];
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  setClientData: (client: Client | null) => void;
  setClientInstances: (instances: Instance[]) => void;
}

export function useAuthInit(): AuthInitResult {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [clientInstances, setClientInstances] = useState<Instance[]>([]);

  useEffect(() => {
    const adminToken = localStorage.getItem('fidscript_admin_token');
    const clientToken = localStorage.getItem('fidscript_client_token');

    if (adminToken) {
      authApi.me().then((res) => {
        if (res.success && res.data) {
          setCurrentUser({ email: res.data.email, role: 'admin', name: res.data.name });
        } else if (res.status === 401) {
          localStorage.removeItem('fidscript_admin_token');
        }
        setIsLoading(false);
      });
    } else if (clientToken) {
      Promise.all([authApi.clientMe(), instancesApi.getClientInstances()]).then(([meRes, instRes]) => {
        if (meRes.success && meRes.data) {
          setClientData(meRes.data);
          setCurrentUser({ email: meRes.data.email, role: 'client', name: meRes.data.name });
          if (instRes.success && instRes.data) {
            setClientInstances(instRes.data);
          }
        } else if (meRes.status === 401) {
          localStorage.removeItem('fidscript_client_token');
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  return { currentUser, clientData, clientInstances, isLoading, setCurrentUser, setClientData, setClientInstances };
}
