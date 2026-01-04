# Deployment Setup Checklist

## Prerequisites
- [ ] Cloudflare account with Pages enabled
- [ ] GitHub repository: `daniel0707/blog-front`
- [ ] Webiny CMS deployed and running on AWS
- [ ] AWS account with Bedrock access enabled
- [ ] AWS Step Functions and Lambda access

## 1. GitHub Repository Setup

### Environment Setup
Go to: `https://github.com/daniel0707/blog-front/settings/environments`

Create two environments:

#### Production Environment
- [ ] Create environment: `prod`
- [ ] Add secrets:
  - `WEBINY_GRAPHQL_ENDPOINT`: `https://cms-api.vahla.fi/cms/read/en-US`
  - `WEBINY_API_TOKEN`: From Webiny production
  - `CLOUDFLARE_API_TOKEN`: Create at https://dash.cloudflare.com/profile/api-tokens
    - Template: "Edit Cloudflare Workers"
    - Permissions: Account > Cloudflare Pages > Edit
  - `CLOUDFLARE_ACCOUNT_ID`: From Cloudflare dashboard URL
- [ ] Add variables:
  - `CF_PAGES_PROJECT`: `dans-clever-corner`

#### Development Environment
- [ ] Create environment: `dev`
- [ ] Add secrets (same keys, different values):
  - `WEBINY_GRAPHQL_ENDPOINT`: `https://cms-api-dev.vahla.fi/cms/read/en-US`
  - `WEBINY_API_TOKEN`: From Webiny development
  - `CLOUDFLARE_API_TOKEN`: Same as production (or separate if preferred)
  - `CLOUDFLARE_ACCOUNT_ID`: Same as production
- [ ] Add variables:
  - `CF_PAGES_PROJECT`: `dans-clever-corner-dev`

### Verify Workflow File
- [ ] Confirm `.github/workflows/deploy.yml` exists
- [ ] Review workflow configuration
- [ ] Test manual dispatch with dev environment
- [ ] Test manual dispatch with prod environment

## 2. Cloudflare Pages Setup

### Production Pages Project
- [ ] Go to Cloudflare Dashboard → Pages
- [ ] Connect to GitHub repository: `daniel0707/blog-front`
- [ ] Build settings:
  - Build command: `npm run build` (won't be used, GitHub Actions handles it)
  - Build output directory: `dist`
- [ ] Add custom domain: `blog.vahla.fi`
- [ ] Configure DNS records (CNAME or A/AAAA)
- [ ] Wait for SSL certificate provisioning
- [ ] Verify HTTPS works

### Development Pages Project
- [ ] Create new project: `dans-clever-corner-dev`
- [ ] Connect to same GitHub repository: `daniel0707/blog-front`
- [ ] Build settings:
  - Build command: `npm run build` (won't be used)
  - Build output directory: `dist`
- [ ] Add custom domain: `blog-dev.vahla.fi`
- [ ] Configure DNS records
- [ ] Wait for SSL certificate provisioning
- [ ] Verify HTTPS worksficate provisioning
- [ ] Verify HTTPS works

## 3. Webiny CMS Configuration

### Install Content Hook
See `docs/WEBINY_HOOK.md` for detailed instructions:

- [ ] Install AWS SDK: `npm install @aws-sdk/client-sfn`
- [ ] Create `apps/api/graphql/src/plugins/contentPublishHook.ts`
- [ ] Register plugin in `apps/api/graphql/src/index.ts`
- [ ] Add environment variables to Webiny `.env`:
  - `WEBINY_ENV` (dev/prod)
  - `STEP_FUNCTION_ARN_DEV` (ARN of dev Step Function)
  - `STEP_FUNCTION_ARN_PROD` (ARN of prod Step Function)
  - `AWS_REGION` (e.g., us-east-1)
- [ ] Update Lambda IAM role with `states:StartExecution` permission
- [ ] Deploy Webiny with changes: `yarn webiny deploy api --env <env>`

## 4. AWS Step Functions & AI Pipeline Setup

### Create Step Function State Machine
- [ ] Create new AWS project: `blog-ai-pipeline`
- [ ] Define Step Function (ASL JSON or CDK/Terraform)
- [ ] Create Lambda functions for each step:
  - Lambda 1: LLM summarization (Bedrock Claude/Llama)
  - Lambda 2: Image prompt generation
  - Lambda 3: Image generation (Bedrock Titan)
  - Lambda 4: Upload to Webiny File Manager
  - Lambda 5: Update CMS entry
  - Lambda 6: Trigger GitHub repository_dispatch
- [ ] Configure Step Function error handling and retries
- [ ] Set up CloudWatch logging

### Step Function Environment Variables
- [ ] `GITHUB_PAT` - Personal Access Token with `repo` scope
- [ ] `GITHUB_REPO` - `daniel0707/blog-front`
- [ ] `WEBINY_API_TOKEN` - For CMS updates
- [ ] `WEBINY_GRAPHQL_ENDPOINT` - CMS API endpoint
- [ ] `AWS_REGION` - For Bedrock access
- [ ] SNS topic ARN for failure notifications (optional)

### IAM Permissions
- [ ] Step Function → Bedrock: `bedrock:InvokeModel`
- [ ] Step Function → Lambda: `lambda:InvokeFunction`
- [ ] Step Function → S3: `s3:PutObject`, `s3:GetObject`
- [ ] Step Function → CloudWatch Logs: `logs:CreateLogGroup`, `logs:PutLogEvents`
- [ ] Lambda → Bedrock: `bedrock:InvokeModel`
- [ ] Webiny Lambda → Step Functions: `states:StartExecution`

### Deploy Pipeline
- [ ] Deploy dev environment: `blog-ai-pipeline-dev`
- [ ] Deploy prod environment: `blog-ai-pipeline-prod`
- [ ] Test Step Function with sample payload
- [ ] Verify Bedrock access (enable models if needed)

## 5. Testing

### Test Full Pipeline
- [ ] Create test blog post in Webiny
- [ ] Publish the post
- [ ] Verify Webiny hook fires (check CloudWatch Lambda logs)
- [ ] Verify Step Function execution starts
- [ ] Verify LLM summarization completes (CloudWatch logs)
- [ ] Verify Titan image generation completes
- [ ] Verify image uploaded to Webiny File Manager
- [ ] Verify CMS entry updated with summary + image
- [ ] Verify GitHub Action triggered
- [ ] Verify build completes successfully
- [ ] Verify deployment to Cloudflare Pages
- [ ] Visit site and confirm post appears with AI enhancements

### Test Error Scenarios
- [ ] Test with invalid content (no title)
- [ ] Test with Bedrock API failure (mock/disable temporarily)
- [ ] Test with GitHub API failure (invalid PAT)
- [ ] Verify Step Function retry logic works
- [ ] Verify CloudWatch logs capture errors
- [ ] Verify email notifications sent (if configured)

## 6. Development Environment

### Optional: Set up development pipeline
- [ ] Create separate Cloudflare Pages project: `dans-clever-corner-dev`
- [ ] Point to `blog-dev.vahla.fi`
- [ ] Use dev CMS endpoint: `cms-api-dev.vahla.fi`
- [ ] Use dev Step Function: `blog-ai-pipeline-dev`
- [ ] Test changes in dev before production deploy

## 7. Monitoring Setup

### AWS CloudWatch
- [ ] Enable detailed logging for Step Functions
- [ ] Set up CloudWatch dashboard for:
  - Step Function execution duration
  - Bedrock API latency
  - Lambda errors
  - Success/failure rates
- [ ] Configure CloudWatch alarms for failures
- [ ] Set up SNS topic for email alerts

### Cloudflare & GitHub
- [ ] Enable Cloudflare Web Analytics on Pages
- [ ] Monitor GitHub Actions email notifications
- [ ] Set up uptime monitoring (optional): UptimeRobot, Pingdom, etc.

### Cost Monitoring
- [ ] Enable AWS Cost Explorer
- [ ] Set budget alert at $10/month
- [ ] Monitor Bedrock usage
- [ ] Track per-post cost metrics

## 8. Documentation

- [ ] Update `DEPLOYMENT.md` with actual ARNs and configuration
- [ ] Document troubleshooting procedures
- [ ] Create runbook for common issues
- [ ] Document rollback procedures
- [ ] Document Step Function state machine design

## Post-Launch

- [ ] Remove sensitive data from Git (should already be in `.gitignore`)
- [ ] Rotate API tokens after testing complete
- [ ] Monitor first few publishes closely
- [ ] Optimize AI prompts based on output quality
- [ ] Review and optimize build times
- [ ] Set up cost monitoring for Bedrock usage (~$0.01/post expected)
- [ ] Consider Bedrock provisioned throughput if volume increases
