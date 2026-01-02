# WebinyCMS Integration TODO

## Project Goal
Integrate WebinyCMS as the content source for this Astro blog starter, replacing local markdown files with content fetched from Webiny at build time.

## Phase 1: Content Model Design

### 1.1 Create NEW WebinyCMS Content Model
- [ ] **Do NOT trust the existing Webiny schema as-is**
- [ ] **Do NOT trust the existing Astro blog starter schema as-is**
- [ ] Design a content model that better suits our needs from scratch
- [ ] Question and rethink every field in both existing schemas
- [ ] **Key requirement: Posts must be divided into SECTIONS**
  - This allows for better content organization and structure
  - Each section can have its own content, images, and metadata
  - More flexibility in post composition than single-body markdown

### 1.1.5 Review and Adjust Site Configuration
- [x] Review `src/site.config.ts` and update all values for the actual blog
  - [x] Update `site` URL (now uses environment-based: blog.vahla.fi / blog-dev.vahla.fi)
  - [x] Update `title` (now "Dan's Clever Corner")
  - [x] Update `description` (now "Comprehending Life's Undefined Behaviour")
  - [x] Update `author` (now "Daniel Vahla")
  - [x] Update `tags` for SEO (now includes Programming, Cloud, Food, Life topics)
  - [ ] Replace `socialCardAvatarImage` with actual avatar (still using placeholder avatar.jpg)
  - [x] Review and adjust `pageSize` (kept at 6)
  - [x] Update `navLinks` (removed GitHub, renamed Archive to Posts)
  - [x] Configure `themes.mode` and `themes.default` (mode: select, default: catppuccin-mocha)
  - [x] Consider reducing `themes.include` array (kept all 59 themes)
  - [x] Update all `socialLinks` (removed most, kept email and LinkedIn)
  - [x] Configure `giscus` for your own repository (daniel0707/blog-front, General category)
  - [x] Review `characters` for character chat feature (removed from config, now CMS-only)

### 1.2 Content Model Design Decisions

#### Feature Analysis from Current Repo:

**SEO Implementation:**
- ✅ **Keep SEO fields** - Repo has comprehensive SEO meta tags:
  - Standard meta description
  - OpenGraph tags (og:title, og:description, og:url, og:type, og:image)
  - Twitter card tags (twitter:title, twitter:description, twitter:image)
  - Currently uses `title` and `description` from frontmatter
  - **Decision**: Add separate `seoTitle` and `seoDescription` fields in Webiny
    - Allows customization for social media without affecting page title
    - Falls back to regular title/description if not provided
    - Gives better control over how posts appear when shared

**Series Implementation:**
- ✅ **Keep Series** - Works like tags, but for grouping related posts
  - Simple string field: `series: "My Series Name"`
  - Posts with same series string are automatically grouped
  - Creates dedicated series pages at `/series/my-series-name`
  - **Indefinite length**: Yes! Any number of posts can have the same series value
  - Shows post count badge on series links
  - Sorted by most recent post in series
  - **Decision**: Keep this feature - great for multi-part tutorials/stories

**Tags Implementation:**
- ✅ **Keep as simple string array** - `tags: ['typescript', 'javascript']`
  - Just an array of strings, no complex tag objects
  - Auto-generates tag pages at `/tags/typescript`, `/tags/javascript`
  - Shows post count for each tag
  - Multiple tags per post
  - Used in meta keywords for SEO
  - **Decision**: Keep simple - no need for tag colors/descriptions

**Images & Responsive Design:**
- Current repo uses Astro's image optimization automatically
- Frontmatter: `coverImage: { src: image(), alt: string }`
- **Webiny side**: Can query specific sizes (e.g., `?width=800`, `?width=400`)
- **Decision**: Store single image URL in Webiny, append size queries in Astro:
  - Desktop: `${imageUrl}?width=1200`
  - Mobile: `${imageUrl}?width=800`
  - Thumbnail: `${imageUrl}?width=400`
  - Simpler than storing multiple URLs in CMS

#### REMOVED from Model:
- ❌ **Author model** - Single author blog, keep author config locally in Astro (site.config.ts)
  - No need for CMS complexity when there's only one author
  - Simpler to manage author info in code
- ❌ **Featured flag** - Not needed for now

#### Fields to Include in Post Model:
- [ ] **Basic fields:**
  - `title` (string, required) - Post title
  - `slug` (string, required, unique) - URL-friendly identifier
  - `description` (string, optional) - Short summary for previews
  - `tags` (array of strings) - Simple tag names
  - `series` (string, optional) - Series name for grouping related posts
  
- [ ] **SEO fields:**
  - `seoTitle` (string, optional) - Custom title for social media (falls back to title)
  - `seoDescription` (string, optional) - Custom description for social media (falls back to description)
  
- [ ] **Publishing metadata:**
  - `publishedDate` (datetime, required) - When post was first published
  - `updatedDate` (datetime, optional) - When post was last updated
  - `draft` (boolean, default: true) - Whether post is published or draft
  
- [ ] **Images:**
  - `coverImage` (image reference) - Main post image
  - `coverImageAlt` (string) - Alt text for accessibility
  - Note: Webiny will provide single URL, Astro will add size parameters
  
- [ ] **Section-based content structure** (array of sections):
  - Each section object contains:
    - `content` (rich text/HTML) - Section body content
    - `image` (image reference, optional) - Section-specific image
    - `imageAlt` (string, optional) - Alt text for section image

### 1.3 Schema Mapping Plan
Document how Webiny fields will map to Astro's expected schema:
- [ ] Define transformation logic
- [ ] Handle section concatenation (if needed for compatibility)
- [ ] Image URL handling and optimization
- [ ] Author data flattening/structuring
- [ ] Date format conversions

## Phase 2: Webiny Integration

### 2.1 Setup & Configuration
- [x] Environment variables (.env file with API endpoint and token)
- [ ] Install required dependencies
  - [ ] `graphql-request` (for GraphQL queries)
  - [ ] Any other needed packages

### 2.2 Create Custom Astro Content Loader
- [ ] Build a Webiny loader for Astro content collections
  - [ ] Fetch all posts from Webiny GraphQL API at build time
  - [ ] Transform Webiny data to match Astro content schema
  - [ ] Handle errors and validation
  - [ ] Support filtering (draft vs published)
- [ ] Integrate loader into `src/content.config.ts`
- [ ] Ensure loader works with Astro's build process

### 2.3 Migrate Webiny Integration Files
- [ ] Review existing files in `webiny/` folder
- [ ] Adapt types (`webiny/types/cms.ts`) to new content model
- [ ] Update queries (`webiny/lib/cms.ts`) for new schema
- [ ] Integrate utilities:
  - [ ] `webiny-client.ts` - GraphQL client setup
  - [ ] `fix-code-blocks.ts` - Code syntax highlighting for Webiny HTML
  - [ ] `date-utils.ts` - Date formatting helpers

### 2.4 WebinyCMS Configuration Changes

**CRITICAL: Lock Down & Configure Webiny Lexical Editor**

**Phase 2.4.1: Restrict Editor to Markdown-Compatible Features Only**
- [ ] **Customize Webiny Lexical Editor configuration**
  - [ ] Remove/disable all toolbar buttons/features that cannot be converted to markdown
  - [ ] Remove HTML element insertion (no raw HTML support)
  - [ ] Remove custom styling options (colors, fonts, etc.)
  - [ ] Remove features that don't map to markdown
  - [ ] Keep ONLY markdown-compatible features:
    - Paragraphs and line breaks
    - Headings (h1-h6)
    - Bold, italic, strikethrough
    - Links
    - Ordered and unordered lists
    - Code blocks with language selection
    - Inline code
    - Images (with alt text)
    - Block quotes
    - Horizontal rules
    - Tables (basic markdown tables)

**Phase 2.4.2: Add Markdown Transformation Support**
- [ ] **Install/configure Lexical Markdown plugin**
  - [ ] Add `@lexical/markdown` plugin to editor
  - [ ] Configure markdown transformers for all supported features
  - [ ] Test bidirectional conversion (markdown → editor, editor → markdown)
  
- [ ] **Implement Markdown export transformer in Webiny backend**
  - [ ] Create custom transformer: Lexical JSON → Markdown string
  - [ ] Ensure transformer handles all allowed content types:
    - Paragraphs, headings (h1-h6)
    - Lists (ordered, unordered, nested)
    - Code blocks with language identifiers (```language)
    - Inline code with backticks
    - Links, bold, italic, strikethrough formatting
    - Images with alt text: `![alt](url)`
    - Block quotes (> prefix)
    - Tables (markdown table syntax)
    - Horizontal rules (---)
  - [ ] Configure GraphQL query to request markdown format:
    ```graphql
    postSectionContent(format: "markdown")  # Instead of "html"
    ```

**Phase 2.4.3: Support Special Markdown Features from Astro**
This blog uses custom markdown extensions that need Webiny support:

- [ ] **Admonitions** (via remark-directive):
  ```markdown
  :::note
  This is a note
  :::
  
  :::tip
  Helpful tip here
  :::
  
  :::important | :::caution | :::warning
  ```
  - [ ] Research if Lexical supports directive syntax natively
  - [ ] Option A: Add custom Lexical plugin for admonitions
  - [ ] Option B: Add custom toolbar button that inserts directive text
  - [ ] Test all admonition types: note, tip, important, caution, warning

- [ ] **Character Chats** (custom remark plugin):
  ```markdown
  :::duck
  Message from duck character
  :::
  
  :::owl{align="right"}
  Message with alignment
  :::
  ```
  - [ ] Add character selector to editor (dropdown or custom button)
  - [ ] Insert proper directive syntax with character name
  - [ ] Support alignment parameter: `{align="left"}` or `{align="right"}`
  - [ ] Test sequential character chats (conversations)

- [ ] **GitHub Cards** (custom remark plugin):
  ```markdown
  ::github{repo="owner/repo"}
  ::github{user="username"}
  ```
  - [ ] Add custom button/field for GitHub card insertion
  - [ ] Validate repo/user format
  - [ ] Insert proper directive syntax

- [ ] **Emoji Shortcodes** (remark-gemoji):
  ```markdown
  :star_struck: :coffee: :rocket:
  ```
  - [ ] Add emoji picker to editor OR allow shortcode typing
  - [ ] Use GitHub emoji shortcode format
  - [ ] Test emoji rendering in preview

- [ ] **LaTeX/KaTeX Math** (LOW PRIORITY):
  ```markdown
  Inline: $ equation $
  Block: $$ equation $$
  ```
  - [ ] Consider adding math editor plugin for Lexical
  - [ ] Support inline and block math syntax
  - [ ] May defer this feature initially

- [ ] **Special Image Handling**:
  ```markdown
  ![alt text](url "title for figcaption")
  ![alt text #pixelated](url)
  ```
  - [ ] Support image title attribute for figcaptions
  - [ ] Support `#pixelated` tag in alt text for pixel art CSS
  - [ ] Test image uploads and URL handling

**Phase 2.4.4: Validate & Test**
- [ ] **Create test content in Webiny** with all supported features
- [ ] Verify markdown export is clean and valid
- [ ] Test that exported markdown works in Astro without modification
- [ ] Ensure no HTML tags leak into markdown output
- [ ] Test edge cases (nested lists, complex tables, etc.)

### 2.5 Content Transformation

**Revised Astro Content Pipeline with Markdown from Webiny:**
- Webiny Lexical editor → **Markdown output** (via transformer)
- Array of markdown sections from Webiny
- Concatenate sections with section markers/dividers
- Feed into Astro's content collections as markdown
- Process through remark/rehype pipeline (all existing plugins work!)
- `render()` → `<Content />` component as usual

**Benefits of Markdown Approach:**
- ✅ Uses all existing remark/rehype plugins automatically
- ✅ Consistent rendering between local markdown and Webiny content
- ✅ Maintains section structure (can add markers between sections)
- ✅ Preserves Astro features (TOC, reading time, syntax highlighting)
- ✅ No custom rendering component needed
- ✅ Code blocks work exactly as expected

**Content Flow:**
```
Webiny Lexical → Markdown sections → Concatenate → Astro content loader → 
remark/rehype plugins → <Content /> component
```

- [ ] Create transformation functions
  - [ ] Webiny Post → Astro Post schema
  - [ ] Concatenate markdown sections with dividers (if needed)
  - [ ] Preserve section boundaries with HTML comments or custom markers
  - [ ] Map Webiny fields to Astro frontmatter
  - [ ] Handle image URLs (add responsive size parameters)
  - [ ] Transform dates to ISO format

## Phase 3: Testing & Validation

### 3.1 Build-Time Testing
- [ ] Test custom loader fetches posts successfully
- [ ] Verify pagination works with Webiny data
- [ ] Check all post pages generate correctly
- [ ] Validate tag filtering and tag pages
- [ ] Test series functionality (if implemented)

### 3.2 Content Rendering
- [ ] Verify markdown/HTML rendering works
- [ ] Check code block syntax highlighting
- [ ] Test image loading and display
- [ ] Validate metadata (SEO, dates, authors)
- [ ] Check responsive design with new content

### 3.3 Performance
- [ ] Measure build time with Webiny integration
- [ ] Check for any API rate limiting issues
- [ ] Optimize GraphQL queries if needed
- [ ] Consider caching strategies for development

## Phase 4: Production Readiness

### 4.1 Documentation
- [ ] Document the content model structure
- [ ] Create guide for adding new posts in Webiny
- [ ] Document build process and deployment
- [ ] Add troubleshooting guide

### 4.2 Deployment Setup
- [ ] Configure build hooks for content updates
- [ ] Set up environment variables in hosting platform
- [ ] Test full build and deploy cycle
- [ ] Plan for content preview workflow

## Notes & Considerations

- **Build Time vs Runtime**: This integration fetches content at BUILD time, not runtime. New posts require rebuilding the site.
- **Webiny Webhooks**: Consider setting up webhooks to trigger builds when content is published in Webiny
- **Local Development**: May want to cache Webiny responses locally during development to avoid rate limits
- **Backward Compatibility**: Keep local markdown support? Or fully migrate to Webiny?
- **Content Migration**: If migrating existing posts, need a strategy to move markdown → Webiny CMS

## Current Status
- [x] Astro blog starter installed and running
- [x] Dependencies installed
- [x] Dev server running at http://localhost:4321/
- [x] Environment variables configured
- [x] Existing Webiny integration files available for reference
- [ ] Content model design - IN PROGRESS
- [ ] Custom loader implementation - PENDING
