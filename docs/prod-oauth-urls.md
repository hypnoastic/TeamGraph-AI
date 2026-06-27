# Production OAuth redirect URLs

Base URL: **https://13.49.222.226.nip.io**

Register these in each provider's developer console.

## Google Cloud Console

**Authorized JavaScript origins**
- `https://13.49.222.226.nip.io`

**Authorized redirect URIs**
- `https://13.49.222.226.nip.io/api/integrations/google/callback`
- `https://13.49.222.226.nip.io/api/integrations/gmail/callback`

## Slack App

**Redirect URL**
- `https://13.49.222.226.nip.io/api/integrations/slack/callback`

## Notion Integration

**Redirect URL**
- `https://13.49.222.226.nip.io/api/integrations/notion/callback`

## GitHub App (`teamgraph-ai`)

**Setup URL / Callback URL**
- `https://13.49.222.226.nip.io/api/integrations/github/callback`

**Webhook URL (optional)**
- `https://13.49.222.226.nip.io/integrations/github/webhook`

## Google Sign-In (login)

Uses One Tap posting to `/auth/google`. Only **Authorized JavaScript origins** are required (same as above).
