import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Copy, Check } from 'lucide-react'
import { normalizeMarkdownForDisplay } from '../../utils/textNormalization'

interface MarkdownViewerProps {
  content: string
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs italic">
        Esta sección no contiene texto adicional. Usa la pestaña de edición para agregar apuntes.
      </div>
    )
  }

  const normalizedContent = normalizeMarkdownForDisplay(content)

  return (
    <div className="prose prose-slate prose-sm max-w-none space-y-3.5 text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 mt-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200/80 pb-1.5 mb-2.5 mt-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-indigo-700 mb-2 mt-3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-slate-800 mb-1.5 mt-2.5">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm text-slate-700 mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1.5 mb-3 text-xs sm:text-sm text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1.5 mb-3 text-xs sm:text-sm text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/60 pl-3 py-2 my-2.5 rounded-r-lg text-xs italic text-slate-700">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-100 text-slate-800">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2 font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-700 border-b border-slate-100">{children}</td>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')

            if (!inline && match) {
              return (
                <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 text-[11px] font-mono text-slate-400 border-b border-slate-800">
                    <span>{match[1]}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeString)}
                      className="flex items-center gap-1 hover:text-white transition-colors text-[10px]"
                    >
                      {copiedCode === codeString ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-xs font-mono bg-slate-900 text-slate-100">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-xs border border-slate-200 font-semibold"
                {...props}
              >
                {children}
              </code>
            )
          }
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
