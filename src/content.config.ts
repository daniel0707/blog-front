import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { webinyLoader } from './loaders/webiny-loader'

// Schema for Webiny posts (remote images as URLs)
const webinyPostsCollection = defineCollection({
  loader: webinyLoader(),
  schema: z.object({
    title: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional(),
    author: z.string().optional(),
    series: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    coverImage: z
      .object({
        src: z.string(), // Remote URL from Webiny
        alt: z.string(),
        width: z.number().default(1200), // Standard social media card width
        height: z.number().default(630), // Standard social media card height
      })
      .optional(),
    toc: z.boolean().optional().default(true),
    // SEO fields from Webiny
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
})

// Schema for local markdown posts (local images with image() helper)
const localPostsCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().optional().default(false),
      description: z.string().optional(),
      author: z.string().optional(),
      series: z.string().optional(),
      tags: z.array(z.string()).optional().default([]),
      coverImage: z
        .strictObject({
          src: image(),
          alt: z.string(),
        })
        .optional(),
      toc: z.boolean().optional().default(true),
    }),
})

const homeCollection = defineCollection({
  loader: glob({ pattern: ['home.md', 'home.mdx'], base: './src/content' }),
  schema: ({ image }) =>
    z.object({
      avatarImage: z
        .object({
          src: image(),
          alt: z.string().optional().default('My avatar'),
        })
        .optional(),
      githubCalendar: z.string().optional(), // GitHub username for calendar
    }),
})

const addendumCollection = defineCollection({
  loader: glob({ pattern: ['addendum.md', 'addendum.mdx'], base: './src/content' }),
  schema: ({ image }) =>
    z.object({
      avatarImage: z
        .object({
          src: image(),
          alt: z.string().optional().default('My avatar'),
        })
        .optional(),
    }),
})

export const collections = {
  // Use Webiny loader for posts (switch to localPostsCollection for local markdown)
  posts: webinyPostsCollection,
  home: homeCollection,
  addendum: addendumCollection,
}
