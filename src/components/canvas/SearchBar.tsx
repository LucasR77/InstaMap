import React, { useState, useRef, useEffect } from 'react'
import type { ParsedNode } from '../../types/graph'
import { Search, X, Sparkles } from 'lucide-react'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  allNodes: ParsedNode[]
  onSelectNode: (id: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  allNodes,
  onSelectNode
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredNodes = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    return allNodes
      .filter((n) => n.label.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .slice(0, 8)
  }, [searchQuery, allNodes])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative z-30 w-72 sm:w-80">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar concepto o sub-tema..."
          className="w-full pl-9 pr-8 py-2 text-xs bg-white/95 backdrop-blur-md border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-md shadow-slate-900/5 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              setIsOpen(false)
            }}
            className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {isOpen && filteredNodes.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 max-h-64 overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-2xl p-1 text-xs divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Coincidencias ({filteredNodes.length})</span>
          </div>
          {filteredNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                onSelectNode(node.id)
                setIsOpen(false)
              }}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="truncate pr-2">
                <p className="font-medium text-slate-800 group-hover:text-indigo-950 truncate">
                  {node.label}
                </p>
                <span className="text-[10px] text-slate-400">Nivel H{node.level}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {node.readingTimeMinutes}m
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
