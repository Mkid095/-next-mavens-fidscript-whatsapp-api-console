/**
 * Platform API — contacts, tags, notes, assignment.
 * Exported from platform.ts for tree-shaking.
 */

import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client.js';

export const platformContactsApi = {
  // Tags (Phase 3 §6 / §9)
  listTags: (customerId: string) =>
    apiGet<{ id: string; tag: string; created_at: string }[]>(
      `/api/platform/customers/${customerId}/tags`,
    ),
  addTag: (customerId: string, tag: string) =>
    apiPost<{ id: string; tag: string }>(`/api/platform/customers/${customerId}/tags`, { tag }),
  removeTag: (customerId: string, tag: string) =>
    apiDelete<null>(`/api/platform/customers/${customerId}/tags/${encodeURIComponent(tag)}`),

  // Notes (Phase 3 §6)
  listNotes: (customerId: string) =>
    apiGet<{
      id: string; body: string; created_at: string;
      author_user_id: string | null; author_name: string | null;
    }[]>(`/api/platform/customers/${customerId}/notes`),
  addNote: (customerId: string, body: string) =>
    apiPost<{ id: string; body: string; created_at: string }>(
      `/api/platform/customers/${customerId}/notes`,
      { body },
    ),
  removeNote: (customerId: string, noteId: string) =>
    apiDelete<null>(`/api/platform/customers/${customerId}/notes/${noteId}`),

  // Customer assignment (§9 — long-term owner)
  getAssignment: (customerId: string) =>
    apiGet<{
      id: string; owner_user_id: string | null; team_id: string | null;
      owner_name: string | null; team_name: string | null;
    } | null>(`/api/platform/customers/${customerId}/assignment`),
  setAssignment: (
    customerId: string,
    body: { owner_user_id?: string | null; team_id?: string | null },
  ) => apiPut<null>(`/api/platform/customers/${customerId}/assignment`, body),
};
