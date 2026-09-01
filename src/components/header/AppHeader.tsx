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
  ArrowLeft,
  Cloud,
  CloudOff,
  Loader2,
  Share2,
  Layers,
  LogIn
} from 'lucide-react'
import { InstaMapLogo } from '../common/InstaMapLogo'
import { useAuth } from '../../context/AuthContext'
import type { SaveStatus } from '../../hooks/useGraphState'

interface AppHeaderProps {
  documentTitle: string
  onTitleChange: (newTitle: string) => void
  studyStats: StudyStats
  onOpenUpload: () => void
  onOpenPaste: () => void
  onOpenTemplates: () => void
  onOpenExport: () => void
  saveStatus?: SaveStatus
  onBackToDashboard?: () => void
  onOpenFlashcards?: () => void
  onOpenShare?: () => void
  onOpenAuth?: () => void
  isReadOnly?: boolean
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  documentTitle,
  onTitleChange,
  studyStats,
  onOpenUpload,
  onOpenPaste,
  onOpenTemplates,
  onOpenExport,
  saveStatus = 'local',
  onBackToDashboard,
  onOpenFlashcards,
  onOpenShare,
  onOpenAuth,
  isReadOnly = false
}) => {
  const { user } = useAuth()
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
      {/* Left: Dashboard Back / Brand Logo & Document Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            title="Volver al Dashboard de mapas y carpetas"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mis Mapas</span>
          </button>
        )}

        {/* Brand Logo & Name */}
        <InstaMapLogo size={32} />

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Editable Title */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle && !isReadOnly ? (
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
              disabled={isReadOnly}
              onClick={() => {
                if (isReadOnly) return
                setTempTitle(documentTitle)
                setIsEditingTitle(true)
              }}
              title={isReadOnly ? "Modo solo lectura" : "Clic para renombrar documento"}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-100 rounded-lg text-slate-800 transition-colors group truncate max-w-[180px] md:max-w-[240px]"
            >
              <span className="text-xs font-bold truncate text-slate-900">{documentTitle}</span>
              {!isReadOnly && (
                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </button>
          )}

          {/* Cloud Save Status Indicator */}
          {saveStatus && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 shrink-0">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-600" title="Sincronizado en la nube">
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Guardado</span>
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-indigo-600" title="Guardando cambios...">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden lg:inline">Guardando...</span>
                </span>
              )}
              {saveStatus === 'local' && (
                <span className="flex items-center gap-1 text-slate-400" title="Guardado local (Invitado)">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Local</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-rose-600" title="Error de sincronización">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Error al guardar</span>
                </span>
              )}
            </div>
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

        {/* Flashcards Study Button */}
        {onOpenFlashcards && (
          <button
            type="button"
            onClick={onOpenFlashcards}
            title="Repasar conceptos del mapa en modo Flashcards"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Flashcards</span>
          </button>
        )}

        {/* Share Button */}
        {onOpenShare && (
          <button
            type="button"
            onClick={onOpenShare}
            title="Compartir enlace público de solo lectura"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Export Button */}
        <button
          type="button"
          onClick={onOpenExport}
          title="Exportar mapa a imagen PNG, SVG, Markdown o JSON"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>

        {/* Login Button for guests */}
        {!user && onOpenAuth && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all cursor-pointer ml-1"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>
    </header>
  )
}
