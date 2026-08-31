import type { IslandColorTheme } from '../types/graph'

export const PASTEL_THEMES: IslandColorTheme[] = [
  // 1. Pastel Warm Amber / Yellow (Conceptos Fundamentales / Paradigmas)
  {
    name: 'Pastel Yellow',
    primary: '#d97706',
    bg: 'bg-[#fef9c3] hover:bg-[#fef08a]',
    border: 'border-[#fde047] hover:border-[#eab308]',
    text: 'text-[#713f12]',
    badge: 'bg-[#fef08a] text-[#713f12] border border-[#fde047]',
    glow: 'shadow-[0_4px_20px_rgba(234,179,8,0.15)]',
    accentHex: '#eab308'
  },
  // 2. Pastel Mint / Emerald (Arquitecturas de Aplicación / Redes Inalámbricas)
  {
    name: 'Pastel Mint',
    primary: '#059669',
    bg: 'bg-[#dcfce7] hover:bg-[#bbf7d0]',
    border: 'border-[#86efac] hover:border-[#22c55e]',
    text: 'text-[#14532d]',
    badge: 'bg-[#bbf7d0] text-[#14532d] border border-[#86efac]',
    glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    accentHex: '#10b981'
  },
  // 3. Pastel Sky / Cyan (Taxonomía por Escala / Arquitectura en Capas)
  {
    name: 'Pastel Sky',
    primary: '#0284c7',
    bg: 'bg-[#e0f2fe] hover:bg-[#bae6fd]',
    border: 'border-[#7dd3fc] hover:border-[#0284c7]',
    text: 'text-[#075985]',
    badge: 'bg-[#bae6fd] text-[#075985] border border-[#7dd3fc]',
    glow: 'shadow-[0_4px_20px_rgba(2,132,199,0.15)]',
    accentHex: '#0284c7'
  },
  // 4. Pastel Rose / Coral (Redes de Acceso / Primitivas de Sockets)
  {
    name: 'Pastel Rose',
    primary: '#e11d48',
    bg: 'bg-[#ffe4e6] hover:bg-[#fecdd3]',
    border: 'border-[#fda4af] hover:border-[#f43f5e]',
    text: 'text-[#881337]',
    badge: 'bg-[#fecdd3] text-[#881337] border border-[#fda4af]',
    glow: 'shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
    accentHex: '#f43f5e'
  },
  // 5. Pastel Lavender / Purple (Arquitectura de Internet / Estandarización)
  {
    name: 'Pastel Lavender',
    primary: '#9333ea',
    bg: 'bg-[#f3e8ff] hover:bg-[#e9d5ff]',
    border: 'border-[#d8b4fe] hover:border-[#a855f7]',
    text: 'text-[#581c87]',
    badge: 'bg-[#e9d5ff] text-[#581c87] border border-[#d8b4fe]',
    glow: 'shadow-[0_4px_20px_rgba(168,85,247,0.15)]',
    accentHex: '#a855f7'
  },
  // 6. Pastel Peach / Orange (Objetivos de Diseño / Unidades de Medida)
  {
    name: 'Pastel Peach',
    primary: '#ea580c',
    bg: 'bg-[#ffedd5] hover:bg-[#fed7aa]',
    border: 'border-[#fed7aa] hover:border-[#f97316]',
    text: 'text-[#7c2d12]',
    badge: 'bg-[#fed7aa] text-[#7c2d12] border border-[#fdba74]',
    glow: 'shadow-[0_4px_20px_rgba(249,115,22,0.15)]',
    accentHex: '#f97316'
  },
  // 7. Pastel Teal
  {
    name: 'Pastel Teal',
    primary: '#0d9488',
    bg: 'bg-[#ccfbf1] hover:bg-[#99f6e4]',
    border: 'border-[#5eead4] hover:border-[#14b8a6]',
    text: 'text-[#134e4a]',
    badge: 'bg-[#99f6e4] text-[#134e4a] border border-[#5eead4]',
    glow: 'shadow-[0_4px_20px_rgba(20,184,166,0.15)]',
    accentHex: '#14b8a6'
  },
  // 8. Pastel Violet
  {
    name: 'Pastel Violet',
    primary: '#7c3aed',
    bg: 'bg-[#ede9fe] hover:bg-[#ddd6fe]',
    border: 'border-[#c4b5fd] hover:border-[#8b5cf6]',
    text: 'text-[#4c1d95]',
    badge: 'bg-[#ddd6fe] text-[#4c1d95] border border-[#c4b5fd]',
    glow: 'shadow-[0_4px_20px_rgba(139,92,246,0.15)]',
    accentHex: '#8b5cf6'
  }
]

// Beige / Latte central root theme
export const ROOT_THEME: IslandColorTheme = {
  name: 'Root Beige Node',
  primary: '#78350f',
  bg: 'bg-[#faedcd]',
  border: 'border-[#d4a373]',
  text: 'text-[#432818]',
  badge: 'bg-[#fefae0] text-[#432818] border border-[#d4a373]',
  glow: 'shadow-[0_10px_35px_rgba(212,163,115,0.25)]',
  accentHex: '#b45309'
}

export function getIslandTheme(islandIndex?: number, level?: number): IslandColorTheme {
  if (level === 1) {
    return ROOT_THEME
  }
  if (islandIndex === undefined || islandIndex < 0) {
    return PASTEL_THEMES[0]
  }
  return PASTEL_THEMES[islandIndex % PASTEL_THEMES.length]
}
