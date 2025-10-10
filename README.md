# ChatKit Token Service

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
- ChatKit workflow ID from Agent Builder

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Wrangler

Copy the template configuration:

```bash
cp wrangler.toml.template wrangler.toml
```

Edit `wrangler.toml` and set your Cloudflare `account_id`. You can find this in your [Cloudflare dashboard](https://dash.cloudflare.com/).

```toml
account_id = "your-account-id-here"
```

### 3. Set Environment Secrets

Use Wrangler to securely set your secrets (these are encrypted and stored in Cloudflare):

```bash
# Required: Your OpenAI API key
wrangler secret put OPENAI_API_KEY
# When prompted, paste your OpenAI API key

# Required: Your ChatKit workflow ID
wrangler secret put CHATKIT_WORKFLOW_ID
# When prompted, paste your workflow ID from Agent Builder

# Optional: Allowed CORS origins (comma-separated)
wrangler secret put ALLOWED_ORIGINS
# Example: https://example.com,https://www.example.com
```

**Important:** Never commit secrets to version control. The `wrangler.toml` file should only contain non-sensitive configuration.

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

After deployment, your worker will be available at `https://chatkit-token-service.<your-subdomain>.workers.dev`

## API Reference

### POST /api/chatkit/start

Create a new ChatKit session.

**Request:**
```bash
curl -X POST https://your-worker.workers.dev/api/chatkit/start \
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
curl -X POST https://your-worker.workers.dev/api/chatkit/refresh \
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

### Backend Integration

Add this PHP code to your WordPress theme's `functions.php` or a custom plugin:

```php
<?php
// No backend integration needed - ChatKit runs entirely in the browser
// The WordPress site only needs to load the ChatKit widget JavaScript
```

### Frontend Integration

Add this JavaScript snippet to your WordPress theme to configure ChatKit with the token service:

```html
<script type="module">
  // ChatKit configuration
  const WORKER_URL = 'https://your-worker.workers.dev';
  
  // Initialize ChatKit with token management
  (async function initChatKit() {
    // Import ChatKit from CDN
    const { renderChatkit } = await import('https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/index.js');
    
    let currentSession = null;
    
    // Function to get or refresh client secret
    async function getClientSecret() {
      const now = Math.floor(Date.now() / 1000);
      
      // If we have a valid token, return it
      if (currentSession && currentSession.expires_at > now + 60) {
        return currentSession.client_secret;
      }
      
      try {
        // Refresh or start new session
        const endpoint = currentSession 
          ? '/api/chatkit/refresh' 
          : '/api/chatkit/start';
          
        const body = currentSession 
          ? JSON.stringify({ currentClientSecret: currentSession.client_secret })
          : '{}';
        
        const response = await fetch(WORKER_URL + endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get token');
        }
        
        currentSession = await response.json();
        return currentSession.client_secret;
      } catch (error) {
        console.error('ChatKit token error:', error);
        throw error;
      }
    }
    
    // Render ChatKit widget
    renderChatkit({
      getClientSecret: getClientSecret,
      // Add other ChatKit configuration options here
    });
  })();
</script>
```

### Vanilla JavaScript Example (No WordPress)

```html
<!DOCTYPE html>
<html>
<head>
  <title>ChatKit Example</title>
</head>
<body>
  <div id="chatkit-container"></div>
  
  <script type="module">
    const WORKER_URL = 'https://your-worker.workers.dev';
    
    // Import ChatKit
    import { renderChatkit } from 'https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/index.js';
    
    let currentSession = null;
    
    // Token management function
    async function getClientSecret() {
      const now = Math.floor(Date.now() / 1000);
      
      // Return cached token if still valid
      if (currentSession && currentSession.expires_at > now + 60) {
        return currentSession.client_secret;
      }
      
      // Request new or refreshed token
      const endpoint = currentSession ? '/api/chatkit/refresh' : '/api/chatkit/start';
      const body = currentSession 
        ? { currentClientSecret: currentSession.client_secret }
        : {};
      
      const response = await fetch(WORKER_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get ChatKit token');
      }
      
      currentSession = await response.json();
      return currentSession.client_secret;
    }
    
    // Initialize ChatKit
    renderChatkit({
      getClientSecret,
      container: document.getElementById('chatkit-container'),
    });
  </script>
</body>
</html>
```

## Testing with curl

### Test session creation:

```bash
curl -X POST http://localhost:8787/api/chatkit/start \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{}' \
  -v
```

### Test session refresh:

```bash
# First, get a session
SESSION=$(curl -s -X POST http://localhost:8787/api/chatkit/start \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.client_secret')

# Then refresh it
curl -X POST http://localhost:8787/api/chatkit/refresh \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d "{\"currentClientSecret\": \"$SESSION\"}" \
  -v
```

### Test CORS preflight:

```bash
curl -X OPTIONS http://localhost:8787/api/chatkit/start \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Test rate limiting:

```bash
# Send multiple requests quickly
for i in {1..15}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:8787/api/chatkit/start \
    -H "Content-Type: application/json" \
    -d '{}' | jq '.error // "success"'
done
```

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
  "status": 200,
  "outcome": "success",
  "latency_ms": 245,
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

1. Check that `ALLOWED_ORIGINS` includes your domain
2. Verify the `Origin` header is sent in requests
3. Ensure preflight (OPTIONS) requests succeed

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
├── src/
│   ├── index.ts          # Main Worker entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── openai.ts         # OpenAI API client
│   ├── cors.ts           # CORS handling
│   ├── rate-limiter.ts   # Rate limiting logic
│   ├── logger.ts         # Request logging
│   └── errors.ts         # Error response helpers
├── wrangler.toml.template # Cloudflare Worker config template
├── tsconfig.json         # TypeScript configuration
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## Contributing

This is a minimal, self-contained service. When making changes:
1. Keep functions small and focused
2. Add comments for complex logic
3. Test locally with `wrangler dev`
4. Run type checking with `npm run type-check`

## License

ISC

## Resources

- [ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
