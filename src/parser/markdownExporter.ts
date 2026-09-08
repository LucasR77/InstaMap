import type { ParsedNode } from '../types/graph'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Strips leading heading or bullet prefix from a node's content so we don't duplicate when rendering
 */
function cleanNodeBody(content: string, label: string): string {
  if (!content) return ''
  let cleaned = content.trim()

  // Strip leading '# Title' if present and matches label or is duplicate title heading
  const headingRegex = /^#{1,6}\s+([^\r\n]+)(?:\r?\n)*/
  const headingMatch = cleaned.match(headingRegex)
  if (headingMatch) {
    const headingText = headingMatch[1].trim().replace(/^[*_~`]+|[*_~`]+$/g, '')
    const cleanLabel = label.trim().replace(/^[*_~`]+|[*_~`]+$/g, '')
    if (
      headingText.toLowerCase() === cleanLabel.toLowerCase() ||
      headingText.length === 0 ||
      cleanLabel.toLowerCase().startsWith(headingText.toLowerCase())
    ) {
      cleaned = cleaned.slice(headingMatch[0].length).trim()
    }
  }

  // Strip leading '- **Title**: ' or '- _Title_: ' or 'Title: ' if present at start
  const escapedLabel = escapeRegex(label)
  const bulletPrefix = new RegExp(
    `^[-*+]\\s+(?:\\*\\*|__|_|\\*)?${escapedLabel}(?:\\*\\*|__|_|\\*)?[:\\-—]?\\s*`,
    'i'
  )
  cleaned = cleaned.replace(bulletPrefix, '').trim()

  // Strip standalone leading title if matches label exactly
  const titlePrefix = new RegExp(
    `^(?:\\*\\*|__|_|\\*)?${escapedLabel}(?:\\*\\*|__|_|\\*)?[:\\-—]?\\s*`,
    'i'
  )
  cleaned = cleaned.replace(titlePrefix, '').trim()

  return cleaned
}

/**
 * Reconstructs a full, clean, valid Markdown document from the ParsedNode tree.
 */
export function exportTreeToMarkdown(nodes: ParsedNode[]): string {
  if (!nodes || nodes.length === 0) return ''

  const output: string[] = []

  function serializeNode(node: ParsedNode) {
    const level = Math.max(1, Math.min(6, node.level))
    const hashes = '#'.repeat(level)

    // Level 1 Root
    if (level === 1) {
      output.push(`${hashes} ${node.label}`)
      const body = cleanNodeBody(node.content, node.label)
      if (body) {
        output.push(body)
      }
    } else if (level === 2) {
      output.push(`${hashes} ${node.label}`)
      const body = cleanNodeBody(node.content, node.label)
      if (body) {
        output.push(body)
      }
    } else if (level === 3 && !node.isLeaf) {
      output.push(`${hashes} ${node.label}`)
      const body = cleanNodeBody(node.content, node.label)
      if (body) {
        output.push(body)
      }
    } else {
      // Leaf / bullet node
      const body = cleanNodeBody(node.content, node.label)
      if (body) {
        const formattedBody = body.includes('\n')
          ? body
              .split('\n')
              .map((l, idx) => (idx === 0 ? l : l.trim() ? `  ${l}` : ''))
              .join('\n')
          : body
        output.push(`- **${node.label}**: ${formattedBody}`)
      } else {
        output.push(`- **${node.label}**`)
      }
    }


    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        serializeNode(child)
      }
    }
  }

  for (const root of nodes) {
    serializeNode(root)
  }

  return output.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Exports the graph structure to structured JSON.
 */
export function exportTreeToJSON(nodes: ParsedNode[], title: string): string {
  const exportData = {
    title,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    nodes
  }

  return JSON.stringify(exportData, null, 2)
}
