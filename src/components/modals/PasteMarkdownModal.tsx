import React, { useState } from 'react'
import { FileCode, X, Sparkles, AlertCircle } from 'lucide-react'

interface PasteMarkdownModalProps {
  isOpen: boolean
  onClose: () => void
  onMarkdownSubmit: (markdown: string, title: string) => void
}

export const PasteMarkdownModal: React.FC<PasteMarkdownModalProps> = ({
  isOpen,
  onClose,
  onMarkdownSubmit
}) => {
  const [title, setTitle] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!markdown.trim()) {
      setError('Por favor ingresa o pega el contenido Markdown.')
      return
    }

    const finalTitle = title.trim() || 'Nuevo Mapa Conceptual'
    onMarkdownSubmit(markdown, finalTitle)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Pegar / Escribir Markdown</h3>
              <p className="text-xs text-slate-500">Genera el mapa conceptual a partir de texto directo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Title Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Título del Documento (Opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Fundamentos de Redes de Computadoras"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium"
            />
          </div>

          {/* Markdown Content Area */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Contenido en Formato Markdown (# H1, ## H2, viñetas...)
            </label>
            <textarea
              rows={12}
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value)
                setError(null)
              }}
              placeholder={`# Título Principal del Tema\n\nIntroducción general...\n\n## 1. Primera Sección\n\n- **Subconcepto A**: Descripción detallada...\n- **Subconcepto B**: Explicación...`}
              className="w-full p-3.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-xs leading-relaxed resize-y"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/20 text-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar Mapa Conceptual</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
