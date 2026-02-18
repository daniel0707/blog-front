import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'

/**
 * Unwraps heading anchors (added by rehype-autolink-headings) for specific files.
 * Pass an array of filenames (matched by path suffix) to opt them out.
 */
const plugin: Plugin<[{ files?: string[] }?], Root> = (options = {}) => {
  const { files = ['home.md'] } = options
  return function transformer(tree, file) {
    const filePath = file.path ?? ''
    if (!files.some((f) => filePath.endsWith(f))) return

    visit(tree, 'element', (node: Element) => {
      if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName)) return
      if (node.children.length !== 1) return
      const child = node.children[0]
      if (child.type === 'element' && child.tagName === 'a') {
        // Replace the wrapping <a> with its own children
        node.children = child.children
      }
    })
  }
}

export default plugin
