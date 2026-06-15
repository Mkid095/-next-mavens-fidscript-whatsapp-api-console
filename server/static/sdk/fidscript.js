/**
 * FIDScript WhatsApp API — JavaScript/TypeScript SDK
 * Generated 2026-06-15T11:47:25.187Z
 * Base: https://whatsapp.fidscript.com/api/v1
 *
 * Usage:
 *   import { Fidscript } from './fidscript.js';
 *   const api = new Fidscript({ apiKey: 'fidscript_live_...' });
 *   await api.send_text('my-instance', { number: '254700000000', text: 'Hello!' });
 */

export class Fidscript {
  baseUrl = 'https://whatsapp.fidscript.com/api/v1';

  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) throw new Error('apiKey is required');
    this.apiKey = apiKey;
  }

  /**
   * Confirm an API key is active and resolve the owning client. No side effects — ideal for a connection test.
   * GET /whoami — free
   */
  async validate_key(instanceName) {
    const url = `${this.baseUrl}/whoami`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Aggregate API usage for the authenticated client: requests today/this month, sends this month, token spend, and failed requests.
   * GET /usage — free
   */
  async usage_analytics(instanceName) {
    const url = `${this.baseUrl}/usage`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * The machine-readable OpenAPI 3.0 document for the entire API. Import into Postman, Insomnia, or an AI agent. A YAML mirror is at /api/v1/openapi.yaml.
   * GET /openapi.json — free
   */
  async openapi_spec(instanceName) {
    const url = `${this.baseUrl}/openapi.json`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send a plain-text WhatsApp message.
   * POST /messages/text/{instanceName} — costs 1 token(s)
   */
  async send_text(instanceName, to, message) {
    const url = `${this.baseUrl}/messages/text/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'message': '\'<message>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send an image, video, document or audio file by URL.
   * POST /messages/media/{instanceName} — costs 2 token(s)
   */
  async send_media(instanceName, to, media_url, media_type, caption) {
    const url = `${this.baseUrl}/messages/media/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'media_url': '\'<media_url>\'',
    'media_type': '\'image\'',
    'caption': '\'<caption>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Share a geographic location pin.
   * POST /messages/location/{instanceName} — costs 1 token(s)
   */
  async send_location(instanceName, to, latitude, longitude, name, address) {
    const url = `${this.baseUrl}/messages/location/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'latitude': '0',
    'longitude': '0',
    'name': '\'<name>\'',
    'address': '\'<address>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Share one or more contact cards.
   * POST /messages/contact/{instanceName} — costs 1 token(s)
   */
  async send_contact(instanceName, to, contact) {
    const url = `${this.baseUrl}/messages/contact/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'contact': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * React to an existing message (emoji).
   * POST /messages/reaction/{instanceName} — costs 1 token(s)
   */
  async send_reaction(instanceName, to, key, reaction) {
    const url = `${this.baseUrl}/messages/reaction/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'key': '{}',
    'reaction': '\'<reaction>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send an interactive poll.
   * POST /messages/poll/{instanceName} — costs 1 token(s)
   */
  async send_poll(instanceName, to, name, selectableCount, values) {
    const url = `${this.baseUrl}/messages/poll/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'name': '\'<name>\'',
    'selectableCount': '1',
    'values': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send an interactive list message with selectable sections.
   * POST /messages/list/{instanceName} — costs 1 token(s)
   */
  async send_list(instanceName, to, title, description, buttonText, footerText, sections) {
    const url = `${this.baseUrl}/messages/list/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'title': '\'<title>\'',
    'description': '\'<description>\'',
    'buttonText': '\'Options\'',
    'footerText': '\'<footerText>\'',
    'sections': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send a native WhatsApp voice message (PTT) from an audio URL.
   * POST /messages/audio/{instanceName} — costs 2 token(s)
   */
  async send_audio(instanceName, to, audio) {
    const url = `${this.baseUrl}/messages/audio/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'audio': '\'<audio>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send a WhatsApp sticker from an image URL.
   * POST /messages/sticker/{instanceName} — costs 2 token(s)
   */
  async send_sticker(instanceName, to, sticker) {
    const url = `${this.baseUrl}/messages/sticker/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'to': '\'<to>\'',
    'sticker': '\'<sticker>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Post a status/story update (text, image, or audio).
   * POST /messages/status/{instanceName} — costs 2 token(s)
   */
  async send_status(instanceName, type, content, caption, backgroundColor, font, allContacts, statusJidList) {
    const url = `${this.baseUrl}/messages/status/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'type': '\'text\'',
    'content': '\'<content>\'',
    'caption': '\'<caption>\'',
    'backgroundColor': '\'#008000\'',
    'font': '1',
    'allContacts': 'true',
    'statusJidList': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Create a new WhatsApp group with an initial participant list.
   * POST /groups/create/{instanceName} — free
   */
  async create_group(instanceName, subject, description, participants) {
    const url = `${this.baseUrl}/groups/create/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'subject': '\'<subject>\'',
    'description': '\'<description>\'',
    'participants': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Rename a group.
   * POST /groups/update-subject/{instanceName} — free
   */
  async update_subject(instanceName, groupJid, subject) {
    const url = `${this.baseUrl}/groups/update-subject/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'subject': '\'<subject>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Change the group description.
   * POST /groups/update-description/{instanceName} — free
   */
  async update_description(instanceName, groupJid, description) {
    const url = `${this.baseUrl}/groups/update-description/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'description': '\'<description>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Set the group picture from an image URL.
   * POST /groups/update-picture/{instanceName} — free
   */
  async update_picture(instanceName, groupJid, image) {
    const url = `${this.baseUrl}/groups/update-picture/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'image': '\'<image>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * List every group the instance belongs to.
   * GET /groups/fetch-all/{instanceName} — free
   */
  async fetch_all_groups(instanceName, getParticipants) {
    const url = `${this.baseUrl}/groups/fetch-all/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'getParticipants': 'false'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Get info for a single group by JID.
   * GET /groups/find/{instanceName} — free
   */
  async find_group(instanceName, groupJid) {
    const url = `${this.baseUrl}/groups/find/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * List the members of a group.
   * GET /groups/find-members/{instanceName} — free
   */
  async find_members(instanceName, groupJid) {
    const url = `${this.baseUrl}/groups/find-members/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Add, remove, promote or demote members.
   * POST /groups/update-participant/{instanceName} — free
   */
  async update_participant(instanceName, groupJid, action, participants) {
    const url = `${this.baseUrl}/groups/update-participant/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'action': '\'add\'',
    'participants': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Fetch the group invite code.
   * GET /groups/invite-code/{instanceName} — free
   */
  async invite_code(instanceName, groupJid) {
    const url = `${this.baseUrl}/groups/invite-code/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Revoke and rotate the group invite code.
   * POST /groups/revoke-invite/{instanceName} — free
   */
  async revoke_invite(instanceName, groupJid) {
    const url = `${this.baseUrl}/groups/revoke-invite/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Look up group metadata from an invite code.
   * GET /groups/find-by-invite/{instanceName} — free
   */
  async find_by_invite(instanceName, inviteCode) {
    const url = `${this.baseUrl}/groups/find-by-invite/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'inviteCode': '\'<inviteCode>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Join a group via its invite code.
   * GET /groups/accept-invite/{instanceName} — free
   */
  async accept_invite(instanceName, inviteCode) {
    const url = `${this.baseUrl}/groups/accept-invite/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'inviteCode': '\'<inviteCode>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Send a group invite link to numbers (as a message).
   * POST /groups/send-invite/{instanceName} — free
   */
  async send_invite(instanceName, groupJid, description, numbers) {
    const url = `${this.baseUrl}/groups/send-invite/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'description': '\'<description>\'',
    'numbers': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Leave a group.
   * DELETE /groups/leave/{instanceName} — free
   */
  async leave_group(instanceName, groupJid) {
    const url = `${this.baseUrl}/groups/leave/{instanceName}`;
    const opts = { method: 'DELETE', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Enable/disable disappearing messages. expiration = seconds (0 to disable).
   * POST /groups/toggle-ephemeral/{instanceName} — free
   */
  async toggle_ephemeral(instanceName, groupJid, expiration) {
    const url = `${this.baseUrl}/groups/toggle-ephemeral/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'expiration': '604800'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Toggle announcement / lock state.
   * POST /groups/update-setting/{instanceName} — free
   */
  async update_setting(instanceName, groupJid, action) {
    const url = `${this.baseUrl}/groups/update-setting/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'groupJid': '\'<groupJid>\'',
    'action': '\'announcement\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Mark one or more messages as read.
   * POST /chats/mark-read/{instanceName} — free
   */
  async mark_read(instanceName, readMessages) {
    const url = `${this.baseUrl}/chats/mark-read/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'readMessages': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Mark a chat as unread.
   * POST /chats/mark-unread/{instanceName} — free
   */
  async mark_unread(instanceName, chat, lastMessage) {
    const url = `${this.baseUrl}/chats/mark-unread/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'chat': '\'<chat>\'',
    'lastMessage': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Archive or unarchive a chat.
   * POST /chats/archive/{instanceName} — free
   */
  async archive_chat(instanceName, chat, archive, lastMessage) {
    const url = `${this.baseUrl}/chats/archive/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'chat': '\'<chat>\'',
    'archive': 'true',
    'lastMessage': '{}'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Broadcast a presence update (typing, online, etc.).
   * POST /chats/presence/{instanceName} — free
   */
  async send_presence(instanceName, number, options) {
    const url = `${this.baseUrl}/chats/presence/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'number': '\'<number>\'',
    'options': '{}'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Delete a message for everyone in the chat.
   * DELETE /chats/delete-for-everyone/{instanceName} — free
   */
  async delete_for_everyone(instanceName, id, remoteJid, fromMe, participant) {
    const url = `${this.baseUrl}/chats/delete-for-everyone/{instanceName}`;
    const opts = { method: 'DELETE', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'id': '\'<id>\'',
    'remoteJid': '\'<remoteJid>\'',
    'fromMe': 'false',
    'participant': '\'<participant>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Edit the text of a message you sent.
   * POST /chats/update-message/{instanceName} — free
   */
  async update_message(instanceName, number, text, key) {
    const url = `${this.baseUrl}/chats/update-message/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'number': '0',
    'text': '\'<text>\'',
    'key': '{}'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * List all open chats.
   * POST /chats/find-chats/{instanceName} — free
   */
  async find_chats(instanceName) {
    const url = `${this.baseUrl}/chats/find-chats/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Search contacts with optional filter.
   * POST /chats/find-contacts/{instanceName} — free
   */
  async find_contacts(instanceName, where) {
    const url = `${this.baseUrl}/chats/find-contacts/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'where': '{}'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Search messages with optional filter.
   * POST /chats/find-messages/{instanceName} — free
   */
  async find_messages(instanceName, where) {
    const url = `${this.baseUrl}/chats/find-messages/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'where': '{}'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Search status updates.
   * POST /chats/find-status/{instanceName} — free
   */
  async find_status(instanceName, where, limit) {
    const url = `${this.baseUrl}/chats/find-status/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'where': '{}',
    'limit': '10'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Check which numbers are registered on WhatsApp.
   * POST /chats/is-whatsapp/{instanceName} — free
   */
  async is_whatsapp(instanceName, numbers) {
    const url = `${this.baseUrl}/chats/is-whatsapp/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'numbers': '[]'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Retrieve media as base64 (for re-uploading or forwarding).
   * POST /chats/base64/{instanceName} — free
   */
  async get_base64(instanceName, message, convertToMp4) {
    const url = `${this.baseUrl}/chats/base64/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'message': '{}',
    'convertToMp4': 'false'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Get the profile picture URL for a number.
   * GET /chats/profile-pic-url/{instanceName} — free
   */
  async profile_pic_url(instanceName, number) {
    const url = `${this.baseUrl}/chats/profile-pic-url/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'number': '\'<number>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Fetch a contact's full profile by phone number.
   * POST /profile/fetch/{instanceName} — free
   */
  async fetch_profile(instanceName, number) {
    const url = `${this.baseUrl}/profile/fetch/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'number': '\'<number>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Fetch the instance owner's privacy settings.
   * GET /profile/fetch-privacy/{instanceName} — free
   */
  async fetch_privacy(instanceName) {
    const url = `${this.baseUrl}/profile/fetch-privacy/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Update the display name shown to contacts.
   * POST /profile/update-name/{instanceName} — free
   */
  async update_name(instanceName, name) {
    const url = `${this.baseUrl}/profile/update-name/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'name': '\'<name>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Update your WhatsApp status (bio text).
   * POST /profile/update-status/{instanceName} — free
   */
  async update_status(instanceName, status) {
    const url = `${this.baseUrl}/profile/update-status/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'status': '\'<status>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Set your profile picture from an image URL.
   * POST /profile/update-picture/{instanceName} — free
   */
  async update_picture(instanceName, picture) {
    const url = `${this.baseUrl}/profile/update-picture/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'picture': '\'<picture>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Remove your profile picture.
   * DELETE /profile/remove-picture/{instanceName} — free
   */
  async remove_picture(instanceName) {
    const url = `${this.baseUrl}/profile/remove-picture/{instanceName}`;
    const opts = { method: 'DELETE', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Fetch the current instance settings.
   * GET /settings/find/{instanceName} — free
   */
  async find_settings(instanceName) {
    const url = `${this.baseUrl}/settings/find/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Update instance settings (call rejection, online status, history sync, etc.).
   * POST /settings/set/{instanceName} — free
   */
  async set_settings(instanceName, rejectCall, msgCall, groupsIgnore, alwaysOnline, readMessages, readStatus, syncFullHistory) {
    const url = `${this.baseUrl}/settings/set/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'rejectCall': 'false',
    'msgCall': '\'<msgCall>\'',
    'groupsIgnore': 'false',
    'alwaysOnline': 'false',
    'readMessages': 'false',
    'readStatus': 'false',
    'syncFullHistory': 'false'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Get the current connection state and phone number.
   * GET /instance/connection-state/{instanceName} — free
   */
  async connection_state(instanceName) {
    const url = `${this.baseUrl}/instance/connection-state/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Generate a new QR code and start the WhatsApp session. Use /instance/connection-state to poll until connected.
   * GET /instance/connect/{instanceName} — free
   */
  async connect___qr(instanceName, number) {
    const url = `${this.baseUrl}/instance/connect/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'number': '\'<number>\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Restart the WhatsApp session. Requires {"confirm":true} in the body or X-Confirm-Restart: true header — 428 otherwise.
   * POST /instance/restart/{instanceName} — free
   */
  async restart(instanceName, confirm) {
    const url = `${this.baseUrl}/instance/restart/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'confirm': 'true'
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Disconnect and log out of the WhatsApp session.
   * DELETE /instance/logout/{instanceName} — free
   */
  async logout(instanceName) {
    const url = `${this.baseUrl}/instance/logout/{instanceName}`;
    const opts = { method: 'DELETE', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Broadcast your presence (available or unavailable).
   * POST /instance/set-presence/{instanceName} — free
   */
  async set_presence(instanceName, presence) {
    const url = `${this.baseUrl}/instance/set-presence/{instanceName}`;
    const opts = { method: 'POST', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    opts.body = JSON.stringify({
    'presence': '\'available\''
});
    const res = await fetch(url, opts);
    return res.json();
  }

  /**
   * Fetch the current QR code without triggering a new connection. Returns 204 if no QR is pending.
   * GET /instance/qr/{instanceName} — free
   */
  async fetch_qr(instanceName) {
    const url = `${this.baseUrl}/instance/qr/{instanceName}`;
    const opts = { method: 'GET', headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' } };
    
    const res = await fetch(url, opts);
    return res.json();
  }
}
