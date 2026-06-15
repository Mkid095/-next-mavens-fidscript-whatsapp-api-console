# FIDScript WhatsApp API — Python SDK
# Generated 2026-06-15T11:47:25.188Z
# Base: https://whatsapp.fidscript.com/api/v1
#
# Usage:
#   from fidscript import Fidscript
#   api = Fidscript(api_key='fidscript_live_...')
#   api.send_text('my-instance', number='254700000000', text='Hello!')

import requests

class Fidscript:
    base_url = 'https://whatsapp.fidscript.com/api/v1'

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError('api_key is required')
        self.api_key = api_key

    def validate_key(instance_name):
        """
        Confirm an API key is active and resolve the owning client. No side effects — ideal for a connection test.
        GET /whoami — free
        """
        url = f"{self.base_url}/whoami"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def usage_analytics(instance_name):
        """
        Aggregate API usage for the authenticated client: requests today/this month, sends this month, token spend, and failed requests.
        GET /usage — free
        """
        url = f"{self.base_url}/usage"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def openapi_spec(instance_name):
        """
        The machine-readable OpenAPI 3.0 document for the entire API. Import into Postman, Insomnia, or an AI agent. A YAML mirror is at /api/v1/openapi.yaml.
        GET /openapi.json — free
        """
        url = f"{self.base_url}/openapi.json"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def send_text(instance_name, to, message):
        """
        Send a plain-text WhatsApp message.
        POST /messages/text/{instanceName} — costs 1 token(s)
        """
        url = f"{self.base_url}/messages/text/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "message": "\"<message>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_media(instance_name, to, media_url, media_type, caption):
        """
        Send an image, video, document or audio file by URL.
        POST /messages/media/{instanceName} — costs 2 token(s)
        """
        url = f"{self.base_url}/messages/media/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "media_url": "\"<media_url>\"",
            "media_type": "\"image\"",
            "caption": "\"<caption>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_location(instance_name, to, latitude, longitude, name, address):
        """
        Share a geographic location pin.
        POST /messages/location/{instanceName} — costs 1 token(s)
        """
        url = f"{self.base_url}/messages/location/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "latitude": "0",
            "longitude": "0",
            "name": "\"<name>\"",
            "address": "\"<address>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_contact(instance_name, to, contact):
        """
        Share one or more contact cards.
        POST /messages/contact/{instanceName} — costs 1 token(s)
        """
        url = f"{self.base_url}/messages/contact/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "contact": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_reaction(instance_name, to, key, reaction):
        """
        React to an existing message (emoji).
        POST /messages/reaction/{instanceName} — costs 1 token(s)
        """
        url = f"{self.base_url}/messages/reaction/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "key": "{}",
            "reaction": "\"<reaction>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_poll(instance_name, to, name, selectableCount, values):
        """
        Send an interactive poll.
        POST /messages/poll/{instanceName} — costs 1 token(s)
        """
        url = f"{self.base_url}/messages/poll/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "name": "\"<name>\"",
            "selectableCount": "1",
            "values": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_list(instance_name, to, title, description, buttonText, footerText, sections):
        """
        Send an interactive list message with selectable sections.
        POST /messages/list/{instanceName} — costs 1 token(s)
        """
        url = f"{self.base_url}/messages/list/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "title": "\"<title>\"",
            "description": "\"<description>\"",
            "buttonText": "\"Options\"",
            "footerText": "\"<footerText>\"",
            "sections": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_audio(instance_name, to, audio):
        """
        Send a native WhatsApp voice message (PTT) from an audio URL.
        POST /messages/audio/{instanceName} — costs 2 token(s)
        """
        url = f"{self.base_url}/messages/audio/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "audio": "\"<audio>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_sticker(instance_name, to, sticker):
        """
        Send a WhatsApp sticker from an image URL.
        POST /messages/sticker/{instanceName} — costs 2 token(s)
        """
        url = f"{self.base_url}/messages/sticker/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "to": "\"<to>\"",
            "sticker": "\"<sticker>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_status(instance_name, type, content, caption, backgroundColor, font, allContacts, statusJidList):
        """
        Post a status/story update (text, image, or audio).
        POST /messages/status/{instanceName} — costs 2 token(s)
        """
        url = f"{self.base_url}/messages/status/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "type": "\"text\"",
            "content": "\"<content>\"",
            "caption": "\"<caption>\"",
            "backgroundColor": "\"#008000\"",
            "font": "1",
            "allContacts": "true",
            "statusJidList": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def create_group(instance_name, subject, description, participants):
        """
        Create a new WhatsApp group with an initial participant list.
        POST /groups/create/{instanceName} — free
        """
        url = f"{self.base_url}/groups/create/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "subject": "\"<subject>\"",
            "description": "\"<description>\"",
            "participants": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def update_subject(instance_name, groupJid, subject):
        """
        Rename a group.
        POST /groups/update-subject/{instanceName} — free
        """
        url = f"{self.base_url}/groups/update-subject/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "subject": "\"<subject>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def update_description(instance_name, groupJid, description):
        """
        Change the group description.
        POST /groups/update-description/{instanceName} — free
        """
        url = f"{self.base_url}/groups/update-description/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "description": "\"<description>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def update_picture(instance_name, groupJid, image):
        """
        Set the group picture from an image URL.
        POST /groups/update-picture/{instanceName} — free
        """
        url = f"{self.base_url}/groups/update-picture/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "image": "\"<image>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def fetch_all_groups(instance_name, getParticipants):
        """
        List every group the instance belongs to.
        GET /groups/fetch-all/{instanceName} — free
        """
        url = f"{self.base_url}/groups/fetch-all/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "getParticipants": "false"
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def find_group(instance_name, groupJid):
        """
        Get info for a single group by JID.
        GET /groups/find/{instanceName} — free
        """
        url = f"{self.base_url}/groups/find/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def find_members(instance_name, groupJid):
        """
        List the members of a group.
        GET /groups/find-members/{instanceName} — free
        """
        url = f"{self.base_url}/groups/find-members/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def update_participant(instance_name, groupJid, action, participants):
        """
        Add, remove, promote or demote members.
        POST /groups/update-participant/{instanceName} — free
        """
        url = f"{self.base_url}/groups/update-participant/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "action": "\"add\"",
            "participants": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def invite_code(instance_name, groupJid):
        """
        Fetch the group invite code.
        GET /groups/invite-code/{instanceName} — free
        """
        url = f"{self.base_url}/groups/invite-code/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def revoke_invite(instance_name, groupJid):
        """
        Revoke and rotate the group invite code.
        POST /groups/revoke-invite/{instanceName} — free
        """
        url = f"{self.base_url}/groups/revoke-invite/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def find_by_invite(instance_name, inviteCode):
        """
        Look up group metadata from an invite code.
        GET /groups/find-by-invite/{instanceName} — free
        """
        url = f"{self.base_url}/groups/find-by-invite/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "inviteCode": "\"<inviteCode>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def accept_invite(instance_name, inviteCode):
        """
        Join a group via its invite code.
        GET /groups/accept-invite/{instanceName} — free
        """
        url = f"{self.base_url}/groups/accept-invite/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "inviteCode": "\"<inviteCode>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def send_invite(instance_name, groupJid, description, numbers):
        """
        Send a group invite link to numbers (as a message).
        POST /groups/send-invite/{instanceName} — free
        """
        url = f"{self.base_url}/groups/send-invite/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "description": "\"<description>\"",
            "numbers": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def leave_group(instance_name, groupJid):
        """
        Leave a group.
        DELETE /groups/leave/{instanceName} — free
        """
        url = f"{self.base_url}/groups/leave/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\""
        }
        resp = requests.delete(url, json=payload, headers=headers)
        return resp.json()

    def toggle_ephemeral(instance_name, groupJid, expiration):
        """
        Enable/disable disappearing messages. expiration = seconds (0 to disable).
        POST /groups/toggle-ephemeral/{instanceName} — free
        """
        url = f"{self.base_url}/groups/toggle-ephemeral/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "expiration": "604800"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def update_setting(instance_name, groupJid, action):
        """
        Toggle announcement / lock state.
        POST /groups/update-setting/{instanceName} — free
        """
        url = f"{self.base_url}/groups/update-setting/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "groupJid": "\"<groupJid>\"",
            "action": "\"announcement\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def mark_read(instance_name, readMessages):
        """
        Mark one or more messages as read.
        POST /chats/mark-read/{instanceName} — free
        """
        url = f"{self.base_url}/chats/mark-read/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "readMessages": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def mark_unread(instance_name, chat, lastMessage):
        """
        Mark a chat as unread.
        POST /chats/mark-unread/{instanceName} — free
        """
        url = f"{self.base_url}/chats/mark-unread/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "chat": "\"<chat>\"",
            "lastMessage": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def archive_chat(instance_name, chat, archive, lastMessage):
        """
        Archive or unarchive a chat.
        POST /chats/archive/{instanceName} — free
        """
        url = f"{self.base_url}/chats/archive/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "chat": "\"<chat>\"",
            "archive": "true",
            "lastMessage": "{}"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def send_presence(instance_name, number, options):
        """
        Broadcast a presence update (typing, online, etc.).
        POST /chats/presence/{instanceName} — free
        """
        url = f"{self.base_url}/chats/presence/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "number": "\"<number>\"",
            "options": "{}"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def delete_for_everyone(instance_name, id, remoteJid, fromMe, participant):
        """
        Delete a message for everyone in the chat.
        DELETE /chats/delete-for-everyone/{instanceName} — free
        """
        url = f"{self.base_url}/chats/delete-for-everyone/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "id": "\"<id>\"",
            "remoteJid": "\"<remoteJid>\"",
            "fromMe": "false",
            "participant": "\"<participant>\""
        }
        resp = requests.delete(url, json=payload, headers=headers)
        return resp.json()

    def update_message(instance_name, number, text, key):
        """
        Edit the text of a message you sent.
        POST /chats/update-message/{instanceName} — free
        """
        url = f"{self.base_url}/chats/update-message/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "number": "0",
            "text": "\"<text>\"",
            "key": "{}"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def find_chats(instance_name):
        """
        List all open chats.
        POST /chats/find-chats/{instanceName} — free
        """
        url = f"{self.base_url}/chats/find-chats/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.post(url, headers=headers)
        return resp.json()

    def find_contacts(instance_name, where):
        """
        Search contacts with optional filter.
        POST /chats/find-contacts/{instanceName} — free
        """
        url = f"{self.base_url}/chats/find-contacts/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "where": "{}"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def find_messages(instance_name, where):
        """
        Search messages with optional filter.
        POST /chats/find-messages/{instanceName} — free
        """
        url = f"{self.base_url}/chats/find-messages/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "where": "{}"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def find_status(instance_name, where, limit):
        """
        Search status updates.
        POST /chats/find-status/{instanceName} — free
        """
        url = f"{self.base_url}/chats/find-status/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "where": "{}",
            "limit": "10"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def is_whatsapp(instance_name, numbers):
        """
        Check which numbers are registered on WhatsApp.
        POST /chats/is-whatsapp/{instanceName} — free
        """
        url = f"{self.base_url}/chats/is-whatsapp/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "numbers": "[]"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def get_base64(instance_name, message, convertToMp4):
        """
        Retrieve media as base64 (for re-uploading or forwarding).
        POST /chats/base64/{instanceName} — free
        """
        url = f"{self.base_url}/chats/base64/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "message": "{}",
            "convertToMp4": "false"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def profile_pic_url(instance_name, number):
        """
        Get the profile picture URL for a number.
        GET /chats/profile-pic-url/{instanceName} — free
        """
        url = f"{self.base_url}/chats/profile-pic-url/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "number": "\"<number>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def fetch_profile(instance_name, number):
        """
        Fetch a contact's full profile by phone number.
        POST /profile/fetch/{instanceName} — free
        """
        url = f"{self.base_url}/profile/fetch/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "number": "\"<number>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def fetch_privacy(instance_name):
        """
        Fetch the instance owner's privacy settings.
        GET /profile/fetch-privacy/{instanceName} — free
        """
        url = f"{self.base_url}/profile/fetch-privacy/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def update_name(instance_name, name):
        """
        Update the display name shown to contacts.
        POST /profile/update-name/{instanceName} — free
        """
        url = f"{self.base_url}/profile/update-name/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "name": "\"<name>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def update_status(instance_name, status):
        """
        Update your WhatsApp status (bio text).
        POST /profile/update-status/{instanceName} — free
        """
        url = f"{self.base_url}/profile/update-status/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "status": "\"<status>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def update_picture(instance_name, picture):
        """
        Set your profile picture from an image URL.
        POST /profile/update-picture/{instanceName} — free
        """
        url = f"{self.base_url}/profile/update-picture/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "picture": "\"<picture>\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def remove_picture(instance_name):
        """
        Remove your profile picture.
        DELETE /profile/remove-picture/{instanceName} — free
        """
        url = f"{self.base_url}/profile/remove-picture/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.delete(url, headers=headers)
        return resp.json()

    def find_settings(instance_name):
        """
        Fetch the current instance settings.
        GET /settings/find/{instanceName} — free
        """
        url = f"{self.base_url}/settings/find/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def set_settings(instance_name, rejectCall, msgCall, groupsIgnore, alwaysOnline, readMessages, readStatus, syncFullHistory):
        """
        Update instance settings (call rejection, online status, history sync, etc.).
        POST /settings/set/{instanceName} — free
        """
        url = f"{self.base_url}/settings/set/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "rejectCall": "false",
            "msgCall": "\"<msgCall>\"",
            "groupsIgnore": "false",
            "alwaysOnline": "false",
            "readMessages": "false",
            "readStatus": "false",
            "syncFullHistory": "false"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def connection_state(instance_name):
        """
        Get the current connection state and phone number.
        GET /instance/connection-state/{instanceName} — free
        """
        url = f"{self.base_url}/instance/connection-state/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()

    def connect___qr(instance_name, number):
        """
        Generate a new QR code and start the WhatsApp session. Use /instance/connection-state to poll until connected.
        GET /instance/connect/{instanceName} — free
        """
        url = f"{self.base_url}/instance/connect/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "number": "\"<number>\""
        }
        resp = requests.get(url, json=payload, headers=headers)
        return resp.json()

    def restart(instance_name, confirm):
        """
        Restart the WhatsApp session. Requires {"confirm":true} in the body or X-Confirm-Restart: true header — 428 otherwise.
        POST /instance/restart/{instanceName} — free
        """
        url = f"{self.base_url}/instance/restart/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "confirm": "true"
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def logout(instance_name):
        """
        Disconnect and log out of the WhatsApp session.
        DELETE /instance/logout/{instanceName} — free
        """
        url = f"{self.base_url}/instance/logout/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.delete(url, headers=headers)
        return resp.json()

    def set_presence(instance_name, presence):
        """
        Broadcast your presence (available or unavailable).
        POST /instance/set-presence/{instanceName} — free
        """
        url = f"{self.base_url}/instance/set-presence/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        payload = {
            "presence": "\"available\""
        }
        resp = requests.post(url, json=payload, headers=headers)
        return resp.json()

    def fetch_qr(instance_name):
        """
        Fetch the current QR code without triggering a new connection. Returns 204 if no QR is pending.
        GET /instance/qr/{instanceName} — free
        """
        url = f"{self.base_url}/instance/qr/{instanceName}"
        headers = {'X-API-Key': self.api_key, 'Content-Type': 'application/json'}
        resp = requests.get(url, headers=headers)
        return resp.json()
