# Cloudflare Secrets Configuration

This document tracks which secrets have been configured in Cloudflare Workers.

## Configured Secrets

The following secrets have been added to Cloudflare Workers and are ready for use:

### ✅ OPENAI_API_KEY
- **Status**: Configured
- **Purpose**: Your OpenAI API key for accessing the Realtime API
- **Required**: Yes
- **Added**: October 2025

### ~~CHATKIT_WORKFLOW_ID~~ (Deprecated)
- **Status**: No longer used
- **Purpose**: Previously used for ChatKit workflow ID from Agent Builder
- **Required**: No - Removed in v1.3.0
- **Migration**: The workflow ID should now be set client-side via the `workflow-id` attribute on the `<openai-chatkit>` HTML element
- **Note**: If you have this secret configured in Cloudflare, it can be safely deleted with `wrangler secret delete CHATKIT_WORKFLOW_ID`

## Non-Secret Configuration

### ALLOWED_ORIGINS
- **Type**: Environment variable (not a secret)
- **Purpose**: Comma-separated list of allowed CORS origins
- **Required**: Optional (defaults to allowing all origins if not set)
- **Configuration**: Set in `wrangler.toml` under `[vars]` section
- **Example**: `ALLOWED_ORIGINS = "https://example.com,https://www.example.com"`
- **Note**: This is not sensitive data, so it's configured as a regular environment variable rather than a secret

## Managing Secrets

### Viewing Secrets
Secrets cannot be viewed once set. To verify a secret exists:
```bash
wrangler secret list
```

### Updating Secrets
To update an existing secret:
```bash
wrangler secret put OPENAI_API_KEY
# When prompted, paste your new OpenAI API key
```

### Deleting Secrets
To remove a secret:
```bash
wrangler secret delete OPENAI_API_KEY
```

## GitHub Actions Secrets

For automated deployment via GitHub Actions, you also need to configure repository secrets:

### Required for Deployment
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token (not yet configured)
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID (not yet configured)

To add these secrets:
1. Go to your GitHub repository settings
2. Navigate to Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its value

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit secrets to version control**
   - Secrets should only be set via `wrangler secret put`
   - The `.dev.vars` file is gitignored and safe for local development
   - The `wrangler.toml` file should never contain actual secret values

2. **Rotate secrets regularly**
   - Update API keys periodically for security
   - Use `wrangler secret put` to update without downtime

3. **Limit access**
   - Only team members who need access should have Cloudflare credentials
   - Use principle of least privilege

4. **Monitor usage**
   - Check Cloudflare Workers logs for unexpected activity
   - Monitor OpenAI API usage for anomalies

## Migration Note

**If you previously set ALLOWED_ORIGINS as a secret:**

ALLOWED_ORIGINS has been moved from secrets to environment variables in `wrangler.toml` because it contains non-sensitive configuration data (domain lists). 

To migrate:
1. Note your current ALLOWED_ORIGINS value (check your deployment or documentation)
2. Delete the old secret: `wrangler secret delete ALLOWED_ORIGINS`
3. Add it to `wrangler.toml` under the `[vars]` section:
   ```toml
   [vars]
   ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
   ```
4. Redeploy: `npm run deploy`

For local development, continue using `.dev.vars` as before - this works for both secrets and regular environment variables.

## Next Steps

To complete the deployment setup:

1. ✅ Secrets configured in Cloudflare
2. ✅ `wrangler.toml` created
3. ⏳ Set `account_id` in `wrangler.toml` (replace "your-account-id-here")
4. ⏳ Add GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
5. ⏳ Enable deployment in `.github/workflows/deploy.yml` (remove `if: false`)

## Resources

- [Cloudflare Workers Secrets Documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler Secret Commands](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
