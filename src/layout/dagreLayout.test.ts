import { describe, it, expect } from 'vitest'
import { getLayoutedElements } from './dagreLayout'
import type { ParsedNode } from '../types/graph'

describe('SEAM-LAYOUT-ENGINE: getLayoutedElements', () => {
  const deepTree: ParsedNode = {
    id: 'root',
    label: 'Root Subject',
    level: 1,
    content: '',
    parentId: null,
    wordCount: 2,
    readingTimeMinutes: 1,
    children: [
      {
        id: 'branch-right',
        label: 'Right Branch',
        level: 2,
        content: '',
        parentId: 'root',
        wordCount: 2,
        readingTimeMinutes: 1,
        children: [
          {
            id: 'sub-right',
            label: 'Right Subtitle',
            level: 3,
            content: '',
            parentId: 'branch-right',
            wordCount: 2,
            readingTimeMinutes: 1,
            children: [
              {
                id: 'leaf-level-4',
                label: 'Level 4 Concept',
                level: 4,
                content: '',
                parentId: 'sub-right',
                wordCount: 3,
                readingTimeMinutes: 1,
                children: [
                  {
                    id: 'leaf-level-5',
                    label: 'Level 5 Sub-concept',
                    level: 5,
                    content: '',
                    parentId: 'leaf-level-4',
                    wordCount: 3,
                    readingTimeMinutes: 1,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'branch-left',
        label: 'Left Branch',
        level: 2,
        content: '',
        parentId: 'root',
        wordCount: 2,
        readingTimeMinutes: 1,
        children: [
          {
            id: 'sub-left',
            label: 'Left Subtitle',
            level: 3,
            content: '',
            parentId: 'branch-left',
            wordCount: 2,
            readingTimeMinutes: 1,
            children: [
              {
                id: 'leaf-left-4',
                label: 'Left Level 4 Concept',
                level: 4,
                content: '',
                parentId: 'sub-left',
                wordCount: 3,
                readingTimeMinutes: 1,
                children: [
                  {
                    id: 'leaf-left-5',
                    label: 'Left Level 5 Sub-concept',
                    level: 5,
                    content: '',
                    parentId: 'leaf-left-4',
                    wordCount: 3,
                    readingTimeMinutes: 1,
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  const complexTree: ParsedNode = {
    id: 'root',
    label: 'Sistemas Complejos Adaptativos y Redes',
    level: 1,
    content: '',
    parentId: null,
    wordCount: 5,
    readingTimeMinutes: 1,
    children: [
      {
        id: 'b1',
        label: '1. Fundamentos Teóricos de la Emergencia y Auto-organización',
        level: 2,
        content: '',
        parentId: 'root',
        wordCount: 8,
        readingTimeMinutes: 1,
        children: [
          {
            id: 'b1-s1',
            label: '1.1 Dinámicas no lineales y caos determinista',
            level: 3,
            content: '',
            parentId: 'b1',
            wordCount: 7,
            readingTimeMinutes: 1,
            children: [
              {
                id: 'b1-s1-c1',
                label: 'Atractores extraños y sensibilidad a las condiciones iniciales',
                level: 4,
                content: '',
                parentId: 'b1-s1',
                wordCount: 8,
                readingTimeMinutes: 1,
                children: []
              },
              {
                id: 'b1-s1-c2',
                label: 'Bifurcaciones de Feigenbaum y cascadas de duplicación de período',
                level: 4,
                content: '',
                parentId: 'b1-s1',
                wordCount: 9,
                readingTimeMinutes: 1,
                children: []
              }
            ]
          },
          {
            id: 'b1-s2',
            label: '1.2 Propiedades emergentes en agentes distribuidos',
            level: 3,
            content: '',
            parentId: 'b1',
            wordCount: 6,
            readingTimeMinutes: 1,
            children: []
          }
        ]
      },
      {
        id: 'b2',
        label: '2. Topología de Redes Complejas',
        level: 2,
        content: '',
        parentId: 'root',
        wordCount: 4,
        readingTimeMinutes: 1,
        children: [
          {
            id: 'b2-s1',
            label: '2.1 Redes Libres de Escala',
            level: 3,
            content: '',
            parentId: 'b2',
            wordCount: 4,
            readingTimeMinutes: 1,
            children: [
              {
                id: 'b2-s1-c1',
                label: 'Distribución de ley de potencia en grados de conectividad',
                level: 4,
                content: '',
                parentId: 'b2-s1',
                wordCount: 9,
                readingTimeMinutes: 1,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'b3',
        label: '3. Modelos Basados en Agentes',
        level: 2,
        content: '',
        parentId: 'root',
        wordCount: 4,
        readingTimeMinutes: 1,
        children: [
          {
            id: 'b3-s1',
            label: '3.1 Reglas locales de interacción',
            level: 3,
            content: '',
            parentId: 'b3',
            wordCount: 4,
            readingTimeMinutes: 1,
            children: []
          }
        ]
      },
      {
        id: 'b4',
        label: '4. Resiliencia y Transiciones de Fase Críticas',
        level: 2,
        content: '',
        parentId: 'root',
        wordCount: 7,
        readingTimeMinutes: 1,
        children: [
          {
            id: 'b4-s1',
            label: '4.1 Conectividad de percolación en grafos aleatorios',
            level: 3,
            content: '',
            parentId: 'b4',
            wordCount: 6,
            readingTimeMinutes: 1,
            children: []
          },
          {
            id: 'b4-s2',
            label: '4.2 Efecto cascada y colapso sistémico',
            level: 3,
            content: '',
            parentId: 'b4',
            wordCount: 5,
            readingTimeMinutes: 1,
            children: []
          }
        ]
      }
    ]
  }

  it('ensures subnodes expand outward horizontally without overlapping their parents at deep levels', () => {
    const { nodes } = getLayoutedElements([deepTree])
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    const leaf4 = nodeMap.get('leaf-level-4')!
    const leaf5 = nodeMap.get('leaf-level-5')!
    expect(leaf4).toBeDefined()
    expect(leaf5).toBeDefined()

    const leaf4Width = leaf4.data.cardWidth ?? 260
    // In right hemisphere, child must expand strictly to the right: x(leaf5) >= x(leaf4) + width(leaf4)
    expect(leaf5.position.x).toBeGreaterThanOrEqual(leaf4.position.x + leaf4Width)

    const leftLeaf4 = nodeMap.get('leaf-left-4')!
    const leftLeaf5 = nodeMap.get('leaf-left-5')!
    expect(leftLeaf4).toBeDefined()
    expect(leftLeaf5).toBeDefined()

    const leftLeaf5Width = leftLeaf5.data.cardWidth ?? 260
    // In left hemisphere, child must expand strictly to the left: x(leftLeaf5) + width(leftLeaf5) <= x(leftLeaf4)
    expect(leftLeaf5.position.x + leftLeaf5Width).toBeLessThanOrEqual(leftLeaf4.position.x)
  })

  it('guarantees zero bounding-box overlaps between any pair of visible nodes in an asymmetric tree', () => {
    const { nodes } = getLayoutedElements([complexTree])

    // Verify no two nodes overlap in 2D bounding boxes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]

        const aWidth = a.data.cardWidth ?? 260
        // Heuristic vertical card height (at least 40px)
        const aHeight = 40
        const bWidth = b.data.cardWidth ?? 260
        const bHeight = 40

        const aLeft = a.position.x
        const aRight = a.position.x + aWidth
        const aTop = a.position.y
        const aBottom = a.position.y + aHeight

        const bLeft = b.position.x
        const bRight = b.position.x + bWidth
        const bTop = b.position.y
        const bBottom = b.position.y + bHeight

        const horizontalOverlap = aLeft < bRight && aRight > bLeft
        const verticalOverlap = aTop < bBottom && aBottom > bTop

        const isOverlapping = horizontalOverlap && verticalOverlap

        expect(
          isOverlapping,
          `Nodes "${a.data.label}" and "${b.data.label}" overlap! A: [${aLeft}, ${aRight}]x[${aTop}, ${aBottom}], B: [${bLeft}, ${bRight}]x[${bTop}, ${bBottom}]`
        ).toBe(false)
      }
    }
  })

  it('adjusts positions when a node is collapsed vs expanded without causing collisions', () => {
    const treeWithSubnodes: ParsedNode = {
      id: 'root',
      label: 'Root',
      level: 1,
      content: '',
      parentId: null,
      wordCount: 1,
      readingTimeMinutes: 1,
      children: [
        {
          id: 'branch-1',
          label: 'Branch 1',
          level: 2,
          content: '',
          parentId: 'root',
          wordCount: 2,
          readingTimeMinutes: 1,
          children: [
            {
              id: 'child-1-1',
              label: 'Child 1.1',
              level: 3,
              content: '',
              parentId: 'branch-1',
              wordCount: 2,
              readingTimeMinutes: 1,
              children: []
            },
            {
              id: 'child-1-2',
              label: 'Child 1.2',
              level: 3,
              content: '',
              parentId: 'branch-1',
              wordCount: 2,
              readingTimeMinutes: 1,
              children: []
            },
            {
              id: 'child-1-3',
              label: 'Child 1.3',
              level: 3,
              content: '',
              parentId: 'branch-1',
              wordCount: 2,
              readingTimeMinutes: 1,
              children: []
            }
          ]
        },
        {
          id: 'branch-2',
          label: 'Branch 2',
          level: 2,
          content: '',
          parentId: 'root',
          wordCount: 2,
          readingTimeMinutes: 1,
          children: []
        }
      ]
    }

    // When collapsed, children are not rendered
    const collapsedResult = getLayoutedElements([treeWithSubnodes], {
      collapsedNodeIds: new Set(['branch-1'])
    })
    expect(collapsedResult.nodes.some((n) => n.id === 'child-1-1')).toBe(false)

    // When expanded, children are rendered and branch-2 is shifted
    const expandedResult = getLayoutedElements([treeWithSubnodes], {
      collapsedNodeIds: new Set()
    })
    expect(expandedResult.nodes.some((n) => n.id === 'child-1-1')).toBe(true)

    // Check no overlaps in expanded result
    const expNodes = expandedResult.nodes
    for (let i = 0; i < expNodes.length; i++) {
      for (let j = i + 1; j < expNodes.length; j++) {
        const a = expNodes[i]
        const b = expNodes[j]
        const aW = a.data.cardWidth ?? 260
        const bW = b.data.cardWidth ?? 260
        const aH = 40
        const bH = 40

        const overlap =
          a.position.x < b.position.x + bW &&
          a.position.x + aW > b.position.x &&
          a.position.y < b.position.y + bH &&
          a.position.y + aH > b.position.y

        expect(
          overlap,
          `Nodes "${a.data.label}" and "${b.data.label}" overlap on expand`
        ).toBe(false)
      }
    }
  })

  it('guarantees zero bounding-box overlaps across extreme font scale sizes', () => {
    const testScales = [0.85, 1.05, 1.6]

    for (const scale of testScales) {
      const { nodes } = getLayoutedElements([complexTree], { fontSizeScale: scale })

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const aW = a.data.cardWidth ?? 260
          const bW = b.data.cardWidth ?? 260
          const aH = 36 * scale
          const bH = 36 * scale

          const overlap =
            a.position.x < b.position.x + bW &&
            a.position.x + aW > b.position.x &&
            a.position.y < b.position.y + bH &&
            a.position.y + aH > b.position.y

          expect(
            overlap,
            `Scale ${scale}: Nodes "${a.data.label}" and "${b.data.label}" overlap`
          ).toBe(false)
        }
      }
    }
  })
})
