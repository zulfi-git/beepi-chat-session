# Contributing to ChatKit Token Service

**Note: This is a private and proprietary project.** 

This document is for internal team members. This is a minimal, focused service, so contributions should maintain simplicity and clarity.

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.dev.vars.example` to `.dev.vars` and fill in your API keys
4. Run type checking: `npm run type-check`
5. Start development server: `npm run dev`

## Code Style

- **Keep functions small and focused** - Each function should do one thing well
- **Add comments for complex logic** - But prefer self-documenting code
- **Use TypeScript types** - Leverage the type system for safety
- **Follow existing patterns** - Maintain consistency with the codebase
- **No external dependencies** unless absolutely necessary

## Testing

Before submitting changes:

1. Run TypeScript type checking: `npm run type-check`
2. Test locally with `npm run dev`
3. Run the test script: `./examples/test.sh`
4. Open `examples/test.html` in a browser and test manually

## Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request with a clear description

## Areas for Contribution

- **Enhanced rate limiting** - Durable Objects integration for distributed rate limiting
- **Monitoring improvements** - Better logging, metrics, alerts
- **Security enhancements** - Additional validation, security headers
- **Documentation** - Clarifications, examples, use cases
- **Testing** - Additional test cases, edge cases

## What NOT to Change

- ❌ Don't add unnecessary dependencies
- ❌ Don't make the service more complex without good reason
- ❌ Don't expose secrets or sensitive data in logs
- ❌ Don't break the simple API contract

## Questions?

Open an issue to discuss your idea before starting major work.
