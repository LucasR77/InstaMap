import type { ParsedNode } from '../types/graph'

/**
 * Calculates word count and estimated reading time
 */
export function calculateReadingStats(text: string): { wordCount: number; readingTimeMinutes: number } {
  const clean = text.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_`~>[\]()]/g, ' ')
  const words = clean.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180))
  return { wordCount, readingTimeMinutes }
}

/**
 * Generates a clean URL-safe and collision-free ID
 */
function generateNodeId(label: string, index: number): string {
  const cleanLabel = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)

  return `node-${index}-${cleanLabel || 'item'}`
}

interface RawSection {
  level: number
  label: string
  lines: string[]
}

interface ParsedItem {
  type: 'bullet' | 'standalone_bold' | 'bold_with_body' | 'colon_lead' | 'intro'
  title: string
  rawLines: string[]
}

/**
 * Extracts subnodes (table rows, bold criteria, bullet points, colon paragraphs)
 * from a section's lines without over-fragmenting or generating noise nodes.
 */
function extractParagraphAndBulletSubnodes(
  parentNode: ParsedNode,
  lines: string[],
  baseIndex: number
): { children: ParsedNode[]; introLines: string[] } {
  const children: ParsedNode[] = []
  let childCounter = 0

  // 1. Check for standard Markdown Table: lines with '|'
  const tableLines = lines.filter((l) => l.trim().startsWith('|') && l.trim().endsWith('|'))
  if (tableLines.length >= 2) {
    const rows = tableLines.map((row) =>
      row
        .split('|')
        .map((cell) => cell.trim())
        .filter((_c, idx, arr) => idx > 0 && idx < arr.length - 1)
    )

    const headers = rows[0] || []
    const dataRows = rows.slice(1).filter((r) => !r.every((c) => /^[-:\s]+$/.test(c)))

    if (dataRows.length > 0) {
      for (const row of dataRows) {
        if (row.length === 0) continue
        const rawLabel = row[0] || ''
        const cleanLabel = rawLabel.replace(/^[*_~`]+|[*_~`]+$/g, '').trim()
        if (!cleanLabel) continue

        const detailLines: string[] = []
        for (let c = 1; c < row.length; c++) {
          const colHeader = headers[c] || `Columna ${c + 1}`
          const colVal = row[c]
          if (colVal) {
            detailLines.push(`- **${colHeader}:** ${colVal}`)
          }
        }

        const bodyContent = detailLines.length > 0 ? detailLines.join('\n') : rawLabel
        const fullContent = `### ${cleanLabel}\n\n${bodyContent}`
        const stats = calculateReadingStats(fullContent)

        children.push({
          id: generateNodeId(`${parentNode.id}-p-${childCounter++}`, baseIndex + childCounter),
          label: cleanLabel,
          level: Math.min(6, parentNode.level + 1),
          content: fullContent,
          parentId: parentNode.id,
          children: [],
          wordCount: stats.wordCount,
          readingTimeMinutes: stats.readingTimeMinutes,
          islandIndex: parentNode.islandIndex,
          isLeaf: true
        })
      }
      const nonTableLines = lines.filter((l) => !l.trim().startsWith('|') || !l.trim().endsWith('|'))
      return { children, introLines: nonTableLines }
    }
  }

  // 2. Parse line by line to build structured items (handles multiline bullets, adjacent definitions, etc.)
  const bulletRegex = /^(\s*[-*+]|\s*\d+\.)\s+(.+)$/
  const standaloneBoldRegex = /^(__|\*\*|_|\*)([^*_]{2,120})\1:?\s*$/
  const boldWithBodyRegex = /^(__|\*\*|_|\*)([^*_]{2,120})\1[:\-—]\s*(.+)$/
  const colonLeadRegex = /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ0-9\s()/\-–—',.]{2,50}):\s+(.+)$/

  const items: ParsedItem[] = []
  let currentItem: ParsedItem | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const bulletMatch = trimmed.match(bulletRegex)
    const standaloneBoldMatch = trimmed.match(standaloneBoldRegex)
    const boldWithBodyMatch = trimmed.match(boldWithBodyRegex)
    const colonMatch = trimmed.match(colonLeadRegex)

    if (bulletMatch) {
      if (currentItem) items.push(currentItem)
      const fullText = bulletMatch[2].trim()
      let title = fullText

      const innerBold = fullText.match(/^(__|\*\*|_|\*)([^*_]+)\1:?\s*(.*)$/)
      if (innerBold) {
        title = innerBold[2].trim()
        const remainder = (innerBold[3] || '').trim()
        currentItem = {
          type: 'bullet',
          title: title.replace(/^[*_~`]+|[*_~`]+$/g, '').trim(),
          rawLines: remainder ? [remainder] : []
        }
      } else {
        const colonIndex = fullText.indexOf(':')
        if (colonIndex > 0 && colonIndex < 55) {
          title = fullText.slice(0, colonIndex).trim()
          const remainder = fullText.slice(colonIndex + 1).trim()
          currentItem = {
            type: 'bullet',
            title: title.replace(/^[*_~`]+|[*_~`]+$/g, '').trim(),
            rawLines: remainder ? [remainder] : []
          }
        } else {
          if (fullText.length > 55) {
            title = fullText.slice(0, 50) + '...'
          }
          currentItem = {
            type: 'bullet',
            title: title.replace(/^[*_~`]+|[*_~`]+$/g, '').trim(),
            rawLines: [fullText]
          }
        }
      }
    } else if (standaloneBoldMatch) {
      if (currentItem) items.push(currentItem)
      currentItem = {
        type: 'standalone_bold',
        title: standaloneBoldMatch[2].trim().replace(/^[*_~`]+|[*_~`]+$/g, ''),
        rawLines: []
      }
    } else if (boldWithBodyMatch) {
      if (currentItem) items.push(currentItem)
      currentItem = {
        type: 'bold_with_body',
        title: boldWithBodyMatch[2].trim().replace(/^[*_~`]+|[*_~`]+$/g, ''),
        rawLines: [(boldWithBodyMatch[3] || '').trim()]
      }
    } else if (colonMatch) {
      if (currentItem) items.push(currentItem)
      currentItem = {
        type: 'colon_lead',
        title: colonMatch[1].trim(),
        rawLines: [trimmed]
      }
    } else {
      // Plain text line
      if (currentItem) {
        currentItem.rawLines.push(trimmed)
      } else {
        currentItem = {
          type: 'intro',
          title: '',
          rawLines: [trimmed]
        }
      }
    }
  }
  if (currentItem) items.push(currentItem)

  // 3. Detect converted table column headers:
  // Identified by consecutive standalone_bold items with 0 rawLines
  let tableHeaders: string[] = []
  let itemStartIndex = 0

  while (itemStartIndex < items.length && items[itemStartIndex].type === 'intro') {
    itemStartIndex++
  }

  let emptyBoldCount = 0
  while (
    itemStartIndex + emptyBoldCount < items.length &&
    items[itemStartIndex + emptyBoldCount].type === 'standalone_bold' &&
    items[itemStartIndex + emptyBoldCount].rawLines.length === 0
  ) {
    emptyBoldCount++
  }

  if (emptyBoldCount >= 2 && emptyBoldCount <= 5) {
    tableHeaders = items
      .slice(itemStartIndex, itemStartIndex + emptyBoldCount)
      .map((it) => it.title)
    itemStartIndex += emptyBoldCount
  }

  // 4. Create child nodes
  for (let i = itemStartIndex; i < items.length; i++) {
    const item = items[i]
    if (item.type === 'intro' || !item.title) continue

    let formattedBody = ''

    if (item.type === 'standalone_bold' && tableHeaders.length >= 2 && item.rawLines.length > 0) {
      const colNames =
        tableHeaders.length === item.rawLines.length + 1
          ? tableHeaders.slice(1)
          : tableHeaders

      formattedBody = item.rawLines
        .map((text, idx) => {
          const colName = colNames[idx] || `Detalle ${idx + 1}`
          return `- **${colName}:** ${text}`
        })
        .join('\n\n')
    } else if (item.rawLines.length > 0) {
      formattedBody = item.rawLines.join('\n\n')
    }

    const fullContent = formattedBody ? `### ${item.title}\n\n${formattedBody}` : `### ${item.title}`
    const stats = calculateReadingStats(fullContent)

    children.push({
      id: generateNodeId(`${parentNode.id}-p-${childCounter++}`, baseIndex + childCounter),
      label: item.title,
      level: Math.min(6, parentNode.level + 1),
      content: fullContent,
      parentId: parentNode.id,
      children: [],
      wordCount: stats.wordCount,
      readingTimeMinutes: stats.readingTimeMinutes,
      islandIndex: parentNode.islandIndex,
      isLeaf: true
    })
  }

  const introLines: string[] = []
  for (let i = 0; i < itemStartIndex; i++) {
    introLines.push(...items[i].rawLines)
  }

  return { children, introLines }
}

/**
 * Parses a raw Markdown string into an array of structured ParsedNodes.
 * Accurately recognizes:
 * - # H1 / Document Title -> Level 1 Root
 * - ## or "3. Título" -> Level 2 TÍTULO (Island Category)
 * - ### or "3.1. Subtítulo" -> Level 3 SUBTÍTULO (White card with accent border)
 * - Bullet / Bold / Colon Paragraphs -> Level 4 TÍTULO DE PÁRRAFO (Leaf)
 */
export function parseMarkdown(
  markdown: string,
  defaultTitle = 'Fundamentos de Redes de Computadoras'
): ParsedNode[] {
  if (!markdown || !markdown.trim()) {
    return [
      {
        id: 'node-root',
        label: defaultTitle,
        level: 1,
        content: '# ' + defaultTitle + '\n\nDocumento vacío. Carga o escribe notas Markdown para comenzar.',
        parentId: null,
        children: [],
        wordCount: 12,
        readingTimeMinutes: 1,
        islandIndex: 0
      }
    ]
  }

  const lines = markdown.split(/\r?\n/)
  const sections: RawSection[] = []
  let currentSection: RawSection | null = null
  let introLines: string[] = []

  // Regexes for headings:
  // Standard markdown: # H1, ## H2, ### H3
  const hashHeadingRegex = /^(#{1,6})\s+(.+)$/
  // Numbered section headings: "3. Título" (level 2) or "3.1. Subtítulo" (level 3) or "3.1.1. Sub-subtítulo" (level 4)
  const numberedSectionRegex = /^(\d+(\.\d+)*)\.?\s+([A-ZÁÉÍÓÚÑ].*)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    const hashMatch = trimmedLine.match(hashHeadingRegex)
    const cleanNumbered = trimmedLine.replace(/^[*_~`]+|[*_~`]+$/g, '').trim()
    const numberedMatch = !hashMatch && cleanNumbered.match(numberedSectionRegex)

    if (hashMatch) {
      if (currentSection) {
        sections.push(currentSection)
      } else if (introLines.length > 0) {
        sections.push({ level: 1, label: defaultTitle, lines: introLines })
        introLines = []
      }

      const level = hashMatch[1].length
      const cleanLabel = hashMatch[2].trim().replace(/^[*_~`]+|[*_~`]+$/g, '')

      currentSection = {
        level,
        label: cleanLabel,
        lines: [line]
      }
    } else if (numberedMatch) {
      const prefix = numberedMatch[1]
      const dotCount = (prefix.match(/\./g) || []).length
      const level = dotCount === 0 ? 2 : dotCount === 1 ? 3 : 4
      const cleanLabel = cleanNumbered.replace(/^[*_~`]+|[*_~`]+$/g, '')

      if (currentSection) {
        sections.push(currentSection)
      } else if (introLines.length > 0) {
        sections.push({ level: 1, label: defaultTitle, lines: introLines })
        introLines = []
      }

      currentSection = {
        level,
        label: cleanLabel,
        lines: [line]
      }
    } else {
      if (currentSection) {
        currentSection.lines.push(line)
      } else {
        introLines.push(line)
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  } else if (introLines.length > 0) {
    sections.push({ level: 1, label: defaultTitle, lines: introLines })
  }

  if (sections.length === 0) {
    return [
      {
        id: 'node-root',
        label: defaultTitle,
        level: 1,
        content: markdown,
        parentId: null,
        children: [],
        wordCount: calculateReadingStats(markdown).wordCount,
        readingTimeMinutes: 1,
        islandIndex: 0
      }
    ]
  }

  const h1Count = sections.filter((s) => s.level === 1).length
  let rootNode: ParsedNode

  let processedSections = sections
  let islandCounter = 0

  if (h1Count === 1 && sections[0].level === 1) {
    const h1Section = sections[0]
    const content = h1Section.lines.join('\n').trim()
    const stats = calculateReadingStats(content)

    rootNode = {
      id: generateNodeId(h1Section.label, 0),
      label: h1Section.label,
      level: 1,
      content,
      parentId: null,
      children: [],
      wordCount: stats.wordCount,
      readingTimeMinutes: stats.readingTimeMinutes,
      islandIndex: 0
    }
    processedSections = sections.slice(1)
  } else {
    const derivedTitle = defaultTitle.replace(/\.(md|txt)$/i, '')
    rootNode = {
      id: 'node-0-root',
      label: derivedTitle || 'Mapa de Estudio',
      level: 1,
      content: `# ${derivedTitle || 'Mapa de Estudio'}\n\nEstructura conceptual sintetizada del documento.`,
      parentId: null,
      children: [],
      wordCount: 6,
      readingTimeMinutes: 1,
      islandIndex: 0
    }
  }

  const stack: { level: number; node: ParsedNode }[] = [{ level: 1, node: rootNode }]

  for (let i = 0; i < processedSections.length; i++) {
    const sec = processedSections[i]
    const content = sec.lines.join('\n').trim()
    const stats = calculateReadingStats(content)

    while (stack.length > 1 && stack[stack.length - 1].level >= sec.level) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].node
    let nodeIslandIndex = parent.islandIndex

    if (parent.level === 1 || sec.level === 2) {
      nodeIslandIndex = islandCounter++
    }

    const node: ParsedNode = {
      id: generateNodeId(sec.label, i + 10),
      label: sec.label,
      level: sec.level,
      content,
      parentId: parent.id,
      children: [],
      wordCount: stats.wordCount,
      readingTimeMinutes: stats.readingTimeMinutes,
      islandIndex: nodeIslandIndex,
      isLeaf: sec.level >= 4
    }

    // Extract bullet items or paragraph titles under this section
    const hasNextSubheading =
      i + 1 < processedSections.length && processedSections[i + 1].level > sec.level

    if (!hasNextSubheading && sec.lines.length > 1) {
      const { children: paragraphNodes, introLines } = extractParagraphAndBulletSubnodes(
        node,
        sec.lines.slice(1),
        i * 40
      )
      if (paragraphNodes.length > 0) {
        node.children.push(...paragraphNodes)
        const parentIntro = [sec.lines[0], ...introLines].join('\n').trim()
        node.content = parentIntro
        const introStats = calculateReadingStats(parentIntro)
        node.wordCount = introStats.wordCount
        node.readingTimeMinutes = introStats.readingTimeMinutes
      }
    }

    parent.children.push(node)
    stack.push({ level: sec.level, node })
  }

  return [rootNode]
}

/**
 * Flattens a ParsedNode hierarchy into an ID-indexed Map
 */
export function flattenNodeTree(nodes: ParsedNode[]): Map<string, ParsedNode> {
  const map = new Map<string, ParsedNode>()

  function traverse(node: ParsedNode) {
    map.set(node.id, node)
    for (const child of node.children) {
      traverse(child)
    }
  }

  for (const root of nodes) {
    traverse(root)
  }

  return map
}

/**
 * Returns array of all nodes in tree
 */
export function getAllNodesList(nodes: ParsedNode[]): ParsedNode[] {
  const list: ParsedNode[] = []
  function traverse(node: ParsedNode) {
    list.push(node)
    for (const child of node.children) {
      traverse(child)
    }
  }
  for (const root of nodes) {
    traverse(root)
  }
  return list
}

/**
 * Returns the clean display text for a node (stripping redundant heading label prefix if present)
 */
export function getNodeDisplayContent(node: ParsedNode): string {
  if (!node.content) return ''
  let cleaned = node.content.trim()

  // If starts with heading matching the label: '# Label' or '### Label'
  const headingRegex = /^#{1,6}\s+[^\r\n]+(?:\r?\n)*/
  const headingMatch = cleaned.match(headingRegex)
  if (headingMatch) {
    const afterHeading = cleaned.slice(headingMatch[0].length).trim()
    if (afterHeading) {
      cleaned = afterHeading
    }
  }

  // Strip leading bullet prefix if present: '- **Label**: '
  const escapedLabel = node.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const bulletPrefix = new RegExp(
    `^[-*+]\\s+(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?[:\\-—]?\\s*`,
    'i'
  )
  cleaned = cleaned.replace(bulletPrefix, '').trim()

  return cleaned || node.content
}
