/**
 * toolRunner type definitions.
 */
export interface ToolRunnerInput {
  tool: {
    id: string;
    name: string;
    type: string;
    parameters_json: string;
    executor_json: string;
    data_source_id: string;
  };
  arguments: Record<string, unknown>;
  workspaceId: string;
  chatbotId?: string;
  conversationId?: string;
}

export type ToolRunResult = unknown;

export interface ExecutorConfig {
  records?: Array<Record<string, unknown>>;
  keyField?: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  pathTemplate?: string;
  bodyTemplate?: Record<string, unknown>;
  demoData?: unknown;
  steps?: Array<{ tool_id: string; pass_args?: boolean }>;
}

export interface DataSourceRow {
  id: string;
  type: string;
  config_json: string;
  connection_id: string | null;
  workspace_id: string;
}

export interface ConnectionRow {
  id: string;
  base_url: string;
  encrypted_config: string;
  auth_type: string;
  auth_header_name: string;
  type: string;
}
