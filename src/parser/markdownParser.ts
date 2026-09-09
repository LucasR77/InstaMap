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

/**
 * Strips leading/trailing markdown bold, italic, strikethrough, backtick decorations
 */
export function stripMarkdownDecorations(text: string): string {
  return text.replace(/^[*_~`]+|[*_~`]+$/g, '').trim()
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

interface ContentBlock {
  type: 'lines' | 'table'
  lines: string[]
}

function partitionIntoBlocks(lines: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let currentLines: string[] = []
  let currentTable: string[] = []

  const isTableLine = (l: string) => {
    const t = l.trim()
    return t.startsWith('|') && t.endsWith('|')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isTableLine(line)) {
      if (currentLines.length > 0) {
        blocks.push({ type: 'lines', lines: currentLines })
        currentLines = []
      }
      currentTable.push(line)
    } else {
      if (currentTable.length > 0) {
        if (currentTable.length >= 2) {
          blocks.push({ type: 'table', lines: currentTable })
        } else {
          currentLines.push(...currentTable)
        }
        currentTable = []
      }
      currentLines.push(line)
    }
  }

  if (currentTable.length >= 2) {
    blocks.push({ type: 'table', lines: currentTable })
  } else if (currentTable.length > 0) {
    currentLines.push(...currentTable)
  }

  if (currentLines.length > 0) {
    blocks.push({ type: 'lines', lines: currentLines })
  }

  return blocks
}

function propagateIslandAndLevels(node: ParsedNode, islandIndex: number, currentLevel: number) {
  node.islandIndex = islandIndex
  node.level = Math.min(6, currentLevel)
  for (const child of node.children) {
    propagateIslandAndLevels(child, islandIndex, currentLevel + 1)
  }
}

function extractBoldDefinition(trimmed: string): { title: string; body: string } | null {
  const boldRegex = /^(\s*[-*+]?\s*)?(__|\*\*|_|\*)([^*_]{2,120}?)(?:\s*:\s*)?\2(?:\s*[:\-—]\s*|\s*)(.+)$/
  const match = trimmed.match(boldRegex)
  if (match) {
    const rawTitle = match[3].trim().replace(/^[:\-—\s]+|[:\-—\s]+$/g, '')
    const body = match[4].trim()
    if (rawTitle && body) {
      return { title: rawTitle, body }
    }
  }
  return null
}

function extractStandaloneBold(trimmed: string): string | null {
  const boldRegex = /^(\s*[-*+]?\s*)?(__|\*\*|_|\*)([^*_]{2,120}?)(?:\s*:\s*)?\2:?\s*$/
  const match = trimmed.match(boldRegex)
  if (match) {
    const rawTitle = match[3].trim().replace(/^[:\-—\s]+|[:\-—\s]+$/g, '')
    if (rawTitle) return rawTitle
  }
  return null
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
  const introLines: string[] = []
  let lastConceptNode: ParsedNode | null = null
  let isFirstTextBlock = true

  const bulletRegex = /^(\s*[-*+]|\s*\d+\.)\s+(.+)$/
  const colonLeadRegex = /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ0-9\s()/\-–—',.]{2,50}):\s+(.+)$/

  const blocks = partitionIntoBlocks(lines)

  for (const block of blocks) {
    if (block.type === 'lines') {
      const items: ParsedItem[] = []
      let currentItem: ParsedItem | null = null

      for (const line of block.lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        const boldDefinition = extractBoldDefinition(trimmed)
        const standaloneBoldTitle = !boldDefinition && extractStandaloneBold(trimmed)
        const colonMatch = !boldDefinition && !standaloneBoldTitle && trimmed.match(colonLeadRegex)
        const bulletMatch = !boldDefinition && !standaloneBoldTitle && !colonMatch && trimmed.match(bulletRegex)

        if (boldDefinition) {
          if (currentItem) items.push(currentItem)
          currentItem = {
            type: 'bold_with_body',
            title: boldDefinition.title.replace(/^[*_~`]+|[*_~`]+$/g, '').trim(),
            rawLines: [boldDefinition.body]
          }
        } else if (standaloneBoldTitle) {
          if (currentItem) items.push(currentItem)
          currentItem = {
            type: 'standalone_bold',
            title: standaloneBoldTitle.replace(/^[*_~`]+|[*_~`]+$/g, '').trim(),
            rawLines: []
          }
        } else if (colonMatch) {
          if (currentItem) items.push(currentItem)
          currentItem = {
            type: 'colon_lead',
            title: colonMatch[1].trim(),
            rawLines: [colonMatch[2].trim()]
          }
        } else if (bulletMatch) {
          if (currentItem) items.push(currentItem)
          const fullText = bulletMatch[2].trim()
          let title = fullText

          const innerBold = extractBoldDefinition(fullText)
          if (innerBold) {
            title = innerBold.title
            currentItem = {
              type: 'bullet',
              title: title.replace(/^[*_~`]+|[*_~`]+$/g, '').trim(),
              rawLines: innerBold.body ? [innerBold.body] : []
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

      let itemStartIndex = 0
      if (isFirstTextBlock) {
        while (itemStartIndex < items.length && items[itemStartIndex].type === 'intro') {
          introLines.push(...items[itemStartIndex].rawLines)
          itemStartIndex++
        }
        isFirstTextBlock = false
      }

      // Check for empty standalone_bold table headers if any
      let emptyBoldCount = 0
      while (
        itemStartIndex + emptyBoldCount < items.length &&
        items[itemStartIndex + emptyBoldCount].type === 'standalone_bold' &&
        items[itemStartIndex + emptyBoldCount].rawLines.length === 0
      ) {
        emptyBoldCount++
      }

      let tableHeaders: string[] = []
      if (emptyBoldCount >= 2 && emptyBoldCount <= 5) {
        tableHeaders = items
          .slice(itemStartIndex, itemStartIndex + emptyBoldCount)
          .map((it) => it.title)
        itemStartIndex += emptyBoldCount
      }

      for (let i = itemStartIndex; i < items.length; i++) {
        const item = items[i]
        if (item.type === 'intro' || !item.title) {
          if (item.rawLines.length > 0) {
            if (lastConceptNode) {
              lastConceptNode.content += '\n\n' + item.rawLines.join('\n\n')
              const stats = calculateReadingStats(lastConceptNode.content)
              lastConceptNode.wordCount = stats.wordCount
              lastConceptNode.readingTimeMinutes = stats.readingTimeMinutes
            } else {
              introLines.push(...item.rawLines)
            }
          }
          continue
        }

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

        const conceptNode: ParsedNode = {
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
        }

        children.push(conceptNode)
        lastConceptNode = conceptNode
      }
    } else if (block.type === 'table') {
      const rows = block.lines.map((row) =>
        row
          .split('|')
          .map((cell) => cell.trim())
          .filter((_c, idx, arr) => idx > 0 && idx < arr.length - 1)
      )

      const headers = rows[0] || []
      const dataRows = rows.slice(1).filter((r) => !r.every((c) => /^[-:\s]+$/.test(c)))

      if (dataRows.length > 0) {
        const tableParent = lastConceptNode || parentNode
        if (lastConceptNode) {
          lastConceptNode.isLeaf = false
        }

        const firstColHeader = headers[0] || 'Tabla'
        const containerLabel = stripMarkdownDecorations(firstColHeader) || 'Tabla'
        const containerContent = `### ${containerLabel}\n\nTabla comparativa de ${containerLabel}.`
        const containerStats = calculateReadingStats(containerContent)

        const containerNode: ParsedNode = {
          id: generateNodeId(`${tableParent.id}-tbl-${childCounter++}`, baseIndex + childCounter),
          label: containerLabel,
          level: Math.min(6, tableParent.level + 1),
          content: containerContent,
          parentId: tableParent.id,
          children: [],
          wordCount: containerStats.wordCount,
          readingTimeMinutes: containerStats.readingTimeMinutes,
          islandIndex: tableParent.islandIndex,
          isLeaf: false
        }

        for (const row of dataRows) {
          if (row.length === 0) continue
          const rawLabel = row[0] || ''
          const cleanLabel = stripMarkdownDecorations(rawLabel)
          if (!cleanLabel) continue

          const detailLines: string[] = []
          const attrNodes: ParsedNode[] = []

          for (let c = 1; c < row.length; c++) {
            const colHeader = stripMarkdownDecorations(headers[c] || `Columna ${c + 1}`)
            const colVal = (row[c] || '').trim()
            if (colVal) {
              detailLines.push(`- **${colHeader}:** ${colVal}`)
              const attrLabel = `${colHeader}: ${colVal}`
              const attrContent = `### ${colHeader}\n\n**${colHeader}:** ${colVal}`
              const attrStats = calculateReadingStats(attrContent)

              attrNodes.push({
                id: generateNodeId(`${cleanLabel}-c-${childCounter++}`, baseIndex + childCounter),
                label: attrLabel,
                level: Math.min(6, containerNode.level + 2),
                content: attrContent,
                parentId: '', // set after rowNode is instantiated
                children: [],
                wordCount: attrStats.wordCount,
                readingTimeMinutes: attrStats.readingTimeMinutes,
                islandIndex: containerNode.islandIndex,
                isLeaf: true
              })
            }
          }

          const rowContent = detailLines.length > 0 ? `### ${cleanLabel}\n\n${detailLines.join('\n')}` : `### ${cleanLabel}`
          const rowStats = calculateReadingStats(rowContent)

          const rowNode: ParsedNode = {
            id: generateNodeId(`${cleanLabel}-r-${childCounter++}`, baseIndex + childCounter),
            label: cleanLabel,
            level: Math.min(6, containerNode.level + 1),
            content: rowContent,
            parentId: containerNode.id,
            children: [],
            wordCount: rowStats.wordCount,
            readingTimeMinutes: rowStats.readingTimeMinutes,
            islandIndex: containerNode.islandIndex,
            isLeaf: attrNodes.length === 0
          }

          for (const attrNode of attrNodes) {
            attrNode.parentId = rowNode.id
            rowNode.children.push(attrNode)
          }

          containerNode.children.push(rowNode)
        }

        if (tableParent === parentNode) {
          children.push(containerNode)
        } else {
          tableParent.children.push(containerNode)
        }

        lastConceptNode = null
      }
    }
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
      } else if (introLines.some((l) => l.trim().length > 0)) {
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
      } else if (introLines.some((l) => l.trim().length > 0)) {
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
  } else if (introLines.some((l) => l.trim().length > 0)) {
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
    const firstLineIsHeading = /^#{1,6}\s+/.test(h1Section.lines[0]?.trim() || '')
    const bodyLines = firstLineIsHeading ? h1Section.lines.slice(1) : h1Section.lines
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

    // If root section has definition paragraphs or bullet items, extract them as children
    if (bodyLines.length > 0) {
      const { children: paragraphNodes, introLines: parentIntroLines } = extractParagraphAndBulletSubnodes(
        rootNode,
        bodyLines,
        10
      )
      if (paragraphNodes.length > 0) {
        paragraphNodes.forEach((child) => {
          propagateIslandAndLevels(child, islandCounter++, 2)
        })
        rootNode.children.push(...paragraphNodes)
        const parentIntro = (firstLineIsHeading ? [h1Section.lines[0], ...parentIntroLines] : parentIntroLines)
          .join('\n')
          .trim()
        rootNode.content = parentIntro || rootNode.content
        const introStats = calculateReadingStats(rootNode.content)
        rootNode.wordCount = introStats.wordCount
        rootNode.readingTimeMinutes = introStats.readingTimeMinutes
      }
    }
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

    // Extract bullet items, definitions, or tables directly under this section
    if (sec.lines.length > 1) {
      const { children: paragraphNodes, introLines } = extractParagraphAndBulletSubnodes(
        node,
        sec.lines.slice(1),
        i * 40
      )
      if (paragraphNodes.length > 0) {
        node.children.push(...paragraphNodes)
        node.isLeaf = false
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
  const headingRegex = /^#{1,6}\s+([^\r\n]+)(?:\r?\n)*/
  const headingMatch = cleaned.match(headingRegex)
  if (headingMatch) {
    const headingText = headingMatch[1].trim().replace(/^[*_~`]+|[*_~`]+$/g, '')
    const cleanLabel = node.label.trim().replace(/^[*_~`]+|[*_~`]+$/g, '')
    if (
      headingText.toLowerCase() === cleanLabel.toLowerCase() ||
      headingText.length === 0 ||
      cleanLabel.toLowerCase().startsWith(headingText.toLowerCase())
    ) {
      cleaned = cleaned.slice(headingMatch[0].length).trim()
    }
  }

  // Strip leading bullet prefix if present: '- **Label**: '
  const escapedLabel = node.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const bulletPrefix = new RegExp(
    `^[-*+]\\s+(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?[:\\-—]?\\s*`,
    'i'
  )
  cleaned = cleaned.replace(bulletPrefix, '').trim()

  return cleaned
}

