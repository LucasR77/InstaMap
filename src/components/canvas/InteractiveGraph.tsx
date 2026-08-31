import React, { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeMouseHandler,
  BackgroundVariant,
  SelectionMode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { CustomNode } from './CustomNode'
import { GraphControls } from './GraphControls'
import { getLayoutedElements } from '../../layout/dagreLayout'
import type { ParsedNode, LayoutDirection } from '../../types/graph'

const nodeTypes = {
  customNode: CustomNode
}

interface InteractiveGraphProps {
  parsedTree: ParsedNode[]
  direction: LayoutDirection
  collapsedNodeIds: Set<string>
  masteredNodeIds: Set<string>
  selectedNodeId: string | null
  highlightedNodeIds: Set<string>
  onSelectNode: (id: string | null) => void
  onToggleCollapse: (id: string) => void
  onToggleMastered: (id: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export const InteractiveGraphContent: React.FC<InteractiveGraphProps> = ({
  parsedTree,
  direction,
  collapsedNodeIds,
  masteredNodeIds,
  selectedNodeId,
  highlightedNodeIds,
  onSelectNode,
  onToggleCollapse,
  onToggleMastered,
  onExpandAll,
  onCollapseAll
}) => {

  const { fitView, setCenter } = useReactFlow()

  // Calculate layouted nodes and edges
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    const { nodes, edges } = getLayoutedElements(parsedTree, {
      direction,
      collapsedNodeIds,
      masteredNodeIds,
      selectedNodeId,
      highlightedNodeIds,
      onToggleCollapse,
      onToggleMastered,
      onSelectNode
    })
    return { layoutedNodes: nodes, layoutedEdges: edges }
  }, [
    parsedTree,
    direction,
    collapsedNodeIds,
    masteredNodeIds,
    selectedNodeId,
    highlightedNodeIds,
    onToggleCollapse,
    onToggleMastered,
    onSelectNode
  ])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  // Center camera smoothly when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId)
      if (node && node.position) {
        setCenter(node.position.x + 100, node.position.y + 30, {
          duration: 500,
          zoom: 1.15
        })
      }
    }
  }, [selectedNodeId, nodes, setCenter])

  // Initial fit view on load or layout toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.18, duration: 400 })
    }, 120)
    return () => clearTimeout(timer)
  }, [direction, parsedTree, fitView])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelectNode(node.id)
    },
    [onSelectNode]
  )

  const handlePaneClick = useCallback(() => {
    onSelectNode(null)
  }, [onSelectNode])

  return (
    <div className="relative w-full h-full bg-[#faf9f6] overflow-hidden select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
        className="touch-none"
      >
        <Background
          id="canvas-bg"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#cbd5e1"
          className="opacity-60"
        />

        {/* MiniMap */}
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            if (node.id === selectedNodeId) return '#6366f1'
            const level = (node.data as any)?.level
            if (level === 1) return '#0f172a'
            if (level === 2) return '#eab308'
            return '#cbd5e1'
          }}
          maskColor="rgba(241, 245, 249, 0.75)"
          className="!bottom-6 !right-6 !bg-white/90 !border !border-slate-200 !rounded-xl !shadow-lg overflow-hidden !m-0 hidden sm:block"
        />
      </ReactFlow>

      {/* Floating Canvas Controls */}
      <GraphControls
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
      />
    </div>
  )
}

