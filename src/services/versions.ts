import { API_BASE_URL, fetchApi } from '../data/api/client.js';

export interface DeployVersion {
  id: number;
  version: string;
  previous_version: string | null;
  commit_hash: string;
  deployed_at: string;
  changes_summary: string;
  changelog: string | null;
  service: string;
}

export const versionsApi = {
  /** Fetch all deploy versions (public, no auth) */
  getAll: async (): Promise<{ success: boolean; data?: DeployVersion[]; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/versions`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /** Fetch latest deploy version (public, no auth) */
  getLatest: async (): Promise<{ success: boolean; data?: DeployVersion; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/versions/latest`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
};
