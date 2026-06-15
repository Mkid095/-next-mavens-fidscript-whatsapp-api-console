<?php
/**
 * FIDScript WhatsApp API — PHP SDK
 * Generated 2026-06-15T11:47:25.189Z
 * Base: https://whatsapp.fidscript.com/api/v1
 *
 * Usage:
 *   require_once 'fidscript.php';
 *   $api = new Fidscript('fidscript_live_...');
 *   $api->sendText('my-instance', '254700000000', 'Hello!');
 */

class Fidscript {
  private string $baseUrl = 'https://whatsapp.fidscript.com/api/v1';
  private string $apiKey;

  public function __construct(string $apiKey) {
    if (!$apiKey) throw new \InvalidArgumentException('apiKey required');
    $this->apiKey = $apiKey;
  }

  /**
   * Confirm an API key is active and resolve the owning client. No side effects — ideal for a connection test.
   * GET /whoami — free
   */
  public function validateKey($instanceName)
  {
    $url = $this->baseUrl . '/whoami';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Aggregate API usage for the authenticated client: requests today/this month, sends this month, token spend, and failed requests.
   * GET /usage — free
   */
  public function usageAnalytics($instanceName)
  {
    $url = $this->baseUrl . '/usage';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * The machine-readable OpenAPI 3.0 document for the entire API. Import into Postman, Insomnia, or an AI agent. A YAML mirror is at /api/v1/openapi.yaml.
   * GET /openapi.json — free
   */
  public function openAPISpec($instanceName)
  {
    $url = $this->baseUrl . '/openapi.json';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send a plain-text WhatsApp message.
   * POST /messages/text/{instanceName} — costs 1 token(s)
   */
  public function sendText($instanceName, $to, $message)
  {
    $url = $this->baseUrl . '/messages/text/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","message":"\"<message>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send an image, video, document or audio file by URL.
   * POST /messages/media/{instanceName} — costs 2 token(s)
   */
  public function sendMedia($instanceName, $to, $media_url, $media_type, $caption)
  {
    $url = $this->baseUrl . '/messages/media/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","media_url":"\"<media_url>\"","media_type":"\"image\"","caption":"\"<caption>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Share a geographic location pin.
   * POST /messages/location/{instanceName} — costs 1 token(s)
   */
  public function sendLocation($instanceName, $to, $latitude, $longitude, $name, $address)
  {
    $url = $this->baseUrl . '/messages/location/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","latitude":"0","longitude":"0","name":"\"<name>\"","address":"\"<address>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Share one or more contact cards.
   * POST /messages/contact/{instanceName} — costs 1 token(s)
   */
  public function sendContact($instanceName, $to, $contact)
  {
    $url = $this->baseUrl . '/messages/contact/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","contact":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * React to an existing message (emoji).
   * POST /messages/reaction/{instanceName} — costs 1 token(s)
   */
  public function sendReaction($instanceName, $to, $key, $reaction)
  {
    $url = $this->baseUrl . '/messages/reaction/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","key":"{}","reaction":"\"<reaction>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send an interactive poll.
   * POST /messages/poll/{instanceName} — costs 1 token(s)
   */
  public function sendPoll($instanceName, $to, $name, $selectableCount, $values)
  {
    $url = $this->baseUrl . '/messages/poll/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","name":"\"<name>\"","selectableCount":"1","values":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send an interactive list message with selectable sections.
   * POST /messages/list/{instanceName} — costs 1 token(s)
   */
  public function sendList($instanceName, $to, $title, $description, $buttonText, $footerText, $sections)
  {
    $url = $this->baseUrl . '/messages/list/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","title":"\"<title>\"","description":"\"<description>\"","buttonText":"\"Options\"","footerText":"\"<footerText>\"","sections":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send a native WhatsApp voice message (PTT) from an audio URL.
   * POST /messages/audio/{instanceName} — costs 2 token(s)
   */
  public function sendAudio($instanceName, $to, $audio)
  {
    $url = $this->baseUrl . '/messages/audio/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","audio":"\"<audio>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send a WhatsApp sticker from an image URL.
   * POST /messages/sticker/{instanceName} — costs 2 token(s)
   */
  public function sendSticker($instanceName, $to, $sticker)
  {
    $url = $this->baseUrl . '/messages/sticker/{instanceName}';
    $payload = json_encode({"to":"\"<to>\"","sticker":"\"<sticker>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Post a status/story update (text, image, or audio).
   * POST /messages/status/{instanceName} — costs 2 token(s)
   */
  public function sendStatus($instanceName, $type, $content, $caption, $backgroundColor, $font, $allContacts, $statusJidList)
  {
    $url = $this->baseUrl . '/messages/status/{instanceName}';
    $payload = json_encode({"type":"\"text\"","content":"\"<content>\"","caption":"\"<caption>\"","backgroundColor":"\"#008000\"","font":"1","allContacts":"true","statusJidList":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Create a new WhatsApp group with an initial participant list.
   * POST /groups/create/{instanceName} — free
   */
  public function createGroup($instanceName, $subject, $description, $participants)
  {
    $url = $this->baseUrl . '/groups/create/{instanceName}';
    $payload = json_encode({"subject":"\"<subject>\"","description":"\"<description>\"","participants":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Rename a group.
   * POST /groups/update-subject/{instanceName} — free
   */
  public function updateSubject($instanceName, $groupJid, $subject)
  {
    $url = $this->baseUrl . '/groups/update-subject/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","subject":"\"<subject>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Change the group description.
   * POST /groups/update-description/{instanceName} — free
   */
  public function updateDescription($instanceName, $groupJid, $description)
  {
    $url = $this->baseUrl . '/groups/update-description/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","description":"\"<description>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Set the group picture from an image URL.
   * POST /groups/update-picture/{instanceName} — free
   */
  public function updatePicture($instanceName, $groupJid, $image)
  {
    $url = $this->baseUrl . '/groups/update-picture/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","image":"\"<image>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * List every group the instance belongs to.
   * GET /groups/fetch-all/{instanceName} — free
   */
  public function fetchAllGroups($instanceName, $getParticipants)
  {
    $url = $this->baseUrl . '/groups/fetch-all/{instanceName}';
    $payload = json_encode({"getParticipants":"false"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Get info for a single group by JID.
   * GET /groups/find/{instanceName} — free
   */
  public function findGroup($instanceName, $groupJid)
  {
    $url = $this->baseUrl . '/groups/find/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * List the members of a group.
   * GET /groups/find-members/{instanceName} — free
   */
  public function findMembers($instanceName, $groupJid)
  {
    $url = $this->baseUrl . '/groups/find-members/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Add, remove, promote or demote members.
   * POST /groups/update-participant/{instanceName} — free
   */
  public function updateParticipant($instanceName, $groupJid, $action, $participants)
  {
    $url = $this->baseUrl . '/groups/update-participant/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","action":"\"add\"","participants":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Fetch the group invite code.
   * GET /groups/invite-code/{instanceName} — free
   */
  public function inviteCode($instanceName, $groupJid)
  {
    $url = $this->baseUrl . '/groups/invite-code/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Revoke and rotate the group invite code.
   * POST /groups/revoke-invite/{instanceName} — free
   */
  public function revokeInvite($instanceName, $groupJid)
  {
    $url = $this->baseUrl . '/groups/revoke-invite/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Look up group metadata from an invite code.
   * GET /groups/find-by-invite/{instanceName} — free
   */
  public function findByInvite($instanceName, $inviteCode)
  {
    $url = $this->baseUrl . '/groups/find-by-invite/{instanceName}';
    $payload = json_encode({"inviteCode":"\"<inviteCode>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Join a group via its invite code.
   * GET /groups/accept-invite/{instanceName} — free
   */
  public function acceptInvite($instanceName, $inviteCode)
  {
    $url = $this->baseUrl . '/groups/accept-invite/{instanceName}';
    $payload = json_encode({"inviteCode":"\"<inviteCode>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Send a group invite link to numbers (as a message).
   * POST /groups/send-invite/{instanceName} — free
   */
  public function sendInvite($instanceName, $groupJid, $description, $numbers)
  {
    $url = $this->baseUrl . '/groups/send-invite/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","description":"\"<description>\"","numbers":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Leave a group.
   * DELETE /groups/leave/{instanceName} — free
   */
  public function leaveGroup($instanceName, $groupJid)
  {
    $url = $this->baseUrl . '/groups/leave/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'DELETE',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Enable/disable disappearing messages. expiration = seconds (0 to disable).
   * POST /groups/toggle-ephemeral/{instanceName} — free
   */
  public function toggleEphemeral($instanceName, $groupJid, $expiration)
  {
    $url = $this->baseUrl . '/groups/toggle-ephemeral/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","expiration":"604800"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Toggle announcement / lock state.
   * POST /groups/update-setting/{instanceName} — free
   */
  public function updateSetting($instanceName, $groupJid, $action)
  {
    $url = $this->baseUrl . '/groups/update-setting/{instanceName}';
    $payload = json_encode({"groupJid":"\"<groupJid>\"","action":"\"announcement\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Mark one or more messages as read.
   * POST /chats/mark-read/{instanceName} — free
   */
  public function markRead($instanceName, $readMessages)
  {
    $url = $this->baseUrl . '/chats/mark-read/{instanceName}';
    $payload = json_encode({"readMessages":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Mark a chat as unread.
   * POST /chats/mark-unread/{instanceName} — free
   */
  public function markUnread($instanceName, $chat, $lastMessage)
  {
    $url = $this->baseUrl . '/chats/mark-unread/{instanceName}';
    $payload = json_encode({"chat":"\"<chat>\"","lastMessage":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Archive or unarchive a chat.
   * POST /chats/archive/{instanceName} — free
   */
  public function archiveChat($instanceName, $chat, $archive, $lastMessage)
  {
    $url = $this->baseUrl . '/chats/archive/{instanceName}';
    $payload = json_encode({"chat":"\"<chat>\"","archive":"true","lastMessage":"{}"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Broadcast a presence update (typing, online, etc.).
   * POST /chats/presence/{instanceName} — free
   */
  public function sendPresence($instanceName, $number, $options)
  {
    $url = $this->baseUrl . '/chats/presence/{instanceName}';
    $payload = json_encode({"number":"\"<number>\"","options":"{}"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Delete a message for everyone in the chat.
   * DELETE /chats/delete-for-everyone/{instanceName} — free
   */
  public function deleteforEveryone($instanceName, $id, $remoteJid, $fromMe, $participant)
  {
    $url = $this->baseUrl . '/chats/delete-for-everyone/{instanceName}';
    $payload = json_encode({"id":"\"<id>\"","remoteJid":"\"<remoteJid>\"","fromMe":"false","participant":"\"<participant>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'DELETE',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Edit the text of a message you sent.
   * POST /chats/update-message/{instanceName} — free
   */
  public function updateMessage($instanceName, $number, $text, $key)
  {
    $url = $this->baseUrl . '/chats/update-message/{instanceName}';
    $payload = json_encode({"number":"0","text":"\"<text>\"","key":"{}"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * List all open chats.
   * POST /chats/find-chats/{instanceName} — free
   */
  public function findChats($instanceName)
  {
    $url = $this->baseUrl . '/chats/find-chats/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Search contacts with optional filter.
   * POST /chats/find-contacts/{instanceName} — free
   */
  public function findContacts($instanceName, $where)
  {
    $url = $this->baseUrl . '/chats/find-contacts/{instanceName}';
    $payload = json_encode({"where":"{}"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Search messages with optional filter.
   * POST /chats/find-messages/{instanceName} — free
   */
  public function findMessages($instanceName, $where)
  {
    $url = $this->baseUrl . '/chats/find-messages/{instanceName}';
    $payload = json_encode({"where":"{}"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Search status updates.
   * POST /chats/find-status/{instanceName} — free
   */
  public function findStatus($instanceName, $where, $limit)
  {
    $url = $this->baseUrl . '/chats/find-status/{instanceName}';
    $payload = json_encode({"where":"{}","limit":"10"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Check which numbers are registered on WhatsApp.
   * POST /chats/is-whatsapp/{instanceName} — free
   */
  public function isWhatsApp($instanceName, $numbers)
  {
    $url = $this->baseUrl . '/chats/is-whatsapp/{instanceName}';
    $payload = json_encode({"numbers":"[]"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Retrieve media as base64 (for re-uploading or forwarding).
   * POST /chats/base64/{instanceName} — free
   */
  public function getBase64($instanceName, $message, $convertToMp4)
  {
    $url = $this->baseUrl . '/chats/base64/{instanceName}';
    $payload = json_encode({"message":"{}","convertToMp4":"false"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Get the profile picture URL for a number.
   * GET /chats/profile-pic-url/{instanceName} — free
   */
  public function profilePicURL($instanceName, $number)
  {
    $url = $this->baseUrl . '/chats/profile-pic-url/{instanceName}';
    $payload = json_encode({"number":"\"<number>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Fetch a contact's full profile by phone number.
   * POST /profile/fetch/{instanceName} — free
   */
  public function fetchProfile($instanceName, $number)
  {
    $url = $this->baseUrl . '/profile/fetch/{instanceName}';
    $payload = json_encode({"number":"\"<number>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Fetch the instance owner's privacy settings.
   * GET /profile/fetch-privacy/{instanceName} — free
   */
  public function fetchPrivacy($instanceName)
  {
    $url = $this->baseUrl . '/profile/fetch-privacy/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Update the display name shown to contacts.
   * POST /profile/update-name/{instanceName} — free
   */
  public function updateName($instanceName, $name)
  {
    $url = $this->baseUrl . '/profile/update-name/{instanceName}';
    $payload = json_encode({"name":"\"<name>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Update your WhatsApp status (bio text).
   * POST /profile/update-status/{instanceName} — free
   */
  public function updateStatus($instanceName, $status)
  {
    $url = $this->baseUrl . '/profile/update-status/{instanceName}';
    $payload = json_encode({"status":"\"<status>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Set your profile picture from an image URL.
   * POST /profile/update-picture/{instanceName} — free
   */
  public function updatePicture($instanceName, $picture)
  {
    $url = $this->baseUrl . '/profile/update-picture/{instanceName}';
    $payload = json_encode({"picture":"\"<picture>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Remove your profile picture.
   * DELETE /profile/remove-picture/{instanceName} — free
   */
  public function removePicture($instanceName)
  {
    $url = $this->baseUrl . '/profile/remove-picture/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'DELETE',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Fetch the current instance settings.
   * GET /settings/find/{instanceName} — free
   */
  public function findSettings($instanceName)
  {
    $url = $this->baseUrl . '/settings/find/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Update instance settings (call rejection, online status, history sync, etc.).
   * POST /settings/set/{instanceName} — free
   */
  public function setSettings($instanceName, $rejectCall, $msgCall, $groupsIgnore, $alwaysOnline, $readMessages, $readStatus, $syncFullHistory)
  {
    $url = $this->baseUrl . '/settings/set/{instanceName}';
    $payload = json_encode({"rejectCall":"false","msgCall":"\"<msgCall>\"","groupsIgnore":"false","alwaysOnline":"false","readMessages":"false","readStatus":"false","syncFullHistory":"false"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Get the current connection state and phone number.
   * GET /instance/connection-state/{instanceName} — free
   */
  public function connectionState($instanceName)
  {
    $url = $this->baseUrl . '/instance/connection-state/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Generate a new QR code and start the WhatsApp session. Use /instance/connection-state to poll until connected.
   * GET /instance/connect/{instanceName} — free
   */
  public function connectQR($instanceName, $number)
  {
    $url = $this->baseUrl . '/instance/connect/{instanceName}';
    $payload = json_encode({"number":"\"<number>\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Restart the WhatsApp session. Requires {"confirm":true} in the body or X-Confirm-Restart: true header — 428 otherwise.
   * POST /instance/restart/{instanceName} — free
   */
  public function restart($instanceName, $confirm)
  {
    $url = $this->baseUrl . '/instance/restart/{instanceName}';
    $payload = json_encode({"confirm":"true"});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Disconnect and log out of the WhatsApp session.
   * DELETE /instance/logout/{instanceName} — free
   */
  public function logout($instanceName)
  {
    $url = $this->baseUrl . '/instance/logout/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'DELETE',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Broadcast your presence (available or unavailable).
   * POST /instance/set-presence/{instanceName} — free
   */
  public function setPresence($instanceName, $presence)
  {
    $url = $this->baseUrl . '/instance/set-presence/{instanceName}';
    $payload = json_encode({"presence":"\"available\""});
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey, 'Content-Type: application/json'],
      CURLOPT_POSTFIELDS => $payload
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  /**
   * Fetch the current QR code without triggering a new connection. Returns 204 if no QR is pending.
   * GET /instance/qr/{instanceName} — free
   */
  public function fetchQR($instanceName)
  {
    $url = $this->baseUrl . '/instance/qr/{instanceName}';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => ['X-API-Key: ' . $this->apiKey]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
}
