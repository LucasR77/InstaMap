import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNodeData } from '../../types/graph'
import { CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, BookOpen } from 'lucide-react'

export const CustomNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData
  const {
    id,
    label,
    level,
    hasContent,
    childCount,
    hasChildren,
    isCollapsed,
    isMastered,
    islandColor,
    side = 'right',
    isLeaf,
    isHighlighted,
    isDimmed,
    isSelected,
    fontScale = 1.05,
    cardWidth,
    onToggleCollapse,
    onToggleMastered,
    onSelectNode
  } = nodeData

  const isRoot = level === 1
  const isTitle = level === 2 && !isLeaf // Level 2 Island Category
  const isSubtitle = level === 3 && !isLeaf // Level 3 Subcategory

  const isLeftSide = side === 'left'

  const handleMasteredClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleMastered?.(id)
  }

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse?.(id)
  }

  const handleCardClick = () => {
    onSelectNode?.(id)
  }

  // 1. Nodo RAÍZ / TÍTULO PRINCIPAL (Warm Latte / Rich Amber con Tipografía Grande y Destacada)
  if (isRoot) {
    const rootWidth = cardWidth || Math.round(270 * fontScale)
    const rootFontSize = Math.round(16.5 * fontScale)

    return (
      <div
        onClick={handleCardClick}
        style={{
          width: `${rootWidth}px`,
          fontSize: `${rootFontSize}px`
        }}
        className={`relative px-5 py-4 rounded-2xl bg-[#faedcd] text-[#432818] border-2 border-[#d4a373] select-none cursor-pointer transition-all duration-200 shadow-xl shadow-amber-900/10 ${
          isSelected
            ? 'ring-4 ring-amber-600 scale-105 shadow-2xl'
            : 'hover:scale-[1.02] hover:shadow-2xl hover:border-[#b45309]'
        } ${isHighlighted ? 'ring-4 ring-amber-500 scale-105' : ''} ${
          isDimmed ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="target-left"
          className="!w-2.5 !h-2.5 !bg-[#d4a373] !border-2 !border-white opacity-0"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="source-left"
          className="!w-2.5 !h-2.5 !bg-[#d4a373] !border-2 !border-white opacity-0"
        />
        <Handle
          type="target"
          position={Position.Right}
          id="target-right"
          className="!w-2.5 !h-2.5 !bg-[#d4a373] !border-2 !border-white opacity-0"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="source-right"
          className="!w-2.5 !h-2.5 !bg-[#d4a373] !border-2 !border-white opacity-0"
        />

        <h1 className="font-extrabold tracking-tight text-center leading-snug whitespace-normal break-words text-[#432818] uppercase">
          {label}
        </h1>
      </div>
    )
  }

  // 2. Nodo TÍTULO (Nivel 2 - e.g. "3. Delimitación Conceptual"): Color Pastel con Borde Temático
  if (isTitle) {
    const titleWidth = cardWidth || Math.round(260 * fontScale)
    const titleFontSize = Math.round(14.5 * fontScale)

    return (
      <div
        onClick={handleCardClick}
        style={{
          width: `${titleWidth}px`,
          fontSize: `${titleFontSize}px`
        }}
        className={`group relative flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl border-2 shadow-xs transition-all duration-200 cursor-pointer select-none ${
          islandColor.bg
        } ${islandColor.border} ${
          isSelected ? 'ring-3 ring-indigo-400 scale-105 shadow-md' : 'hover:scale-[1.02] hover:shadow-sm'
        } ${isHighlighted ? 'ring-3 ring-amber-400 scale-105' : ''} ${
          isDimmed ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <Handle
          type="target"
          position={isLeftSide ? Position.Right : Position.Left}
          id={isLeftSide ? 'target-right' : 'target-left'}
          className="!w-2 !h-2 !bg-slate-400 opacity-0"
        />
        <Handle
          type="source"
          position={isLeftSide ? Position.Left : Position.Right}
          id={isLeftSide ? 'source-left' : 'source-right'}
          className="!w-2 !h-2 !bg-slate-400 opacity-0"
        />

        {/* Label (Full text wrapped vertically) */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${isLeftSide ? 'order-2 text-right' : 'text-left'}`}>
          <h2
            className={`font-extrabold leading-snug whitespace-normal break-words w-full ${islandColor.text} ${
              isMastered ? 'line-through opacity-60' : ''
            }`}
          >
            {label}
          </h2>
        </div>

        {/* Actions (Collapse / Mastery) */}
        <div className={`flex items-center gap-1.5 shrink-0 ${isLeftSide ? 'order-1' : ''}`}>
          <button
            type="button"
            onClick={handleMasteredClick}
            className={`p-0.5 rounded-full transition-colors ${
              isMastered ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${isMastered ? 'fill-emerald-200 scale-110' : ''}`}
            />
          </button>

          {hasChildren && (
            <button
              type="button"
              onClick={handleCollapseClick}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-bold rounded transition-all ${
                isCollapsed
                  ? 'bg-amber-200 text-amber-900 border border-amber-400 animate-pulse'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
              }`}
              title={isCollapsed ? 'Desplegar sub-nodos' : 'Colapsar sub-nodos'}
            >
              {isCollapsed ? (
                <>
                  {isLeftSide ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>+{childCount}</span>
                </>
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  // 3. Nodo SUBTÍTULO (Nivel 3 - e.g. "3.1. Definición Formal"): Blanco con Borde de Color de Acento
  if (isSubtitle) {
    const subtitleWidth = cardWidth || Math.round(260 * fontScale)
    const subtitleFontSize = Math.round(13.5 * fontScale)

    return (
      <div
        onClick={handleCardClick}
        style={{
          width: `${subtitleWidth}px`,
          fontSize: `${subtitleFontSize}px`
        }}
        className={`group relative flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border-2 shadow-xs transition-all duration-200 cursor-pointer select-none ${
          islandColor.border
        } ${
          isSelected ? 'ring-3 ring-indigo-400 scale-105 shadow-md' : 'hover:scale-[1.02] hover:shadow-sm'
        } ${isHighlighted ? 'ring-3 ring-amber-400 scale-105' : ''} ${
          isDimmed ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <Handle
          type="target"
          position={isLeftSide ? Position.Right : Position.Left}
          id={isLeftSide ? 'target-right' : 'target-left'}
          className="!w-2 !h-2 !bg-slate-400 opacity-0"
        />
        <Handle
          type="source"
          position={isLeftSide ? Position.Left : Position.Right}
          id={isLeftSide ? 'source-left' : 'source-right'}
          className="!w-2 !h-2 !bg-slate-400 opacity-0"
        />

        {/* Label (Full text wrapped vertically) */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${isLeftSide ? 'order-2 text-right' : 'text-left'}`}>
          <h3
            className={`font-bold leading-snug whitespace-normal break-words w-full text-slate-800 group-hover:text-slate-950 ${
              isMastered ? 'line-through opacity-60' : ''
            }`}
          >
            {label}
          </h3>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-1.5 shrink-0 ${isLeftSide ? 'order-1' : ''}`}>
          <button
            type="button"
            onClick={handleMasteredClick}
            className={`p-0.5 rounded-full transition-colors ${
              isMastered ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${isMastered ? 'fill-emerald-200 scale-110' : ''}`}
            />
          </button>

          {hasChildren && (
            <button
              type="button"
              onClick={handleCollapseClick}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-bold rounded transition-all ${
                isCollapsed
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title={isCollapsed ? 'Desplegar sub-nodos' : 'Colapsar sub-nodos'}
            >
              {isCollapsed ? (
                <>
                  {isLeftSide ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>+{childCount}</span>
                </>
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  // 4. Nodo TÍTULO DE PÁRRAFO (Nivel 4 / Hojas - e.g. "Nodos Autónomos"): Texto completo vertical
  const leafWidth = cardWidth || Math.round(275 * fontScale)
  const leafFontSize = Math.round(13 * fontScale)

  return (
    <div
      onClick={handleCardClick}
      style={{
        width: `${leafWidth}px`,
        fontSize: `${leafFontSize}px`
      }}
      className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-xs cursor-pointer select-none transition-all duration-150 ${
        islandColor.bg
      } ${islandColor.border} ${
        isLeftSide ? 'text-right flex-row-reverse' : 'text-left'
      } ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-md scale-105'
          : 'hover:scale-[1.02] hover:shadow-sm'
      } ${isHighlighted ? 'ring-2 ring-amber-400' : ''} ${
        isDimmed ? 'opacity-30' : 'opacity-100'
      }`}
    >
      <Handle
        type="target"
        position={isLeftSide ? Position.Right : Position.Left}
        id={isLeftSide ? 'target-right' : 'target-left'}
        className="!w-1.5 !h-1.5 !bg-slate-400 !border-none opacity-0"
      />
      <Handle
        type="source"
        position={isLeftSide ? Position.Left : Position.Right}
        id={isLeftSide ? 'source-left' : 'source-right'}
        className="!w-1.5 !h-1.5 !bg-slate-400 !border-none opacity-0"
      />

      {/* Mastered Indicator */}
      {isMastered && (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
      )}

      {/* Full text vertically wrapped without truncation */}
      <span
        className={`font-semibold leading-snug whitespace-normal break-words flex-1 min-w-0 ${islandColor.text} ${
          isMastered ? 'line-through opacity-60' : ''
        }`}
      >
        {label}
      </span>

      {hasContent && (
        <BookOpen className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </div>
  )
})

CustomNode.displayName = 'CustomNode'
