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
 * Normalizes raw Markdown emitted by Mammoth:
 * 1. Unescapes overly aggressive backslash escapes (\., \(, \), \-, \+, etc.)
 * 2. Elevates bold numbered paragraphs (e.g., "__1. Título__", "**2.1. Subtítulo**")
 *    into explicit Markdown headings (##, ###) if the author typed bold text instead
 *    of selecting Word's heading style.
 * 3. Cleans up whitespace and empty blocks.
 */
export function normalizeDocxMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown) return ''

  // 1. Remove unnecessary backslash escapes from mammoth
  const unescaped = rawMarkdown.replace(/\\([.\-()+_#*`~[\]])/g, '$1')

  // 2. Identify bold numbered headings or isolated bold titles
  const lines = unescaped.split(/\r?\n/)
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()

    // Check if line is a bold heading: ^(__|\*\*)(.+)(__|\*\*)$
    const boldHeadingMatch = line.match(/^(__|\*\*)([^*_]+)(__|\*\*)$/)
    if (boldHeadingMatch) {
      const inner = boldHeadingMatch[2].trim()
      // Check if it starts with a number like "1." or "2.1." or "3.1.2."
      const numMatch = inner.match(/^(\d+(\.\d+)*)\.?\s+(.+)$/)
      if (numMatch) {
        const prefix = numMatch[1]
        const dotCount = (prefix.match(/\./g) || []).length
        if (dotCount === 0) {
          // Level 2 Heading: ## 1. Title
          line = `## ${inner}`
        } else if (dotCount === 1) {
          // Level 3 Heading: ### 2.1. Subtitle
          line = `### ${inner}`
        } else {
          // Level 4 Heading: #### 2.1.1. Sub-sub
          line = `#### ${inner}`
        }
      }
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

  const result = await mammoth.convertToMarkdown(
    { arrayBuffer },
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
