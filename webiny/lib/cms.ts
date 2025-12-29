import { queryWebiny } from './webiny-client';
import type { Post, Author, WebinyListResponse, WebinyGetResponse } from '../types/cms';

// GraphQL Queries with correct Webiny field names
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
          authorBio
          authorPicture
        }
      }
    }
  }
`;

const GET_POST_QUERY = `
  query GetPost($id: ID!) {
    getPost(where: { id: $id }) {
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
          authorBio
          authorPicture
        }
      }
    }
  }
`;

const GET_POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: String!) {
    listPosts(where: { postSlug: $slug }, limit: 1) {
      data {
        id
        entryId
        createdOn
        modifiedOn
        savedOn
        firstPublishedOn
        lastPublishedOn
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
          authorBio
          authorPicture
        }
      }
    }
  }
`;

const LIST_AUTHORS_QUERY = `
  query ListAuthors($limit: Int, $after: String) {
    listAuthors(limit: $limit, after: $after) {
      data {
        id
        entryId
        createdOn
        modifiedOn
        savedOn
        firstPublishedOn
        lastPublishedOn
        authorName
        authorSlug
        authorBio
        authorPicture
      }
      meta {
        cursor
        hasMoreItems
        totalCount
      }
    }
  }
`;

const GET_AUTHOR_QUERY = `
  query GetAuthor($id: ID!) {
    getAuthor(where: { id: $id }) {
      data {
        id
        entryId
        createdOn
        modifiedOn
        savedOn
        firstPublishedOn
        lastPublishedOn
        authorName
        authorSlug
        authorBio
        authorPicture
      }
    }
  }
`;

// Fetching Functions

/**
 * Fetch all posts from Webiny CMS
 * @param limit - Maximum number of posts to fetch (default: 100)
 * @returns Array of Post objects
 */
export async function getAllPosts(limit: number = 100): Promise<Post[]> {
  const response = await queryWebiny<{ listPosts: WebinyListResponse<Post> }>(LIST_POSTS_QUERY, {
    limit,
  });
  return response.listPosts.data;
}

/**
 * Fetch a single post by ID
 * @param id - The post ID
 * @returns Post object or null
 */
export async function getPostById(id: string): Promise<Post | null> {
  const response = await queryWebiny<{ getPost: WebinyGetResponse<Post> }>(GET_POST_QUERY, { id });
  return response.getPost.data || null;
}

/**
 * Fetch a single post by slug
 * @param slug - The post slug
 * @returns Post object or null
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const response = await queryWebiny<{ listPosts: WebinyListResponse<Post> }>(
    GET_POST_BY_SLUG_QUERY,
    { slug }
  );
  return response.listPosts.data[0] || null;
}

/**
 * Fetch all authors from Webiny CMS
 * @param limit - Maximum number of authors to fetch (default: 100)
 * @returns Array of Author objects
 */
export async function getAllAuthors(limit: number = 100): Promise<Author[]> {
  const response = await queryWebiny<{ listAuthors: WebinyListResponse<Author> }>(
    LIST_AUTHORS_QUERY,
    { limit }
  );
  return response.listAuthors.data;
}

/**
 * Fetch a single author by ID
 * @param id - The author ID
 * @returns Author object or null
 */
export async function getAuthorById(id: string): Promise<Author | null> {
  const response = await queryWebiny<{ getAuthor: WebinyGetResponse<Author> }>(GET_AUTHOR_QUERY, {
    id,
  });
  return response.getAuthor.data || null;
}

/**
 * Fetch posts by a specific author
 * @param authorId - The author ID
 * @returns Array of Post objects
 */
export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) =>
    post.postAuthorReference?.some((author) => author.id === authorId)
  );
}
