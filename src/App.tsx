import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useGraphState } from './hooks/useGraphState'
import { AppHeader } from './components/header/AppHeader'
import { SearchBar } from './components/canvas/SearchBar'
import { InteractiveGraphContent } from './components/canvas/InteractiveGraph'
import { ReadingSidebar } from './components/sidebar/ReadingSidebar'
import { FileUploadModal } from './components/modals/FileUploadModal'
import { PasteMarkdownModal } from './components/modals/PasteMarkdownModal'
import { TemplatesModal } from './components/modals/TemplatesModal'
import { ExportModal } from './components/header/ExportModal'
import { AuthModal } from './components/auth/AuthModal'
import { DashboardView } from './components/dashboard/DashboardView'
import { FlashcardsModal } from './components/study/FlashcardsModal'
import { ShareModal } from './components/share/ShareModal'
import { AuthProvider, useAuth } from './context/AuthContext'
import { supabase, type DbMap } from './lib/supabase'
import type { SampleDocument } from './samples/sampleData'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const {
    documentTitle,
    setDocumentTitle,
    parsedTree,
    nodeMap,
    allNodesList,
    direction,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    collapsedNodeIds,
    masteredNodeIds,
    selectedNodeId,
    selectedNode,
    searchQuery,
    setSearchQuery,
    highlightedNodeIds,
    studyStats,
    loadMarkdown,
    loadFromDbMap,
    currentMapId,
    saveStatus,
    addNewNode,
    deleteNode,
    selectNode,
    toggleCollapse,
    expandAll,
    collapseAll,
    toggleMastered,
    updateNodeContent
  } = useGraphState()

  // Current view state
  const [view, setView] = useState<'dashboard' | 'editor'>('editor')
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [activeShareMap, setActiveShareMap] = useState<DbMap | null>(null)

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isPasteOpen, setIsPasteOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  // Detect shared map in URL (?share=<id>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('share')
    if (shareId) {
      supabase
        .from('maps')
        .select('*')
        .eq('id', shareId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            loadFromDbMap(data as DbMap)
            setIsReadOnly(true)
            setView('editor')
          }
        })
    }
  }, [loadFromDbMap])

  // If user is authenticated on initial load, navigate to dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('share') && user && !currentMapId) {
      setView('dashboard')
    }
  }, [user, currentMapId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUploadOpen) setIsUploadOpen(false)
        else if (isPasteOpen) setIsPasteOpen(false)
        else if (isTemplatesOpen) setIsTemplatesOpen(false)
        else if (isExportOpen) setIsExportOpen(false)
        else if (isAuthOpen) setIsAuthOpen(false)
        else if (isFlashcardsOpen) setIsFlashcardsOpen(false)
        else if (isShareOpen) setIsShareOpen(false)
        else if (selectedNodeId) selectNode(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isUploadOpen,
    isPasteOpen,
    isTemplatesOpen,
    isExportOpen,
    isAuthOpen,
    isFlashcardsOpen,
    isShareOpen,
    selectedNodeId,
    selectNode
  ])

  const handleTemplateSelect = (template: SampleDocument) => {
    loadMarkdown(template.markdown, template.title)
    setView('editor')
  }

  const handleFileLoaded = (markdown: string, title: string) => {
    loadMarkdown(markdown, title)
    setView('editor')
  }

  const handleMarkdownSubmit = (markdown: string, title: string) => {
    loadMarkdown(markdown, title)
    setView('editor')
  }

  // Handle map selection from Dashboard
  const handleOpenMapFromDashboard = (map: DbMap) => {
    loadFromDbMap(map)
    setIsReadOnly(false)
    setView('editor')
  }

  // Handle share modal trigger from dashboard
  const handleOpenShareFromDashboard = (map: DbMap) => {
    setActiveShareMap(map)
    setIsShareOpen(true)
  }

  // Current active map for share modal
  const currentDbMapForShare: DbMap | null = activeShareMap || (currentMapId ? {
    id: currentMapId,
    user_id: user?.id || '',
    folder_id: null,
    title: documentTitle,
    raw_markdown: '',
    mastered_node_ids: Array.from(masteredNodeIds),
    layout_direction: direction,
    is_public: false,
    share_slug: null,
    created_at: '',
    updated_at: ''
  } : null)

  if (authLoading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-[#faf9f6] text-slate-600">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // If view is dashboard and user is logged in
  if (view === 'dashboard' && user) {
    return (
      <>
        <DashboardView
          onOpenMap={handleOpenMapFromDashboard}
          onNewLocalMap={() => setView('editor')}
          onOpenShareModal={handleOpenShareFromDashboard}
        />
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false)
            setActiveShareMap(null)
          }}
          map={currentDbMapForShare}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-[#faf9f6] text-slate-900 overflow-hidden font-sans">
      {/* Top Header */}
      <AppHeader
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        studyStats={studyStats}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenPaste={() => setIsPasteOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        saveStatus={saveStatus}
        onBackToDashboard={user ? () => setView('dashboard') : undefined}
        onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        onOpenShare={currentMapId ? () => setIsShareOpen(true) : undefined}
        onOpenAuth={() => setIsAuthOpen(true)}
        isReadOnly={isReadOnly}
      />

      {/* Main Canvas Area */}
      <main className="relative flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Floating Top Search Bar */}
        <div className="absolute top-4 left-6 z-20">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            allNodes={allNodesList}
            onSelectNode={selectNode}
          />
        </div>

        {/* React Flow Interactive Graph */}
        <ReactFlowProvider>
          <InteractiveGraphContent
            parsedTree={parsedTree}
            direction={direction}
            fontSizeScale={fontSizeScale}
            onIncreaseFontSize={increaseFontSize}
            onDecreaseFontSize={decreaseFontSize}
            collapsedNodeIds={collapsedNodeIds}
            masteredNodeIds={masteredNodeIds}
            selectedNodeId={selectedNodeId}
            highlightedNodeIds={highlightedNodeIds}
            onSelectNode={selectNode}
            onToggleCollapse={toggleCollapse}
            onToggleMastered={toggleMastered}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            onAddNewNode={isReadOnly ? undefined : (parentId) => addNewNode(parentId)}
          />
        </ReactFlowProvider>

        {/* Reading and Editing Drawer */}
        <ReadingSidebar
          node={selectedNode}
          nodeMap={nodeMap}
          isOpen={Boolean(selectedNodeId && selectedNode)}
          isMastered={Boolean(selectedNodeId && masteredNodeIds.has(selectedNodeId))}
          masteredNodeIds={masteredNodeIds}
          onClose={() => selectNode(null)}
          onToggleMastered={toggleMastered}
          onSaveNode={isReadOnly ? () => {} : updateNodeContent}
          onSelectNode={selectNode}
          onAddChild={isReadOnly ? undefined : (parentId) => addNewNode(parentId)}
          onDeleteNode={isReadOnly ? undefined : (nodeId) => deleteNode(nodeId)}
        />
      </main>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileLoaded={handleFileLoaded}
      />

      <PasteMarkdownModal
        isOpen={isPasteOpen}
        onClose={() => setIsPasteOpen(false)}
        onMarkdownSubmit={handleMarkdownSubmit}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        documentTitle={documentTitle}
        parsedTree={parsedTree}
        onExpandAll={expandAll}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        parsedTree={parsedTree}
        masteredNodeIds={masteredNodeIds}
        toggleMastered={toggleMastered}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false)
          setActiveShareMap(null)
        }}
        map={currentDbMapForShare}
      />
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
