# Interactive Testing Guide

This guide documents the interactive browser-based test page (`examples/test.html`) for the ChatKit Token Service.

## Overview

The interactive test page provides a browser-based UI for testing all API endpoints before integrating with your WordPress site or production environment.

## Features

The test page includes tests for:

1. **Health Check** - Verify service is running and get version info
2. **Session Creation** - Test POST `/api/chatkit/start`
3. **Session Refresh** - Test POST `/api/chatkit/refresh`
4. **Rate Limiting** - Verify rate limiter works (sends 15 rapid requests)
5. **CORS Preflight** - Test OPTIONS requests for CORS support

## Usage

### 1. Start the Development Server

```bash
npm run dev
```

This starts the worker at `http://localhost:8787`

### 2. Open the Test Page

Open `examples/test.html` in your browser:

```bash
# On macOS
open examples/test.html

# On Linux
xdg-open examples/test.html

# Or manually navigate to the file in your browser
```

### 3. Configure the Worker URL

- **Local testing**: Use `http://localhost:8787` (default)
- **Production testing**: Use your deployed worker URL (e.g., `https://your-worker.your-domain.workers.dev`)

### 4. Run Tests

Click the buttons to test each endpoint:

#### Health Check
```
GET /api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "1.3.0"
}
```

#### Start Session
```
POST /api/chatkit/start
```

**Expected Response:**
```json
{
  "client_secret": "cs_live_abc123...",
  "expires_at": 1234567890
}
```

The page will:
- Display the full response
- Store the session for refresh testing
- Enable the "Refresh Session" button
- Show session expiration countdown

#### Refresh Session
```
POST /api/chatkit/refresh
```

**Request Body:**
```json
{
  "currentClientSecret": "cs_live_abc123..."
}
```

**Expected Response:**
```json
{
  "client_secret": "cs_live_xyz789...",
  "expires_at": 1234567950
}
```

#### Rate Limiting Test

Sends 15 rapid requests to test the rate limiter.

**Expected Behavior:**
- First ~10 requests: `200 OK` (successful)
- Remaining requests: `429 Too Many Requests` (rate limited)

**Sample Output:**
```json
{
  "total": 15,
  "successful": 10,
  "rateLimited": 5,
  "results": [
    { "request": 1, "status": 200, "rateLimited": false },
    { "request": 2, "status": 200, "rateLimited": false },
    ...
    { "request": 11, "status": 429, "rateLimited": true },
    ...
  ]
}
```

#### CORS Preflight Test
```
OPTIONS /api/chatkit/start
```

**Expected Headers:**
```json
{
  "status": 204,
  "corsHeaders": {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400"
  }
}
```

## Test Page Features

### Current Session Display

The page maintains state of the current session and displays:
- Client secret (truncated for security)
- Expiration timestamp (human-readable)
- Time remaining until expiration (in seconds)

### Color-Coded Results

- **Green** - Successful responses
- **Red** - Error responses

### Request Status

Each test shows "Sending request..." while processing, then displays the full JSON response.

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to `http://localhost:8787`

**Solution:**
1. Ensure `npm run dev` is running
2. Check the correct port in wrangler output
3. Verify worker URL in the configuration field

### CORS Errors

**Problem:** CORS errors when testing from file:// protocol

**Solution:**
1. Use `http://localhost:8787` for local testing
2. For production, ensure your domain is in `ALLOWED_ORIGINS` environment variable
3. Test CORS preflight endpoint first

### Rate Limiting Not Working

**Problem:** All 15 requests succeed in rate limit test

**Solution:**
1. Rate limiter state resets on worker restart
2. Wait 10 seconds between tests for tokens to refill
3. Check rate limit configuration in `src/rate-limiter.ts`

### Session Refresh Fails

**Problem:** "Invalid or expired session" error

**Solution:**
1. Ensure session hasn't expired (check "Expires In" counter)
2. Start a new session if needed
3. Verify client secret is being sent correctly

## Advanced Testing

### Testing with curl

For automated testing, use `examples/test.sh` instead:

```bash
./examples/test.sh
```

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

### Testing Production Deployment

1. Update Worker URL to your production URL
2. Run all tests to verify deployment
3. Check rate limiting with production settings
4. Verify CORS with your actual domain

### Custom Test Scenarios

Edit `examples/test.html` to add custom tests:

```javascript
async function testCustomScenario() {
  const response = await fetch(getWorkerUrl() + '/api/chatkit/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* custom payload */ }),
  });
  
  const data = await response.json();
  displayResult('customResult', data);
}
```

## Browser Compatibility

The test page works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Uses standard `fetch` API and ES6+ JavaScript features.

## Security Notes

1. **Never use production API keys in the browser** - The test page only works with the Worker service, which keeps secrets server-side
2. **Client secrets are sensitive** - The page truncates them in display
3. **Test in private browsing** - Prevents caching of sensitive data

## Next Steps

After successful interactive testing:

1. Review [TESTING.md](TESTING.md) for comprehensive testing guide
2. Follow [WORDPRESS-INTEGRATION.md](WORDPRESS-INTEGRATION.md) for production integration
3. See [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system design

---

**For automated testing**, see: [TESTING.md](TESTING.md)  
**For production deployment**, see: [CI-CD-SETUP.md](CI-CD-SETUP.md)
