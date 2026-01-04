# Webiny CMS Integration - Content Publish Hook

This file needs to be added to your Webiny CMS repository to trigger the AI content pipeline via AWS Step Functions.

## File Location
`apps/api/graphql/src/plugins/contentPublishHook.ts`

## Implementation

```typescript
import { ContextPlugin } from "@webiny/api-serverless-cms";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfnClient = new SFNClient({ region: process.env.AWS_REGION || "us-east-1" });

export default new ContextPlugin(async (context) => {
  // Hook into content lifecycle
  context.cms.onEntryAfterPublish.subscribe(async ({ entry, model }) => {
    // Only process blog posts
    if (model.modelId !== "post") {
      return;
    }

    console.log(`Content published: ${entry.id}`);

    try {
      // Extract content data
      const payload = {
        entryId: entry.id,
        title: entry.values.postHeadline || "",
        description: entry.values.postDescription || "",
        content: extractContentText(entry.values.postSections),
        environment: process.env.WEBINY_ENV || "prod",
        publishedAt: new Date().toISOString(),
      };

      // Determine Step Function ARN based on environment
      const stepFunctionArn =
        process.env.WEBINY_ENV === "dev"
          ? process.env.STEP_FUNCTION_ARN_DEV
          : process.env.STEP_FUNCTION_ARN_PROD;

      if (!stepFunctionArn) {
        throw new Error("Step Function ARN not configured");
      }

      // Start Step Function execution
      const command = new StartExecutionCommand({
        stateMachineArn: stepFunctionArn,
        input: JSON.stringify(payload),
        name: `post-${entry.id}-${Date.now()}`, // Unique execution name
      });

      const response = await sfnClient.send(command);

      console.log(
        `Successfully triggered AI pipeline for entry: ${entry.id}`,
        `Execution ARN: ${response.executionArn}`
      );
    } catch (error) {
      console.error("Failed to trigger AI pipeline:", error);
      // Don't throw - allow content to be published even if pipeline fails
      // The content can be manually republished to retry
    }
  });
});

/**
 * Extract plain text from post sections for AI processing
 */
function extractContentText(sections: any[]): string {
  if (!sections || !Array.isArray(sections)) {
    return "";
  }

  return sections
    .map((section) => {
      // Extract markdown content from each section
      return section.postSectionContent || "";
    })
    .join("\n\n")
    .trim();
}
```

## Register Plugin

Add to `apps/api/graphql/src/index.ts`:

```typescript
import contentPublishHook from "./plugins/contentPublishHook";

export const handler = createHandler({
  plugins: [
    // ... existing plugins
    contentPublishHook,
  ],
});
```

## Required Dependencies

Add to `package.json`:

```bash
npm install @aws-sdk/client-sfn
```

## Environment Variables

Add to Webiny `.env` file:

```bash
# Environment identifier
WEBINY_ENV=dev  # or "prod"

# AWS Step Function ARNs
STEP_FUNCTION_ARN_DEV=arn:aws:states:us-east-1:123456789:stateMachine:blog-ai-pipeline-dev
STEP_FUNCTION_ARN_PROD=arn:aws:states:us-east-1:123456789:stateMachine:blog-ai-pipeline-prod

# AWS Region (optional, defaults to us-east-1)
AWS_REGION=us-east-1
```

## IAM Permissions

Ensure the Webiny Lambda execution role has permission to start Step Functions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "states:StartExecution"
      ],
      "Resource": [
        "arn:aws:states:us-east-1:123456789:stateMachine:blog-ai-pipeline-dev",
        "arn:aws:states:us-east-1:123456789:stateMachine:blog-ai-pipeline-prod"
      ]
    }
  ]
}
```

## Deployment

After making changes:

```bash
yarn webiny deploy api --env <environment>
```

## Testing

### 1. Check CloudWatch Logs

After publishing content, check Lambda logs:
- AWS Console → CloudWatch → Log Groups → `/aws/lambda/webiny-api-graphql`
- Look for: "Successfully triggered AI pipeline for entry: ..."

### 2. Verify Step Function Execution

- AWS Console → Step Functions → State machines
- Select your state machine (blog-ai-pipeline-dev or prod)
- Check "Executions" tab for recent runs
- Click execution to see detailed step-by-step progress

### 3. Verify GitHub Actions Trigger

After Step Function completes:
- GitHub → Actions tab
- Look for workflow run triggered by `repository_dispatch`
- Check build logs and deployment status

## Troubleshooting

### Hook Not Firing
- Check that plugin is registered in `index.ts`
- Verify `modelId === "post"` matches your content model
- Check CloudWatch logs for Lambda errors

### Step Function Not Starting
- Verify ARN is correct in `.env`
- Check IAM permissions on Lambda execution role
- Verify AWS SDK client configuration

### Execution Fails
- Check Step Function execution in AWS Console
- Review CloudWatch logs for each Lambda step
- Common issues:
  - Bedrock model not enabled in region
  - Missing IAM permissions
  - Invalid payload format
  - API rate limits

## Notes

- Hook is non-blocking - content publishes even if Step Function fails
- Each execution has unique name to prevent duplicates
- Can manually republish content to retry pipeline
- Step Function ARN must be created before deploying hook
