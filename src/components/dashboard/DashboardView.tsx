import React, { useState, useRef } from 'react'
import {
  Folder,
  FolderPlus,
  FilePlus,
  Upload,
  Search,
  MoreVertical,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Edit2,
  Copy,
  Share2,
  FolderInput,
  LogOut,
  Sparkles,
  GitFork,
  CheckCircle2,
  Compass
} from 'lucide-react'
import { useDashboardState } from '../../hooks/useDashboardState'
import { useAuth } from '../../context/AuthContext'
import { parseDocx } from '../../parser/docxParser'
import { InstaMapLogo } from '../common/InstaMapLogo'
import type { DbMap } from '../../lib/supabase'

interface DashboardViewProps {
  onOpenMap: (map: DbMap) => void
  onNewLocalMap: () => void
  onOpenShareModal?: (map: DbMap) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenMap,
  onNewLocalMap,
  onOpenShareModal
}) => {
  const { user, signOut } = useAuth()
  const {
    currentFolderId,
    setCurrentFolderId,
    breadcrumbs,
    folders,
    allFolders,
    maps,
    loading,
    searchQuery,
    setSearchQuery,
    createFolder,
    deleteFolder,
    createMap,
    deleteMap,
    moveMap,
    renameMap,
    duplicateMap
  } = useDashboardState()

  // Modal states
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#f59e0b') // Amber by default to match InstaMap

  const [renameModalMap, setRenameModalMap] = useState<DbMap | null>(null)
  const [renameTitle, setRenameTitle] = useState('')

  const [moveModalMap, setMoveModalMap] = useState<DbMap | null>(null)
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null)

  const [activeMenuMapId, setActiveMenuMapId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quick stats
  const totalMasteredNodes = maps.reduce(
    (sum, m) => sum + (Array.isArray(m.mastered_node_ids) ? m.mastered_node_ids.length : 0),
    0
  )

  // Handle new folder submit
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    await createFolder(newFolderName, newFolderColor)
    setNewFolderName('')
    setIsNewFolderOpen(false)
  }

  // Handle rename submit
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameModalMap || !renameTitle.trim()) return
    await renameMap(renameModalMap.id, renameTitle)
    setRenameModalMap(null)
  }

  // Handle move submit
  const handleMoveSubmit = async () => {
    if (!moveModalMap) return
    await moveMap(moveModalMap.id, targetFolderId)
    setMoveModalMap(null)
  }

  // Handle creating blank map
  const handleCreateBlankMap = async () => {
    const newMap = await createMap(
      'Nuevo Mapa Mental',
      '# Concepto Principal\n\n## Rama 1: Introducción\n- _Definición_: Escribe aquí los fundamentos.\n\n## Rama 2: Desarrollo\n- _Aplicaciones_: Ejemplos prácticos y relaciones.'
    )
    if (newMap) {
      onOpenMap(newMap)
    }
  }

  // Handle file upload (.docx or .md)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      let markdown = ''
      let title = file.name.replace(/\.[^/.]+$/, '')

      if (file.name.endsWith('.docx')) {
        const result = await parseDocx(file)
        markdown = result.markdown
        title = result.title || title
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        markdown = await file.text()
      }

      if (markdown) {
        const created = await createMap(title, markdown)
        if (created) {
          onOpenMap(created)
        }
      }
    } catch (err) {
      console.error('Error parsing uploaded file:', err)
      alert('Error al procesar el archivo. Verifica el formato.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const currentFolder = allFolders.find((f) => f.id === currentFolderId)

  return (
    <div
      className="flex flex-col w-screen h-screen bg-[#FAF9F6] text-slate-900 font-sans overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1.1px, transparent 1.1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Top Navbar: Mirrors AppHeader cleanly */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <InstaMapLogo size={32} />

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Search bar */}
          <div className="relative w-48 sm:w-64 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carpetas o mapas..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* New Folder button */}
          <button
            onClick={() => setIsNewFolderOpen(true)}
            title="Crear una nueva carpeta organizadora"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-violet-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-violet-300 transition-all shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-violet-500" />
            <span>Nueva Carpeta</span>
          </button>

          {/* Upload docx / md */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".docx,.md,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar un archivo Word (.docx) o Markdown (.md)"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Importar .docx / .md</span>
          </button>

          {/* Open Local Editor button */}
          <button
            onClick={onNewLocalMap}
            title="Abrir lienzo interactivo en blanco"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Lienzo</span>
          </button>

          {/* Create Map button */}
          <button
            onClick={handleCreateBlankMap}
            title="Crear un mapa mental en blanco en esta carpeta"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Nuevo Mapa</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-1">
            <div
              title={user?.email || 'Usuario'}
              className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shadow-xs"
            >
              {(user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <button
              onClick={() => signOut()}
              title="Cerrar Sesión"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb Navigation & Folder Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {currentFolderId && (
                <button
                  onClick={() => {
                    const parent = allFolders.find((f) => f.id === currentFolderId)?.parent_id ?? null
                    setCurrentFolderId(parent)
                  }}
                  className="p-1.5 mr-1 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-white border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
                  title="Subir un nivel"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id ?? 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      idx === breadcrumbs.length - 1
                        ? 'font-bold text-slate-900 bg-white border border-slate-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Quick KPI Stats */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-xl font-semibold shadow-2xs">
                <GitFork className="w-3 h-3 text-amber-600 rotate-90" />
                <span>{maps.length} {maps.length === 1 ? 'mapa' : 'mapas'}</span>
              </div>

              {totalMasteredNodes > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 rounded-xl font-semibold shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{totalMasteredNodes} dominados</span>
                </div>
              )}

              {folders.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50/90 border border-violet-200/80 text-violet-900 rounded-xl font-semibold shadow-2xs">
                  <Folder className="w-3 h-3 text-violet-600" />
                  <span>{folders.length} {folders.length === 1 ? 'carpeta' : 'carpetas'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">Cargando tus carpetas y mapas...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Folders Section */}
              {folders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Carpetas ({folders.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {folders.map((folder) => {
                      const folderMapsCount = maps.filter((m) => m.folder_id === folder.id).length
                      return (
                        <div
                          key={folder.id}
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="group flex items-center justify-between p-3.5 bg-white hover:bg-white border border-slate-200/90 hover:border-violet-300 rounded-2xl cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-3 truncate min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: `${folder.color}15`,
                                color: folder.color,
                                borderColor: `${folder.color}35`
                              }}
                            >
                              <Folder className="w-5 h-5 fill-current" />
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-sm text-slate-800 group-hover:text-violet-700 transition-colors truncate block">
                                {folder.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {folderMapsCount} {folderMapsCount === 1 ? 'mapa' : 'mapas'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`¿Eliminar la carpeta "${folder.name}" y todo su contenido?`)) {
                                deleteFolder(folder.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                            title="Eliminar Carpeta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Maps Section */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {currentFolder ? `Mapas en ${currentFolder.name}` : 'Todos los Mapas'} ({maps.length})
                  </h3>
                </div>

                {maps.length === 0 && folders.length === 0 ? (
                  /* Empty state styled cleanly with InstaMap's mindmap aesthetic */
                  <div className="py-20 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white/70 shadow-xs max-w-xl mx-auto">
                    {/* Visual Mindmap Illustration */}
                    <div className="w-16 h-16 rounded-2xl bg-[#faedcd] border border-[#d4a373] text-[#432818] flex items-center justify-center mb-4 shadow-sm">
                      <Sparkles className="w-8 h-8 text-amber-700" />
                    </div>
                    <h4 className="font-extrabold text-lg text-slate-900 mb-1 font-['Outfit']">
                      No hay mapas en este espacio
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                      Empezá creando un nuevo mapa mental interactivo o importá un documento de Word (.docx) o Markdown para estructurarlo automáticamente.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={handleCreateBlankMap}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Crear Primer Mapa</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Importar Word .docx</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {maps.map((map) => {
                      const masteredCount = Array.isArray(map.mastered_node_ids)
                        ? map.mastered_node_ids.length
                        : 0
                      const updatedDate = new Date(map.updated_at).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short'
                      })
                      const cleanExcerpt = map.raw_markdown
                        .replace(/[#*`_~[\]]/g, '')
                        .slice(0, 95)
                        .trim()

                      return (
                        <div
                          key={map.id}
                          onClick={() => onOpenMap(map)}
                          className="group relative flex flex-col justify-between p-5 bg-white hover:bg-white border border-slate-200/90 hover:border-amber-400/90 rounded-2xl cursor-pointer transition-all duration-200 shadow-xs hover:shadow-lg hover:-translate-y-1 min-h-[175px]"
                        >
                          <div>
                            {/* Card Header: Mindmap Icon + Options Menu */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#faedcd] border border-[#d4a373]/80 flex items-center justify-center shrink-0 shadow-2xs">
                                <GitFork className="w-4 h-4 text-[#432818] rotate-90" />
                              </div>

                              {/* Options Menu Button */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuMapId(activeMenuMapId === map.id ? null : map.id)
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuMapId === map.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150"
                                  >
                                    <button
                                      onClick={() => {
                                        setActiveMenuMapId(null)
                                        setRenameModalMap(map)
                                        setRenameTitle(map.title)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>Cambiar Nombre</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMenuMapId(null)
                                        setMoveModalMap(map)
                                        setTargetFolderId(map.folder_id)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <FolderInput className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Mover a Carpeta</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMenuMapId(null)
                                        duplicateMap(map.id)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Duplicar</span>
                                    </button>

                                    {onOpenShareModal && (
                                      <button
                                        onClick={() => {
                                          setActiveMenuMapId(null)
                                          onOpenShareModal(map)
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                      >
                                        <Share2 className="w-3.5 h-3.5 text-sky-500" />
                                        <span>Compartir</span>
                                      </button>
                                    )}

                                    <div className="border-t border-slate-100 my-1"></div>

                                    <button
                                      onClick={() => {
                                        setActiveMenuMapId(null)
                                        if (confirm(`¿Eliminar definitivamente el mapa "${map.title}"?`)) {
                                          deleteMap(map.id)
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Eliminar</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Map Title */}
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5 font-['Outfit']">
                              {map.title}
                            </h4>

                            {/* Markdown Excerpt Preview */}
                            {cleanExcerpt && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {cleanExcerpt}...
                              </p>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
                            <span>{updatedDate}</span>
                            {masteredCount > 0 && (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{masteredCount} dominados</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal: New Folder */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center border border-violet-200">
                <FolderPlus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">Nueva Carpeta</h3>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nombre (ej. Medicina, Derecho, Algoritmos)"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 mb-4 transition-all"
            />

            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-semibold text-slate-500">Color distintivo:</span>
              {[
                { hex: '#f59e0b', name: 'Amarillo Cálido' },
                { hex: '#8b5cf6', name: 'Violeta' },
                { hex: '#0ea5e9', name: 'Celeste' },
                { hex: '#10b981', name: 'Esmeralda' },
                { hex: '#f43f5e', name: 'Coral' },
                { hex: '#64748b', name: 'Pizarra' }
              ].map(({ hex, name }) => (
                <button
                  key={hex}
                  type="button"
                  title={name}
                  onClick={() => setNewFolderColor(hex)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    newFolderColor === hex ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-600/20 transition-colors cursor-pointer"
              >
                Crear Carpeta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Rename Map */}
      {renameModalMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleRenameSubmit}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <Edit2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">Renombrar Mapa</h3>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-6 transition-all"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameModalMap(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Move Map to Folder */}
      {moveModalMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                <FolderInput className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">Mover a Carpeta</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Selecciona el destino para <strong className="text-slate-700">"{moveModalMap.title}"</strong>:
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar mb-6">
              {/* Root destination */}
              <button
                type="button"
                onClick={() => setTargetFolderId(null)}
                className={`w-full p-2.5 text-xs text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  targetFolderId === null
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Folder className="w-4 h-4 text-amber-500" />
                <span>Principal (Sin carpeta)</span>
              </button>

              {allFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTargetFolderId(f.id)}
                  className={`w-full p-2.5 text-xs text-left rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    targetFolderId === f.id
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Folder className="w-4 h-4" style={{ color: f.color }} />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveModalMap(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMoveSubmit}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
