import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ParsedNode, LayoutDirection, StudyStats } from '../types/graph'
import { parseMarkdown, flattenNodeTree, getAllNodesList, calculateReadingStats } from '../parser/markdownParser'
import { exportTreeToMarkdown } from '../parser/markdownExporter'
import { SAMPLE_DOCUMENTS } from '../samples/sampleData'
import confetti from 'canvas-confetti'

const STORAGE_KEYS = {
  MARKDOWN: 'instamap_markdown_v1',
  TITLE: 'instamap_title_v1',
  DIRECTION: 'instamap_direction_v1',
  MASTERED: 'instamap_mastered_v1',
  FONT_SCALE: 'instamap_font_scale_v1'
}

const LEGACY_STORAGE_KEYS = {
  MARKDOWN: 'nodeflow_study_markdown_v2',
  TITLE: 'nodeflow_study_title_v2',
  DIRECTION: 'nodeflow_study_direction_v2',
  MASTERED: 'nodeflow_study_mastered_v2'
}

export function useGraphState() {
  // Load initial document from sample or localStorage
  const [rawMarkdown, setRawMarkdown] = useState<string>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.MARKDOWN) ||
        localStorage.getItem(LEGACY_STORAGE_KEYS.MARKDOWN)
      return saved ? JSON.parse(saved) : SAMPLE_DOCUMENTS[0].markdown
    } catch {
      return SAMPLE_DOCUMENTS[0].markdown
    }
  })

  const [documentTitle, setDocumentTitleState] = useState<string>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.TITLE) ||
        localStorage.getItem(LEGACY_STORAGE_KEYS.TITLE)
      return saved ? JSON.parse(saved) : SAMPLE_DOCUMENTS[0].title
    } catch {
      return SAMPLE_DOCUMENTS[0].title
    }
  })

  const [direction, setDirection] = useState<LayoutDirection>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.DIRECTION) ||
        localStorage.getItem(LEGACY_STORAGE_KEYS.DIRECTION)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed === 'BILATERAL' || parsed === 'LR' || parsed === 'TB') {
          return parsed
        }
      }
      return 'BILATERAL'
    } catch {
      return 'BILATERAL'
    }
  })

  const [fontSizeScale, setFontSizeScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_SCALE)
      if (saved) {
        const val = parseFloat(JSON.parse(saved))
        if (!isNaN(val) && val >= 0.8 && val <= 1.8) {
          return val
        }
      }
      return 1.05
    } catch {
      return 1.05
    }
  })

  const [masteredNodeIds, setMasteredNodeIds] = useState<Set<string>>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEYS.MASTERED) ||
        localStorage.getItem(LEGACY_STORAGE_KEYS.MASTERED)
      return saved ? new Set(JSON.parse(saved)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })

  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Parse markdown into hierarchical tree
  const parsedTree = useMemo<ParsedNode[]>(() => {
    return parseMarkdown(rawMarkdown, documentTitle)
  }, [rawMarkdown, documentTitle])

  // Flattened map and list for quick lookups
  const nodeMap = useMemo(() => flattenNodeTree(parsedTree), [parsedTree])
  const allNodesList = useMemo(() => getAllNodesList(parsedTree), [parsedTree])

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MARKDOWN, JSON.stringify(rawMarkdown))
    } catch (e) {
      console.warn('Failed to save markdown to localStorage', e)
    }
  }, [rawMarkdown])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TITLE, JSON.stringify(documentTitle))
    } catch (e) {
      console.warn('Failed to save title to localStorage', e)
    }
  }, [documentTitle])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DIRECTION, JSON.stringify(direction))
    } catch (e) {
      console.warn('Failed to save direction to localStorage', e)
    }
  }, [direction])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FONT_SCALE, JSON.stringify(fontSizeScale))
    } catch (e) {
      console.warn('Failed to save font scale to localStorage', e)
    }
  }, [fontSizeScale])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTERED, JSON.stringify(Array.from(masteredNodeIds)))
    } catch (e) {
      console.warn('Failed to save mastered nodes to localStorage', e)
    }
  }, [masteredNodeIds])

  // Font Scale Adjusters
  const increaseFontSize = useCallback(() => {
    setFontSizeScale((prev) => Math.min(1.6, Math.round((prev + 0.1) * 100) / 100))
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSizeScale((prev) => Math.max(0.85, Math.round((prev - 0.1) * 100) / 100))
  }, [])

  // Synchronized Document Title change
  const setDocumentTitle = useCallback((newTitle: string) => {
    const cleanTitle = newTitle.trim()
    if (!cleanTitle) return

    setDocumentTitleState(cleanTitle)

    // Update rawMarkdown top heading if present
    setRawMarkdown((prevMarkdown) => {
      const headingMatch = prevMarkdown.match(/^(#{1,6})\s+[^\r\n]+(\r?\n[\s\S]*)?$/)
      if (headingMatch) {
        return `${headingMatch[1]} ${cleanTitle}${headingMatch[2] || ''}`
      }
      return `# ${cleanTitle}\n\n${prevMarkdown}`
    })
  }, [])

  // Compute Study Statistics
  const studyStats = useMemo<StudyStats>(() => {
    const totalNodes = allNodesList.length
    let masteredCount = 0
    let totalWords = 0
    let totalReadingMinutes = 0

    for (const node of allNodesList) {
      if (masteredNodeIds.has(node.id)) {
        masteredCount++
      }
      totalWords += node.wordCount
      totalReadingMinutes += node.readingTimeMinutes
    }

    const percentage = totalNodes > 0 ? Math.round((masteredCount / totalNodes) * 100) : 0
    return {
      totalNodes,
      masteredNodes: masteredCount,
      percentage,
      totalWords,
      totalReadingMinutes
    }
  }, [allNodesList, masteredNodeIds])

  // Path from any node back to Root (for breadcrumbs and highlighted trace)
  const getPathToRoot = useCallback((targetId: string | null): string[] => {
    if (!targetId) return []
    const path: string[] = []
    let currentId: string | null = targetId

    while (currentId) {
      path.unshift(currentId)
      const current = nodeMap.get(currentId)
      currentId = current?.parentId ?? null
    }

    return path
  }, [nodeMap])

  // Search filter and highlighted path
  const highlightedNodeIds = useMemo<Set<string>>(() => {
    if (!searchQuery.trim()) {
      return new Set<string>()
    }

    const query = searchQuery.toLowerCase().trim()
    const matchingIds = new Set<string>()

    for (const node of allNodesList) {
      const matchLabel = node.label.toLowerCase().includes(query)
      const matchContent = node.content.toLowerCase().includes(query)

      if (matchLabel || matchContent) {
        matchingIds.add(node.id)
        const path = getPathToRoot(node.id)
        for (const ancestorId of path) {
          matchingIds.add(ancestorId)
        }
      }
    }

    return matchingIds
  }, [searchQuery, allNodesList, getPathToRoot])

  // Actions
  const loadMarkdown = useCallback((newMarkdown: string, newTitle?: string) => {
    setRawMarkdown(newMarkdown)
    if (newTitle) {
      setDocumentTitleState(newTitle)
    }
    setDirection('BILATERAL')
    setSelectedNodeId(null)
    setCollapsedNodeIds(new Set())
    setSearchQuery('')
  }, [])

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id)
    if (id) {
      setCollapsedNodeIds((prev) => {
        if (prev.has(id)) {
          const next = new Set(prev)
          next.delete(id)
          return next
        }
        return prev
      })
    }
  }, [])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setCollapsedNodeIds(new Set())
  }, [])

  const collapseAll = useCallback(() => {
    const toCollapse = new Set<string>()
    for (const node of allNodesList) {
      if (node.level > 1 && node.children.length > 0) {
        toCollapse.add(node.id)
      }
    }
    setCollapsedNodeIds(toCollapse)
  }, [allNodesList])

  const toggleMastered = useCallback((id: string) => {
    setMasteredNodeIds((prev) => {
      const next = new Set(prev)
      const wasMastered = next.has(id)
      if (wasMastered) {
        next.delete(id)
      } else {
        next.add(id)
        if (next.size === allNodesList.length && allNodesList.length > 0) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
          })
        }
      }
      return next
    })
  }, [allNodesList])

  // Real, persistent update of node content and label
  const updateNodeContent = useCallback(
    (id: string, newLabel: string, newContent: string) => {
      const cleanLabel = newLabel.trim()
      let updatedNodeFound = false
      let isRootUpdated = false

      function updateRecursive(nodes: ParsedNode[]): ParsedNode[] {
        return nodes.map((node) => {
          if (node.id === id) {
            updatedNodeFound = true
            if (node.level === 1) {
              isRootUpdated = true
            }
            const stats = calculateReadingStats(newContent || cleanLabel)
            return {
              ...node,
              label: cleanLabel || node.label,
              content: newContent,
              wordCount: stats.wordCount,
              readingTimeMinutes: stats.readingTimeMinutes
            }
          }
          return {
            ...node,
            children: updateRecursive(node.children)
          }
        })
      }

      const updatedTree = updateRecursive(parsedTree)

      if (updatedNodeFound) {
        if (isRootUpdated && cleanLabel) {
          setDocumentTitleState(cleanLabel)
        }
        const newMarkdown = exportTreeToMarkdown(updatedTree)
        setRawMarkdown(newMarkdown)
      }
    },
    [parsedTree]
  )

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    // Try direct lookup
    const directMatch = nodeMap.get(selectedNodeId)
    if (directMatch) return directMatch

    // If ID changed slightly during re-parsing, find matching node in allNodesList
    return allNodesList[0] || null
  }, [selectedNodeId, nodeMap, allNodesList])

  return {
    rawMarkdown,
    documentTitle,
    setDocumentTitle,
    parsedTree,
    nodeMap,
    allNodesList,
    direction,
    setDirection,
    fontSizeScale,
    setFontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    collapsedNodeIds,
    masteredNodeIds,
    selectedNodeId,
    selectedNode,
    searchQuery,
    setSearchQuery,
    highlightedNodeIds,
    studyStats,
    loadMarkdown,
    selectNode,
    toggleCollapse,
    expandAll,
    collapseAll,
    toggleMastered,
    updateNodeContent,
    getPathToRoot
  }
}
