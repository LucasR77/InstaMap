import type { ParsedNode, CustomNodeType, CustomEdgeType, LayoutDirection } from '../types/graph'
import { getIslandTheme } from '../utils/colorUtils'

export interface LayoutOptions {
  direction?: LayoutDirection
  fontSizeScale?: number
  collapsedNodeIds?: Set<string>
  masteredNodeIds?: Set<string>
  selectedNodeId?: string | null
  highlightedNodeIds?: Set<string>
  onToggleCollapse?: (id: string) => void
  onToggleMastered?: (id: string) => void
  onSelectNode?: (id: string) => void
}

function getDimensions(scale: number) {
  return {
    root: { width: Math.round(270 * scale), height: Math.round(85 * scale) },
    island: { width: Math.round(260 * scale), minHeight: Math.round(52 * scale) },
    subtitle: { width: Math.round(260 * scale), minHeight: Math.round(48 * scale) },
    leaf: { width: Math.round(275 * scale), minHeight: Math.round(42 * scale) },
    gap: Math.round(14 * scale)
  }
}

/**
 * Computes the dynamic vertical height of a single node based on label length, wrapping and font scale
 */
function getNodeHeight(node: ParsedNode, scale = 1.05): number {
  const len = node.label.length
  if (node.level === 1) {
    const charsPerLine = Math.max(16, Math.floor(22 / scale))
    const lines = Math.max(1, Math.ceil(len / charsPerLine))
    return Math.max(68 * scale, (44 + lines * 22) * scale)
  }

  const isLeaf = node.isLeaf || node.level >= 4
  const isSubtitle = node.level === 3 && !node.isLeaf

  if (isLeaf) {
    const charsPerLine = Math.max(20, Math.floor(30 / scale))
    const lines = Math.max(1, Math.ceil(len / charsPerLine))
    return (38 + (lines - 1) * 20) * scale
  }

  if (isSubtitle) {
    const charsPerLine = Math.max(18, Math.floor(26 / scale))
    const lines = Math.max(1, Math.ceil(len / charsPerLine))
    return (46 + (lines - 1) * 20) * scale
  }

  // Level 2 Título
  const charsPerLine = Math.max(18, Math.floor(25 / scale))
  const lines = Math.max(1, Math.ceil(len / charsPerLine))
  return (48 + (lines - 1) * 20) * scale
}

/**
 * Calculates the bounding height of a subtree recursively
 */
function calculateSubtreeHeight(
  node: ParsedNode,
  collapsedNodeIds: Set<string>,
  scale: number,
  gap: number
): number {
  const selfHeight = getNodeHeight(node, scale)
  const isCollapsed = collapsedNodeIds.has(node.id)

  if (isCollapsed || node.children.length === 0) {
    return selfHeight
  }

  const childrenHeights = node.children.map((child) =>
    calculateSubtreeHeight(child, collapsedNodeIds, scale, gap)
  )
  const totalChildrenHeight =
    childrenHeights.reduce((acc, h) => acc + h, 0) +
    Math.max(0, node.children.length - 1) * gap

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
    fontSizeScale = 1.05,
    collapsedNodeIds = new Set<string>(),
    masteredNodeIds = new Set<string>(),
    selectedNodeId = null,
    highlightedNodeIds = new Set<string>(),
    onToggleCollapse,
    onToggleMastered,
    onSelectNode
  } = options

  const dim = getDimensions(fontSizeScale)
  const nodes: CustomNodeType[] = []
  const edges: CustomEdgeType[] = []

  const isRootMastered = masteredNodeIds.has(rootNode.id)
  const isRootSelected = selectedNodeId === rootNode.id
  const isRootHighlighted =
    highlightedNodeIds.size > 0 ? highlightedNodeIds.has(rootNode.id) : undefined
  const isRootDimmed = highlightedNodeIds.size > 0 ? !highlightedNodeIds.has(rootNode.id) : false

  const rootHeight = getNodeHeight(rootNode, fontSizeScale)

  // 1. Center Root Node at (0, 0)
  nodes.push({
    id: rootNode.id,
    type: 'customNode',
    position: {
      x: -dim.root.width / 2,
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
      fontScale: fontSizeScale,
      cardWidth: dim.root.width,
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

  const depth1 = Math.round(300 * fontSizeScale)
  const depth2 = Math.round(640 * fontSizeScale)
  const depth3 = Math.round(980 * fontSizeScale)
  const branchGap = Math.round(28 * fontSizeScale)

  function layoutSide(branches: ParsedNode[], side: 'right' | 'left') {
    const isRight = side === 'right'

    // Compute heights for each branch
    const branchHeights = branches.map((b) =>
      calculateSubtreeHeight(b, collapsedNodeIds, fontSizeScale, dim.gap)
    )
    const totalSideHeight =
      branchHeights.reduce((acc, h) => acc + h, 0) +
      Math.max(0, branches.length - 1) * branchGap

    let currentY = -totalSideHeight / 2

    // Recursive helper to lay out any node and its children with symmetrical centering
    function layoutNode(node: ParsedNode, startY: number, parentNode: ParsedNode | null) {
      const subtreeHeight = calculateSubtreeHeight(node, collapsedNodeIds, fontSizeScale, dim.gap)
      const centerY = startY + subtreeHeight / 2
      const selfHeight = getNodeHeight(node, fontSizeScale)
      const islandColor = getIslandTheme(node.islandIndex, node.level)

      const isMastered = masteredNodeIds.has(node.id)
      const isSelected = selectedNodeId === node.id
      const isHighlighted =
        highlightedNodeIds.size > 0 ? highlightedNodeIds.has(node.id) : undefined
      const isDimmed = highlightedNodeIds.size > 0 ? !highlightedNodeIds.has(node.id) : false

      const isLeaf = node.isLeaf || node.level >= 4
      const isSubtitle = node.level === 3 && !node.isLeaf

      // Determine dimensions and horizontal coordinate
      let width = dim.island.width
      let posX = 0

      if (node.level === 2) {
        width = dim.island.width
        posX = isRight ? depth1 : -depth1 - width
      } else if (isSubtitle) {
        width = dim.subtitle.width
        posX = isRight ? depth2 : -depth2 - width
      } else {
        // Leaf / Paragraph title
        width = dim.leaf.width
        const depthX = node.parentId === rootNode.id ? depth1 : node.level === 3 ? depth2 : depth3
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
          hasContent: Boolean(
            (node.content && node.content.trim().length > 0) || node.children.length > 0
          ),
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
          fontScale: fontSizeScale,
          cardWidth: width,
          onToggleCollapse,
          onToggleMastered,
          onSelectNode
        }
      })

      // Add Edge from parent to this node
      if (parentNode) {
        const isChildOfSelected = selectedNodeId === parentNode.id
        const isEdgeHighlighted =
          (highlightedNodeIds.has(parentNode.id) && highlightedNodeIds.has(node.id)) ||
          isChildOfSelected
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
            strokeWidth: isEdgeHighlighted ? 3.5 : node.level === 2 ? 2.5 : 2.0,
            opacity: isEdgeDimmed ? 0.3 : 0.95
          }
        })
      }

      // Layout children recursively if not collapsed
      if (!collapsedNodeIds.has(node.id) && node.children.length > 0) {
        let childStartY = startY
        for (const child of node.children) {
          const childHeight = calculateSubtreeHeight(child, collapsedNodeIds, fontSizeScale, dim.gap)
          layoutNode(child, childStartY, node)
          childStartY += childHeight + dim.gap
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
