import type { Loader, LoaderContext } from 'astro/loaders'
import crypto from 'node:crypto'
import { getWebinyConfig } from '../utils/env-config'

// Webiny post structure from GraphQL
interface WebinyPostSection {
  postSectionContent: string // Markdown string
  postSectionImage: string | null
  postSectionImageDescription: string | null
}

interface WebinyPost {
  id: string
  entryId: string
  postHeadline: string
  postSlug: string
  postDescription: string | null
  postSeoHeadline: string | null
  postSeoDescription: string | null
  postHeadlineImage: string | null
  postHeadlineImageSmall: string | null
  postHeadlineImageAltText: string | null
  postIsFeatured: boolean
  postWrittenDateTime: string | null
  postEditedDateTime: string | null
  postTags: string[] | null
  postAuthor: { authorName: string } | null
  postSeries: string | null
  postSections: WebinyPostSection[] | null
}

interface WebinyListResponse {
  listPosts: {
    data: WebinyPost[]
  }
}

const LIST_POSTS_QUERY = `
  query ListPosts {
    listPosts {
      data {
        id
        entryId
        postHeadline
        postSlug
        postDescription
        postSeoHeadline
        postSeoDescription
        postHeadlineImage
        postHeadlineImageSmall
        postHeadlineImageAltText
        postIsFeatured
        postWrittenDateTime
        postEditedDateTime
        postTags
        postAuthor {
          authorName
        }
        postSeries
        postSections {
          postSectionContent(format: "markdown")
          postSectionImage
          postSectionImageDescription
        }
      }
    }
  }
`

interface FileManagerFile {
  id: string
  src: string
  meta: {
    width: number | null
    height: number | null
  }
}

interface FileDimensions {
  width: number
  height: number
}

// Cache for file dimensions to avoid redundant API calls
const fileDimensionsCache = new Map<string, FileDimensions>()

/**
 * Extract file ID from Webiny file URL
 * URL format: https://cms-api-dev.vahla.fi/files/{fileId}/{filename}
 */
function extractFileId(url: string): string | null {
  const match = url.match(/\/files\/([^/]+)\//)
  return match ? match[1] : null
}

/**
 * Fetch image dimensions from Webiny File Manager API
 */
async function fetchImageDimensions(
  fileId: string,
  fmEndpoint: string,
  token: string
): Promise<FileDimensions | null> {
  // Check cache first
  if (fileDimensionsCache.has(fileId)) {
    return fileDimensionsCache.get(fileId)!
  }

  const query = `
    query GetFile {
      fileManager {
        getFile(id: "${fileId}") {
          data {
            id
            meta {
              width
              height
            }
          }
        }
      }
    }
  `

  try {
    const response = await fetch(fmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    })

    const json = await response.json()
    const file = json.data?.fileManager?.getFile?.data

    if (file?.meta?.width && file?.meta?.height) {
      const dimensions = {
        width: file.meta.width,
        height: file.meta.height,
      }
      fileDimensionsCache.set(fileId, dimensions)
      return dimensions
    }
  } catch (error) {
    console.error(`Failed to fetch dimensions for file ${fileId}:`, error)
  }

  return null
}

/**
 * Fetch posts from Webiny GraphQL API
 */
async function fetchWebinyPosts(
  endpoint: string,
  token: string
): Promise<WebinyPost[]> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: LIST_POSTS_QUERY }),
  })

  const json = await response.json()

  if (json.errors) {
    console.error('Webiny GraphQL Errors:', json.errors)
    throw new Error(`Webiny GraphQL Error: ${json.errors[0]?.message}`)
  }

  return (json.data as WebinyListResponse).listPosts.data
}

/**
 * Transform Webiny post sections into a single markdown body
 * Sections are joined with horizontal rules (---)
 */
function transformSectionsToMarkdown(sections: WebinyPostSection[] | null): string {
  if (!sections || sections.length === 0) {
    return ''
  }

  return sections
    .map((section) => {
      let content = section.postSectionContent || ''

      // Add section image at the end if present
      if (section.postSectionImage) {
        const alt = section.postSectionImageDescription || 'Section image'
        content += `\n\n![${alt}](${section.postSectionImage})`
      }

      return content.trim()
    })
    .filter((content) => content.length > 0)
    .join('\n\n---\n\n')
}

/**
 * Transform Webiny post to Astro content entry format
 */
async function transformPost(
  post: WebinyPost,
  fmEndpoint: string,
  token: string
): Promise<{
  id: string
  data: Record<string, unknown>
  body: string
}> {
  // Build the markdown body from sections
  const body = transformSectionsToMarkdown(post.postSections)

  // Transform to Astro schema format
  const data: Record<string, unknown> = {
    title: post.postHeadline || 'Untitled',
    published: post.postWrittenDateTime
      ? new Date(post.postWrittenDateTime)
      : new Date(),
    draft: false, // Webiny only returns published posts via read API
    description: post.postDescription || undefined,
    tags: post.postTags || [],
    toc: true,
  }

  // Optional fields
  if (post.postEditedDateTime) {
    data.updated = new Date(post.postEditedDateTime)
  }

  if (post.postAuthor?.authorName) {
    data.author = post.postAuthor.authorName
  }

  if (post.postSeries) {
    data.series = post.postSeries
  }

  // SEO fields (for use in layouts)
  if (post.postSeoHeadline) {
    data.seoTitle = post.postSeoHeadline
  }
  if (post.postSeoDescription) {
    data.seoDescription = post.postSeoDescription
  }

  // Cover image - fetch dimensions from File Manager
  if (post.postHeadlineImage) {
    const fileId = extractFileId(post.postHeadlineImage)
    let dimensions: FileDimensions | null = null

    if (fileId) {
      dimensions = await fetchImageDimensions(fileId, fmEndpoint, token)
    }

    data.coverImage = {
      src: post.postHeadlineImage,
      alt: post.postHeadlineImageAltText || 'Cover image',
      // Use fetched dimensions or defaults
      width: dimensions?.width || 1440,
      height: dimensions?.height || 480,
    }
  }

  // Card image (small square for listings)
  if (post.postHeadlineImageSmall) {
    const fileId = extractFileId(post.postHeadlineImageSmall)
    let dimensions: FileDimensions | null = null

    if (fileId) {
      dimensions = await fetchImageDimensions(fileId, fmEndpoint, token)
    }

    data.cardImage = {
      src: post.postHeadlineImageSmall,
      alt: post.postHeadlineImageAltText || 'Card image',
      width: dimensions?.width || 320,
      height: dimensions?.height || 320,
    }
  }

  return {
    id: post.postSlug,
    data,
    body,
  }
}

/**
 * Astro content loader for Webiny CMS posts
 */
export function webinyLoader(): Loader {
  return {
    name: 'webiny-loader',

    async load(context: LoaderContext): Promise<void> {
      const { store, logger, parseData } = context

      try {
        // Get Webiny configuration
        const { graphqlEndpoint, apiToken, fileManagerEndpoint } = getWebinyConfig()

        logger.info('Fetching posts from Webiny CMS...')

        const posts = await fetchWebinyPosts(graphqlEndpoint, apiToken)
        logger.info(`Fetched ${posts.length} posts from Webiny`)

        // Clear existing entries
        store.clear()

        // Transform and store each post
        for (const post of posts) {
          const transformed = await transformPost(post, fileManagerEndpoint, apiToken)

          // Parse and validate data against schema
          const parsedData = await parseData({
            id: transformed.id,
            data: transformed.data,
          })

          // Generate a digest for content change tracking
          const digest = crypto
            .createHash('sha256')
            .update(transformed.body)
            .digest('hex')
            .slice(0, 16)

          // Render markdown to HTML and metadata
          const rendered = await context.renderMarkdown(transformed.body)

          store.set({
            id: transformed.id,
            data: parsedData,
            body: transformed.body,
            digest,
            rendered,
          })

          logger.debug(`Loaded post: ${transformed.id}`)
        }

        logger.info(`Successfully loaded ${posts.length} posts`)
      } catch (error) {
        if (error instanceof Error && error.message.includes('Missing Webiny configuration')) {
          logger.error(error.message)
          return
        }
        logger.error(`Failed to fetch from Webiny: ${error}`)
        throw error
      }
    },
  }
}
