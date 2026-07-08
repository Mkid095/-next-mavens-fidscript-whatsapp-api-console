export type TestStatus = 'pass' | 'fail' | 'skip';

export interface TestResult {
  name: string;
  status: TestStatus;
  latency?: number;   // ms
  error?: string;
  data?: unknown;
}

export interface TestCollection {
  title: string;
  tests: TestResult[];
}

export interface EnvConfig {
  platformApiUrl: string;   // SaaS backend API
  whatsappApiUrl: string;   // WhatsApp API
  adminEmail?: string;
  adminPassword?: string;
  testWorkspacePrefix?: string;
}
