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

  // Strip leading '# Title' if present
  const headingRegex = /^#{1,6}\s+[^\r\n]+(?:\r?\n)*/
  cleaned = cleaned.replace(headingRegex, '').trim()

  // Strip leading '- **Title**: ' or '- Title: ' if present at start
  const bulletPrefix = new RegExp(
    `^[-*+]\\s+(?:\\*\\*)?${escapeRegex(label)}(?:\\*\\*)?[:\\-—]?\\s*`,
    'i'
  )
  cleaned = cleaned.replace(bulletPrefix, '').trim()

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
        output.push(`- **${node.label}**: ${body}`)
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
