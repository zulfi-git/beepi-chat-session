# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added
- Initial release of ChatKit Token Service
- POST `/api/chatkit/start` endpoint for creating new ChatKit sessions
- POST `/api/chatkit/refresh` endpoint for refreshing existing sessions
- OpenAI Realtime API integration for token issuance
- IP-based rate limiting using token bucket algorithm (10 tokens, refills at 1/second)
- CORS support with OPTIONS preflight handling
- Configurable ALLOWED_ORIGINS for CORS whitelist
- Comprehensive error handling with JSON error responses
- Request logging with unique request IDs, outcomes, and latency tracking
- Environment secrets support (OPENAI_API_KEY, CHATKIT_WORKFLOW_ID, ALLOWED_ORIGINS)
- TypeScript implementation with full type safety
- Wrangler configuration template for Cloudflare Workers deployment
- Comprehensive README with setup, API reference, and troubleshooting
- Quick Start guide for rapid deployment
- WordPress integration guide with code examples
- Interactive HTML test page for manual testing
- Automated bash test script with 6 test scenarios
- Contributing guidelines and code style documentation
- Architecture documentation with system diagrams
- Proprietary license

### Security
- API keys never exposed to browser (server-side only)
- Short-lived tokens (typically 60 seconds) with refresh mechanism
- Rate limiting to prevent abuse and DoS
- CORS protection for cross-origin requests
- Request logging without secrets

### Documentation
- Complete API reference with curl examples
- WordPress integration guide
- Architecture and flow diagrams
- Troubleshooting guide
- Development and deployment instructions

## [Unreleased]

### Planned
- Durable Objects integration for distributed rate limiting
- Enhanced analytics and monitoring
- User authentication support
- Multiple workflow support
- Webhook notifications

---

## Version History

- **1.0.0** - Initial release (2024-01-01)
  - Full-featured ChatKit token service
  - Production-ready implementation
  - Complete documentation

---

For more details, see the [README](README.md) and [ARCHITECTURE](ARCHITECTURE.md) documentation.
