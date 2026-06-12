export type InstanceStatus = 'Connected' | 'Connecting' | 'Disconnected';

export interface Instance {
  id: string;
  name: string;
  phone: string;
  status: InstanceStatus;
  client: string;
  lastActive: string;
}

export interface Transaction {
  id: string;
  amount: number;
  tokens: number;
  reference: string;
  timestamp: string;
  phone: string;
  status: 'Pending' | 'Success' | 'Failed';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  instancesCount: number;
  plan: string;
  joinedDate: string;
  tokenBalance?: number;
  transactions?: Transaction[];
}



export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  source: string;
  message: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}

export interface InboxMessage {
  id: string;
  sender: string;
  role: string;
  subject: string;
  snippet: string;
  date: string;
  read: boolean;
  body: string;
}
