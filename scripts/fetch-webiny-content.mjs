#!/usr/bin/env node

/**
 * Fetch content from Webiny CMS and save to temp file for inspection
 * Uses the same query structure as webiny/lib/cms.ts
 */

import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';

// Read env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

const WEBINY_GRAPHQL_ENDPOINT = envVars.WEBINY_GRAPHQL_ENDPOINT;
const WEBINY_API_TOKEN = envVars.WEBINY_API_TOKEN;

// Same query as in webiny/lib/cms.ts
const LIST_POSTS_QUERY = `
  query ListPosts {
    listPosts {
      data {
        id
        entryId
        postHeadline
        postSlug
        postDescription
        postHeadlineImage
        postIsFeatured
        postWrittenDateTime
        postEditedDateTime
        postTags
        postSections {
          postSectionContent(format: "markdown")
          postSectionImage
          postSectionImageDescription
        }
        postAuthorReference {
          id
          entryId
          authorName
          authorSlug
        }
      }
    }
  }
`;

async function fetchPosts() {
  const response = await fetch(WEBINY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WEBINY_API_TOKEN}`,
    },
    body: JSON.stringify({ query: LIST_POSTS_QUERY }),
  });

  const json = await response.json();
  
  if (json.errors) {
    console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }

  return json.data.listPosts.data;
}

async function main() {
  console.log('Fetching posts from Webiny...');
  console.log('Endpoint:', WEBINY_GRAPHQL_ENDPOINT);
  
  const posts = await fetchPosts();
  
  console.log(`Found ${posts.length} posts\n`);
  
  // Save raw JSON response
  writeFileSync('/tmp/webiny-posts-raw.json', JSON.stringify(posts, null, 2));
  console.log('Saved raw JSON to /tmp/webiny-posts-raw.json');
  
  // Process each post
  for (const post of posts) {
    console.log(`\n=== Post: ${post.postHeadline} ===`);
    console.log(`Slug: ${post.postSlug}`);
    console.log(`Sections: ${post.postSections?.length || 0}`);
    
    // Save individual section content for inspection
    if (post.postSections?.length > 0) {
      post.postSections.forEach((section, i) => {
        const filename = `/tmp/webiny-${post.postSlug}-section-${i}.md`;
        writeFileSync(filename, section.postSectionContent || '(empty)');
        console.log(`  Section ${i}: ${filename}`);
      });
    }
  }
}

main().catch(console.error);

