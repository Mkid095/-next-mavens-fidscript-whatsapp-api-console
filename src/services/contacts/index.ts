// Contacts service barrel — re-export everything from the old contacts.ts surface
export type {
  Contact,
  ClientMessage,
  ClientApiKey,
  Campaign,
  CampaignRecipient,
  ContactGroup,
  ContactGroupMember,
} from './contactsTypes';

export { contactsApi, openGoogleOAuthPopup } from './contactsApi';
export { clientMessagesApi, campaignsApi, groupsApi } from './messagesApi';
export { clientKeysApi } from './keysApi';
