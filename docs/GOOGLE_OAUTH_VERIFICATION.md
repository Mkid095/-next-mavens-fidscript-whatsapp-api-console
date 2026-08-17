# Google OAuth Verification - Submission Guide

**App:** FIDScript WhatsApp API
**Company:** Next Mavens
**OAuth Client ID:** `1061823471277-09ha2u8o4vlbfa10es0d268v6p29u1m9.apps.googleusercontent.com`
**Submitted scopes:** `https://www.googleapis.com/auth/contacts.readonly`, `openid`, `https://www.googleapis.com/auth/userinfo.profile`, `https://www.googleapis.com/auth/userinfo.email`

---

## Step-by-step in Google Cloud Console

### 1. Configure OAuth consent screen
URL: https://console.cloud.google.com/apis/credentials/consent

**App information:**
- App name: **FIDScript - WhatsApp API by Next Mavens**
- User support email: **info@nextmavens.com**
- App logo: upload a square logo (preferably 120x120 PNG)

**App domain (CRITICAL):**
- Application home page: **https://whatsapp.fidscript.com**
- Application privacy policy link: **https://whatsapp.fidscript.com/privacy**
- Application terms of service link: **https://whatsapp.fidscript.com/terms**
- Authorized domains: **fidscript.com**

**Developer contact information:**
- Email addresses: **info@nextmavens.com** (and any backup emails)

### 2. Declare Scopes
Click "Add or remove scopes" → ensure these are listed:
- `https://www.googleapis.com/auth/contacts.readonly` ✓
- `https://www.googleapis.com/auth/userinfo.profile` ✓
- `https://www.googleapis.com/auth/userinfo.email` ✓
- `openid` ✓

### 3. App Domain Verification (one-time, separate from OAuth verification)
1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://whatsapp.fidscript.com` (use URL prefix method)
3. Verify ownership via DNS TXT record (recommended) or HTML file upload
4. Without this, Google cannot verify you own the domain → verification fails

DNS TXT record method:
```
Type: TXT
Host: @ (or root domain)
Value: (the token Google gives you in Search Console)
```

### 4. Submit for Verification
1. Click **Submit for verification** button
2. Fill in the form using the text below
3. Google will email you follow-up questions - respond within 7 days

---

## Justification Text (paste into Google's form)

### Why do you need access to user's Google Contacts?

> FIDScript is a WhatsApp Business API platform built by Next Mavens for businesses in Africa. When a customer imports their Google Contacts into FIDScript, they can quickly select recipients from their address book when sending WhatsApp outreach or campaign messages - instead of manually re-entering every phone number.
>
> The contacts data is used exclusively within FIDScript's interface to populate the recipient picker. We do not transfer Google Contacts data to any third party, advertising network, or data broker. We do not use it for advertising, retargeting, or any purpose other than the recipient-selection feature.
>
> Example user flow:
> 1. User logs into FIDScript with their account
> 2. User clicks "Import Contacts" → "Link Google Account"
> 3. Google consent screen shows FIDScript requests access to read their contacts
> 4. User approves
> 5. FIDScript fetches the contact list and shows it to the user
> 6. User selects which contacts to import as WhatsApp recipients
> 7. User can later use those contacts to send WhatsApp messages
> 8. User can revoke access anytime via myaccount.google.com/permissions

### Will you use the data for advertising?

> **No.** FIDScript does not display advertising. We do not share Google Contacts data with any advertising network, data broker, or third party for advertising purposes. Our use is strictly limited to the contact-import feature described above.

### How is the data stored?

> Encrypted at rest using AES-256-GCM encryption. The encryption keys are stored separately from the encrypted tokens. We retain imported contacts only as long as the user's FIDScript account is active, or until they delete them or unlink their Google account.

### Will data be transferred to third parties?

> **No.** Imported Google Contacts are stored only in our internal database and used within FIDScript. We do not sell, lease, share, or transfer Google Contacts data to any third party under any circumstance.

### How does the user revoke access?

> Two ways:
> 1. Click "Unlink Google Account" inside FIDScript at `/client/contacts`
> 2. Visit https://myaccount.google.com/permissions and revoke FIDScript's access directly from their Google account

### Compliance with Google API Services User Data Policy

> Our use of data received from Google APIs adheres to the **Google API Services User Data Policy**, including the **Limited Use requirements**:
> - We do not transfer Google user data to third parties except as necessary to provide our service
> - We do not use Google user data for advertising
> - We do not use Google user data for tracking across services
> - We do not use Google user data for determining creditworthiness
> - We only request the minimum scopes necessary (read-only contacts)

### Where is data stored?

> Encrypted at rest on servers located in Kenya (East Africa). Some third-party processors (Resend for email delivery) may process ancillary data outside Kenya. The Google Contacts data itself never leaves our infrastructure.

---

## Step 5: Respond to follow-up emails

Google typically emails you within 2-5 business days asking for:
- A demo video of the OAuth flow
- Screenshots of the consent screen users see
- Confirmation that you've tested the flow yourself

**Demo video checklist:**
- [ ] Show the user logged into FIDScript
- [ ] Click "Import Contacts" → "Link Google Account"
- [ ] Show Google's consent screen with FIDScript name, logo, scopes
- [ ] Show approval → contacts being imported
- [ ] Show the "Unlink" button and where the data is stored

If they ask for "**demonstration of how the data is used**":
- Record a 60-90 second screen capture showing the full user flow above

---

## Common rejection reasons & how to avoid them

| Reason Google rejects | How to avoid |
|---|---|
| Domain not verified | Complete Google Search Console setup BEFORE submitting |
| Privacy policy missing contact info | Already covered - privacy page has email + phone |
| App doesn't show OAuth consent clearly | Make sure your OAuth consent screen has logo, name, support email |
| Scopes used but not declared | Our 4 scopes are all declared |
| Vague justification | Use the text above - be specific about data flow |
| Home page empty / placeholder | Our homepage is fully built - `whatsapp.fidscript.com` returns 200 |

---

## Test the flow yourself before submitting

1. Open `https://whatsapp.fidscript.com/client/contacts` (in incognito)
2. Sign up for a FIDScript account with a Gmail address
3. Click **Import Contacts → Link Google Account**
4. Verify:
   - Consent screen shows **"FIDScript"** as app name (not the OAuth client ID)
   - Scopes listed match what we requested
   - After approval, contacts appear in FIDScript
   - You can revoke via Google Account permissions
