import React from 'react'
import { SAMPLE_DOCUMENTS, type SampleDocument } from '../../samples/sampleData'
import {
  X,
  Layers,
  Network,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (doc: SampleDocument) => void
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Network':
        return <Network className="w-6 h-6 text-indigo-600" />
      case 'Layers':
        return <Layers className="w-6 h-6 text-emerald-600" />
      default:
        return <Network className="w-6 h-6 text-indigo-600" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Plantillas de Estudio de Ejemplo</h3>
              <p className="text-xs text-slate-500">Prueba la potencia del grafo con mapas conceptuales listos para usar</p>
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

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => {
                onSelectTemplate(doc)
                onClose()
              }}
              className="flex items-start gap-4 p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all text-left group shadow-xs"
            >
              <div className="p-3 rounded-xl bg-white border border-slate-200 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                {getIcon(doc.icon)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                    {doc.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-900 truncate">
                  {doc.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="self-center p-2 text-slate-400 group-hover:text-indigo-600 transition-colors">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
