package fidscript

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
  "time"
)

// Client is the FIDScript WhatsApp API client.
// Generated 2026-06-15T11:47:25.190Z.
type Client struct {
  baseUrl string
  apiKey  string
  http    *http.Client
}

func New(apiKey string) *Client {
  return &Client{
    baseUrl: "https://whatsapp.fidscript.com/api/v1",
    apiKey:  apiKey,
    http:    &http.Client{Timeout: 30 * time.Second},
  }
}

// Confirm an API key is active and resolve the owning client. No side effects — ideal for a connection test.
// GET /whoami — free
func (c *Client) validate_key() (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/whoami", c.baseUrl)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Aggregate API usage for the authenticated client: requests today/this month, sends this month, token spend, and failed requests.
// GET /usage — free
func (c *Client) usage_analytics() (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/usage", c.baseUrl)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// The machine-readable OpenAPI 3.0 document for the entire API. Import into Postman, Insomnia, or an AI agent. A YAML mirror is at /api/v1/openapi.yaml.
// GET /openapi.json — free
func (c *Client) open_a_p_i_spec() (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/openapi.json", c.baseUrl)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send a plain-text WhatsApp message.
// POST /messages/text/{instanceName} — costs 1 token(s)
func (c *Client) send_text(instanceName string, to string, message string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/text/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "message": message})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send an image, video, document or audio file by URL.
// POST /messages/media/{instanceName} — costs 2 token(s)
func (c *Client) send_media(instanceName string, to string, media_url string, media_type string, caption string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/media/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "media_url": media_url, "media_type": media_type, "caption": caption})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Share a geographic location pin.
// POST /messages/location/{instanceName} — costs 1 token(s)
func (c *Client) send_location(instanceName string, to string, latitude string, longitude string, name string, address string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/location/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "latitude": latitude, "longitude": longitude, "name": name, "address": address})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Share one or more contact cards.
// POST /messages/contact/{instanceName} — costs 1 token(s)
func (c *Client) send_contact(instanceName string, to string, contact string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/contact/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "contact": contact})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// React to an existing message (emoji).
// POST /messages/reaction/{instanceName} — costs 1 token(s)
func (c *Client) send_reaction(instanceName string, to string, key string, reaction string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/reaction/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "key": key, "reaction": reaction})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send an interactive poll.
// POST /messages/poll/{instanceName} — costs 1 token(s)
func (c *Client) send_poll(instanceName string, to string, name string, selectableCount string, values string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/poll/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "name": name, "selectableCount": selectableCount, "values": values})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send an interactive list message with selectable sections.
// POST /messages/list/{instanceName} — costs 1 token(s)
func (c *Client) send_list(instanceName string, to string, title string, description string, buttonText string, footerText string, sections string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/list/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "title": title, "description": description, "buttonText": buttonText, "footerText": footerText, "sections": sections})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send a native WhatsApp voice message (PTT) from an audio URL.
// POST /messages/audio/{instanceName} — costs 2 token(s)
func (c *Client) send_audio(instanceName string, to string, audio string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/audio/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "audio": audio})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send a WhatsApp sticker from an image URL.
// POST /messages/sticker/{instanceName} — costs 2 token(s)
func (c *Client) send_sticker(instanceName string, to string, sticker string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/sticker/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"to": to, "sticker": sticker})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Post a status/story update (text, image, or audio).
// POST /messages/status/{instanceName} — costs 2 token(s)
func (c *Client) send_status(instanceName string, type string, content string, caption string, backgroundColor string, font string, allContacts string, statusJidList string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/messages/status/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"type": type, "content": content, "caption": caption, "backgroundColor": backgroundColor, "font": font, "allContacts": allContacts, "statusJidList": statusJidList})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Create a new WhatsApp group with an initial participant list.
// POST /groups/create/{instanceName} — free
func (c *Client) create_group(instanceName string, subject string, description string, participants string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/create/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"subject": subject, "description": description, "participants": participants})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Rename a group.
// POST /groups/update-subject/{instanceName} — free
func (c *Client) update_subject(instanceName string, groupJid string, subject string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/update-subject/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "subject": subject})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Change the group description.
// POST /groups/update-description/{instanceName} — free
func (c *Client) update_description(instanceName string, groupJid string, description string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/update-description/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "description": description})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Set the group picture from an image URL.
// POST /groups/update-picture/{instanceName} — free
func (c *Client) update_picture(instanceName string, groupJid string, image string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/update-picture/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "image": image})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// List every group the instance belongs to.
// GET /groups/fetch-all/{instanceName} — free
func (c *Client) fetch_all_groups(instanceName string, getParticipants string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/fetch-all/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"getParticipants": getParticipants})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Get info for a single group by JID.
// GET /groups/find/{instanceName} — free
func (c *Client) find_group(instanceName string, groupJid string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/find/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// List the members of a group.
// GET /groups/find-members/{instanceName} — free
func (c *Client) find_members(instanceName string, groupJid string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/find-members/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Add, remove, promote or demote members.
// POST /groups/update-participant/{instanceName} — free
func (c *Client) update_participant(instanceName string, groupJid string, action string, participants string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/update-participant/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "action": action, "participants": participants})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Fetch the group invite code.
// GET /groups/invite-code/{instanceName} — free
func (c *Client) invite_code(instanceName string, groupJid string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/invite-code/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Revoke and rotate the group invite code.
// POST /groups/revoke-invite/{instanceName} — free
func (c *Client) revoke_invite(instanceName string, groupJid string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/revoke-invite/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Look up group metadata from an invite code.
// GET /groups/find-by-invite/{instanceName} — free
func (c *Client) find_by_invite(instanceName string, inviteCode string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/find-by-invite/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"inviteCode": inviteCode})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Join a group via its invite code.
// GET /groups/accept-invite/{instanceName} — free
func (c *Client) accept_invite(instanceName string, inviteCode string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/accept-invite/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"inviteCode": inviteCode})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Send a group invite link to numbers (as a message).
// POST /groups/send-invite/{instanceName} — free
func (c *Client) send_invite(instanceName string, groupJid string, description string, numbers string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/send-invite/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "description": description, "numbers": numbers})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Leave a group.
// DELETE /groups/leave/{instanceName} — free
func (c *Client) leave_group(instanceName string, groupJid string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/leave/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid})
  req, _ := http.NewRequest("DELETE", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Enable/disable disappearing messages. expiration = seconds (0 to disable).
// POST /groups/toggle-ephemeral/{instanceName} — free
func (c *Client) toggle_ephemeral(instanceName string, groupJid string, expiration string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/toggle-ephemeral/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "expiration": expiration})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Toggle announcement / lock state.
// POST /groups/update-setting/{instanceName} — free
func (c *Client) update_setting(instanceName string, groupJid string, action string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/groups/update-setting/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"groupJid": groupJid, "action": action})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Mark one or more messages as read.
// POST /chats/mark-read/{instanceName} — free
func (c *Client) mark_read(instanceName string, readMessages string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/mark-read/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"readMessages": readMessages})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Mark a chat as unread.
// POST /chats/mark-unread/{instanceName} — free
func (c *Client) mark_unread(instanceName string, chat string, lastMessage string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/mark-unread/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"chat": chat, "lastMessage": lastMessage})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Archive or unarchive a chat.
// POST /chats/archive/{instanceName} — free
func (c *Client) archive_chat(instanceName string, chat string, archive string, lastMessage string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/archive/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"chat": chat, "archive": archive, "lastMessage": lastMessage})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Broadcast a presence update (typing, online, etc.).
// POST /chats/presence/{instanceName} — free
func (c *Client) send_presence(instanceName string, number string, options string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/presence/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"number": number, "options": options})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Delete a message for everyone in the chat.
// DELETE /chats/delete-for-everyone/{instanceName} — free
func (c *Client) delete_for_everyone(instanceName string, id string, remoteJid string, fromMe string, participant string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/delete-for-everyone/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"id": id, "remoteJid": remoteJid, "fromMe": fromMe, "participant": participant})
  req, _ := http.NewRequest("DELETE", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Edit the text of a message you sent.
// POST /chats/update-message/{instanceName} — free
func (c *Client) update_message(instanceName string, number string, text string, key string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/update-message/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"number": number, "text": text, "key": key})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// List all open chats.
// POST /chats/find-chats/{instanceName} — free
func (c *Client) find_chats(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/find-chats/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("POST", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Search contacts with optional filter.
// POST /chats/find-contacts/{instanceName} — free
func (c *Client) find_contacts(instanceName string, where string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/find-contacts/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"where": where})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Search messages with optional filter.
// POST /chats/find-messages/{instanceName} — free
func (c *Client) find_messages(instanceName string, where string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/find-messages/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"where": where})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Search status updates.
// POST /chats/find-status/{instanceName} — free
func (c *Client) find_status(instanceName string, where string, limit string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/find-status/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"where": where, "limit": limit})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Check which numbers are registered on WhatsApp.
// POST /chats/is-whatsapp/{instanceName} — free
func (c *Client) is_whats_app(instanceName string, numbers string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/is-whatsapp/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"numbers": numbers})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Retrieve media as base64 (for re-uploading or forwarding).
// POST /chats/base64/{instanceName} — free
func (c *Client) get_base64(instanceName string, message string, convertToMp4 string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/base64/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"message": message, "convertToMp4": convertToMp4})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Get the profile picture URL for a number.
// GET /chats/profile-pic-url/{instanceName} — free
func (c *Client) profile_pic_u_r_l(instanceName string, number string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/chats/profile-pic-url/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"number": number})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Fetch a contact's full profile by phone number.
// POST /profile/fetch/{instanceName} — free
func (c *Client) fetch_profile(instanceName string, number string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/profile/fetch/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"number": number})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Fetch the instance owner's privacy settings.
// GET /profile/fetch-privacy/{instanceName} — free
func (c *Client) fetch_privacy(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/profile/fetch-privacy/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Update the display name shown to contacts.
// POST /profile/update-name/{instanceName} — free
func (c *Client) update_name(instanceName string, name string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/profile/update-name/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"name": name})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Update your WhatsApp status (bio text).
// POST /profile/update-status/{instanceName} — free
func (c *Client) update_status(instanceName string, status string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/profile/update-status/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"status": status})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Set your profile picture from an image URL.
// POST /profile/update-picture/{instanceName} — free
func (c *Client) update_picture(instanceName string, picture string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/profile/update-picture/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"picture": picture})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Remove your profile picture.
// DELETE /profile/remove-picture/{instanceName} — free
func (c *Client) remove_picture(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/profile/remove-picture/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("DELETE", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Fetch the current instance settings.
// GET /settings/find/{instanceName} — free
func (c *Client) find_settings(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/settings/find/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Update instance settings (call rejection, online status, history sync, etc.).
// POST /settings/set/{instanceName} — free
func (c *Client) set_settings(instanceName string, rejectCall string, msgCall string, groupsIgnore string, alwaysOnline string, readMessages string, readStatus string, syncFullHistory string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/settings/set/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"rejectCall": rejectCall, "msgCall": msgCall, "groupsIgnore": groupsIgnore, "alwaysOnline": alwaysOnline, "readMessages": readMessages, "readStatus": readStatus, "syncFullHistory": syncFullHistory})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Get the current connection state and phone number.
// GET /instance/connection-state/{instanceName} — free
func (c *Client) connection_state(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/instance/connection-state/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Generate a new QR code and start the WhatsApp session. Use /instance/connection-state to poll until connected.
// GET /instance/connect/{instanceName} — free
func (c *Client) connect_q_r(instanceName string, number string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/instance/connect/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"number": number})
  req, _ := http.NewRequest("GET", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Restart the WhatsApp session. Requires {"confirm":true} in the body or X-Confirm-Restart: true header — 428 otherwise.
// POST /instance/restart/{instanceName} — free
func (c *Client) restart(instanceName string, confirm string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/instance/restart/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"confirm": confirm})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Disconnect and log out of the WhatsApp session.
// DELETE /instance/logout/{instanceName} — free
func (c *Client) logout(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/instance/logout/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("DELETE", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Broadcast your presence (available or unavailable).
// POST /instance/set-presence/{instanceName} — free
func (c *Client) set_presence(instanceName string, presence string) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/instance/set-presence/{instanceName}", c.baseUrl, instanceName)
  payload, _ := json.Marshal(map[string]interface{}{"presence": presence})
  req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
  req.Header.Set("X-API-Key", c.apiKey)
  req.Header.Set("Content-Type", "application/json")
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
// Fetch the current QR code without triggering a new connection. Returns 204 if no QR is pending.
// GET /instance/qr/{instanceName} — free
func (c *Client) fetch_q_r(instanceName string, ) (map[string]interface{}, error) {
  url := fmt.Sprintf("%s/instance/qr/{instanceName}", c.baseUrl, instanceName)
  
  req, _ := http.NewRequest("GET", url, nil)
  req.Header.Set("X-API-Key", c.apiKey)
  
  resp, err := c.http.Do(req)
  if err != nil { return nil, err }
  defer resp.Body.Close()
  var result map[string]interface{}
  json.NewDecoder(resp.Body).Decode(&result)
  return result, nil
}
