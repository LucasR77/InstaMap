import React, { useState } from 'react'
import type { ParsedNode } from '../../types/graph'
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
  Layers
} from 'lucide-react'

interface ReadingSidebarProps {
  node: ParsedNode | null
  nodeMap: Map<string, ParsedNode>
  isOpen: boolean
  isMastered: boolean
  onClose: () => void
  onToggleMastered: (id: string) => void
  onSaveNode: (id: string, newLabel: string, newContent: string) => void
  onSelectNode: (id: string) => void
}

export const ReadingSidebar: React.FC<ReadingSidebarProps> = ({
  node,
  nodeMap,
  isOpen,
  isMastered,
  onClose,
  onToggleMastered,
  onSaveNode,
  onSelectNode
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview')

  if (!isOpen || !node) return null

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
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Nivel H{node.level}</span>
            </span>

            <span className="flex items-center gap-1 text-slate-500 text-xs font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>~{node.readingTimeMinutes} min</span>
            </span>

            <span className="flex items-center gap-1 text-slate-500 text-xs font-mono">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{node.wordCount} palabras</span>
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

          {/* Mastery Button */}
          <button
            type="button"
            onClick={() => onToggleMastered(node.id)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
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

      {/* Contextual Hierarchy Navigation */}
      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-200">
        <BreadcrumbNav currentNode={node} nodeMap={nodeMap} onSelectNode={onSelectNode} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-white">
        {activeTab === 'preview' ? (
          <MarkdownViewer content={node.content} />
        ) : (
          <NodeEditor
            node={node}
            onSave={(id, newLabel, newContent) => {
              onSaveNode(id, newLabel, newContent)
              setActiveTab('preview')
            }}
            onCancel={() => setActiveTab('preview')}
          />
        )}
      </div>
    </aside>
  )
}
