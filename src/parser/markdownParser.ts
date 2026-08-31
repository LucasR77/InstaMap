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

/**
 * Extracts paragraph titles and bullet concepts from a section's text as leaf sub-nodes (TÍTULOS DE PÁRRAFO)
 */
function extractParagraphAndBulletSubnodes(
  parentNode: ParsedNode,
  lines: string[],
  baseIndex: number
): ParsedNode[] {
  const children: ParsedNode[] = []
  let childCounter = 0

  // Regexes for bullets and leading key-value paragraphs:
  // 1. Nodos Autónomos (Detalle): Explicación...
  // - **Concepto**: Explicación...
  // Planteo del Problema: Explicación...
  // Definición Canónica: Explicación...
  const bulletRegex = /^(\s*[-*+]|\s*\d+\.)\s+(.+)$/
  const boldStartRegex = /^\*\*([^*]+)\*\*[:\-—]?(.*)$/
  const colonLeadRegex = /^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ0-9\s()/\-–—',.]{2,45}):\s+(.+)$/

  // Group text into distinct blocks/paragraphs
  const blocks: string[] = []
  let currentBlock: string[] = []

  for (const line of lines) {
    if (!line.trim()) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n').trim())
        currentBlock = []
      }
    } else {
      currentBlock.push(line)
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n').trim())
  }

  for (const block of blocks) {
    const blockLines = block.split('\n')
    for (const line of blockLines) {
      const trimmedLine = line.trim()
      const bulletMatch = trimmedLine.match(bulletRegex)
      const boldMatch = trimmedLine.match(boldStartRegex)
      const colonMatch = trimmedLine.match(colonLeadRegex)

      if (bulletMatch) {
        const fullText = bulletMatch[2].trim()
        let title = fullText
        let body = fullText

        const innerBoldMatch = fullText.match(boldStartRegex)
        if (innerBoldMatch) {
          title = innerBoldMatch[1].trim()
          body = innerBoldMatch[2].trim() ? innerBoldMatch[2].trim() : fullText
        } else {
          const colonIndex = fullText.indexOf(':')
          if (colonIndex > 0 && colonIndex < 55) {
            title = fullText.slice(0, colonIndex).trim()
            body = fullText.slice(colonIndex + 1).trim()
          } else if (fullText.length > 55) {
            title = fullText.slice(0, 50) + '...'
          }
        }

        title = title.replace(/^[*_~`]+|[*_~`]+$/g, '').trim()

        if (title.length > 0) {
          const stats = calculateReadingStats(body || fullText)
          children.push({
            id: generateNodeId(`${parentNode.id}-p-${childCounter++}`, baseIndex + childCounter),
            label: title,
            level: Math.min(6, parentNode.level + 1),
            content: `### ${title}\n\n${fullText}`,
            parentId: parentNode.id,
            children: [],
            wordCount: stats.wordCount,
            readingTimeMinutes: stats.readingTimeMinutes,
            islandIndex: parentNode.islandIndex,
            isLeaf: true
          })
        }
      } else if (boldMatch) {
        const title = boldMatch[1].trim().replace(/^[*_~`]+|[*_~`]+$/g, '')
        const body = block.trim()
        if (title.length > 0) {
          const stats = calculateReadingStats(body)
          children.push({
            id: generateNodeId(`${parentNode.id}-p-${childCounter++}`, baseIndex + childCounter),
            label: title,
            level: Math.min(6, parentNode.level + 1),
            content: `### ${title}\n\n${body}`,
            parentId: parentNode.id,
            children: [],
            wordCount: stats.wordCount,
            readingTimeMinutes: stats.readingTimeMinutes,
            islandIndex: parentNode.islandIndex,
            isLeaf: true
          })
        }
      } else if (colonMatch) {
        // e.g. "Planteo del Problema: Una confusión..." or "Definición Canónica: Una red..."
        const title = colonMatch[1].trim()
        const body = block.trim()
        if (title.length > 2) {
          const stats = calculateReadingStats(body)
          children.push({
            id: generateNodeId(`${parentNode.id}-p-${childCounter++}`, baseIndex + childCounter),
            label: title,
            level: Math.min(6, parentNode.level + 1),
            content: `### ${title}\n\n${body}`,
            parentId: parentNode.id,
            children: [],
            wordCount: stats.wordCount,
            readingTimeMinutes: stats.readingTimeMinutes,
            islandIndex: parentNode.islandIndex,
            isLeaf: true
          })
        }
      }
    }
  }

  return children
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
    const hashMatch = line.match(hashHeadingRegex)
    const numberedMatch = !hashMatch && line.match(numberedSectionRegex)

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
      // Check depth by number of dots in prefix:
      // "3." -> 0 dots after number -> Level 2 (TÍTULO)
      // "3.1." or "3.1" -> 1 dot -> Level 3 (SUBTÍTULO)
      // "3.1.1" -> 2 dots -> Level 4
      const prefix = numberedMatch[1]
      const dotCount = (prefix.match(/\./g) || []).length
      const level = dotCount === 0 ? 2 : dotCount === 1 ? 3 : 4
      const cleanLabel = line.trim().replace(/^[*_~`]+|[*_~`]+$/g, '')

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
      const paragraphNodes = extractParagraphAndBulletSubnodes(node, sec.lines.slice(1), i * 40)
      node.children.push(...paragraphNodes)
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
