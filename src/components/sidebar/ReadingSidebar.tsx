import React, { useState, useMemo } from 'react'
import type { ParsedNode } from '../../types/graph'
import { getNodeDisplayContent } from '../../parser/markdownParser'
import { MarkdownViewer } from './MarkdownViewer'
import { NodeEditor } from './NodeEditor'
import { BreadcrumbNav } from './BreadcrumbNav'
import {
  X,
  BookOpen,
  Edit3,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  ListTree,
  ExternalLink,
  LayoutGrid,
  AlignLeft
} from 'lucide-react'

interface ReadingSidebarProps {
  node: ParsedNode | null
  nodeMap: Map<string, ParsedNode>
  isOpen: boolean
  isMastered: boolean
  masteredNodeIds?: Set<string>
  onClose: () => void
  onToggleMastered: (id: string) => void
  onSaveNode: (id: string, newLabel: string, newContent: string) => void
  onSelectNode: (id: string) => void
  onAddChild?: (parentId: string) => void
  onDeleteNode?: (nodeId: string) => void
}

/**
 * Extracts introductory content of the parent, filtering out lines that match child labels
 */
function extractIntroContent(content: string, children: ParsedNode[]): string {
  if (!content || !content.trim()) return ''
  if (!children || children.length === 0) return content

  const lines = content.split(/\r?\n/)
  const introLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      introLines.push(line)
      continue
    }

    // Filter out lines that start as bullet or heading matching a child's label
    const isChildLine = children.some((child) => {
      const escaped = child.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`^([-*+]|#{1,6})\\s+(?:\\*\\*)?${escaped}`, 'i')
      return regex.test(trimmed)
    })

    if (!isChildLine) {
      introLines.push(line)
    }
  }

  return introLines.join('\n').trim()
}

/**
 * Builds continuous markdown text combining parent intro and all children
 */
function buildContinuousContent(node: ParsedNode, intro: string): string {
  const parts: string[] = []
  if (intro) {
    parts.push(intro)
  }

  function appendChildren(children: ParsedNode[], currentLevel: number) {
    for (const child of children) {
      const hashes = '#'.repeat(Math.min(6, currentLevel))
      parts.push(`${hashes} ${child.label}`)
      const body = getNodeDisplayContent(child)
      if (body) {
        parts.push(body)
      }
      if (child.children && child.children.length > 0) {
        appendChildren(child.children, currentLevel + 1)
      }
    }
  }

  appendChildren(node.children, Math.max(3, node.level + 1))
  return parts.join('\n\n')
}

interface ChildNodeCardProps {
  child: ParsedNode
  index: number
  depth: number
  masteredNodeIds?: Set<string>
  onToggleMastered: (id: string) => void
  onSelectNode: (id: string) => void
}

const ChildNodeCard: React.FC<ChildNodeCardProps> = ({
  child,
  index,
  depth,
  masteredNodeIds,
  onToggleMastered,
  onSelectNode
}) => {
  const isMastered = Boolean(masteredNodeIds?.has(child.id))
  const displayContent = getNodeDisplayContent(child)
  const hasChildren = child.children && child.children.length > 0

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        depth > 0
          ? 'ml-3 sm:ml-4 mt-2.5 bg-slate-50/70 border-slate-200/80'
          : 'bg-white border-slate-200/90 shadow-xs'
      } ${isMastered ? 'border-emerald-200 bg-emerald-50/20' : 'hover:border-indigo-200 hover:shadow-sm'}`}
    >
      {/* Child Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
            {index + 1}
          </span>
          <h4
            className={`text-xs sm:text-sm font-bold text-slate-800 truncate ${
              isMastered ? 'line-through text-slate-400' : ''
            }`}
            title={child.label}
          >
            {child.label}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mastered toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMastered(child.id)
            }}
            title={isMastered ? 'Marcar como pendiente' : 'Marcar como aprendido'}
            className={`p-1 rounded-md transition-colors ${
              isMastered
                ? 'text-emerald-600 hover:bg-emerald-100/60'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isMastered ? 'fill-emerald-200' : ''}`} />
          </button>

          {/* Jump to node in canvas */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectNode(child.id)
            }}
            title="Enfocar este sub-nodo en el mapa"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden xs:inline">Enfocar</span>
          </button>
        </div>
      </div>

      {/* Child Body: Complete Phrase / Content */}
      <div className="p-3.5 text-xs text-slate-700">
        {displayContent ? (
          <MarkdownViewer content={displayContent} />
        ) : (
          <span className="text-slate-400 italic text-[11px]">Sin texto adicional</span>
        )}

        {/* Recursive sub-children */}
        {hasChildren && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sub-nodos adicionales ({child.children.length})
            </span>
            {child.children.map((subChild, subIdx) => (
              <ChildNodeCard
                key={subChild.id}
                child={subChild}
                index={subIdx}
                depth={depth + 1}
                masteredNodeIds={masteredNodeIds}
                onToggleMastered={onToggleMastered}
                onSelectNode={onSelectNode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const ReadingSidebar: React.FC<ReadingSidebarProps> = ({
  node,
  nodeMap,
  isOpen,
  isMastered,
  masteredNodeIds,
  onClose,
  onToggleMastered,
  onSaveNode,
  onSelectNode,
  onAddChild,
  onDeleteNode
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview')
  const [subnodesViewMode, setSubnodesViewMode] = useState<'cards' | 'continuous'>('cards')

  // Calculate cumulative stats for this branch
  const { totalWords, totalReadingMinutes, totalSubnodesCount } = useMemo(() => {
    if (!node) return { totalWords: 0, totalReadingMinutes: 0, totalSubnodesCount: 0 }
    let words = node.wordCount
    let count = 0

    function countDescendants(n: ParsedNode) {
      for (const child of n.children) {
        count++
        words += child.wordCount
        countDescendants(child)
      }
    }
    countDescendants(node)
    const minutes = Math.max(1, Math.ceil(words / 180))
    return { totalWords: words, totalReadingMinutes: minutes, totalSubnodesCount: count }
  }, [node])

  const introContent = useMemo(() => {
    if (!node) return ''
    return extractIntroContent(node.content, node.children)
  }, [node])

  const continuousContent = useMemo(() => {
    if (!node) return ''
    return buildContinuousContent(node, introContent)
  }, [node, introContent])

  if (!isOpen || !node) return null

  const hasChildren = node.children && node.children.length > 0

  return (
    <aside
      className={`fixed top-14 bottom-0 right-0 z-40 w-full sm:w-[460px] lg:w-[520px] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {/* Level & Read Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Nivel H{node.level}</span>
            </span>

            {hasChildren && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <ListTree className="w-3 h-3 text-amber-600" />
                <span>
                  {node.children.length}{' '}
                  {node.children.length === 1 ? 'sub-nodo' : 'sub-nodos'}
                  {totalSubnodesCount > node.children.length ? ` (${totalSubnodesCount} total)` : ''}
                </span>
              </span>
            )}

            <span className="flex items-center gap-1 text-slate-500 text-xs font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>~{totalReadingMinutes} min</span>
            </span>

            <span className="flex items-center gap-1 text-slate-500 text-xs font-mono">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{totalWords} palabras</span>
            </span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title="Cerrar panel (Esc)"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
          {node.label}
        </h2>

        {/* Mastery Action Button & Tabs */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Tabs: Preview vs Edit */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lectura</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'edit'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onAddChild && (
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                title="Agregar un nuevo subnodo a este concepto"
              >
                <span>+ Subnodo</span>
              </button>
            )}

            {/* Mastery Button */}
            <button
              type="button"
              onClick={() => onToggleMastered(node.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isMastered
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${isMastered ? 'fill-emerald-200 text-emerald-600' : ''}`}
              />
              <span>{isMastered ? 'Dominado' : 'Marcar Aprendido'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contextual Hierarchy Navigation */}
      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-200">
        <BreadcrumbNav currentNode={node} nodeMap={nodeMap} onSelectNode={onSelectNode} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-white">
        {activeTab === 'preview' ? (
          <div className="space-y-5">
            {/* If node has direct intro content, display it */}
            {introContent ? (
              <div className="pb-3 border-b border-slate-100">
                <MarkdownViewer content={introContent} />
              </div>
            ) : !hasChildren ? (
              <MarkdownViewer content={node.content} />
            ) : null}

            {/* Complete Content of All Children */}
            {hasChildren && (
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Contenido completo de sub-nodos ({node.children.length})
                    </h3>
                  </div>

                  {/* View Mode Toggle: Cards vs Continuous */}
                  <div className="flex items-center gap-0.5 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSubnodesViewMode('cards')}
                      title="Vista en tarjetas estructuradas"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-colors ${
                        subnodesViewMode === 'cards'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span className="hidden sm:inline">Tarjetas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubnodesViewMode('continuous')}
                      title="Vista de lectura continua"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-colors ${
                        subnodesViewMode === 'continuous'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <AlignLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Continuo</span>
                    </button>
                  </div>
                </div>

                {/* Render Cards or Continuous */}
                {subnodesViewMode === 'cards' ? (
                  <div className="space-y-3">
                    {node.children.map((child, idx) => (
                      <ChildNodeCard
                        key={child.id}
                        child={child}
                        index={idx}
                        depth={0}
                        masteredNodeIds={masteredNodeIds}
                        onToggleMastered={onToggleMastered}
                        onSelectNode={onSelectNode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200">
                    <MarkdownViewer content={continuousContent} />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <NodeEditor
              node={node}
              onSave={(id, newLabel, newContent) => {
                onSaveNode(id, newLabel, newContent)
                setActiveTab('preview')
              }}
              onCancel={() => setActiveTab('preview')}
              onAddChild={onAddChild}
              onDelete={onDeleteNode}
            />

            {/* Quick links to edit child nodes directly */}
            {hasChildren && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Editar sub-nodos ({node.children.length})
                </h4>
                <div className="space-y-1.5">
                  {node.children.map((child, idx) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelectNode(child.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-indigo-600">
                          {idx + 1}.
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                          {child.label}
                        </span>
                      </div>
                      <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
