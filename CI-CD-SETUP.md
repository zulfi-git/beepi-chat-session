# CI/CD & Automation Setup

This document describes the continuous integration, continuous deployment, and automation setup for the ChatKit Token Service.

## Overview

The project uses GitHub Actions for CI/CD automation and Dependabot for dependency management.

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs:**

#### Test Job
- Runs on Node.js 18.x and 20.x (matrix build)
- Installs dependencies
- Runs TypeScript type checking
- Performs security audit

#### Lint Job
- Runs on Node.js 20.x
- Validates code with TypeScript compiler

**Badge:** `[![CI](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/ci.yml/badge.svg)](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/ci.yml)`

---

### 2. Security Scan Workflow (`.github/workflows/security.yml`)

**Triggers:**
- Scheduled: Every Monday at 9:00 AM UTC
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**Jobs:**

#### Security Audit
- Runs npm audit for known vulnerabilities
- Checks for outdated packages
- Uploads audit results as artifacts (retained for 30 days)

**Badge:** `[![Security Scan](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/security.yml/badge.svg)](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/security.yml)`

---

### 3. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch (when `src/`, `wrangler.toml`, or package files change)
- Manual workflow dispatch with environment selection

**Status:** Currently configured but deployment step is disabled pending secret configuration.

**Jobs:**

#### Deploy Worker
- Runs type checking before deployment
- Deploys to Cloudflare Workers (when enabled)

**To Enable Deployment:**
1. Add the following secrets to your repository:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
2. Edit `.github/workflows/deploy.yml` and remove the `if: false` condition from the deploy step
3. Ensure `wrangler.toml` is configured with your account ID

**Badge:** `[![Deploy](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/deploy.yml/badge.svg)](https://github.com/zulfi-git/beepi-chat-session/actions/workflows/deploy.yml)`

---

## Dependabot Configuration

Located at `.github/dependabot.yml`, this configuration automates dependency updates.

### NPM Dependencies

**Schedule:** Weekly on Mondays at 9:00 AM
**Strategy:**
- Groups minor and patch updates for development dependencies
- Groups minor and patch updates for production dependencies
- Major updates are created as individual PRs
- Maximum 5 open PRs at a time

**Commit Prefix:** `chore`

### GitHub Actions Dependencies

**Schedule:** Weekly on Mondays at 9:00 AM
**Strategy:**
- Keeps GitHub Actions up to date
- Individual PRs for each action update

**Commit Prefix:** `ci`

---

## Status Badges

The following badges are displayed in the README:

1. **CI Badge** - Shows the status of the latest CI run
2. **Security Scan Badge** - Shows the status of the latest security scan
3. **Deploy Badge** - Shows the status of the latest deployment
4. **Node.js Version Badge** - Indicates minimum Node.js version required
5. **License Badge** - Shows the project license type

---

## Local Testing

Before pushing changes, run these commands locally:

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Check for security vulnerabilities
npm audit

# Start development server
npm run dev
```

---

## Workflow Execution

### Viewing Workflow Runs

1. Go to the "Actions" tab in your GitHub repository
2. Select a workflow from the left sidebar
3. Click on a specific run to see details

### Manually Triggering Workflows

1. Go to the "Actions" tab
2. Select the workflow you want to run
3. Click "Run workflow" button
4. Select the branch and any required inputs
5. Click "Run workflow"

---

## Troubleshooting

### CI Failures

**Type Check Failures:**
- Run `npm run type-check` locally to reproduce
- Fix TypeScript errors in the code
- Push changes and CI will re-run

**Dependency Issues:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` to regenerate
- Commit the updated `package-lock.json`

### Dependabot PRs

**Review Process:**
1. Check the PR description for changelog and compatibility notes
2. Review the CI job results (type check and security audit)
3. Test locally if needed: `npm install && npm run type-check`
4. Approve and merge if all checks pass

**Handling Breaking Changes:**
- Major version updates may introduce breaking changes
- Review the dependency's changelog carefully
- Update code if necessary to maintain compatibility
- Test thoroughly before merging

### Security Alerts

**When npm audit reports vulnerabilities:**
1. Review the vulnerability details
2. Check if a fix is available: `npm audit fix`
3. If no automated fix: wait for Dependabot PR or update manually
4. For critical vulnerabilities: act immediately

---

## Best Practices

1. **Keep Dependencies Updated**
   - Review and merge Dependabot PRs regularly
   - Don't let too many PRs accumulate

2. **Monitor CI Status**
   - Check CI results before merging PRs
   - Investigate and fix failures promptly

3. **Security First**
   - Never ignore security vulnerabilities
   - Keep devDependencies updated (they can have security implications too)

4. **Test Locally**
   - Always run tests locally before pushing
   - Use `npm ci` in CI for reproducible builds

5. **Semantic Versioning**
   - Follow semver for version bumps
   - Document breaking changes in CHANGELOG.md

---

## Future Enhancements

Potential improvements to the CI/CD setup:

- [ ] Add automated testing with a test framework
- [ ] Implement code coverage reporting
- [ ] Add ESLint for code style checking
- [ ] Set up staging environment for pre-production testing
- [ ] Implement automated rollback on deployment failures
- [ ] Add performance monitoring and alerts
- [ ] Integrate with Cloudflare Analytics
- [ ] Add end-to-end testing for API endpoints

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Cloudflare Workers CI/CD](https://developers.cloudflare.com/workers/platform/deploy-button/)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated:** 2025-10-10  
**Maintained By:** See [CONTRIBUTING.md](CONTRIBUTING.md)
