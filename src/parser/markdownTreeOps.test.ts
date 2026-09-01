import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './markdownParser'
import { exportTreeToMarkdown } from './markdownExporter'
import type { ParsedNode } from '../types/graph'

describe('SEAM-GRAPH: Manual Node Creation and Deletion', () => {
  it('adds a child node to an existing parent and re-exports cleanly', () => {
    const markdown = `# Documento Base

## Tema Principal
Texto del tema.`

    const tree = parseMarkdown(markdown, 'Documento Base')
    expect(tree.length).toBe(1)
    const root = tree[0]
    expect(root.children.length).toBe(1)
    const tema = root.children[0]

    const newChild: ParsedNode = {
      id: 'node-child-1',
      label: 'Subtema Creado',
      level: 3,
      content: '### Subtema Creado\n\nDetalle nuevo',
      parentId: tema.id,
      children: [],
      wordCount: 5,
      readingTimeMinutes: 1,
      islandIndex: 0,
      isLeaf: true
    }

    tema.children.push(newChild)
    tema.isLeaf = false

    const exported = exportTreeToMarkdown(tree)
    expect(exported).toContain('# Documento Base')
    expect(exported).toContain('## Tema Principal')
    expect(exported).toContain('Subtema Creado')
  })

  it('deletes a node and regenerates markdown without that node', () => {
    const markdown = `# Documento Base

## Tema 1
Contenido 1.

## Tema 2 Para Borrar
Contenido 2.`

    const tree = parseMarkdown(markdown, 'Documento Base')
    const root = tree[0]
    expect(root.children.length).toBe(2)

    // Remove second child
    root.children = root.children.filter((c) => !c.label.includes('Para Borrar'))

    const exported = exportTreeToMarkdown(tree)
    expect(exported).toContain('Tema 1')
    expect(exported).not.toContain('Tema 2 Para Borrar')
  })
})
