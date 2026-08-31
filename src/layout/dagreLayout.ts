import type { ParsedNode, CustomNodeType, CustomEdgeType, LayoutDirection } from '../types/graph'
import { getIslandTheme } from '../utils/colorUtils'

export interface LayoutOptions {
  direction?: LayoutDirection
  collapsedNodeIds?: Set<string>
  masteredNodeIds?: Set<string>
  selectedNodeId?: string | null
  highlightedNodeIds?: Set<string>
  onToggleCollapse?: (id: string) => void
  onToggleMastered?: (id: string) => void
  onSelectNode?: (id: string) => void
}

const DIMENSIONS = {
  root: { width: 240, height: 80 },
  island: { width: 235, minHeight: 46 },
  subtitle: { width: 235, minHeight: 44 },
  leaf: { width: 250, minHeight: 36 },
  gap: 12
}

/**
 * Computes the dynamic vertical height of a single node based on label length and wrapping
 */
function getNodeHeight(node: ParsedNode): number {
  const len = node.label.length
  if (node.level === 1) {
    const lines = Math.max(1, Math.ceil(len / 22))
    return Math.max(60, 40 + lines * 18)
  }

  const isLeaf = node.isLeaf || node.level >= 4
  const isSubtitle = node.level === 3 && !node.isLeaf

  if (isLeaf) {
    const lines = Math.max(1, Math.ceil(len / 28))
    return 34 + (lines - 1) * 16
  }

  if (isSubtitle) {
    const lines = Math.max(1, Math.ceil(len / 24))
    return 42 + (lines - 1) * 16
  }

  // Level 2 Título
  const lines = Math.max(1, Math.ceil(len / 24))
  return 44 + (lines - 1) * 16
}

/**
 * Calculates the bounding height of a subtree recursively
 */
function calculateSubtreeHeight(node: ParsedNode, collapsedNodeIds: Set<string>): number {
  const selfHeight = getNodeHeight(node)
  const isCollapsed = collapsedNodeIds.has(node.id)

  if (isCollapsed || node.children.length === 0) {
    return selfHeight
  }

  const childrenHeights = node.children.map((child) =>
    calculateSubtreeHeight(child, collapsedNodeIds)
  )
  const totalChildrenHeight =
    childrenHeights.reduce((acc, h) => acc + h, 0) +
    Math.max(0, node.children.length - 1) * DIMENSIONS.gap

  return Math.max(selfHeight, totalChildrenHeight)
}

/**
 * Calculates Bilateral Mindmap layout with strictly symmetrical child branching.
 * Every parent is placed at the exact vertical centroid of its children.
 */
function getBilateralLayout(
  rootNode: ParsedNode,
  options: LayoutOptions
): { nodes: CustomNodeType[]; edges: CustomEdgeType[] } {
  const {
    collapsedNodeIds = new Set<string>(),
    masteredNodeIds = new Set<string>(),
    selectedNodeId = null,
    highlightedNodeIds = new Set<string>(),
    onToggleCollapse,
    onToggleMastered,
    onSelectNode
  } = options

  const nodes: CustomNodeType[] = []
  const edges: CustomEdgeType[] = []

  const isRootMastered = masteredNodeIds.has(rootNode.id)
  const isRootSelected = selectedNodeId === rootNode.id
  const isRootHighlighted =
    highlightedNodeIds.size > 0 ? highlightedNodeIds.has(rootNode.id) : undefined
  const isRootDimmed = highlightedNodeIds.size > 0 ? !highlightedNodeIds.has(rootNode.id) : false

  const rootHeight = getNodeHeight(rootNode)

  // 1. Center Root Node at (0, 0)
  nodes.push({
    id: rootNode.id,
    type: 'customNode',
    position: {
      x: -DIMENSIONS.root.width / 2,
      y: -rootHeight / 2
    },
    data: {
      id: rootNode.id,
      label: rootNode.label,
      content: rootNode.content,
      level: 1,
      hasContent: Boolean(rootNode.content && rootNode.content.trim().length > 0),
      wordCount: rootNode.wordCount,
      readingTimeMinutes: rootNode.readingTimeMinutes,
      parentId: null,
      childCount: rootNode.children.length,
      hasChildren: rootNode.children.length > 0,
      isCollapsed: false,
      isMastered: isRootMastered,
      islandColor: getIslandTheme(0, 1),
      side: 'center',
      isLeaf: false,
      isHighlighted: isRootHighlighted,
      isDimmed: isRootDimmed,
      isSelected: isRootSelected,
      onToggleCollapse,
      onToggleMastered,
      onSelectNode
    }
  })

  // 2. Split Level 2 TÍTULOS into Right and Left groups
  const h2Children = rootNode.children
  const totalBranches = h2Children.length
  const rightCount = Math.ceil(totalBranches / 2)

  const rightBranches = h2Children.slice(0, rightCount)
  const leftBranches = h2Children.slice(rightCount)

  function layoutSide(branches: ParsedNode[], side: 'right' | 'left') {
    const isRight = side === 'right'

    // Compute heights for each branch
    const branchHeights = branches.map((b) => calculateSubtreeHeight(b, collapsedNodeIds))
    const branchGap = 24
    const totalSideHeight =
      branchHeights.reduce((acc, h) => acc + h, 0) +
      Math.max(0, branches.length - 1) * branchGap

    let currentY = -totalSideHeight / 2

    // Recursive helper to lay out any node and its children with symmetrical centering
    function layoutNode(node: ParsedNode, startY: number, parentNode: ParsedNode | null) {
      const subtreeHeight = calculateSubtreeHeight(node, collapsedNodeIds)
      const centerY = startY + subtreeHeight / 2
      const selfHeight = getNodeHeight(node)
      const islandColor = getIslandTheme(node.islandIndex, node.level)

      const isMastered = masteredNodeIds.has(node.id)
      const isSelected = selectedNodeId === node.id
      const isHighlighted =
        highlightedNodeIds.size > 0 ? highlightedNodeIds.has(node.id) : undefined
      const isDimmed = highlightedNodeIds.size > 0 ? !highlightedNodeIds.has(node.id) : false

      const isLeaf = node.isLeaf || node.level >= 4
      const isSubtitle = node.level === 3 && !node.isLeaf

      // Determine dimensions and horizontal coordinate
      let width = DIMENSIONS.island.width
      let posX = 0

      if (node.level === 2) {
        width = DIMENSIONS.island.width
        posX = isRight ? 260 : -260 - width
      } else if (isSubtitle) {
        width = DIMENSIONS.subtitle.width
        posX = isRight ? 565 : -565 - width
      } else {
        // Leaf / Paragraph title
        width = DIMENSIONS.leaf.width
        const depthX = node.parentId === rootNode.id ? 260 : node.level === 3 ? 565 : 870
        posX = isRight ? depthX : -depthX - width
      }

      // Add the Node positioned at symmetrical centerY
      nodes.push({
        id: node.id,
        type: 'customNode',
        position: {
          x: posX,
          y: centerY - selfHeight / 2
        },
        data: {
          id: node.id,
          label: node.label,
          content: node.content,
          level: node.level,
          hasContent: Boolean(node.content && node.content.trim().length > 0),
          wordCount: node.wordCount,
          readingTimeMinutes: node.readingTimeMinutes,
          parentId: node.parentId,
          childCount: node.children.length,
          hasChildren: node.children.length > 0,
          isCollapsed: collapsedNodeIds.has(node.id),
          isMastered,
          islandColor,
          side,
          isLeaf,
          isHighlighted,
          isDimmed,
          isSelected,
          onToggleCollapse,
          onToggleMastered,
          onSelectNode
        }
      })

      // Add Edge from parent to this node
      if (parentNode) {
        const isEdgeHighlighted =
          highlightedNodeIds.has(parentNode.id) && highlightedNodeIds.has(node.id)
        const isEdgeDimmed = highlightedNodeIds.size > 0 && !isEdgeHighlighted

        edges.push({
          id: `e-${parentNode.id}->${node.id}`,
          source: parentNode.id,
          target: node.id,
          sourceHandle: isRight ? 'source-right' : 'source-left',
          targetHandle: isRight ? 'target-left' : 'target-right',
          type: 'bezier',
          animated: isEdgeHighlighted,
          style: {
            stroke: isEdgeHighlighted
              ? '#38bdf8'
              : isEdgeDimmed
              ? '#e2e8f0'
              : islandColor.accentHex,
            strokeWidth: isEdgeHighlighted ? 3 : node.level === 2 ? 2.3 : 1.8,
            opacity: isEdgeDimmed ? 0.3 : 0.9
          }
        })
      }

      // Layout children recursively if not collapsed
      if (!collapsedNodeIds.has(node.id) && node.children.length > 0) {
        let childStartY = startY
        for (const child of node.children) {
          const childHeight = calculateSubtreeHeight(child, collapsedNodeIds)
          layoutNode(child, childStartY, node)
          childStartY += childHeight + DIMENSIONS.gap
        }
      }
    }

    // Lay out all Level 2 branches on this side
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i]
      const bHeight = branchHeights[i]
      layoutNode(branch, currentY, rootNode)
      currentY += bHeight + branchGap
    }
  }

  layoutSide(rightBranches, 'right')
  layoutSide(leftBranches, 'left')

  return { nodes, edges }
}

export function getLayoutedElements(
  rootNodes: ParsedNode[],
  options: LayoutOptions = {}
): { nodes: CustomNodeType[]; edges: CustomEdgeType[] } {
  if (rootNodes.length > 0) {
    return getBilateralLayout(rootNodes[0], options)
  }

  return { nodes: [], edges: [] }
}
