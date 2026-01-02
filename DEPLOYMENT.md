# Deployment Guide

## Overview

This document outlines the deployment strategy for Dan's Clever Corner blog, including hosting setup, build configuration, and automated workflows.

## Architecture

- **Frontend**: Static site generated with Astro
- **CMS**: Webiny Headless CMS
- **Hosting**: [TO BE FILLED]
- **Build Trigger**: [TO BE FILLED]

## Environment Configuration

### Development Environment
- URL: `https://blog-dev.vahla.fi`
- CMS Endpoint: `https://cms-api-dev.vahla.fi/cms/read/en-US`
- Environment File: `.env`

### Production Environment
- URL: `https://blog.vahla.fi`
- CMS Endpoint: `https://cms-api.vahla.fi/cms/read/en-US`
- Environment File: `.env.production`

## Required Environment Variables

```bash
WEBINY_GRAPHQL_ENDPOINT=https://cms-api.vahla.fi/cms/read/en-US
WEBINY_API_TOKEN=your_token_here
```

## Build Process

### Local Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## Deployment Strategy

### Hosting Platform
**Cloudflare Pages** - Global CDN with automatic HTTPS, edge deployment, and preview environments.

### Build Configuration

#### GitHub Actions Workflow
- **Trigger**: `repository_dispatch` event from Cloudflare Workflow
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Node Version**: 20.x
- **Deploy Tool**: Wrangler CLI

#### Build Environment Variables (GitHub Secrets)
```bash
WEBINY_GRAPHQL_ENDPOINT  # CMS API endpoint
WEBINY_API_TOKEN         # CMS authentication token
CLOUDFLARE_API_TOKEN     # For Wrangler deployment
CLOUDFLARE_ACCOUNT_ID    # Your CF account ID
```

### Automated Builds

#### Pipeline Flow
1. **Content Published** → Webiny CMS fires `onEntryAfterPublish` hook
2. **Cloudflare Workflow** → Processes AI tasks:
   - Generate summary via LLM
   - Create Flux V2 prompt
   - Generate hero image
   - Upload image to Webiny File Manager
   - Update CMS entry with image + summary
3. **Trigger GitHub** → Workflow calls `repository_dispatch` API
4. **GitHub Action Runs** → Builds static site with enriched content
5. **Deploy to Cloudflare Pages** → Wrangler pushes artifacts

### Webhooks

#### Webiny Hook (CMS Repo)
**File**: `apps/api/graphql/src/plugins/contentPublishHook.ts`

Fires POST request to Cloudflare Workflow URL on content publish:
```typescript
POST https://workflow.vahla.dev/publish
Body: { entryId, title, content, environment }
```

#### GitHub Repository Dispatch (Workflow)
**Endpoint**: `https://api.github.com/repos/daniel0707/blog-front/dispatches`

Triggered after AI processing completes:
```bash
POST /repos/daniel0707/blog-front/dispatches
Headers: 
  Authorization: token <GITHUB_PAT>
  Accept: application/vnd.github.v3+json
Body: 
  { "event_type": "webiny-publish", "client_payload": { "entry_id": "..." } }
```

### Error Handling

At each step, if failure occurs:
1. **Log error** to Cloudflare Analytics
2. **Send email notification** via Cloudflare Email Routing to `daniel+blog-deploy@vahla.fi`
3. **Abort pipeline** - Do not trigger build with incomplete data

### Deployment Environments

| Environment | Branch | Workflow URL | CMS Endpoint |
|-------------|--------|--------------|--------------|
| Development | `main` | `workflow-dev.vahla.dev` | `cms-api-dev.vahla.fi` |
| Production | `main` | `workflow.vahla.dev` | `cms-api.vahla.fi` |

## DNS Configuration

- `blog.vahla.fi` → Production site
- `blog-dev.vahla.fi` → Development/staging site

## Monitoring & Maintenance

### Build Monitoring
- **GitHub Actions**: Monitor workflow runs at `https://github.com/daniel0707/blog-front/actions`
- **Cloudflare Analytics**: Track Workflow execution times and success rates
- **Email Alerts**: Receive notifications on failure

### Performance Metrics
- **Build Time**: Target < 2 minutes
- **AI Processing**: Target < 60 seconds (LLM + Flux combined)
- **Total Pipeline**: Target < 3 minutes from publish to live

### Logs
- **Workflow Logs**: Cloudflare Dashboard → Workers → Workflows
- **Build Logs**: GitHub Actions tab
- **Deploy Logs**: Cloudflare Pages dashboard

## Rollback Strategy

### Automatic Rollback
Cloudflare Pages maintains deployment history. Rollback via:
1. Cloudflare Dashboard → Pages → Deployments
2. Select previous successful deployment
3. Click "Rollback to this deployment"

### Manual Rollback
If content issue detected:
1. Edit content in Webiny CMS
2. Re-publish to trigger new build
3. Or: Manually trigger GitHub Action with `workflow_dispatch`

### Emergency Rollback
If critical issue:
```bash
# Redeploy previous build
wrangler pages deploy dist/ --project-name=dans-clever-corner --branch=main
```

## Notes

- Blog content is fetched at build time, not runtime
- New posts require triggering a rebuild
- Consider build caching strategies for faster deployments






------
🚀 Finalized AI Content Pipeline Plan
This architecture decouples the user experience from the long-running AI tasks, utilizing Cloudflare Workflows as the reliable orchestrator.
📝 Pipeline Overview
| Component | Role in the Pipeline |
|---|---|
| Webiny CMS (AWS Lambda) | The Trigger. Fires a simple hook upon content publishing. |
| Cloudflare Workflow | The Orchestrator. Manages state, retries, and sequential logic for all external API calls. |
| AI Endpoints (LLM + Flux V2) | The Workers. Summarization and Image Generation. |
| GitHub Actions | The Builder. Executes the static site build. |
| Cloudflare Pages | The Host. Receives the final artifact for global deployment. |
Phase 1: The Trigger (Webiny to Cloudflare)
| Step | Action | Details |
|---|---|---|
| 1. | CMS Publish | User clicks "Publish" in Webiny. |
| 2. | Lambda Fires Hook | The Webiny onEntryAfterPublish plugin (running on AWS Lambda) executes a POST request to the Cloudflare Workflow URL, sending the content entry ID and raw text. |
Phase 2: The Orchestrator (Cloudflare Workflow) - Updated
This is the core logic running inside the Cloudflare V8 environment.
| Step | Action | Rationale/Implementation Detail |
|---|---|---|
| 3. | Summarize Content | Workflow calls an external LLM API (e.g., Workers AI, OpenAI) to generate a short summary. |
| 4. | Create Flux V2 Prompt | Workflow uses the summary and title to construct a highly descriptive prompt for Flux V2. |
| 5. | Generate Flux Image | Workflow calls the Black Forest Labs API for FLUX.2. It waits for the temporary result URL. |
| 6. | Fetch Image Binary | Workflow performs a second fetch call to the temporary URL obtained in Step 5, downloading the raw image data (binary blob) into memory. |
| 7. | Upload to Webiny File Manager | Workflow calls the Webiny File Manager API (via GraphQL/REST) with the image binary, receiving a permanent File ID in return. |
| 8. | Update CMS Content Entry | Workflow calls the Webiny Headless CMS API to update the entry with the permanent File ID and the AI-generated summary. |
| 9. | Trigger GitHub Action | Workflow executes a final POST request to the GitHub Repository Dispatch endpoint. |
Phase 3: The Builder (GitHub -> Pages)
| Step | Action | Rationale/Implementation Detail |
|---|---|---|
| 10. | GitHub Action Wakes Up | The repository_dispatch event triggers the CI pipeline. |
| 11. | Build Static Site | The runner executes npm run build. Since the CMS was updated in Step 8, the build process pulls the complete, enriched content (including the permanent image URL). |
| 12. | Deploy Artifact | The runner uses the wrangler pages deploy command to upload the final static artifacts directly to Cloudflare Pages. |
