# Deployment Architecture

This document describes the complete deployment pipeline for Dan's Clever Corner blog, including AI-powered content enhancement.

## Overview

The blog uses a sophisticated multi-stage pipeline that automatically enriches content with AI-generated summaries and hero images before deploying to production.

### Architecture Components

1. **Webiny CMS** (AWS Lambda) - Headless CMS for content management
2. **AWS Step Functions** - AI content enhancement orchestrator
3. **AWS Bedrock** - LLM (Claude/Llama) for summarization, Titan for image generation
4. **GitHub Actions** - Build automation and deployment
5. **Cloudflare Pages** - Static site hosting with global CDN

### Content Flow

```
Content Author (You)
    ↓ (writes post)
Webiny CMS
    ↓ (clicks Publish)
onEntryAfterPublish Hook
    ↓ (invokes Step Function)
AWS Step Functions
    ↓ (orchestrates AI pipeline)
├─ Step 1: Bedrock LLM (summarization) [FREE with credits]
├─ Step 2: Generate image prompt from summary
├─ Step 3: Bedrock Titan (image generation) [$0.01/image]
├─ Step 4: Upload image to Webiny File Manager
├─ Step 5: Update CMS entry with summary + image
└─ Step 6: Trigger GitHub Actions (repository_dispatch)
    ↓
GitHub Actions Workflow
├─ Checkout code
├─ Install dependencies
├─ Build static site (fetches enriched content from CMS)
└─ Deploy to Cloudflare Pages
    ↓
Live Blog (blog.vahla.fi or blog-dev.vahla.fi)
```

### Cost Per Post
- LLM summarization: **$0.00** (AWS credits)
- Image generation: **$0.01** (Titan @ 1024×1024)
- **Total: ~$0.01 per blog post**

## Detailed Pipeline Steps

### 1. Content Creation & Publishing
- Author writes blog post in Webiny CMS
- Content includes: title, description, markdown sections
- Click "Publish" button

### 2. Webiny Hook Trigger
**File**: `apps/api/graphql/src/plugins/contentPublishHook.ts` (in Webiny CMS repo)
- Hook fires on `onEntryAfterPublish` event
- Extracts content: title, description, sections (markdown)
- Invokes AWS Step Function with payload
- Returns immediately (non-blocking)

### 3. AWS Step Functions Orchestration

#### Step 3.1: LLM Summarization
- **Service**: AWS Bedrock (Claude 3 or Llama 3)
- **Input**: Full blog post content
- **Output**: 2-3 sentence summary
- **Cost**: $0.00 (covered by AWS credits)
- **Duration**: ~5-10 seconds

#### Step 3.2: Image Prompt Generation
- **Method**: Prompt engineering or light LLM call
- **Input**: Title + summary
- **Output**: Detailed image generation prompt
- **Example**: "A modern minimalist illustration of [topic], featuring [key concepts], in a tech blog style with vibrant colors"

#### Step 3.3: Image Generation
- **Service**: AWS Bedrock Titan Image Generator
- **Input**: Image prompt
- **Output**: 1024×1024 PNG image
- **Cost**: $0.01 per image
- **Duration**: ~10-20 seconds
- **Output**: Temporary S3 URL or base64 data

#### Step 3.4: Upload to Webiny File Manager
- **Method**: Fetch image binary → Upload via Webiny GraphQL/REST API
- **Storage**: Webiny File Manager (S3-backed)
- **Output**: Permanent file ID and URL

#### Step 3.5: Update CMS Entry
- **Method**: GraphQL mutation to update post entry
- **Fields Updated**:
  - `postSummary` (generated summary text)
  - `postHeroImage` (file reference ID)
- **Result**: Enriched content ready for build

#### Step 3.6: Trigger GitHub Actions
- **Method**: POST to GitHub API
- **Endpoint**: `https://api.github.com/repos/daniel0707/blog-front/dispatches`
- **Payload**:
  ```json
  {
    "event_type": "webiny-publish",
    "client_payload": {
      "entry_id": "post-id-123",
      "environment": "dev" | "prod"
    }
  }
  ```
- **Authentication**: GitHub Personal Access Token with `repo` scope

### 4. GitHub Actions Build
**File**: `.github/workflows/deploy.yml`

#### Triggers
- `repository_dispatch` with type `webiny-publish` (automated)
- `workflow_dispatch` (manual deployment)

#### Steps
1. **Checkout repository** - Fetch latest code
2. **Setup Node.js 22** - With npm cache
3. **Install dependencies** - `npm ci`
4. **Build static site** - `npm run build`
   - Fetches enriched content from Webiny GraphQL API
   - Generates static pages with AI-generated summaries + hero images
5. **Deploy to Cloudflare Pages** - Via Wrangler CLI
   - Project name determined by environment variable
   - `dev` → `dans-clever-corner-dev` → blog-dev.vahla.fi
   - `prod` → `dans-clever-corner` → blog.vahla.fi

### 5. Cloudflare Pages Deployment
- Global CDN distribution
- Automatic HTTPS
- Instant rollback capability
- Analytics and monitoring

## Environment Configuration

### Development Environment (`dev`)
- **CMS**: https://cms-api-dev.vahla.fi
- **Step Function**: `blog-ai-pipeline-dev` (AWS)
- **Website**: https://blog-dev.vahla.fi
- **GitHub Environment**: `dev`

### Production Environment (`prod`)
- **CMS**: https://cms-api.vahla.fi
- **Step Function**: `blog-ai-pipeline-prod` (AWS)
- **Website**: https://blog.vahla.fi
- **GitHub Environment**: `prod`

## Error Handling

### Webiny Hook Failures
- Hook uses try/catch - errors logged but don't block publish
- Content publishes successfully even if Step Function invocation fails
- Can manually republish to retry AI pipeline

### Step Functions Failures
- Each step has retry logic (3 attempts with exponential backoff)
- Failures logged to CloudWatch
- Email notifications sent via SNS (configured in Step Function)
- Manual intervention: Check CloudWatch logs, fix issue, manually trigger Step Function

### Build Failures
- GitHub Actions automatically emails on failure
- Logs available in Actions tab
- Can manually re-run workflow
- Previous deployment remains live (no downtime)

### Rollback Procedures
1. **Cloudflare Pages rollback**: Dashboard → Deployments → Select previous → Rollback
2. **Manual redeploy**: Actions → Run workflow → Select environment
3. **Emergency**: Use Wrangler CLI locally: `wrangler pages deploy dist --project-name=dans-clever-corner`

## Monitoring & Maintenance

### Build Monitoring
- **GitHub Actions**: Email notifications on failure
- **Cloudflare Dashboard**: Build logs and deployment history
- **Target**: Build time < 2 minutes

### AI Processing Metrics
- **CloudWatch Logs**: Step Function execution logs
- **CloudWatch Metrics**: Custom metrics for:
  - LLM response time
  - Image generation time
  - Total pipeline duration
  - Success/failure rates
- **Target**: Total AI processing < 60 seconds

### Cost Monitoring
- **AWS Cost Explorer**: Track Bedrock usage
- **Budget Alerts**: Set at $10/month threshold
- **Expected**: ~$0.30-1.00/month (30-100 posts)

## Security

### Secrets Management
- **GitHub Secrets**: Environment-specific (dev/prod)
  - `WEBINY_GRAPHQL_ENDPOINT`
  - `WEBINY_API_TOKEN`
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- **AWS Secrets Manager**: Step Function credentials
  - GitHub PAT (for repository_dispatch)
  - Webiny API tokens
- **Webiny .env**: Step Function ARN and auth token

### IAM Permissions
- Webiny Lambda → Step Functions: `states:StartExecution`
- Step Functions → Bedrock: `bedrock:InvokeModel`
- Step Functions → S3: `s3:PutObject`, `s3:GetObject`
- Step Functions → Webiny API: Via API token (no AWS IAM)
- Step Functions → GitHub API: Via PAT

## Repository Structure

This deployment setup spans three repositories:

1. **blog-front** (this repo)
   - Astro frontend code
   - GitHub Actions workflow
   - Deployment documentation

2. **cms** (Webiny repository)
   - CMS configuration
   - Content publish hook
   - Webiny deployment (Lambda/API Gateway)

3. **blog-ai-pipeline** (separate AWS project)
   - Step Functions definition (ASL JSON)
   - Lambda functions for each step
   - Infrastructure as Code (CDK/Terraform)

## Setup Instructions

See `docs/SETUP_CHECKLIST.md` for detailed step-by-step setup guide.
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
