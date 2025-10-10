# Quick Start Guide

Get your ChatKit Token Service running in 5 minutes!

## Prerequisites

- Node.js (v18+)
- Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
- OpenAI API key with Realtime API access
- ChatKit workflow ID from Agent Builder

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/zulfi-git/beepi-chat-session.git
cd beepi-chat-session

# 2. Install dependencies
npm install

# 3. Create local environment file for development
cp .dev.vars.example .dev.vars

# 4. Edit .dev.vars and add your API keys
# OPENAI_API_KEY=sk-...your-key...
# CHATKIT_WORKFLOW_ID=your-workflow-id
# ALLOWED_ORIGINS=http://localhost:3000

# 5. Start development server
npm run dev
```

Your worker is now running at `http://localhost:8787`!

## Test It

### Quick test with curl:

```bash
curl -X POST http://localhost:8787/api/chatkit/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "client_secret": "sess_abc123...",
  "expires_at": 1704067200
}
```

### Interactive testing:

Open `examples/test.html` in your browser and click the test buttons.

### Automated testing:

```bash
./examples/test.sh
```

## Deploy to Production

```bash
# 1. The wrangler.toml file is already included in the repository
# For local deployment, you may need to set your account_id in wrangler.toml
# Find it at: https://dash.cloudflare.com
# Note: When deploying via Cloudflare Pages, account_id is set automatically

# 2. Set production secrets (if not already configured)
# Note: OPENAI_API_KEY and CHATKIT_WORKFLOW_ID are already configured
# See SECRETS.md for details
wrangler secret put OPENAI_API_KEY      # Already configured
wrangler secret put CHATKIT_WORKFLOW_ID # Already configured

# 3. (Optional) Configure allowed origins in wrangler.toml
# Edit wrangler.toml and uncomment/set the ALLOWED_ORIGINS variable:
# [vars]
# ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"

# 4. Deploy!
npm run deploy
```

Your worker is now live at: `https://chatkit-token-service.your-subdomain.workers.dev`

## Integrate with WordPress

See `examples/wordpress-integration.html` for complete WordPress integration guide.

Quick snippet:

```html
<script type="module">
  const WORKER_URL = 'https://your-worker.workers.dev';
  let session = null;
  
  async function getClientSecret() {
    const now = Math.floor(Date.now() / 1000);
    if (session && session.expires_at > now + 60) return session.client_secret;
    
    const endpoint = session ? '/api/chatkit/refresh' : '/api/chatkit/start';
    const body = session ? { currentClientSecret: session.client_secret } : {};
    
    const res = await fetch(WORKER_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    session = await res.json();
    return session.client_secret;
  }
  
  // Initialize ChatKit
  import('https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/index.js')
    .then(({ renderChatkit }) => renderChatkit({ getClientSecret }));
</script>
```

## Next Steps

- Read the full [README.md](../README.md) for detailed documentation
- Check out [examples/wordpress-integration.html](examples/wordpress-integration.html) for WordPress integration
- View [CONTRIBUTING.md](../CONTRIBUTING.md) if you want to contribute

## Troubleshooting

**"Missing OPENAI_API_KEY"**
- Make sure you set secrets: `wrangler secret put OPENAI_API_KEY`

**CORS errors**
- Add your domain to ALLOWED_ORIGINS in `wrangler.toml` under `[vars]` section
- Format: `ALLOWED_ORIGINS = "https://domain1.com,https://domain2.com"`
- For local development, add to `.dev.vars` file

**Rate limit errors**
- The default limit is 10 requests/IP, refilling at 1/second
- Adjust in `src/rate-limiter.ts` if needed

**Need help?**
- Check the [README.md](../README.md) for detailed troubleshooting
- View Worker logs: `wrangler tail`
- Check OpenAI API status: https://status.openai.com/

## What's Next?

Your token service is now:
- ✅ Issuing short-lived ChatKit tokens
- ✅ Protecting your OpenAI API key
- ✅ Rate limiting requests
- ✅ Handling CORS properly
- ✅ Logging requests (without secrets)

Add the ChatKit widget to your site and start chatting! 🚀
