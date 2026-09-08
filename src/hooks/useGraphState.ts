import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ParsedNode, LayoutDirection, StudyStats } from '../types/graph'
import { parseMarkdown, flattenNodeTree, getAllNodesList, calculateReadingStats } from '../parser/markdownParser'
import { exportTreeToMarkdown } from '../parser/markdownExporter'
import { SAMPLE_DOCUMENTS } from '../samples/sampleData'
import { supabase, isSupabaseConfigured, type DbMap } from '../lib/supabase'
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

export type SaveStatus = 'saved' | 'saving' | 'local' | 'error'

export function findNodePath(tree: ParsedNode[], id: string): number[] | null {
  function search(nodes: ParsedNode[], currentPath: number[]): number[] | null {
    for (let i = 0; i < nodes.length; i++) {
      const path = [...currentPath, i]
      if (nodes[i].id === id) return path
      const found = search(nodes[i].children, path)
      if (found) return found
    }
    return null
  }
  return search(tree, [])
}

export function getNodeByPath(tree: ParsedNode[], path: number[]): ParsedNode | null {
  let currentList = tree
  let current: ParsedNode | null = null
  for (const index of path) {
    if (!currentList || index < 0 || index >= currentList.length) return null
    current = currentList[index]
    currentList = current.children
  }
  return current
}

export function useGraphState(initialMap?: DbMap | null) {

  const [currentMapId, setCurrentMapId] = useState<string | null>(initialMap ? initialMap.id : null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initialMap ? 'saved' : 'local')

  // Load initial document from sample or localStorage
  const [rawMarkdown, setRawMarkdown] = useState<string>(() => {
    if (initialMap) return initialMap.raw_markdown
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
    if (initialMap) return initialMap.title
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

      const targetPath = findNodePath(parsedTree, id)

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
        const effectiveTitle = isRootUpdated && cleanLabel ? cleanLabel : documentTitle
        if (isRootUpdated && cleanLabel) {
          setDocumentTitleState(cleanLabel)
        }
        const newMarkdown = exportTreeToMarkdown(updatedTree)
        setRawMarkdown(newMarkdown)

        // Resolve new ID in the re-parsed tree using targetPath
        if (targetPath) {
          const reParsedTree = parseMarkdown(newMarkdown, effectiveTitle)
          const newNode = getNodeByPath(reParsedTree, targetPath)
          if (newNode) {
            setSelectedNodeId(newNode.id)
            if (masteredNodeIds.has(id) && newNode.id !== id) {
              setMasteredNodeIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                next.add(newNode.id)
                return next
              })
            }
            if (collapsedNodeIds.has(id) && newNode.id !== id) {
              setCollapsedNodeIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                next.add(newNode.id)
                return next
              })
            }
          }
        }
      }
    },
    [parsedTree, documentTitle, masteredNodeIds, collapsedNodeIds]
  )

  // Add new node (child or root branch)
  const addNewNode = useCallback(
    (parentId?: string, initialLabel = 'Nuevo Concepto', initialContent = '') => {
      const newId = `node-${Date.now()}-custom`

      function addRecursive(nodes: ParsedNode[]): { updated: ParsedNode[]; addedNode: ParsedNode | null } {
        let added: ParsedNode | null = null

        const updated = nodes.map((node) => {
          if (node.id === parentId) {
            const childLevel = Math.min(6, node.level + 1)
            const newNode: ParsedNode = {
              id: newId,
              label: initialLabel,
              level: childLevel,
              content: initialContent,
              parentId: node.id,
              children: [],
              wordCount: calculateReadingStats(initialContent || initialLabel).wordCount,
              readingTimeMinutes: 1,
              islandIndex: node.islandIndex,
              isLeaf: childLevel >= 4
            }
            added = newNode
            return {
              ...node,
              isLeaf: false,
              children: [...node.children, newNode]
            }
          }

          const childResult = addRecursive(node.children)
          if (childResult.addedNode) {
            added = childResult.addedNode
            return {
              ...node,
              children: childResult.updated
            }
          }

          return node
        })

        return { updated, addedNode: added }
      }

      let newTree: ParsedNode[] = []
      let createdNode: ParsedNode | null = null
      let newPath: number[] = []

      if (!parentId || parentId === parsedTree[0]?.id) {
        // Add to main root
        const root = parsedTree[0]
        const newNode: ParsedNode = {
          id: newId,
          label: initialLabel,
          level: 2,
          content: initialContent,
          parentId: root?.id || null,
          children: [],
          wordCount: calculateReadingStats(initialContent || initialLabel).wordCount,
          readingTimeMinutes: 1,
          islandIndex: 0,
          isLeaf: false
        }
        createdNode = newNode

        if (root) {
          newPath = [0, root.children.length]
          newTree = [
            {
              ...root,
              children: [...root.children, newNode]
            }
          ]
        } else {
          newPath = [0]
          newTree = [newNode]
        }
      } else {
        const targetParentPath = findNodePath(parsedTree, parentId)
        const parentNode = targetParentPath ? getNodeByPath(parsedTree, targetParentPath) : null
        const childIndex = parentNode ? parentNode.children.length : 0
        if (targetParentPath) {
          newPath = [...targetParentPath, childIndex]
        }
        const res = addRecursive(parsedTree)
        newTree = res.updated
        createdNode = res.addedNode
      }

      const newMarkdown = exportTreeToMarkdown(newTree)
      setRawMarkdown(newMarkdown)

      const reParsedTree = parseMarkdown(newMarkdown, documentTitle)
      const newNode = newPath.length > 0 ? getNodeByPath(reParsedTree, newPath) : null
      if (newNode) {
        setSelectedNodeId(newNode.id)
      } else if (createdNode) {
        setSelectedNodeId(createdNode.id)
      }
    },
    [parsedTree, documentTitle]
  )


  // Delete node and its subtree
  const deleteNode = useCallback(
    (nodeId: string) => {
      // Don't allow deleting root node
      if (parsedTree[0]?.id === nodeId) return

      function deleteRecursive(nodes: ParsedNode[]): ParsedNode[] {
        return nodes
          .filter((node) => node.id !== nodeId)
          .map((node) => ({
            ...node,
            children: deleteRecursive(node.children)
          }))
      }

      const updatedTree = deleteRecursive(parsedTree)
      const newMarkdown = exportTreeToMarkdown(updatedTree)
      setRawMarkdown(newMarkdown)

      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null)
      }
    },
    [parsedTree, selectedNodeId]
  )

  // Load from Supabase DB Map
  const loadFromDbMap = useCallback((map: DbMap) => {
    setCurrentMapId(map.id)
    setDocumentTitleState(map.title)
    setRawMarkdown(map.raw_markdown)
    if (map.layout_direction) {
      setDirection(map.layout_direction)
    }
    if (Array.isArray(map.mastered_node_ids)) {
      setMasteredNodeIds(new Set(map.mastered_node_ids))
    }
    setSelectedNodeId(null)
    setCollapsedNodeIds(new Set())
    setSearchQuery('')
    setSaveStatus('saved')
  }, [])

  // Auto-save debounce effect to Supabase
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!currentMapId || !isSupabaseConfigured) {
      setSaveStatus('local')
      return
    }

    setSaveStatus('saving')
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('maps')
          .update({
            title: documentTitle,
            raw_markdown: rawMarkdown,
            layout_direction: direction,
            mastered_node_ids: Array.from(masteredNodeIds),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentMapId)

        if (!error) {
          setSaveStatus('saved')
        } else {
          console.error('Supabase auto-save error:', error)
          setSaveStatus('error')
        }
      } catch (err) {
        console.error('Supabase auto-save exception:', err)
        setSaveStatus('error')
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [currentMapId, rawMarkdown, documentTitle, direction, masteredNodeIds])

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    // Direct lookup
    const directMatch = nodeMap.get(selectedNodeId)
    if (directMatch) return directMatch

    // Never fall back to root node (allNodesList[0])!
    // Try finding by partial ID match
    const partialMatch = allNodesList.find(
      (n) => n.id === selectedNodeId || n.id.startsWith(selectedNodeId) || selectedNodeId.startsWith(n.id)
    )
    return partialMatch || null
  }, [selectedNodeId, nodeMap, allNodesList])

  useEffect(() => {
    if (selectedNode && selectedNode.id !== selectedNodeId) {
      setSelectedNodeId(selectedNode.id)
    }
  }, [selectedNode, selectedNodeId])


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
    loadFromDbMap,
    currentMapId,
    setCurrentMapId,
    saveStatus,
    addNewNode,
    deleteNode,
    selectNode,
    toggleCollapse,
    expandAll,
    collapseAll,
    toggleMastered,
    updateNodeContent,
    getPathToRoot
  }
}
