import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Link,
  FileText,
  FileSpreadsheet,
  Server,
  Code,
  Database,
} from 'lucide-react';
import type { KnowledgeSourceType } from '../../types';

export const SOURCE_TYPES: {
  value: KnowledgeSourceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}[] = [
  { value: 'url',      label: 'Website URL',    description: 'Scrape content from a webpage',          icon: Link,        color: 'blue'   },
  { value: 'faq',      label: 'FAQ',             description: 'Structured question & answer pairs',      icon: FileText,   color: 'purple' },
  { value: 'text',     label: 'Plain Text',     description: 'Paste or write free-form text',          icon: FileText,   color: 'yellow' },
  { value: 'json',     label: 'JSON',            description: 'Structured data (products, inventory)', icon: Database,   color: 'orange' },
  { value: 'pdf',      label: 'PDF',             description: 'Upload a PDF document',                  icon: FileText,   color: 'red'    },
  { value: 'csv',      label: 'CSV',             description: 'Spreadsheet or table data',              icon: FileSpreadsheet, color: 'green'  },
  { value: 'database', label: 'Database',       description: 'Connect to your database',                icon: Server,     color: 'cyan'   },
  { value: 'api',      label: 'API Endpoint',   description: 'Fetch data from an external API',       icon: Code,       color: 'pink'   },
];

export const STATUS_CONFIG = {
  active:    { label: 'Active',    icon: CheckCircle2, color: 'text-green-400',    bg: 'bg-green-400/10',    border: 'border-green-400/20'  },
  indexing:  { label: 'Indexing',   icon: Loader2,      color: 'text-yellow-400',   bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20' },
  error:     { label: 'Error',      icon: XCircle,      color: 'text-red-400',       bg: 'bg-red-400/10',     border: 'border-red-400/20'   },
  disabled:  { label: 'Disabled',   icon: AlertCircle,  color: 'text-[#6e684a]',     bg: 'bg-[#2d2813]',       border: 'border-[#2d2813]'     },
} as const;

export type SourceStatus = keyof typeof STATUS_CONFIG;
