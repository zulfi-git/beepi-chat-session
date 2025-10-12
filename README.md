# ChatKit Token Service

[![CI](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/ci.yml/badge.svg)](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/ci.yml)
[![Security Scan](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/security.yml/badge.svg)](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/security.yml)
[![Deploy](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/deploy.yml/badge.svg)](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/deploy.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

A Cloudflare Worker that issues short-lived client tokens for ChatKit (OpenAI Agent Builder) workflows. This service acts as a secure backend proxy that protects your OpenAI API keys while allowing your WordPress site (or any frontend) to authenticate ChatKit sessions.

## Overview

This worker provides two endpoints:
- **POST `/api/chatkit/start`** - Creates a new ChatKit session
- **POST `/api/chatkit/refresh`** - Refreshes an expiring session

The service includes:
- ✅ Secure token issuance without exposing API keys to browsers
- ✅ IP-based rate limiting (token bucket algorithm)
- ✅ CORS support with configurable origins
- ✅ Request logging (request ID, outcome, latency)
- ✅ Comprehensive error handling with JSON responses

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- OpenAI API key with access to Realtime API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Wrangler

The repository includes a `wrangler.toml` configuration file with sensible defaults. For local development, you may need to set your Cloudflare `account_id`. You can find this in your [Cloudflare dashboard](https://dash.cloudflare.com/).

Edit `wrangler.toml` and uncomment the `account_id` line:

```toml
account_id = "your-account-id-here"
```

**Note:** When deploying via Cloudflare Pages or Workers, the `account_id` is automatically set from your Cloudflare account, so this step is only needed for local development with `wrangler dev`.

### 3. Set Environment Secrets

Use Wrangler to securely set your secrets (these are encrypted and stored in Cloudflare):

```bash
# Required: Your OpenAI API key
wrangler secret put OPENAI_API_KEY
# When prompted, paste your OpenAI API key
```

**Important:** Never commit secrets to version control. The `wrangler.toml` file should only contain non-sensitive configuration.

**Status:** The required secret (`OPENAI_API_KEY`) has been configured in Cloudflare. See [docs/SECRETS.md](docs/SECRETS.md) for details on configured secrets and management instructions.

**Note:** The ChatKit workflow ID should be set client-side via the `workflow-id` attribute on the `<openai-chatkit>` HTML element, not as a server-side secret.

### 4. Configure ALLOWED_ORIGINS (Optional)

If you want to restrict which domains can access your API, configure allowed CORS origins in `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
```

**Note:** 
- If not set, all origins are allowed (useful for development, but restrict in production)
- This is a regular environment variable, not a secret, since it's not sensitive data
- For local development, add it to `.dev.vars` instead

## Development

### Run Locally

Start the development server:

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

### Deploy to Cloudflare

Deploy to production:

```bash
npm run deploy
```

After deployment, your worker will be available at `https://chatkit.beepi.no`

## Documentation

- **[WordPress Integration Guide](docs/WORDPRESS-INTEGRATION.md)** - Integrate ChatKit with your WordPress site
- **[Testing Guide](docs/TESTING.md)** - Test your deployment locally and in production
- **[Architecture Documentation](docs/ARCHITECTURE.md)** - System architecture and technical details
- **[CI/CD Setup](docs/CI-CD-SETUP.md)** - Automated testing and deployment
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - How to contribute to this project
- **[Secrets Management](docs/SECRETS.md)** - Managing API keys and secrets

## API Reference

### POST /api/chatkit/start

Create a new ChatKit session.

**Request:**
```bash
curl -X POST https://chatkit.beepi.no/api/chatkit/start \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{}'
```

**Response (200 OK):**
```json
{
  "client_secret": "sess_abc123...",
  "expires_at": 1704067200
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "request_id": "req_1704063600_xyz789"
}
```

### POST /api/chatkit/refresh

Refresh an existing ChatKit session.

**Request:**
```bash
curl -X POST https://chatkit.beepi.no/api/chatkit/refresh \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{"currentClientSecret": "sess_abc123..."}'
```

**Response (200 OK):**
```json
{
  "client_secret": "sess_def456...",
  "expires_at": 1704070800
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "bad_request",
  "message": "currentClientSecret is required",
  "request_id": "req_1704063600_xyz789"
}
```

## WordPress Integration

To integrate ChatKit with your WordPress site, see the comprehensive [WordPress Integration Guide](docs/WORDPRESS-INTEGRATION.md).

**Quick snippet:**

```html
<script type="module">
  const WORKER_URL = 'https://chatkit.beepi.no';
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

## Testing

See the complete [Testing Guide](docs/TESTING.md) for detailed testing instructions.

**Quick test:**

```bash
curl -X POST http://localhost:8787/api/chatkit/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

Or use the interactive test page: open `examples/test.html` in your browser.

## Architecture

### Token Flow

1. **Browser** requests a token from your Cloudflare Worker
2. **Worker** validates the request (rate limit, CORS)
3. **Worker** calls OpenAI Realtime API with your secret API key
4. **OpenAI** returns a short-lived client token
5. **Worker** returns the token to the browser
6. **Browser** uses the token to connect ChatKit to your workflow

### Security Features

- **No API Keys in Browser**: Your OpenAI API key never leaves Cloudflare
- **Short-lived Tokens**: Tokens expire quickly (typically 60 seconds)
- **Rate Limiting**: IP-based token bucket prevents abuse (10 requests, refills at 1/second)
- **CORS Protection**: Only allowed origins can request tokens
- **Request Logging**: All requests logged with ID, outcome, and latency (no secrets logged)

### Rate Limiting

The service uses a token bucket algorithm:
- **Bucket Size**: 10 tokens per IP
- **Refill Rate**: 1 token per second
- **Enforcement**: Per-worker instance (resets on worker restart)

For production, consider using [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) or [Durable Objects](https://developers.cloudflare.com/durable-objects/) for distributed rate limiting.

## Monitoring

View logs in the Cloudflare dashboard or using Wrangler:

```bash
wrangler tail
```

Log format:
```json
{
  "request_id": "req_1704063600_xyz789",
  "method": "POST",
  "path": "/api/chatkit/start",
  "ip": "1.2.3.4",
  "status_code": 200,
  "outcome": "success",
  "duration_ms": 245,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### "Missing OPENAI_API_KEY" error

Make sure you've set the secret:
```bash
wrangler secret put OPENAI_API_KEY
```

### CORS errors in browser console

1. Check that `ALLOWED_ORIGINS` is set in `wrangler.toml` under `[vars]` section and includes your domain
2. Verify the `Origin` header is sent in requests
3. Ensure preflight (OPTIONS) requests succeed
4. For local development, add the origin to `.dev.vars`

### Rate limit errors

Reduce request frequency or increase rate limits in `src/rate-limiter.ts`:
```typescript
new RateLimiter(20, 2, 1000) // 20 tokens, refill 2/second
```

### OpenAI API errors

Check that:
- Your API key is valid and has Realtime API access
- Your workflow ID is correct
- You have available API credits

## Project Structure

```
.
├── .github/
│   ├── workflows/         # GitHub Actions CI/CD workflows
│   │   ├── ci.yml        # Continuous Integration (testing & type-checking)
│   │   ├── security.yml  # Security scanning and audits
│   │   └── deploy.yml    # Deployment to Cloudflare Workers
│   └── dependabot.yml    # Dependabot configuration
├── docs/
│   ├── ARCHITECTURE.md    # System architecture and flow diagrams
│   ├── CI-CD-SETUP.md     # CI/CD pipeline documentation
│   ├── CONTRIBUTING.md    # Contributing guidelines
│   ├── SECRETS.md         # Secrets management documentation
│   ├── TESTING.md         # Testing guide
│   └── WORDPRESS-INTEGRATION.md  # WordPress integration guide
├── examples/
│   ├── test.html          # Interactive browser test page
│   └── test.sh            # Automated test script
├── src/
│   ├── index.ts           # Main Worker entry point
│   ├── types.ts           # TypeScript type definitions
│   ├── openai.ts          # OpenAI API client
│   ├── cors.ts            # CORS handling
│   ├── rate-limiter.ts    # Rate limiting logic
│   ├── logger.ts          # Request logging
│   └── errors.ts          # Error response helpers
├── wrangler.toml          # Cloudflare Worker configuration
├── wrangler.toml.template # Cloudflare Worker config template (for reference)
├── tsconfig.json          # TypeScript configuration
├── package.json           # Node.js dependencies
├── CHANGELOG.md           # Version history and changes
└── README.md              # This file
```

## Contributing

**This is a private and proprietary project - for internal team use only.**

This is a minimal, self-contained service. When making changes:
1. Keep functions small and focused
2. Add comments for complex logic
3. Test locally with `wrangler dev`
4. Run type checking with `npm run type-check`
5. Ensure all CI checks pass before merging

See [CI-CD-SETUP.md](docs/CI-CD-SETUP.md) for details on our automated testing and deployment processes.

For code quality assessment and future improvements, see the archived [assessment documents](docs/archive/).

## License

**Proprietary and Confidential**

This project is private and proprietary. All rights reserved. Unauthorized copying, distribution, or use is strictly prohibited.

## Resources

- [ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
