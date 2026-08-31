import type { ParsedNode } from '../types/graph'

/**
 * Reconstructs a full Markdown document from the ParsedNode tree.
 */
export function exportTreeToMarkdown(nodes: ParsedNode[]): string {
  const chunks: string[] = []

  function traverse(node: ParsedNode) {
    if (node.content && node.content.trim()) {
      chunks.push(node.content.trim())
    } else {
      const hashes = '#'.repeat(Math.max(1, Math.min(6, node.level)))
      chunks.push(`${hashes} ${node.label}`)
    }

    for (const child of node.children) {
      traverse(child)
    }
  }

  for (const root of nodes) {
    traverse(root)
  }

  return chunks.join('\n\n')
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
