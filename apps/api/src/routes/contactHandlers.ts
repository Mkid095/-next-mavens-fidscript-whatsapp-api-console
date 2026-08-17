/**
 * Contact route handlers - thin re-export barrel.
 * Split into: contactCrudHandlers.ts (CRUD), contactGoogleHandlers.ts (Google OAuth).
 */

export {
  getContacts,
  addContacts,
  deleteContact,
  updateContact,
} from './contactCrudHandlers.js';

export {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getGoogleStatus,
  importGoogleContacts,
  unlinkGoogle,
} from './contactGoogleHandlers.js';
