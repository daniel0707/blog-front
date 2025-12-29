import { codeToHtml } from 'shiki';

/**
 * Detect language from code content (simple heuristics)
 */
function detectLanguage(code: string): string {
  const trimmed = code.trim();

  // Python
  if (trimmed.match(/^(def|class|import|from|if __name__|print\()/m)) return 'python';

  // JavaScript/TypeScript
  if (trimmed.match(/^(const|let|var|function|import|export|=>)/m)) return 'javascript';
  if (trimmed.match(/^(interface|type|namespace)/m)) return 'typescript';

  // HTML
  if (trimmed.match(/^<!DOCTYPE|^<html|^<div|^<span/m)) return 'html';

  // CSS
  if (trimmed.match(/^(\.|#)[a-zA-Z].*\{/m)) return 'css';

  // JSON
  if (trimmed.match(/^\{[\s\S]*"[^"]+"\s*:/)) return 'json';

  // Shell/Bash
  if (trimmed.match(/^(#!\/bin\/|npm |yarn |pnpm |cd |ls |mkdir )/m)) return 'bash';

  // SQL
  if (trimmed.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)/im)) return 'sql';

  // Default to plaintext
  return 'plaintext';
}

/**
 * Post-process HTML from Webiny to fix code blocks and add syntax highlighting
 * Webiny renders code as separate paragraphs with inline code tags,
 * but we want proper <pre><code> blocks for multi-line code
 */
export async function fixWebinyCodeBlocks(html: string): Promise<string> {
  // Match consecutive paragraphs that contain only code tags
  // Pattern: <p ...><code ...><span>...</span></code></p>
  const codeLineRegex = /<p[^>]*><code[^>]*><span[^>]*>([^<]*)<\/span><\/code><\/p>/g;

  let result = html;
  let match;
  const matches: Array<{ start: number; end: number; content: string; indent: number }> = [];

  // Find all code lines
  const tempHtml = html;
  const offset = 0;

  while ((match = codeLineRegex.exec(tempHtml)) !== null) {
    const fullMatch = match[0];
    const codeContent = match[1];
    const startIndex = match.index + offset;
    const endIndex = startIndex + fullMatch.length;

    // Check if this line has indentation
    const indentMatch = fullMatch.match(/padding-inline-start:\s*(\d+)px/);
    const indent = indentMatch ? parseInt(indentMatch[1]) / 40 : 0; // 40px per indent level

    matches.push({
      start: startIndex,
      end: endIndex,
      content: codeContent,
      indent: indent,
    });
  }

  // Group consecutive code lines
  const groups: Array<Array<(typeof matches)[0]>> = [];
  let currentGroup: typeof matches = [];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];

    if (currentGroup.length === 0) {
      currentGroup.push(current);
      continue;
    }

    const previous = currentGroup[currentGroup.length - 1];
    const textBetween = html.substring(previous.end, current.start);

    // If there's only whitespace between code lines, they're part of the same block
    if (textBetween.trim() === '') {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Replace each group with a proper code block (from last to first to maintain indices)
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];

    // Only process groups with multiple lines (otherwise keep as inline code)
    if (group.length <= 1) continue;

    // Combine lines with proper indentation
    const codeLines = group.map((line) => {
      const spaces = '  '.repeat(line.indent);
      return spaces + line.content;
    });

    // Check if first line is a language marker (e.g., `python, `javascript)
    let lang = 'plaintext';
    let finalCodeLines = codeLines;

    const firstLine = codeLines[0]?.trim();
    if (firstLine && firstLine.startsWith('`') && firstLine.length < 20) {
      // Extract language from marker like `python
      const langMatch = firstLine.match(/^`(\w+)$/);
      if (langMatch) {
        lang = langMatch[1];
        // Remove the language marker line
        finalCodeLines = codeLines.slice(1);
      }
    }

    const codeBlock = finalCodeLines.join('\n');

    // If no language marker found, try auto-detection
    if (lang === 'plaintext') {
      lang = detectLanguage(codeBlock);
    }

    try {
      // Use matched Shiki themes for each DaisyUI theme
      // Curated mapping for aesthetic harmony:
      // - light: github-light (clean, professional)
      // - cupcake: rose-pine-dawn (soft, pastel pink)
      // - bumblebee: solarized-light (warm, yellow tints)
      // - emerald: vitesse-light (fresh, green-friendly)
      // - synthwave: synthwave-84 (neon, retro)
      // - dracula: dracula (purple/pink dark)
      // - forest: everforest-dark (nature-inspired)
      // - nord: nord (cool blue/gray)
      // etc.
      // Generate all popular Shiki themes so users can choose their preferred code theme
      const highlighted = await codeToHtml(codeBlock, {
        lang,
        themes: {
          'github-light': 'github-light',
          'github-dark': 'github-dark',
          'rose-pine-dawn': 'rose-pine-dawn',
          'rose-pine': 'rose-pine',
          'rose-pine-moon': 'rose-pine-moon',
          'solarized-light': 'solarized-light',
          'solarized-dark': 'solarized-dark',
          'vitesse-light': 'vitesse-light',
          'vitesse-dark': 'vitesse-dark',
          'vitesse-black': 'vitesse-black',
          'synthwave-84': 'synthwave-84',
          'dracula': 'dracula',
          'dracula-soft': 'dracula-soft',
          'everforest-light': 'everforest-light',
          'everforest-dark': 'everforest-dark',
          'nord': 'nord',
          'tokyo-night': 'tokyo-night',
          'night-owl': 'night-owl',
          'monokai': 'monokai',
          'one-dark-pro': 'one-dark-pro',
          'one-light': 'one-light',
          'catppuccin-latte': 'catppuccin-latte',
          'catppuccin-frappe': 'catppuccin-frappe',
          'catppuccin-macchiato': 'catppuccin-macchiato',
          'catppuccin-mocha': 'catppuccin-mocha',
          'gruvbox-light-medium': 'gruvbox-light-medium',
          'gruvbox-dark-medium': 'gruvbox-dark-medium',
          'material-theme-lighter': 'material-theme-lighter',
          'material-theme-darker': 'material-theme-darker',
          'material-theme-ocean': 'material-theme-ocean',
          'poimandres': 'poimandres',
          'slack-dark': 'slack-dark',
          'slack-ochin': 'slack-ochin',
          'min-light': 'min-light',
          'min-dark': 'min-dark',
        },
        defaultColor: false,
      });

      // Wrap the highlighted code in a container with theme selector
      const wrappedCode = `
        <div class="code-block-wrapper relative group">
          <div class="code-theme-selector absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <select class="code-theme-picker select select-xs select-bordered bg-base-200">
              <option value="github-light">GitHub Light</option>
              <option value="github-dark">GitHub Dark</option>
              <option value="rose-pine-dawn">Rose Pine Dawn</option>
              <option value="rose-pine">Rose Pine</option>
              <option value="rose-pine-moon">Rose Pine Moon</option>
              <option value="solarized-light">Solarized Light</option>
              <option value="solarized-dark">Solarized Dark</option>
              <option value="vitesse-light">Vitesse Light</option>
              <option value="vitesse-dark">Vitesse Dark</option>
              <option value="vitesse-black">Vitesse Black</option>
              <option value="synthwave-84">Synthwave '84</option>
              <option value="dracula">Dracula</option>
              <option value="dracula-soft">Dracula Soft</option>
              <option value="everforest-light">Everforest Light</option>
              <option value="everforest-dark">Everforest Dark</option>
              <option value="nord">Nord</option>
              <option value="tokyo-night">Tokyo Night</option>
              <option value="night-owl">Night Owl</option>
              <option value="monokai">Monokai</option>
              <option value="one-dark-pro">One Dark Pro</option>
              <option value="one-light">One Light</option>
              <option value="catppuccin-latte">Catppuccin Latte</option>
              <option value="catppuccin-frappe">Catppuccin Frappé</option>
              <option value="catppuccin-macchiato">Catppuccin Macchiato</option>
              <option value="catppuccin-mocha">Catppuccin Mocha</option>
              <option value="gruvbox-light-medium">Gruvbox Light</option>
              <option value="gruvbox-dark-medium">Gruvbox Dark</option>
              <option value="material-theme-lighter">Material Lighter</option>
              <option value="material-theme-darker">Material Darker</option>
              <option value="material-theme-ocean">Material Ocean</option>
              <option value="poimandres">Poimandres</option>
              <option value="slack-dark">Slack Dark</option>
              <option value="slack-ochin">Slack Ochin</option>
              <option value="min-light">Min Light</option>
              <option value="min-dark">Min Dark</option>
            </select>
          </div>
          ${highlighted}
        </div>
      `;

      // Replace the original code lines with the wrapped highlighted block
      const start = group[0].start;
      const end = group[group.length - 1].end;
      result = result.substring(0, start) + wrappedCode + result.substring(end);
    } catch (error) {
      // Fallback to plain pre/code block if highlighting fails
      console.warn(`Failed to highlight code block with language "${lang}":`, error);
      const fallback = `<pre><code class="language-${lang}">${codeBlock}</code></pre>`;
      const start = group[0].start;
      const end = group[group.length - 1].end;
      result = result.substring(0, start) + fallback + result.substring(end);
    }
  }

  return result;
}
