import React, { useState } from 'react'
import type { StudyStats } from '../../types/graph'
import {
  UploadCloud,
  FileCode,
  Sparkles,
  Download,
  CheckCircle2,
  Edit2,
  Check,
  GitFork
} from 'lucide-react'
import { InstaMapLogo } from '../common/InstaMapLogo'

interface AppHeaderProps {
  documentTitle: string
  onTitleChange: (newTitle: string) => void
  studyStats: StudyStats
  onOpenUpload: () => void
  onOpenPaste: () => void
  onOpenTemplates: () => void
  onOpenExport: () => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  documentTitle,
  onTitleChange,
  studyStats,
  onOpenUpload,
  onOpenPaste,
  onOpenTemplates,
  onOpenExport
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(documentTitle)

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim())
    }
    setIsEditingTitle(false)
  }


  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 flex items-center justify-between gap-4 z-30 select-none shadow-sm">
      {/* Left: Brand Logo & Document Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Brand Logo & Name */}
        <InstaMapLogo size={32} />

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Editable Title */}
        <div className="flex items-center gap-1 min-w-0">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="px-2 py-0.5 text-xs bg-slate-50 border border-indigo-500 rounded-md text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 text-emerald-600 hover:text-emerald-700 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTitle(documentTitle)
                setIsEditingTitle(true)
              }}
              title="Clic para renombrar documento"
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-100 rounded-lg text-slate-800 transition-colors group truncate max-w-[200px] md:max-w-[280px]"
            >
              <span className="text-xs font-bold truncate text-slate-900">{documentTitle}</span>
              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Center/Right: Study Progress Bar */}
      <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              studyStats.percentage === 100 ? 'text-emerald-600 fill-emerald-100' : 'text-indigo-600'
            }`}
          />
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Progreso:</span>
          <span className="font-bold text-slate-900">{studyStats.percentage}%</span>
        </div>

        {/* Visual Progress Meter */}
        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              studyStats.percentage === 100
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${studyStats.percentage}%` }}
          />
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {studyStats.masteredNodes}/{studyStats.totalNodes}
        </span>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Upload File */}
        <button
          type="button"
          onClick={onOpenUpload}
          title="Subir archivo Markdown o Word (.md / .txt / .docx)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-xs"
        >
          <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Cargar</span>
        </button>

        {/* Paste Text */}
        <button
          type="button"
          onClick={onOpenPaste}
          title="Pegar o escribir texto Markdown"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-xs"
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Pegar</span>
        </button>

        {/* Templates */}
        <button
          type="button"
          onClick={onOpenTemplates}
          title="Explorar plantillas de estudio de ejemplo"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden lg:inline">Plantillas</span>
        </button>

        {/* Radial Mindmap Badge */}
        <div
          title="Modo Radial Mindmap activo"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-900 rounded-xl shadow-xs select-none"
        >
          <GitFork className="w-3.5 h-3.5 text-amber-700 rotate-90" />
          <span>Radial</span>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />


        {/* Export Button */}
        <button
          type="button"
          onClick={onOpenExport}
          title="Exportar mapa a imagen PNG, SVG, Markdown o JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  )
}
