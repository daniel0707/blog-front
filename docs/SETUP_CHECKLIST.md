# Deployment Setup Checklist

## Prerequisites
- [ ] Cloudflare account with Pages enabled
- [ ] GitHub repository: `daniel0707/blog-front`
- [ ] Webiny CMS deployed and running
- [ ] Cloudflare Workflow created (separate project)

## 1. GitHub Repository Setup

### Secrets Configuration
Go to: `https://github.com/daniel0707/blog-front/settings/secrets/actions`

Add the following secrets:
- [ ] `WEBINY_GRAPHQL_ENDPOINT` - Production CMS endpoint: `https://cms-api.vahla.fi/cms/read/en-US`
- [ ] `WEBINY_API_TOKEN` - CMS API token from Webiny
- [ ] `CLOUDFLARE_API_TOKEN` - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Template: "Edit Cloudflare Workers"
  - Permissions: Account > Cloudflare Pages > Edit
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare dashboard URL

### Verify Workflow File
- [ ] Confirm `.github/workflows/deploy.yml` exists
- [ ] Review workflow configuration
- [ ] Test manual dispatch trigger

## 2. Cloudflare Pages Setup

### Create Pages Project
- [ ] Go to Cloudflare Dashboard → Pages
- [ ] Create new project: `dans-clever-corner`
- [ ] Connect to GitHub repository: `daniel0707/blog-front`
- [ ] Build settings:
  - Build command: `npm run build` (won't be used, GitHub Actions handles it)
  - Build output directory: `dist`
  - Environment variables: Set `WEBINY_GRAPHQL_ENDPOINT` and `WEBINY_API_TOKEN`

### Custom Domain
- [ ] Add custom domain: `blog.vahla.fi`
- [ ] Configure DNS records (CNAME or A/AAAA)
- [ ] Wait for SSL certificate provisioning
- [ ] Verify HTTPS works

## 3. Webiny CMS Configuration

### Install Content Hook
See `docs/WEBINY_HOOK.md` for detailed instructions:

- [ ] Create `apps/api/graphql/src/plugins/contentPublishHook.ts`
- [ ] Register plugin in `apps/api/graphql/src/index.ts`
- [ ] Add environment variables to Webiny `.env`:
  - `WEBINY_ENV` (dev/production)
  - `WORKFLOW_SECRET_TOKEN` (generate secure token)
- [ ] Deploy Webiny with changes: `yarn webiny deploy`

## 4. Cloudflare Workflow Setup

### Create Workflow
- [ ] Create new Cloudflare Workflow project
- [ ] Deploy to: `workflow.vahla.dev` (production)
- [ ] Deploy to: `workflow-dev.vahla.dev` (development)

### Implement Workflow Steps
- [ ] Step 1: Validate incoming webhook (check `WORKFLOW_SECRET_TOKEN`)
- [ ] Step 2: Call LLM API for summarization
- [ ] Step 3: Generate Flux V2 image prompt
- [ ] Step 4: Call Flux V2 API for image generation
- [ ] Step 5: Fetch image binary from temporary URL
- [ ] Step 6: Upload to Webiny File Manager
- [ ] Step 7: Update CMS entry with summary + image
- [ ] Step 8: Trigger GitHub repository dispatch
- [ ] Error handling: Email notifications on failure

### Environment Variables
- [ ] `GITHUB_PAT` - Personal Access Token with `repo` scope
- [ ] `GITHUB_REPO` - `daniel0707/blog-front`
- [ ] `WEBINY_API_TOKEN` - For CMS updates
- [ ] `WEBINY_GRAPHQL_ENDPOINT` - CMS API endpoint
- [ ] `LLM_API_KEY` - For summarization (Workers AI or OpenAI)
- [ ] `FLUX_API_KEY` - Black Forest Labs API key
- [ ] `WORKFLOW_SECRET_TOKEN` - Shared with Webiny hook
- [ ] `EMAIL_NOTIFICATION_ADDRESS` - `daniel+blog-deploy@vahla.fi`

## 5. Testing

### Test Full Pipeline
- [ ] Create test blog post in Webiny
- [ ] Publish the post
- [ ] Verify Webiny hook fires (check CloudWatch logs)
- [ ] Verify Workflow receives request
- [ ] Verify LLM summarization completes
- [ ] Verify Flux image generation completes
- [ ] Verify image uploaded to Webiny File Manager
- [ ] Verify CMS entry updated with summary + image
- [ ] Verify GitHub Action triggered
- [ ] Verify build completes successfully
- [ ] Verify deployment to Cloudflare Pages
- [ ] Visit `https://blog.vahla.fi` and confirm post appears

### Test Error Scenarios
- [ ] Test with invalid content (no title)
- [ ] Test with LLM API failure (mock)
- [ ] Test with Flux API failure (mock)
- [ ] Test with GitHub API failure (mock)
- [ ] Verify email notifications sent on failures
- [ ] Verify pipeline aborts gracefully

## 6. Development Environment

### Optional: Set up development pipeline
- [ ] Create separate Cloudflare Pages project: `dans-clever-corner-dev`
- [ ] Point to `blog-dev.vahla.fi`
- [ ] Use dev CMS endpoint: `cms-api-dev.vahla.fi`
- [ ] Configure separate GitHub Actions workflow or branch trigger
- [ ] Test changes in dev before production deploy

## 7. Monitoring Setup

### Analytics & Alerts
- [ ] Enable Cloudflare Web Analytics on Pages
- [ ] Set up Cloudflare email alerts for:
  - Workflow failures
  - Build failures
  - Deployment failures
- [ ] Monitor GitHub Actions email notifications
- [ ] Set up uptime monitoring (optional): UptimeRobot, Pingdom, etc.

## 8. Documentation

- [ ] Update `DEPLOYMENT.md` with actual URLs and configuration
- [ ] Document troubleshooting procedures
- [ ] Create runbook for common issues
- [ ] Document rollback procedures

## Post-Launch

- [ ] Remove `.env` files from Git (should already be in `.gitignore`)
- [ ] Rotate API tokens after testing complete
- [ ] Monitor first few publishes closely
- [ ] Optimize AI prompts based on output quality
- [ ] Review and optimize build times
- [ ] Set up cost monitoring for AI APIs
