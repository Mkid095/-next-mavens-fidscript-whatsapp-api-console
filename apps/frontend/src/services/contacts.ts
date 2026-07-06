// Backward-compatibility re-export — all exports live in services/contacts/
export type {
  Contact,
  ClientMessage,
  ClientApiKey,
  Campaign,
  CampaignRecipient,
  ContactGroup,
  ContactGroupMember,
} from './contacts/contactsTypes';

export { contactsApi, openGoogleOAuthPopup } from './contacts/contactsApi';
export { clientMessagesApi, campaignsApi, groupsApi } from './contacts/messagesApi';
export { clientKeysApi } from './contacts/keysApi';
