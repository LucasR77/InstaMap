import React, { useState } from 'react'
import { X, Copy, Check, Globe, Lock, Share2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { DbMap } from '../../lib/supabase'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  map: DbMap | null
  onMapUpdated?: (updatedMap: DbMap) => void
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  map,
  onMapUpdated
}) => {
  const [isPublic, setIsPublic] = useState(map?.is_public ?? false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen || !map) return null

  const shareUrl = `${window.location.origin}/?share=${map.id}`

  const handleTogglePublic = async () => {
    setLoading(true)
    const nextState = !isPublic
    try {
      const { data, error } = await supabase
        .from('maps')
        .update({
          is_public: nextState,
          updated_at: new Date().toISOString()
        })
        .eq('id', map.id)
        .select()
        .single()

      if (!error && data) {
        setIsPublic(nextState)
        if (onMapUpdated) onMapUpdated(data as DbMap)
      }
    } catch (err) {
      console.error('Error toggling public state:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-800 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Compartir Mapa</h3>
            <p className="text-xs text-slate-400 truncate max-w-[280px]">{map.title}</p>
          </div>
        </div>

        {/* Public switch */}
        <div className="flex items-center justify-between p-4 my-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Globe className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {isPublic ? 'Enlace público activado' : 'Acceso privado'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isPublic
                  ? 'Cualquier persona con el link puede ver este mapa.'
                  : 'Solo vos podés ver y editar este mapa.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleTogglePublic}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isPublic ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Link box */}
        {isPublic ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Enlace de solo lectura:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400 py-2">
            Activá el switch superior para generar un enlace compartible.
          </p>
        )}
      </div>
    </div>
  )
}
