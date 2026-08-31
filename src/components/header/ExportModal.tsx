import React, { useState } from 'react'
import type { ParsedNode } from '../../types/graph'
import { exportTreeToMarkdown, exportTreeToJSON } from '../../parser/markdownExporter'
import { downloadFile, exportCanvasToImage } from '../../utils/exportUtils'
import {
  X,
  Download,
  Image as ImageIcon,
  FileCode2,
  FileJson,
  Check,
  Loader2
} from 'lucide-react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  documentTitle: string
  parsedTree: ParsedNode[]
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  parsedTree
}) => {
  const [loadingType, setLoadingType] = useState<string | null>(null)
  const [successType, setSuccessType] = useState<string | null>(null)

  if (!isOpen) return null

  const sanitizeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'mapa-conceptual'

  const handleExportPNG = async () => {
    try {
      setLoadingType('png')
      await exportCanvasToImage(sanitizeName(documentTitle), 'png')
      setSuccessType('png')
      setTimeout(() => setSuccessType(null), 2500)
    } catch (e) {
      console.error('Error exporting PNG', e)
    } finally {
      setLoadingType(null)
    }
  }

  const handleExportSVG = async () => {
    try {
      setLoadingType('svg')
      await exportCanvasToImage(sanitizeName(documentTitle), 'svg')
      setSuccessType('svg')
      setTimeout(() => setSuccessType(null), 2500)
    } catch (e) {
      console.error('Error exporting SVG', e)
    } finally {
      setLoadingType(null)
    }
  }

  const handleExportMarkdown = () => {
    const md = exportTreeToMarkdown(parsedTree)
    downloadFile(md, `${sanitizeName(documentTitle)}.md`, 'text/markdown')
    setSuccessType('md')
    setTimeout(() => setSuccessType(null), 2500)
  }

  const handleExportJSON = () => {
    const json = exportTreeToJSON(parsedTree, documentTitle)
    downloadFile(json, `${sanitizeName(documentTitle)}.json`, 'application/json')
    setSuccessType('json')
    setTimeout(() => setSuccessType(null), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Exportar Mapa Conceptual</h3>
              <p className="text-xs text-slate-500">Elige el formato de descarga deseado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* PNG Export */}
          <button
            type="button"
            onClick={handleExportPNG}
            disabled={Boolean(loadingType)}
            className="flex flex-col items-start p-3.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-left group shadow-xs"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              {loadingType === 'png' ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : successType === 'png' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : null}
            </div>
            <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
              Imagen PNG (2x HD)
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Captura visual del lienzo</span>
          </button>

          {/* SVG Export */}
          <button
            type="button"
            onClick={handleExportSVG}
            disabled={Boolean(loadingType)}
            className="flex flex-col items-start p-3.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-left group shadow-xs"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              {loadingType === 'svg' ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : successType === 'svg' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : null}
            </div>
            <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
              Gráfico Vectorial SVG
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Vector nítido escalable</span>
          </button>

          {/* Markdown Export */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex flex-col items-start p-3.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-left group shadow-xs"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <FileCode2 className="w-5 h-5 text-amber-500" />
              {successType === 'md' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <span className="font-bold text-xs text-slate-900 group-hover:text-amber-900">
              Markdown (.md)
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Documento de texto actualizado</span>
          </button>

          {/* JSON Export */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex flex-col items-start p-3.5 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-left group shadow-xs"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <FileJson className="w-5 h-5 text-cyan-600" />
              {successType === 'json' && <Check className="w-4 h-4 text-emerald-600" />}
            </div>
            <span className="font-bold text-xs text-slate-900 group-hover:text-cyan-900">
              Estructura JSON
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Grafo estructurado con nodos</span>
          </button>
        </div>
      </div>
    </div>
  )
}
