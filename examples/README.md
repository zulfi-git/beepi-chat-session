# Examples

This directory contains interactive examples and testing tools.

## Files

### test.html
Interactive browser-based test page for the ChatKit Token Service.

**Usage:**
1. Start the development server: `npm run dev`
2. Open `test.html` in your browser
3. Configure the Worker URL (default: `http://localhost:8787`)
4. Click test buttons to verify functionality

**Documentation:** See [../docs/TESTING-INTERACTIVE.md](../docs/TESTING-INTERACTIVE.md) for complete guide with expected responses and troubleshooting.

**Note:** For comprehensive testing documentation, see [../docs/TESTING.md](../docs/TESTING.md)

### test.sh
Automated command-line test script using curl.

**Usage:**
```bash
./examples/test.sh
```

Tests covered:
- Session creation
- Session refresh
- Rate limiting
- CORS handling
- Error responses

---

**Tip:** For complete documentation, see the [../docs/](../docs/) directory.
