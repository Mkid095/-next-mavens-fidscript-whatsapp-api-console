export type TestStatus = 'pass' | 'fail' | 'skip';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface TestResult {
  name: string;
  status: TestStatus;
  severity?: Severity;    // defaults to 'high' on failure
  category?: string;     // e.g. 'infrastructure', 'messaging', 'media'
  latency?: number;       // ms
  error?: string;        // one-line summary
  detail?: string;       // response body, stack, etc.
  data?: unknown;
}

export interface TestCollection {
  title: string;
  tests: TestResult[];
}

export interface ValidationReport {
  score: number;          // 0-100
  passed: number;
  failed: number;
  skipped: number;
  collections: TestCollection[];
  gitSha?: string;
  timestamp: string;
  severity: Record<string, number>;  // e.g. { critical: 1, high: 2 }
}

export interface EnvConfig {
  platformApiUrl: string;
  whatsappApiUrl: string;
  adminEmail?: string;
  adminPassword?: string;
  testWorkspacePrefix?: string;
  testWhatsAppNumber?: string;
}
