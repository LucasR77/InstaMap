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
import type { SampleDocument } from './samples/sampleData'

export function App() {
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
    selectNode,
    toggleCollapse,
    expandAll,
    collapseAll,
    toggleMastered,
    updateNodeContent
  } = useGraphState()

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isPasteOpen, setIsPasteOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUploadOpen) setIsUploadOpen(false)
        else if (isPasteOpen) setIsPasteOpen(false)
        else if (isTemplatesOpen) setIsTemplatesOpen(false)
        else if (isExportOpen) setIsExportOpen(false)
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
    selectedNodeId,
    selectNode
  ])

  const handleTemplateSelect = (template: SampleDocument) => {
    loadMarkdown(template.markdown, template.title)
  }

  const handleFileLoaded = (markdown: string, title: string) => {
    loadMarkdown(markdown, title)
  }

  const handleMarkdownSubmit = (markdown: string, title: string) => {
    loadMarkdown(markdown, title)
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <AppHeader
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        studyStats={studyStats}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenPaste={() => setIsPasteOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
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
          onSaveNode={updateNodeContent}
          onSelectNode={selectNode}
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
    </div>
  )
}

export default App
