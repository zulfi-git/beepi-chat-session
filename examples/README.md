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

**Note:** For documentation on testing, see [../docs/TESTING.md](../docs/TESTING.md)

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

### wordpress-integration.html
Interactive reference guide for WordPress integration (HTML version).

**Note:** The markdown version is now the primary documentation. See [../docs/WORDPRESS-INTEGRATION.md](../docs/WORDPRESS-INTEGRATION.md)

This HTML file is kept for:
- Local browsing with styling
- Print/PDF export if needed
- Interactive reference during development

---

**Tip:** For complete documentation, see the [../docs/](../docs/) directory.
