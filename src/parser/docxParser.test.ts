import { describe, it, expect } from 'vitest'
import {
  normalizeDocxMarkdown,
  convertHtmlTablesToMarkdown,
  convertMammothHtmlToMarkdown
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

  it('converts Mammoth HTML containing definition and table into Markdown without flattening', () => {
    const mammothHtml = `
<h2>Principios Arquitectónicos REST</h2>
<p><strong>Sin estado (Stateless):</strong> Cada petición del cliente al servidor debe contener toda la información necesaria para comprender y procesar la petición.</p>
<table>
  <tr><th>Operación HTTP</th><th>Función Principal en REST</th><th>Idempotencia</th></tr>
  <tr><td>GET</td><td>Consultar datos sin efectos secundarios</td><td>Sí</td></tr>
  <tr><td>POST</td><td>Crear un nuevo recurso</td><td>No</td></tr>
  <tr><td>PUT</td><td>Actualizar completamente o crear un recurso</td><td>Sí</td></tr>
  <tr><td>DELETE</td><td>Eliminar un recurso</td><td>Sí</td></tr>
</table>
    `.trim()

    const markdown = convertMammothHtmlToMarkdown(mammothHtml)
    expect(markdown).toContain('## Principios Arquitectónicos REST')
    expect(markdown).toContain('**Sin estado (Stateless):** Cada petición del cliente al servidor')
    expect(markdown).toContain('| Operación HTTP | Función Principal en REST | Idempotencia |')
    expect(markdown).toContain('| --- | --- | --- |')
    expect(markdown).toContain('| GET | Consultar datos sin efectos secundarios | Sí |')

    // Preserves table lines in normalizeDocxMarkdown without converting into ### headings
    const normalized = normalizeDocxMarkdown(markdown)
    expect(normalized).not.toContain('### Operación HTTP')
    expect(normalized).not.toContain('### GET')
    expect(normalized).toContain('| Operación HTTP | Función Principal en REST | Idempotencia |')
  })

  it('end-to-end: converts docx table structure into proper 4-level ParsedNode tree', async () => {
    const mammothHtml = `
<h1>Fundamentos de Arquitectura</h1>
<h2>Principios REST</h2>
<p>Sin estado (Stateless): Cada petición del cliente al servidor debe contener toda la información necesaria.</p>
<table>
  <tr><th>Operación HTTP</th><th>Función Principal</th><th>Idempotencia</th></tr>
  <tr><td>GET</td><td>Consultar datos</td><td>Sí</td></tr>
  <tr><td>POST</td><td>Crear recurso</td><td>No</td></tr>
</table>
    `.trim()

    const markdown = normalizeDocxMarkdown(convertMammothHtmlToMarkdown(mammothHtml))
    const { parseMarkdown } = await import('./markdownParser')
    const tree = parseMarkdown(markdown, 'Fundamentos de Arquitectura')

    // Root -> Principios REST (L2) -> Sin estado (L3) -> Operación HTTP (L4) -> GET (L5) -> Attributes (L6)
    const root = tree[0]
    expect(root.label).toBe('Fundamentos de Arquitectura')

    const restIsland = root.children[0]
    expect(restIsland.label).toBe('Principios REST')
    expect(restIsland.level).toBe(2)

    const statelessNode = restIsland.children[0]
    expect(statelessNode.label).toContain('Sin estado')
    expect(statelessNode.level).toBe(3)

    const tableContainer = statelessNode.children[0]
    expect(tableContainer.label).toBe('Operación HTTP')
    expect(tableContainer.level).toBe(4)

    const getRow = tableContainer.children[0]
    expect(getRow.label).toBe('GET')
    expect(getRow.level).toBe(5)

    expect(getRow.children.length).toBe(2)
    expect(getRow.children[0].label).toBe('Función Principal: Consultar datos')
    expect(getRow.children[0].level).toBe(6)
    expect(getRow.children[1].label).toBe('Idempotencia: Sí')
    expect(getRow.children[1].level).toBe(6)
  })
})

