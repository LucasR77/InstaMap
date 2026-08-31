import React, { useState } from 'react'
import type { ParsedNode } from '../../types/graph'
import { Save, RotateCcw, Check } from 'lucide-react'

interface NodeEditorProps {
  node: ParsedNode
  onSave: (id: string, newLabel: string, newContent: string) => void
  onCancel: () => void
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node, onSave, onCancel }) => {
  const [label, setLabel] = useState(node.label)
  const [content, setContent] = useState(node.content)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [prevNodeId, setPrevNodeId] = useState(node.id)

  if (node.id !== prevNodeId) {
    setPrevNodeId(node.id)
    setLabel(node.label)
    setContent(node.content)
    setSavedSuccess(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(node.id, label.trim() || node.label, content)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
      {/* Node Title */}
      <div className="space-y-1.5">
        <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
          Título del Concepto (Nivel H{node.level})
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
        />
      </div>

      {/* Node Markdown Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Contenido Markdown
          </label>
          <span className="text-[10px] text-slate-500">{wordCount} palabras</span>
        </div>
        <textarea
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tus notas, tablas, fórmulas KaTeX o código aquí..."
          className="w-full p-3 bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs leading-relaxed resize-y"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Cancelar</span>
        </button>

        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition-all text-xs"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
