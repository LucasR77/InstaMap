import { describe, it, expect } from 'vitest'
import {
  normalizeLatexDelimiters,
  normalizeParagraphHeaders,
  normalizeMarkdownForDisplay
} from './textNormalization'

describe('SEAM-LATEX: normalizeLatexDelimiters', () => {
  it('converts inline \\( ... \\) to $ ... $', () => {
    const input = 'La fórmula de Euler es \\(e^{i\\pi} + 1 = 0\\) en el plano complejo.'
    const result = normalizeLatexDelimiters(input)
    expect(result).toBe('La fórmula de Euler es $e^{i\\pi} + 1 = 0$ en el plano complejo.')
  })

  it('converts display \\[ ... \\] to $$ ... $$', () => {
    const input = 'Integral:\n\\[ \\int_0^\\infty e^{-x} dx = 1 \\]\nFin.'
    const result = normalizeLatexDelimiters(input)
    expect(result).toContain('$$\n\\int_0^\\infty e^{-x} dx = 1\n$$')
  })
})

describe('normalizeParagraphHeaders', () => {
  it('converts _Título_: into **Título**:', () => {
    const input = '_Definición_: Este concepto es clave.'
    const result = normalizeParagraphHeaders(input)
    expect(result).toBe('**Definición**: Este concepto es clave.')
  })

  it('converts bullet items like - _Hipótesis_: into - **Hipótesis**:', () => {
    const input = '- _Hipótesis nula_: No hay diferencia.'
    const result = normalizeParagraphHeaders(input)
    expect(result).toBe('- **Hipótesis nula**: No hay diferencia.')
  })

  it('normalizes both latex and paragraph headers via normalizeMarkdownForDisplay', () => {
    const input = '_Fórmula_: \\(x = 1\\)'
    const result = normalizeMarkdownForDisplay(input)
    expect(result).toBe('**Fórmula**: $x = 1$')
  })
})
