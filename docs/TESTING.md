# Testing Guide

This guide describes how to test the ChatKit Token Service locally and in production.

## Quick Test

Open `examples/test.html` in your browser for interactive testing (see [TESTING-INTERACTIVE.md](TESTING-INTERACTIVE.md) for detailed guide), or use the automated test script:

```bash
./examples/test.sh
```

---

## Manual Testing with curl

### Prerequisites

Make sure your worker is running:

```bash
# For local testing
npm run dev

# Worker will be at http://localhost:8787
```

### Test Session Creation

```bash
curl -X POST http://localhost:8787/api/chatkit/start \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{}' \
  -v
```

**Expected Response (200 OK):**
```json
{
  "client_secret": "sess_abc123...",
  "expires_at": 1704067200
}
```

### Test Session Refresh

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

**Expected Response (200 OK):**
```json
{
  "client_secret": "sess_def456...",
  "expires_at": 1704070800
}
```

### Test CORS Preflight

```bash
curl -X OPTIONS http://localhost:8787/api/chatkit/start \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected Response (204 No Content):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..15}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:8787/api/chatkit/start \
    -H "Content-Type: application/json" \
    -d '{}' | jq '.error // "success"'
done
```

**Expected Behavior:**
- First ~10 requests succeed
- Remaining requests return 429 (rate limited)

---

## Interactive Browser Testing

Open `examples/test.html` in your browser for a visual testing interface. For comprehensive documentation on the interactive test page, see [TESTING-INTERACTIVE.md](TESTING-INTERACTIVE.md).

### Configuration

1. Enter your Worker URL (default: `http://localhost:8787`)
2. Click test buttons to verify functionality

### Available Tests

**1. Start Session**
- Creates a new ChatKit session
- Returns `client_secret` and `expires_at`
- Updates session info display

**2. Refresh Session**
- Refreshes existing session (requires active session)
- Returns new `client_secret` and `expires_at`

**3. Rate Limiting Test**
- Sends 15 rapid requests
- Shows which requests succeeded vs. rate limited
- Verifies rate limiter is working

**4. CORS Preflight Test**
- Sends OPTIONS request
- Displays CORS headers returned
- Verifies CORS configuration

---

## Automated Testing

Run the automated test script:

```bash
./examples/test.sh
```

This script tests:
1. Health check endpoint
2. Session creation
3. Session refresh
4. CORS preflight handling
5. Rate limiting
6. Error handling (invalid requests)

---

## Troubleshooting Tests

### "Connection refused" errors

- Verify worker is running: `npm run dev`
- Check the URL is correct (default: `http://localhost:8787`)

### "Missing OPENAI_API_KEY" errors

For local testing, create `.dev.vars` file:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your keys
```

### Rate limit tests not working

- Rate limits are per-worker instance
- Restart worker to reset rate limits
- Check `src/rate-limiter.ts` for current limits (default: 10 tokens, refill 1/second)

### CORS errors

For local development, add to `.dev.vars`:

```
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Or set in `wrangler.toml` for production:

```toml
[vars]
ALLOWED_ORIGINS = "https://yourdomain.com"
```

---

## Production Testing

Test your deployed worker:

```bash
# Replace with your actual worker URL
WORKER_URL="https://chatkit.beepi.no"

# Test session creation
curl -X POST $WORKER_URL/api/chatkit/start \
  -H "Content-Type: application/json" \
  -H "Origin: https://yoursite.com" \
  -d '{}'
```

### Monitor Logs

View real-time logs:

```bash
wrangler tail
```

Or with pretty formatting:

```bash
wrangler tail --format pretty
```

---

## Performance Testing

### Latency Testing

```bash
# Measure request latency
time curl -X POST http://localhost:8787/api/chatkit/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Load Testing

For simple load testing:

```bash
# Send 100 requests with 10 concurrent
for i in {1..10}; do
  (for j in {1..10}; do
    curl -s -X POST http://localhost:8787/api/chatkit/start \
      -H "Content-Type: application/json" \
      -d '{}' > /dev/null
  done) &
done
wait
```

For production load testing, consider using tools like:
- [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html)
- [wrk](https://github.com/wg/wrk)
- [Artillery](https://www.artillery.io/)

---

## CI/CD Testing

The project includes automated CI testing:

- **Type checking**: Runs on every push and PR
- **Security audit**: Runs weekly and on every push
- **Deployment verification**: Runs after successful deployment

See [CI-CD-SETUP.md](CI-CD-SETUP.md) for details.

---

## Test Checklist

Before deploying to production:

- [ ] All unit tests pass (type checking)
- [ ] Manual testing with curl succeeds
- [ ] Interactive browser tests pass
- [ ] Rate limiting works correctly
- [ ] CORS configuration is correct
- [ ] Secrets are configured properly
- [ ] Logs show no errors
- [ ] WordPress integration tested (if applicable)

---

**Next Steps:** After testing locally, deploy to production and test with your actual WordPress site. See [WORDPRESS-INTEGRATION.md](WORDPRESS-INTEGRATION.md) for integration instructions.
