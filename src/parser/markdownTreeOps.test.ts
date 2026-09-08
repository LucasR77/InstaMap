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

  it('updates a node label and content and preserves the node correctly on re-parse', () => {
    const markdown = `# Documento Base

## Tema 1
Intro del tema 1.

- **Concepto A**: Definición original de A.
- **Concepto B**: Definición original de B.`

    const tree = parseMarkdown(markdown, 'Documento Base')
    const root = tree[0]
    const tema1 = root.children[0]
    const conceptoA = tema1.children[0]

    expect(conceptoA.label).toBe('Concepto A')

    // Simulate updating Concepto A
    conceptoA.label = 'Concepto A Renovado'
    conceptoA.content = 'Nueva definición completa de A sin encabezado repetido.'

    const exported = exportTreeToMarkdown(tree)
    console.log('--- EXPORTED MARKDOWN ---:\n', exported)

    const reParsedTree = parseMarkdown(exported, 'Documento Base')
    const reParsedRoot = reParsedTree[0]
    const reParsedTema1 = reParsedRoot.children[0]
    const reParsedA = reParsedTema1.children.find((c) => c.label === 'Concepto A Renovado')

    expect(reParsedA).toBeDefined()
    expect(reParsedA?.content).toContain('Nueva definición completa de A')
    expect(reParsedTema1.children.length).toBe(2)
  })

  it('updates a parent section node label and intro content', () => {
    const markdown = `# Documento Base

## Tema 1
Intro original.

- **Concepto A**: Detalle.`

    const tree = parseMarkdown(markdown, 'Documento Base')
    const root = tree[0]
    const tema1 = root.children[0]

    // Simulate updating Tema 1
    tema1.label = 'Tema 1 Modificado'
    tema1.content = 'Intro modificada por el usuario.'

    const exported = exportTreeToMarkdown(tree)
    console.log('--- EXPORTED SECTION MARKDOWN ---:\n', exported)

    const reParsedTree = parseMarkdown(exported, 'Documento Base')
    const reParsedRoot = reParsedTree[0]
    const reParsedTema1 = reParsedRoot.children.find((c) => c.label === 'Tema 1 Modificado')

    expect(reParsedTema1).toBeDefined()
    expect(reParsedTema1?.children.length).toBe(1)
    expect(reParsedTema1?.children[0].label).toBe('Concepto A')
  })
})

