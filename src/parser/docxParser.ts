import mammoth from 'mammoth'

export interface DocxParseResult {
  markdown: string
  title: string
  messages: string[]
}

/**
 * Custom Word style mappings to ensure standard and Spanish Word headings,
 * titles, and list formats map accurately to Markdown headers and blocks.
 */
const DOCX_STYLE_MAP: string[] = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='Título 1'] => h1:fresh",
  "p[style-name='Título 2'] => h2:fresh",
  "p[style-name='Título 3'] => h3:fresh",
  "p[style-name='Título 4'] => h4:fresh",
  "p[style-name='Titulo 1'] => h1:fresh",
  "p[style-name='Titulo 2'] => h2:fresh",
  "p[style-name='Titulo 3'] => h3:fresh",
  "p[style-name='Titulo 4'] => h4:fresh",
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Título'] => h1:fresh",
  "p[style-name='Titulo'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Subtítulo'] => h2:fresh",
  "p[style-name='Subtitulo'] => h2:fresh"
]

/**
 * Converts any HTML <table> elements emitted by Mammoth into clean Markdown tables
 */
export function convertHtmlTablesToMarkdown(content: string): string {
  if (!content || !content.includes('<table')) return content

  return content.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || []
    if (rowMatches.length === 0) return ''

    const rowsData: string[][] = []
    for (const row of rowMatches) {
      const cellMatches = row.match(/<(?:td|th)[\s\S]*?<\/(?:td|th)>/gi) || []
      const cells = cellMatches.map((cell) =>
        cell
          .replace(/<[^>]+>/g, ' ')
          .replace(/\\([.\-()+_#*`~[\]])/g, '$1')
          .replace(/\r?\n/g, ' ')
          .trim()
      )
      if (cells.some((c) => c.length > 0)) {
        rowsData.push(cells)
      }
    }

    if (rowsData.length === 0) return ''
    const maxCols = Math.max(...rowsData.map((r) => r.length))
    if (maxCols === 0) return ''

    const normalizedRows = rowsData.map((r) => {
      const padded = [...r]
      while (padded.length < maxCols) padded.push('')
      return padded
    })

    const header = normalizedRows[0]
    const separator = Array(maxCols).fill('---')
    const body = normalizedRows.length > 1 ? normalizedRows.slice(1) : []

    const mdLines = [
      `| ${header.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
      ...body.map((r) => `| ${r.join(' | ')} |`)
    ]

    return `\n\n${mdLines.join('\n')}\n\n`
  })
}

/**
 * Normalizes raw Markdown emitted by Mammoth:
 * 1. Converts embedded HTML tables to Markdown tables.
 * 2. Unescapes overly aggressive backslash escapes (\., \(, \), \-, \+, etc.)
 * 3. Identifies informal headings (numbered outlines, Roman numerals, uppercase titles, standalone bold/italics).
 * 4. Normalizes lettered lists (a), b)) and paragraph subtitles (_Título_:).
 */
export function normalizeDocxMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown) return ''

  // 1. Convert HTML tables to Markdown tables
  const tablesConverted = convertHtmlTablesToMarkdown(rawMarkdown)

  // 2. Remove unnecessary backslash escapes from mammoth
  const unescaped = tablesConverted.replace(/\\([.\-()+_#*`~[\]:])/g, '$1')

  // 3. Process line by line
  const lines = unescaped.split(/\r?\n/)
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) {
      processedLines.push('')
      continue
    }

    // Skip lines that are already markdown headings
    if (line.startsWith('#')) {
      processedLines.push(line)
      continue
    }

    // A. Bold or Italic standalone heading: ^(__|\*\*|_|\*)(.+)\1:?$
    const boldMatch = line.match(/^(__|\*\*|_|\*)([^*_]{2,120})\1:?$/)
    const lineToEvaluate = boldMatch ? boldMatch[2].trim() : line

    // B. Formal chapter prefixes: "Capítulo 1", "Tema 2:", "Unidad 3:"
    const chapterMatch = lineToEvaluate.match(/^(Cap[ií]tulo|Tema|M[oó]dulo|Unidad)\s+([0-9IVXLCDM]+)[:\.\s]\s*(.+)$/i)
    if (chapterMatch) {
      processedLines.push(`## ${lineToEvaluate}`)
      continue
    }

    // C. Roman numerals: "I. Introducción", "II. Marco Teórico"
    const romanMatch = lineToEvaluate.match(/^([IVXLCDM]{1,6})\.\s+(.+)$/)
    if (romanMatch) {
      processedLines.push(`## ${lineToEvaluate}`)
      continue
    }

    // D. Numbered hierarchies: "1.", "1.1", "1.1.2", "2.3.4.1"
    const numMatch = lineToEvaluate.match(/^(\d+(\.\d+)*)\.?\s+(.+)$/)
    if (numMatch) {
      const prefix = numMatch[1]
      const dotCount = (prefix.match(/\./g) || []).length
      if (dotCount === 0) {
        processedLines.push(`## ${lineToEvaluate}`)
      } else if (dotCount === 1) {
        processedLines.push(`### ${lineToEvaluate}`)
      } else {
        processedLines.push(`#### ${lineToEvaluate}`)
      }
      continue
    }

    // E. Standalone bold or italic title if isolated on its line
    if (boldMatch && lineToEvaluate.length <= 80 && !lineToEvaluate.endsWith('.')) {
      processedLines.push(`### ${lineToEvaluate}`)
      continue
    }

    // F. Standalone all-caps line (e.g. "INTRODUCCIÓN", "MARCO CONCEPTUAL", "CONCLUSIÓN")
    if (
      line.length >= 4 &&
      line.length <= 60 &&
      line === line.toUpperCase() &&
      /^[A-ZÁÉÍÓÚÑ0-9\s:/-]+$/.test(line) &&
      !line.endsWith('.') &&
      !line.includes('|')
    ) {
      processedLines.push(`## ${line}`)
      continue
    }

    // G. Lettered sub-bullets: "a) ...", "b) ..." -> "- **a)** ..."
    const letterMatch = line.match(/^([a-z]\))\s+(.+)$/i)
    if (letterMatch) {
      processedLines.push(`- **${letterMatch[1]}** ${letterMatch[2]}`)
      continue
    }

    // H. Paragraph italic titles: "_Nota_: detalle" -> "**Nota**: detalle"
    const italicLeadMatch = line.match(/^(_|\*)([^\n_*]{2,80})\1[:\-—]\s*(.*)$/)
    if (italicLeadMatch) {
      processedLines.push(`**${italicLeadMatch[2]}**: ${italicLeadMatch[3]}`)
      continue
    }

    processedLines.push(line)
  }

  return processedLines.join('\n')
}

/**
 * Parses a .docx File, Blob, or ArrayBuffer into structured, normalized Markdown.
 *
 * @param fileOrBuffer The Word .docx file or raw ArrayBuffer
 * @param customTitle Optional custom document title (defaults to file name or extracted heading)
 * @returns Object with generated markdown string, resolved title, and warning messages
 */
export async function parseDocx(
  fileOrBuffer: File | Blob | ArrayBuffer,
  customTitle?: string
): Promise<DocxParseResult> {
  let arrayBuffer: ArrayBuffer
  let fallbackTitle = customTitle || 'Documento Word'

  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer
  } else if (fileOrBuffer instanceof Blob) {
    if ('name' in fileOrBuffer && typeof (fileOrBuffer as File).name === 'string') {
      const cleanFileName = (fileOrBuffer as File).name.replace(/\.[^/.]+$/, '').trim()
      if (cleanFileName) {
        fallbackTitle = cleanFileName
      }
    }
    arrayBuffer = await fileOrBuffer.arrayBuffer()
  } else {
    throw new Error('Formato de entrada no soportado para parseo DOCX')
  }

  const mammothOptions: any = { arrayBuffer }
  const nodeBuffer = (globalThis as any).Buffer
  if (nodeBuffer && typeof nodeBuffer.from === 'function') {
    mammothOptions.buffer = nodeBuffer.from(arrayBuffer)
  }

  const result = await mammoth.convertToMarkdown(
    mammothOptions,
    {
      styleMap: DOCX_STYLE_MAP,
      includeDefaultStyleMap: true
    }
  )

  const messages = result.messages ? result.messages.map((m) => m.message) : []
  const normalizedMarkdown = normalizeDocxMarkdown(result.value)

  // Try to extract document title if not explicitly set
  let resolvedTitle = fallbackTitle
  if (!customTitle) {
    const firstH1Match = normalizedMarkdown.match(/^#\s+(.+)$/m)
    if (firstH1Match && firstH1Match[1].trim()) {
      resolvedTitle = firstH1Match[1].trim()
    }
  }

  return {
    markdown: normalizedMarkdown,
    title: resolvedTitle,
    messages
  }
}
