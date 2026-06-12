import { Instance, Client, SystemLog, ApiKey, InboxMessage } from './types';

export const INITIAL_INSTANCES: Instance[] = [
  {
    id: 'inst-1',
    name: 'test123',
    phone: '—',
    status: 'Disconnected',
    client: '—',
    lastActive: '11h ago',
  },
  {
    id: 'inst-2',
    name: 'Viventire',
    phone: '—',
    status: 'Disconnected',
    client: '—',
    lastActive: 'May 4',
  },
  {
    id: 'inst-3',
    name: 'allrounders',
    phone: '—',
    status: 'Connecting',
    client: 'All Rounders',
    lastActive: 'Jun 5',
  },
  {
    id: 'inst-4',
    name: 'kenneddy',
    phone: '—',
    status: 'Connecting',
    client: 'Soostori',
    lastActive: 'Jun 5',
  },
  {
    id: 'inst-5',
    name: 'soostori',
    phone: '254732203353',
    status: 'Connected',
    client: 'Soostori',
    lastActive: '11h ago',
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Soostori Ltd',
    email: 'kennedygithinjioffice@gmail.com',
    phone: '254732203353',
    instancesCount: 2,
    plan: 'Enterprise',
    joinedDate: 'Jan 12, 2026',
    tokenBalance: 1250,
    transactions: [
      {
        id: 'tx-1',
        amount: 250,
        tokens: 1250,
        reference: 'RHF4KT9XM1',
        timestamp: '2026-06-11 14:23',
        phone: '254732203353',
        status: 'Success'
      },
      {
        id: 'tx-2',
        amount: 50,
        tokens: 250,
        reference: 'QY81MT12PL',
        timestamp: '2026-06-02 09:15',
        phone: '254732203353',
        status: 'Success'
      }
    ]
  },
  {
    id: 'cli-2',
    name: 'All Rounders Inc.',
    email: 'hello@allrounders.co',
    phone: '+1 (555) 0192-384',
    instancesCount: 1,
    plan: 'Developer Pro',
    joinedDate: 'Mar 02, 2026',
    tokenBalance: 300,
    transactions: [
      {
        id: 'tx-3',
        amount: 60,
        tokens: 300,
        reference: 'PF72JT9SL9',
        timestamp: '2026-06-01 11:32',
        phone: '+1 (555) 0192-384',
        status: 'Success'
      }
    ]
  },
  {
    id: 'cli-3',
    name: 'Viventire LLC',
    email: 'ops@viventire.io',
    phone: '—',
    instancesCount: 1,
    plan: 'Starter Plan',
    joinedDate: 'May 04, 2026',
    tokenBalance: 0,
    transactions: []
  },
];



export const INITIAL_LOG_ENTRIES: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-12T09:12:15Z',
    level: 'INFO',
    source: 'API Gateway',
    message: 'JWT Token handshake verified successfully for credentials_dev_key',
  },
  {
    id: 'log-2',
    timestamp: '2026-06-12T08:54:10Z',
    level: 'WARNING',
    source: 'Instance Monitor',
    message: 'Ping timeout detected for instance: test123 — entering self-repair phase',
  },
  {
    id: 'log-3',
    timestamp: '2026-06-11T21:40:02Z',
    level: 'SUCCESS',
    source: 'Core Webhook Router',
    message: 'Delivered notification payload successfully to Soostori HTTPS endpoint',
  },
  {
    id: 'log-4',
    timestamp: '2026-06-11T13:22:19Z',
    level: 'ERROR',
    source: 'SSL Overseer',
    message: 'Could not fetch remote certificates for viv-v2.internal — routing paused',
  },
  {
    id: 'log-5',
    timestamp: '2026-06-10T11:02:44Z',
    level: 'SUCCESS',
    source: 'Console Router',
    message: 'New physical instance created manually by Administrator kennedygithinjioffice',
  },
];

export const INITIAL_KEYS: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production Server Sync Token',
    key: 'nm_live_df3c6b219e904b77f901cb0eaee8a931',
    created: '2026-01-20',
    lastUsed: '14 mins ago',
    status: 'Active',
  },
  {
    id: 'key-2',
    name: 'Local Sandbox Sandbox-V2',
    key: 'nm_test_f71120a10bc39e99a8bc430e768128ad',
    created: '2026-05-15',
    lastUsed: '2 days ago',
    status: 'Active',
  },
  {
    id: 'key-3',
    name: 'Deprecated CLI Client key',
    key: 'nm_live_883a992cbded940a02efc2a939e602ab',
    created: '2025-11-04',
    lastUsed: '30+ days ago',
    status: 'Revoked',
  },
];

export const INITIAL_MESSAGES: InboxMessage[] = [
  {
    id: 'msg-1',
    sender: 'DevOps System Team',
    role: 'Infrastructure Status',
    subject: 'Core Webhook Gateway Upgrade Complete',
    snippet: 'All event forwarding rates have been optimized to decrease total request latency down to 2ms...',
    date: 'Jun 12, 2026',
    read: false,
    body: 'We have updated the active Webhook brokers to support modern HTTP/2 socket streaming. For tenants on Developer Pro or Enterprise, peak payload pipelines will experience significant latency reductions (from 48ms down to 2ms average). No breaking configuration changes are required on your endpoints.',
  },
  {
    id: 'msg-2',
    sender: 'NextMavens Support Team',
    role: 'Administrative Support',
    subject: 'Active Instances quota warning threshold reached',
    snippet: 'Your active instances group is now using 5 instances. We recommend updating your plan limits...',
    date: 'Jun 11, 2026',
    read: false,
    body: 'Regarding your current account allocation, you are running near your starter ceiling. To ensure uninterrupted service, we highly suggest migrating to Developer Pro which expands your ceiling to 12 active instances with complete priority uptime support.',
  },
  {
    id: 'msg-3',
    sender: 'Kennedy Githinji',
    role: 'Supervisor Account',
    subject: 'Webhook configuration question',
    snippet: 'Let us coordinate on shifting all local telemetry triggers over to our dedicated server endpoint...',
    date: 'Jun 05, 2026',
    read: true,
    body: 'Hey Team, we need to shift all active testing configurations over from sandbox domains to our permanent live environment on port 254732203353. Let us schedule an automated migration this weekend.',
  },
];
