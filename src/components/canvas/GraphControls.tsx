import React from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Expand,
  GitFork,
  Type,
  Plus
} from 'lucide-react'

interface GraphControlsProps {
  fontSizeScale?: number
  onIncreaseFontSize?: () => void
  onDecreaseFontSize?: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onAddNewNode?: () => void
  hasSelectedNode?: boolean
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  fontSizeScale = 1.05,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onExpandAll,
  onCollapseAll,
  onAddNewNode,
  hasSelectedNode = false
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  const formattedScale = Math.round(fontSizeScale * 100)

  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/5 text-slate-700 select-none">
      {/* Add Node Button */}
      {onAddNewNode && (
        <button
          type="button"
          onClick={onAddNewNode}
          title={hasSelectedNode ? "Agregar subnodo hijo al concepto seleccionado" : "Agregar una nueva rama principal al mapa"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{hasSelectedNode ? '+ Subnodo' : '+ Nueva Rama'}</span>
        </button>
      )}

      {onAddNewNode && <div className="h-4 w-px bg-slate-200" />}

      {/* Radial Mindmap Indicator */}
      <div
        title="Distribución Radial Mindmap activa"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 border border-amber-200/60 text-amber-900 rounded-lg select-none"
      >
        <GitFork className="w-3.5 h-3.5 text-amber-700 rotate-90" />
        <span className="hidden sm:inline">Radial Mindmap</span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Font Size Adjuster Controls */}
      <div className="flex items-center gap-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
        <button
          type="button"
          onClick={onDecreaseFontSize}
          title="Disminuir tamaño de letra (A-)"
          disabled={fontSizeScale <= 0.85}
          className="px-2 py-1 hover:bg-white hover:text-slate-950 rounded text-xs font-bold text-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
        >
          A-
        </button>

        <div
          title={`Tamaño de letra actual: ${formattedScale}%`}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono font-bold text-indigo-700 bg-white rounded shadow-2xs border border-indigo-100"
        >
          <Type className="w-3 h-3 text-indigo-600" />
          <span>{formattedScale}%</span>
        </div>

        <button
          type="button"
          onClick={onIncreaseFontSize}
          title="Aumentar tamaño de letra (A+)"
          disabled={fontSizeScale >= 1.6}
          className="px-2 py-1 hover:bg-white hover:text-slate-950 rounded text-xs font-bold text-slate-700 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
        >
          A+
        </button>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Expand / Collapse All */}
      <button
        type="button"
        onClick={onExpandAll}
        title="Expandir todas las ramas (100% abierto)"
        className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-600"
      >
        <Expand className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onCollapseAll}
        title="Colapsar todas las sub-ramas"
        className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-600"
      >
        <Minimize2 className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-slate-200" />

      {/* Zoom Controls */}
      <button
        type="button"
        onClick={() => zoomIn({ duration: 250 })}
        title="Acercar lienzo (Zoom In)"
        className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-600"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut({ duration: 250 })}
        title="Alejar lienzo (Zoom Out)"
        className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-600"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Fit View */}
      <button
        type="button"
        onClick={() => fitView({ padding: 0.18, duration: 400 })}
        title="Centrar y encajar vista"
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-700"
      >
        <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
        <span>Centrar</span>
      </button>
    </div>
  )
}
