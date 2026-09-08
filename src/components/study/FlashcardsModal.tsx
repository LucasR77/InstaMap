import React, { useState, useEffect, useCallback } from 'react'
import { X, RotateCw, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Award, Sparkles } from 'lucide-react'
import type { ParsedNode } from '../../types/graph'
import { getAllNodesList } from '../../parser/markdownParser'
import { MarkdownViewer } from '../sidebar/MarkdownViewer'
import confetti from 'canvas-confetti'

interface FlashcardsModalProps {
  isOpen: boolean
  onClose: () => void
  parsedTree: ParsedNode[]
  masteredNodeIds: Set<string>
  toggleMastered: (id: string) => void
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  parsedTree,
  masteredNodeIds,
  toggleMastered
}) => {
  // Collect all actionable study cards (nodes with level >= 2)
  const cards = React.useMemo(() => {
    const all = getAllNodesList(parsedTree)
    return all.filter((n) => n.level >= 2 && n.label.trim().length > 0)
  }, [parsedTree])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, cards.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setIsFlipped(false)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handlePrev])

  if (!isOpen) return null

  const currentCard = cards[currentIndex]
  const isFinished = cards.length > 0 && currentIndex >= cards.length

  const handleMarkMastered = () => {
    if (!currentCard) return
    if (!masteredNodeIds.has(currentCard.id)) {
      toggleMastered(currentCard.id)
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 }
      })
    }
    handleNext()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col min-h-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Modo Flashcards</h3>
              <p className="text-[11px] text-slate-400">Repaso activo de conceptos del mapa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cards.length > 0 && !isFinished && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentIndex + 1} / {cards.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Finished Screen */}
        {isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              ¡Completaste el mazo de repaso!
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Repasaste todas las tarjetas de este mapa mental.
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0)
                setIsFlipped(false)
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Reiniciar Mazo
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-12 text-slate-400 text-xs">
            No hay suficientes nodos creados en este mapa para armar un mazo de estudio.
          </div>
        ) : (
          <>
            {/* Interactive Flashcard */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 relative cursor-pointer select-none rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-6 sm:p-8 flex flex-col justify-center items-center text-center transition-all hover:border-indigo-500/40 shadow-inner group min-h-[260px]"
            >
              <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isFlipped ? 'Dorso (Explicación)' : 'Frente (Concepto)'}
              </span>

              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-slate-400 group-hover:text-indigo-400 text-[11px]">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Voltear (Espacio)</span>
              </div>

              {!isFlipped ? (
                <div className="my-auto">
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {currentCard.label}
                  </h4>
                  {masteredNodeIds.has(currentCard.id) && (
                    <span className="inline-block mt-3 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-0.5 rounded-full">
                      ✓ Concepto Dominado
                    </span>
                  )}
                </div>
              ) : (
                <div className="my-auto max-h-[220px] overflow-y-auto w-full text-left px-2 custom-scrollbar">
                  <MarkdownViewer content={currentCard.content || currentCard.label} />
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-amber-400" />
                  <span>Aún repasando</span>
                </button>

                <button
                  onClick={handleMarkMastered}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Dominado!</span>
                </button>
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
