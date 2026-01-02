/**
 * Utility functions for fetching author data from Webiny CMS
 */

interface WebinyAuthor {
  id: string
  entryId: string
  authorName: string
  authorSlug: string
  authorBio: string | null
  authorPicture: string | null
}

interface WebinyListAuthorsResponse {
  listAuthors: {
    data: WebinyAuthor[]
  }
}

const LIST_AUTHORS_QUERY = `
  query ListAuthors {
    listAuthors {
      data {
        id
        entryId
        authorName
        authorSlug
        authorBio
        authorPicture
      }
    }
  }
`

/**
 * Fetch all authors from Webiny CMS
 */
export async function fetchAuthors(): Promise<WebinyAuthor[]> {
  const endpoint = import.meta.env.WEBINY_GRAPHQL_ENDPOINT
  const token = import.meta.env.WEBINY_API_TOKEN

  if (!endpoint || !token) {
    throw new Error('Missing Webiny configuration. Check WEBINY_GRAPHQL_ENDPOINT and WEBINY_API_TOKEN environment variables.')
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: LIST_AUTHORS_QUERY,
      }),
    })

    if (!response.ok) {
      throw new Error(`Webiny API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors)
      throw new Error('GraphQL query failed')
    }

    const data = result.data as WebinyListAuthorsResponse
    return data.listAuthors.data
  } catch (error) {
    console.error('Error fetching authors from Webiny:', error)
    throw error
  }
}

export type { WebinyAuthor }
