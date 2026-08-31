import React from 'react'
import type { ParsedNode } from '../../types/graph'
import { ChevronRight, ArrowUpLeft, CornerDownRight } from 'lucide-react'

interface BreadcrumbNavProps {
  currentNode: ParsedNode
  nodeMap: Map<string, ParsedNode>
  onSelectNode: (id: string) => void
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  currentNode,
  nodeMap,
  onSelectNode
}) => {
  const parentNode = currentNode.parentId ? nodeMap.get(currentNode.parentId) : null
  const childrenNodes = currentNode.children

  return (
    <div className="space-y-2.5 py-1.5 text-xs">
      {/* Ancestor Trail */}
      {parentNode && (
        <div className="flex items-center gap-1.5 text-slate-500">
          <ArrowUpLeft className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium">Sección Padre:</span>
          <button
            type="button"
            onClick={() => onSelectNode(parentNode.id)}
            className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[240px]"
            title={parentNode.label}
          >
            {parentNode.label}
          </button>
        </div>
      )}

      {/* Children Quick Jump */}
      {childrenNodes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <CornerDownRight className="w-3 h-3 text-indigo-600" />
            <span>Sub-nodos directos ({childrenNodes.length}):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {childrenNodes.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => onSelectNode(child.id)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 hover:text-indigo-900 transition-all text-left shadow-2xs"
              >
                <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate max-w-[160px]">{child.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
