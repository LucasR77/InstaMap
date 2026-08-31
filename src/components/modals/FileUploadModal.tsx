import React, { useState, useRef, useEffect } from 'react'
import { UploadCloud, FileText, X, AlertCircle, ShieldCheck, Loader2, FileCode, FileType2 } from 'lucide-react'
import { parseDocx } from '../../parser/docxParser'

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onFileLoaded: (markdown: string, title: string) => void
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileLoaded
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset modal state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false)
      setIsDragging(false)
      setErrorMessage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null)
    const fileName = file.name.toLowerCase()
    const isDocx = fileName.endsWith('.docx')
    const isMarkdownOrText =
      fileName.endsWith('.md') ||
      fileName.endsWith('.markdown') ||
      fileName.endsWith('.txt') ||
      file.type.includes('text')

    if (!isDocx && !isMarkdownOrText) {
      setErrorMessage('Por favor selecciona un archivo Markdown (.md, .markdown), Texto (.txt) o Word (.docx) válido.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setIsProcessing(true)

    try {
      if (isDocx) {
        const result = await parseDocx(file)
        if (!result.markdown || !result.markdown.trim()) {
          throw new Error('El documento Word está vacío o no contiene texto legible.')
        }
        setIsProcessing(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onFileLoaded(result.markdown, result.title)
        onClose()
      } else {
        const reader = new FileReader()
        reader.onload = (e) => {
          setIsProcessing(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          const content = e.target?.result as string
          const title = file.name.replace(/\.[^/.]+$/, '')
          onFileLoaded(content, title)
          onClose()
        }
        reader.onerror = () => {
          setErrorMessage('Error al leer el archivo. Intenta de nuevo.')
          setIsProcessing(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
        reader.readAsText(file, 'UTF-8')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al procesar el archivo'
      setErrorMessage(msg)
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (isProcessing) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isProcessing) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Cargar Archivo de Apuntes</h3>
              <p className="text-xs text-slate-500">Procesamiento 100% en tu navegador (Client-side)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isProcessing
              ? 'border-indigo-300 bg-indigo-50/30 cursor-wait'
              : isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-slate-100/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
            disabled={isProcessing}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const selectedFile = e.target.files[0]
                e.target.value = ''
                handleFileProcess(selectedFile)
              }
            }}
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">Procesando y analizando documento...</p>
              <p className="text-xs text-slate-500 mt-1">Convirtiendo estructura y generando mapa mental</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 mb-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-indigo-600">
                <FileText className="w-7 h-7" />
              </div>

              <p className="text-sm font-semibold text-slate-800">
                Arrastra tu archivo aquí o <span className="text-indigo-600 underline">examina</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-3">Soporta Markdown, texto estructurado y documentos Word</p>

              {/* Supported Format Badges */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-600">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                  <FileCode className="w-3 h-3" /> .md / .markdown
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <FileType2 className="w-3 h-3" /> .docx (Word)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  .txt
                </span>
              </div>
            </>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Privacidad garantizada:</strong> Tus documentos se leen localmente y nunca se envían a servidores externos.
          </span>
        </div>
      </div>
    </div>
  )
}

