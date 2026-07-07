export interface LLMProvider {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: string;
  api_key_last4: string;
  is_default: number;
  is_free_tier: number;
  free_quota_tokens: number;
  config_json: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}
