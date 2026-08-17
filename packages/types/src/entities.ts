/**
 * entities.ts - Core entity types shared across SDK, CLI, and frontend.
 */

// ── Instance ─────────────────────────────────────────────────────────────────

export type InstanceStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface Instance {
  id: string;
  name: string;
  display_name?: string;
  status: InstanceStatus;
  /** Present when the instance has been linked to a WhatsApp line */
  phone?: string | null;
  created_at: string;
}

export interface CreateInstance {
  name: string;
  display_name?: string;
}
