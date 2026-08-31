import type { Node, Edge } from '@xyflow/react'

export interface IslandColorTheme {
  name: string
  primary: string
  bg: string
  border: string
  text: string
  badge: string
  glow: string
  accentHex: string
}

export interface ParsedNode {
  id: string
  label: string
  level: number // 1 = H1, 2 = H2, 3 = H3 / Leaf
  content: string
  parentId: string | null
  children: ParsedNode[]
  wordCount: number
  readingTimeMinutes: number
  islandIndex?: number
  isLeaf?: boolean
}

export interface GraphNodeData extends Record<string, unknown> {
  id: string
  label: string
  content: string
  level: number
  hasContent: boolean
  wordCount: number
  readingTimeMinutes: number
  parentId: string | null
  childCount: number
  hasChildren: boolean
  isCollapsed: boolean
  isMastered: boolean
  islandColor: IslandColorTheme
  side?: 'left' | 'right' | 'center'
  isLeaf?: boolean
  isHighlighted?: boolean
  isDimmed?: boolean
  isSelected?: boolean
  onToggleCollapse?: (id: string) => void
  onToggleMastered?: (id: string) => void
  onSelectNode?: (id: string) => void
}

export type CustomNodeType = Node<GraphNodeData, 'customNode'>
export type CustomEdgeType = Edge

export type LayoutDirection = 'BILATERAL' | 'LR' | 'TB'

export interface DocumentMetadata {
  id: string
  title: string
  lastModified: number
  totalNodes: number
  totalWords: number
  masteredCount: number
  rawMarkdown: string
}

export interface StudyStats {
  totalNodes: number
  masteredNodes: number
  percentage: number
  totalWords: number
  totalReadingMinutes: number
}
