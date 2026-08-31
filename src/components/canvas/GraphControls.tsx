import React from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Expand,
  GitFork
} from 'lucide-react'

interface GraphControlsProps {
  onExpandAll: () => void
  onCollapseAll: () => void
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  onExpandAll,
  onCollapseAll
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/5 text-slate-700">
      {/* Radial Mindmap Indicator */}
      <div
        title="Distribución Radial Mindmap activa"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 border border-amber-200/60 text-amber-900 rounded-lg select-none"
      >
        <GitFork className="w-3.5 h-3.5 text-amber-700 rotate-90" />
        <span>Radial Mindmap</span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      {/* Expand / Collapse All */}
      <button
        type="button"
        onClick={onExpandAll}
        title="Expandir todas las ramas"
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
        title="Acercar (Zoom In)"
        className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-600"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut({ duration: 250 })}
        title="Alejar (Zoom Out)"
        className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-600"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Fit View */}
      <button
        type="button"
        onClick={() => fitView({ padding: 0.18, duration: 400 })}
        title="Ajustar vista al centro"
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors text-slate-700"
      >
        <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
        <span>Centrar</span>
      </button>
    </div>
  )
}
