# Cloudflare Secrets Configuration

This document tracks which secrets have been configured in Cloudflare Workers.

## Configured Secrets

The following secrets have been added to Cloudflare Workers and are ready for use:

### ✅ OPENAI_API_KEY
- **Status**: Configured
- **Purpose**: Your OpenAI API key for accessing the Realtime API
- **Required**: Yes
- **Added**: 2025-10-10

### ✅ CHATKIT_WORKFLOW_ID
- **Status**: Configured
- **Purpose**: Your ChatKit workflow ID from Agent Builder
- **Required**: Yes
- **Added**: 2025-10-10

### ALLOWED_ORIGINS
- **Status**: Not yet configured
- **Purpose**: Comma-separated list of allowed CORS origins
- **Required**: Optional (defaults to allowing all origins if not set)
- **Example**: `https://example.com,https://www.example.com`

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

wrangler secret put CHATKIT_WORKFLOW_ID
# When prompted, paste your new workflow ID
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
