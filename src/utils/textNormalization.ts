/**
 * Utility to normalize LaTeX delimiters and paragraph formatting for clean Markdown & Math rendering.
 */

/**
 * Normalizes LaTeX delimiters:
 * - Converts \( ... \) to $ ... $
 * - Converts \[ ... \] to $$ ... $$
 * - Cleans up escaped dollar signs or backslashes before math brackets
 */
export function normalizeLatexDelimiters(text: string): string {
  if (!text) return ''

  let result = text

  // 1. Display math: \[ ... \] -> $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => {
    return `\n\n$$\n${equation.trim()}\n$$\n\n`
  })

  // 2. Inline math: \( ... \) -> $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => {
    return `$${equation.trim()}$`
  })

  return result
}

/**
 * Normalizes paragraph titles with underscores or single asterisks (e.g. `_Título_: texto` or `*Nota*: texto`)
 * into bold Markdown (`**Título**: texto`) so they render distinctly instead of showing broken underscores.
 */
export function normalizeParagraphHeaders(text: string): string {
  if (!text) return ''

  const lines = text.split(/\r?\n/)
  const normalizedLines = lines.map((line) => {
    let trimmed = line.trimStart()
    const indent = line.slice(0, line.length - trimmed.length)

    // Handle bullet items like: - _Título_: texto  or  * _Título_: texto
    const bulletMatch = trimmed.match(/^([-*+]\s+)(_|\*)([^\n_*]{2,100})\2[:\-—]\s*(.*)$/)
    if (bulletMatch) {
      const bullet = bulletMatch[1]
      const title = bulletMatch[3].trim()
      const rest = bulletMatch[4]
      return `${indent}${bullet}**${title}**: ${rest}`
    }

    // Handle standalone lines like: _Título_: texto  or  *Título*: texto
    const lineMatch = trimmed.match(/^(_|\*)([^\n_*]{2,100})\1[:\-—]\s*(.*)$/)
    if (lineMatch) {
      const title = lineMatch[2].trim()
      const rest = lineMatch[3]
      return `${indent}**${title}**: ${rest}`
    }

    // Handle lines like: _Título_ on its own
    const standaloneMatch = trimmed.match(/^(_|\*)([^\n_*]{2,100})\1:?\s*$/)
    if (standaloneMatch) {
      const title = standaloneMatch[2].trim()
      return `${indent}### ${title}`
    }

    return line
  })

  return normalizedLines.join('\n')
}

/**
 * Full normalization pipeline for markdown viewers and parser nodes
 */
export function normalizeMarkdownForDisplay(text: string): string {
  if (!text) return ''
  const latexNormalized = normalizeLatexDelimiters(text)
  return normalizeParagraphHeaders(latexNormalized)
}
