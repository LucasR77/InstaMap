import { toPng, toSvg } from 'html-to-image'

/**
 * Downloads a file or Blob to the user's computer
 */
export function downloadFile(content: string | Blob, filename: string, mimeType = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ExportImageOptions {
  fileName?: string
  format?: 'png' | 'svg'
  onExpandAll?: () => void
  padding?: number
  pixelRatio?: number
}

/**
 * Exports the entire concept map to a high-resolution, zoom-independent image.
 * Guarantees 100% scale, full branch expansion and crisp rendering.
 */
export async function exportCanvasToImage(
  fileName = 'mapa-conceptual',
  format: 'png' | 'svg' = 'png',
  options: ExportImageOptions = {}
): Promise<void> {
  const { onExpandAll, padding = 80, pixelRatio = 2.5 } = options

  // 1. If expandAll callback is provided, ensure 100% of nodes are expanded
  if (onExpandAll) {
    onExpandAll()
    // Allow DOM to settle and mount all nodes
    await new Promise((resolve) => setTimeout(resolve, 180))
  }

  const flowViewport = document.querySelector('.react-flow__viewport') as HTMLElement
  if (!flowViewport) {
    throw new Error('Lienzo de React Flow no encontrado')
  }

  // 2. Compute true global bounding box of all rendered node elements
  const nodeElements = Array.from(
    flowViewport.querySelectorAll('.react-flow__node')
  ) as HTMLElement[]

  if (nodeElements.length === 0) {
    throw new Error('No hay nodos para exportar')
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of nodeElements) {
    let x = 0
    let y = 0
    const transform = el.style.transform || ''
    const match = transform.match(/translate(?:3d)?\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/)

    if (match) {
      x = parseFloat(match[1])
      y = parseFloat(match[2])
    } else {
      x = el.offsetLeft
      y = el.offsetTop
    }

    const w = el.offsetWidth || el.clientWidth || 260
    const h = el.offsetHeight || el.clientHeight || 60

    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x + w > maxX) maxX = x + w
    if (y + h > maxY) maxY = y + h
  }

  // Add margin
  const imageWidth = Math.ceil(maxX - minX + padding * 2)
  const imageHeight = Math.ceil(maxY - minY + padding * 2)

  const exportFn = format === 'svg' ? toSvg : toPng

  // 3. Render at 100% scale (scale: 1) with exact translated coordinates
  const dataUrl = await exportFn(flowViewport, {
    backgroundColor: '#faf9f6',
    quality: 1,
    pixelRatio: format === 'svg' ? 1 : pixelRatio,
    width: imageWidth,
    height: imageHeight,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`,
      transformOrigin: 'top left'
    },
    filter: (node) => {
      const className = (node as HTMLElement).className || ''
      if (typeof className === 'string') {
        if (
          className.includes('react-flow__minimap') ||
          className.includes('react-flow__controls') ||
          className.includes('react-flow__panel')
        ) {
          return false
        }
      }
      return true
    }
  })

  // 4. Download file
  const link = document.createElement('a')
  link.download = `${fileName}.${format}`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
