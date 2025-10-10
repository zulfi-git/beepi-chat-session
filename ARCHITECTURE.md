# ChatKit Token Service - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / WordPress                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ChatKit Widget (JavaScript)                               │ │
│  │  • Calls getClientSecret() when auth needed                │ │
│  │  • Connects to OpenAI with client_secret                   │ │
│  │  • Refreshes token before expiration                       │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │
                    │ HTTPS (CORS enabled)
                    │ POST /api/chatkit/start
                    │ POST /api/chatkit/refresh
                    │
┌───────────────────▼───────────────────────────────────────────────┐
│         Cloudflare Worker (Your Token Service)                    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Request Processing Pipeline                                  ││
│  │                                                               ││
│  │  1. CORS Check (handleOptions)                               ││
│  │     └─> Preflight: Return 204 with CORS headers             ││
│  │                                                               ││
│  │  2. Rate Limiting (checkRateLimit)                           ││
│  │     └─> Token bucket per IP (10 tokens, refill 1/sec)       ││
│  │                                                               ││
│  │  3. Request Routing                                          ││
│  │     ├─> /api/chatkit/start  → handleStartSession()          ││
│  │     └─> /api/chatkit/refresh → handleRefreshSession()       ││
│  │                                                               ││
│  │  4. Request Logging (logRequest)                             ││
│  │     └─> Log: request_id, outcome, latency, NO secrets       ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                    │
│  Environment Configuration:                                       │
│  • OPENAI_API_KEY (secret - never exposed to browser)            │
│  • CHATKIT_WORKFLOW_ID (secret - your Agent Builder workflow)    │
│  • ALLOWED_ORIGINS (env var - comma-separated domains)           │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     │ HTTPS (with API key)
                     │ POST /v1/realtime/sessions
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│                   OpenAI Realtime API                              │
│                                                                     │
│  • Validates OPENAI_API_KEY                                        │
│  • Creates short-lived session (client_secret)                     │
│  • Returns { client_secret, expires_at }                           │
│  • Session tied to CHATKIT_WORKFLOW_ID                             │
└────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. Start Session Flow

```
WordPress Site               Worker                OpenAI API
     |                          |                       |
     |--- POST /start --------->|                       |
     |    (empty body)          |                       |
     |                          |                       |
     |                          |--[Rate Limit Check]-->|
     |                          |                       |
     |                          |--- POST /sessions --->|
     |                          |   (with API key)      |
     |                          |                       |
     |                          |<--- 200 OK -----------|
     |                          |   {client_secret,     |
     |                          |    expires_at}        |
     |                          |                       |
     |<-- 200 OK ---------------|                       |
     |   {client_secret,        |                       |
     |    expires_at}           |                       |
     |                          |                       |
     |                          |                       |
```

### 2. Refresh Session Flow

```
WordPress Site               Worker                OpenAI API
     |                          |                       |
     |--- POST /refresh ------->|                       |
     |   {currentClientSecret}  |                       |
     |                          |                       |
     |                          |--[Validate Secret]--->|
     |                          |                       |
     |                          |--- POST /sessions --->|
     |                          |   (with API key)      |
     |                          |                       |
     |                          |<--- 200 OK -----------|
     |                          |   {new client_secret, |
     |                          |    expires_at}        |
     |                          |                       |
     |<-- 200 OK ---------------|                       |
     |   {client_secret,        |                       |
     |    expires_at}           |                       |
     |                          |                       |
```

### 3. Rate Limit Flow

```
WordPress Site               Worker                
     |                          |                       
     |--- POST /start --------->|                       
     |                          |                       
     |                          |--[Check Rate Limit]-->
     |                          |   Token count: 0     
     |                          |                       
     |<-- 429 Too Many ---------|                       
     |   {error, message}       |                       
     |                          |                       
     |                          |                       
     [Wait 1 second...]         |                       
     |                          |                       
     |--- POST /start --------->|                       
     |                          |                       
     |                          |--[Check Rate Limit]-->
     |                          |   Token count: 1     
     |                          |   ✓ Request allowed  
     |                          |                       
     |<-- 200 OK ---------------|                       
```

## Security Model

### What's Protected

1. **API Key Protection**
   - ✅ OPENAI_API_KEY stored as Cloudflare secret
   - ✅ Never sent to browser
   - ✅ Only used server-side in Worker

2. **Token Security**
   - ✅ Short-lived tokens (typically 60 seconds)
   - ✅ Refresh mechanism prevents long-lived exposure
   - ✅ Each session gets unique client_secret

3. **Rate Limiting**
   - ✅ Per-IP token bucket algorithm
   - ✅ Prevents DoS and API abuse
   - ✅ Configurable limits

4. **CORS Protection**
   - ✅ Only allowed origins can request tokens
   - ✅ Preflight requests handled properly
   - ✅ Credentials mode supported

5. **Request Logging**
   - ✅ Every request logged with unique ID
   - ✅ Includes outcome, latency, status
   - ✅ NO secrets logged (API keys, tokens)

### What Could Be Enhanced

1. **Distributed Rate Limiting**
   - Current: Per-worker instance (resets on deployment)
   - Enhancement: Use Cloudflare Durable Objects for global rate limiting

2. **Token Validation**
   - Current: Refresh creates new session
   - Enhancement: Validate currentClientSecret with OpenAI before refresh

3. **User Authentication**
   - Current: Anonymous token issuance
   - Enhancement: Require WordPress user authentication

4. **Advanced Monitoring**
   - Current: Console logs
   - Enhancement: Send to analytics service (e.g., Cloudflare Analytics Engine)

## Module Breakdown

### src/index.ts (Main Worker)
- **fetch()** - Entry point, request routing
- **getClientIp()** - Extract client IP from headers
- **handleStartSession()** - Creates new session
- **handleRefreshSession()** - Refreshes existing session

### src/openai.ts (API Client)
- **createChatKitSession()** - Calls OpenAI to create session
- **refreshChatKitSession()** - Validates and creates new session

### src/rate-limiter.ts (Token Bucket)
- **RateLimiter class** - Token bucket implementation
- **isAllowed()** - Check if request allowed
- **cleanup()** - Remove old entries

### src/cors.ts (CORS Handling)
- **getCorsHeaders()** - Generate CORS headers
- **handleOptions()** - Handle preflight requests
- **isOriginAllowed()** - Validate origin against whitelist

### src/logger.ts (Request Logging)
- **generateRequestId()** - Create unique IDs
- **logRequest()** - Log request with context (no secrets)

### src/errors.ts (Error Responses)
- **createErrorResponse()** - Generate JSON error
- **rateLimitResponse()** - 429 response
- **badRequestResponse()** - 400 response
- **notFoundResponse()** - 404 response
- **internalErrorResponse()** - 500 response

### src/types.ts (TypeScript Types)
- **Env** - Environment bindings
- **SessionResponse** - Token response
- **ErrorResponse** - Error format
- **RequestContext** - Logging context
- And more...

## Performance Considerations

### Latency Breakdown

```
Total Request Time: ~200-500ms
├── Worker Processing: 1-5ms
│   ├── Rate limit check: <1ms
│   ├── CORS handling: <1ms
│   └── Request routing: <1ms
└── OpenAI API Call: 200-450ms
    ├── Network latency: 50-150ms
    ├── API processing: 100-250ms
    └── Response transfer: 50-50ms
```

### Optimization Strategies

1. **Cloudflare Edge Network**
   - Workers run in 300+ cities globally
   - Reduced latency to end users
   - Fast access to OpenAI API

2. **Minimal Dependencies**
   - No npm packages at runtime
   - Fast cold starts (<1ms)
   - Small bundle size

3. **Efficient Rate Limiting**
   - In-memory token bucket
   - O(1) lookup time
   - Periodic cleanup

## Monitoring & Observability

### Metrics to Track

1. **Request Metrics**
   - Requests per second
   - Success rate (200 responses)
   - Error rate (4xx, 5xx)
   - Rate limit hits (429)

2. **Latency Metrics**
   - P50, P95, P99 latencies
   - OpenAI API latency
   - Worker processing time

3. **Security Metrics**
   - CORS violations
   - Rate limit violations
   - Invalid requests

### Log Format

```json
{
  "request_id": "req_1704063600_abc123",
  "method": "POST",
  "path": "/api/chatkit/start",
  "ip": "1.2.3.4",
  "status_code": 200,
  "outcome": "success",
  "duration_ms": 245,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

View logs:
```bash
wrangler tail --format pretty
```

## Deployment Strategy

### Development
```bash
npm run dev              # Local testing
./examples/test.sh       # Run tests
```

### Staging
```bash
wrangler deploy --env staging
wrangler secret put OPENAI_API_KEY --env staging
```

### Production
```bash
wrangler deploy --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put CHATKIT_WORKFLOW_ID --env production
# Note: ALLOWED_ORIGINS is set in wrangler.toml under [vars], not as a secret
```

### Rollback
```bash
wrangler rollback --message "Rolling back to previous version"
```

## Cost Estimation

### Cloudflare Workers (Free Tier)
- 100,000 requests/day free
- Beyond: $0.50 per million requests

### OpenAI Realtime API
- Cost depends on usage
- Tokens are short-lived (minimize waste)
- Each session creation counts as API call

### Example Monthly Costs
```
10,000 users/month
× 5 sessions/user average
= 50,000 API calls/month

Cloudflare: Free (under 100k requests/day)
OpenAI: ~$25-50/month (depends on pricing)
Total: ~$25-50/month
```

## Future Enhancements

### Priority 1 (High Value)
- [ ] Durable Objects for distributed rate limiting
- [ ] Analytics dashboard integration
- [ ] Webhook notifications for errors
- [ ] User authentication integration

### Priority 2 (Medium Value)
- [ ] Token metrics and analytics
- [ ] A/B testing support
- [ ] Multiple workflow support
- [ ] Advanced CORS rules

### Priority 3 (Nice to Have)
- [ ] GraphQL API option
- [ ] WebSocket support
- [ ] Token caching strategy
- [ ] Multi-region routing

## Resources

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Rate Limiting Best Practices](https://developers.cloudflare.com/workers/examples/rate-limiting/)

---

**Last Updated:** 2024-01-01  
**Version:** 1.0.0  
**Maintainer:** See CONTRIBUTING.md
