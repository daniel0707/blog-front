import type { LexicalNode } from 'lexical';

// Webiny CMS Entity Types (only custom fields)

// Lexical Editor Content Structure
export interface LexicalContent {
  root: {
    children: LexicalNode[];
    direction: string | null;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

export interface PostSection {
  postSectionContent: string; // HTML string from Webiny
  postSectionImage: string;
  postSectionImageDescription: string;
}

export interface Author {
  id: string;
  entryId: string;
  // Custom author fields
  authorName: string;
  authorSlug: string;
  authorBio: string;
  authorPicture: string;
}

export interface Post {
  id: string;
  entryId: string;
  // Custom post fields
  postHeadline: string;
  postSlug: string;
  postDescription: string;
  postSeoHeadline: string;
  postSeoDescription: string;
  postHeadlineImage: string;
  postHeadlineImageSmall: string;
  postHeadlineImageAltText: string;
  postIsFeatured: boolean;
  postWrittenDateTime: string;
  postEditedDateTime: string;
  postSections: PostSection[];
  postAuthorReference: Author[];
  postTags: string[];
}

// GraphQL Response Types
export interface WebinyListResponse<T> {
  data: T[];
  meta: { totalCount: number; cursor: string | null };
  error?: {
    message: string;
    code: string;
    data: Record<string, unknown>;
  };
}

export interface WebinyGetResponse<T> {
  data: T;
  error?: {
    message: string;
    code: string;
    data: Record<string, unknown>;
  };
}
