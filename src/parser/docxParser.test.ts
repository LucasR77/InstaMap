import { describe, it, expect } from 'vitest'
import {
  normalizeDocxMarkdown,
  convertHtmlTablesToMarkdown
} from './docxParser'

describe('SEAM-DOCX: Smart Hierarchy and Structure Detection', () => {
  it('converts numbered headings into markdown headers', () => {
    const input = `
1. Introducción al Análisis
Este es el texto del tema 1.

1.1. Antecedentes
Detalle histórico.

1.1.1. Detalle específico
Más detalles.
    `.trim()

    const output = normalizeDocxMarkdown(input)
    expect(output).toContain('## 1. Introducción al Análisis')
    expect(output).toContain('### 1.1. Antecedentes')
    expect(output).toContain('#### 1.1.1. Detalle específico')
  })

  it('converts Roman numerals into Level 2 headings', () => {
    const input = 'I. Conceptos Fundamentales\nTexto explicativo.'
    const output = normalizeDocxMarkdown(input)
    expect(output).toContain('## I. Conceptos Fundamentales')
  })

  it('converts standalone uppercase headings into Level 2 headings', () => {
    const input = 'MARCO TEÓRICO\nEl siguiente estudio aborda...'
    const output = normalizeDocxMarkdown(input)
    expect(output).toContain('## MARCO TEÓRICO')
  })

  it('converts lettered lists into bullet points with bold indicators', () => {
    const input = 'a) Primera hipótesis\nb) Segunda hipótesis'
    const output = normalizeDocxMarkdown(input)
    expect(output).toContain('- **a)** Primera hipótesis')
    expect(output).toContain('- **b)** Segunda hipótesis')
  })

  it('converts HTML tables to clean markdown tables', () => {
    const htmlTable = `
<table>
  <tr><td>Concepto</td><td>Definición</td></tr>
  <tr><td>Nodo</td><td>Punto de conexión</td></tr>
  <tr><td>Arista</td><td>Enlace entre nodos</td></tr>
</table>
    `.trim()

    const markdown = convertHtmlTablesToMarkdown(htmlTable)
    expect(markdown).toContain('| Concepto | Definición |')
    expect(markdown).toContain('| --- | --- |')
    expect(markdown).toContain('| Nodo | Punto de conexión |')
    expect(markdown).toContain('| Arista | Enlace entre nodos |')
  })
})
