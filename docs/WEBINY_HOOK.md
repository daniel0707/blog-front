# Webiny CMS Integration - Content Publish Hook

This file needs to be added to your Webiny CMS repository to trigger the AI content pipeline.

## File Location
`apps/api/graphql/src/plugins/contentPublishHook.ts`

## Implementation

```typescript
import { ContextPlugin } from "@webiny/api-serverless-cms";

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
        environment: process.env.WEBINY_ENV || "production",
        publishedAt: new Date().toISOString(),
      };

      // Determine workflow URL based on environment
      const workflowUrl =
        process.env.WEBINY_ENV === "dev"
          ? "https://workflow-dev.vahla.dev/publish"
          : "https://workflow.vahla.dev/publish";

      // Call Cloudflare Workflow
      const response = await fetch(workflowUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKFLOW_SECRET_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Workflow trigger failed: ${response.status} ${response.statusText}`
        );
      }

      console.log(
        `Successfully triggered AI pipeline for entry: ${entry.id}`
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

## Environment Variables

Add to your Webiny `.env` files:

```bash
# Development
WEBINY_ENV=dev
WORKFLOW_SECRET_TOKEN=your-secret-token-here

# Production
WEBINY_ENV=production
WORKFLOW_SECRET_TOKEN=your-secret-token-here
```

## Testing

After deploying the hook:

1. Publish a test post in Webiny CMS
2. Check CloudWatch logs for:
   - "Content published: <entry-id>"
   - "Successfully triggered AI pipeline for entry: <entry-id>"
3. Verify Cloudflare Workflow receives the payload
4. Monitor GitHub Actions for triggered build

## Error Handling

The hook is designed to be **non-blocking**:
- If the Workflow call fails, content is still published
- Errors are logged to CloudWatch
- Content can be manually republished to retry the pipeline

## Security

- Use `WORKFLOW_SECRET_TOKEN` to authenticate requests
- Validate token in Cloudflare Workflow
- Use HTTPS for all communication
- Don't expose sensitive data in logs
