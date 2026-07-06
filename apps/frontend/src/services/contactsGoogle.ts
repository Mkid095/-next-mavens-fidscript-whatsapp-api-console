import { fetchApi } from './api';

export { contactsApi } from './contactsApi';
export { clientKeysApi } from './contactsApi';
export { campaignsApi } from './contactsApi';
export { groupsApi } from './contactsApi';

export interface GoogleStatus {
  linked: boolean;
  name?: string;
  email?: string;
  picture?: string;
}

export const googleContactsApi = {
  authUrl: () => fetchApi<{ url: string }>('/api/contacts/google/auth-url'),

  status: () => fetchApi<GoogleStatus>('/api/contacts/google/status'),

  import: () =>
    fetchApi<{ imported: number; errors: number; total: number }>(
      '/api/contacts/google/import',
      { method: 'POST' }
    ),

  unlink: () =>
    fetchApi<void>('/api/contacts/google/link', { method: 'DELETE' }),
};

/**
 * Opens Google OAuth. Tries popup first (desktop), falls back to redirect (mobile).
 * Popup approach: polls popup.location for google_linked=1 or google_error=...
 * Redirect approach: sets a session flag then navigates, callback lands on /client/contacts.
 */
export function openGoogleOAuthPopup(): Promise<void> {
  return new Promise((resolve, reject) => {
    googleContactsApi.authUrl().then((res) => {
      console.debug('[GoogleOAuth] auth-url response:', res);
      if (!res.success) {
        const detail = res.status ? ` [HTTP ${res.status}: ${res.error}]` : `: ${res.error}`;
        reject(new Error(`Google auth URL request failed${detail}`));
        return;
      }
      const authUrl = res.data?.url || (res as unknown as { url?: string }).url;
      if (!authUrl) {
        reject(new Error('Server returned an empty auth URL — try again'));
        return;
      }

      const popup = window.open(authUrl, 'google_oauth', 'width=600,height=700,scrollbars=yes');
      if (popup) {
        const poll = setInterval(() => {
          try {
            const url = popup.location.href;
            if (url.includes('google_linked=1')) {
              clearInterval(poll);
              popup.close();
              resolve();
            } else if (url.includes('google_error=')) {
              clearInterval(poll);
              const errMatch = url.match(/google_error=([^&]+)/);
              popup.close();
              reject(new Error(decodeURIComponent(errMatch?.[1] || 'Google OAuth failed')));
            }
          } catch {
            // Cross-origin — can't read URL yet, keep polling
          }
        }, 500);

        const closeCheck = setInterval(() => {
          if (popup.closed) {
            clearInterval(poll);
            clearInterval(closeCheck);
            reject(new Error('Popup closed without completing Google sign-in'));
          }
        }, 1000);
      } else {
        console.warn('[GoogleOAuth] popup blocked, falling back to redirect');
        sessionStorage.setItem('google_oauth_pending', '1');
        window.location.href = authUrl;
      }
    }).catch(reject);
  });
}
