import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { h as _h, type Properties } from 'hastscript'
import type { Paragraph as P } from 'mdast'

/** From Astro Starlight: Function that generates an mdast HTML tree ready for conversion to HTML by rehype. */
function h(el: string, attrs: Properties = {}, children: any[] = []): P {
  const { properties, tagName } = _h(el, attrs)
  return {
    children,
    data: { hName: tagName, hProperties: properties },
    type: 'paragraph',
  }
}

interface CharacterDialogueOptions {
  // No options needed - all character images come from CMS URLs
}

const remarkCharacterDialogue: Plugin<[CharacterDialogueOptions?], Root> = (opts = {}) => (tree) => {
  visit(tree, (node, index, parent) => {
    if (!parent || index === undefined || node.type !== 'containerDirective') return

    const characterName = node.name

    // Get image URL from directive label (CMS syntax) or fall back to config (local markdown)
    // CMS syntax: :::characterName[imageUrl]{align="left"}
    // Local syntax: :::characterName{align="left"} (looks up URL from config)
    let imageUrl: string | undefined
    const directiveNode = node as any

    // Check for URL in directive label: [url]
    // remark-directive parses [label] as a paragraph with directiveLabel: true
    const labelIndex = directiveNode.children?.findIndex(
      (child: any) => child.type === 'paragraph' && child.data?.directiveLabel === true
    )

    if (labelIndex !== undefined && labelIndex !== -1) {
      const labelParagraph = directiveNode.children[labelIndex]
      // The label content might be a text node or a link node (if GFM auto-linked it)
      const firstChild = labelParagraph.children?.[0]
      if (firstChild?.type === 'text') {
        imageUrl = firstChild.value
      } else if (firstChild?.type === 'link') {
        // GFM auto-linked the URL
        imageUrl = firstChild.url
      }
      
      if (imageUrl) {
        // Remove the label paragraph so it doesn't appear in content
        directiveNode.children.splice(labelIndex, 1)
      }
    }

    // Skip if we can't find an image URL (must come from CMS)
    if (!imageUrl) return

    const align = node.attributes?.align ?? null
    const alignClass = align === 'left' || align === 'right' ? ` align-${align}` : ''

    // Do not change prefix to AD, ADM, or similar, adblocks will block the content inside.
    const admonition = h(
      'aside',
      {
        'aria-label': `Character dialogue: ${characterName}`,
        class: 'character-dialogue' + alignClass,
        'data-character': characterName,
      },
      [
        h('img', {
          class: 'character-dialogue-image',
          alt: characterName,
          loading: 'lazy',
          src: imageUrl,
          width: 100,
        }),
        h('div', { class: 'character-dialogue-content' }, directiveNode.children),
      ],
    )

    parent.children[index] = admonition
  })
}

export default remarkCharacterDialogue
