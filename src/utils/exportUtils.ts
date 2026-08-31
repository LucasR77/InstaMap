import { toPng, toSvg } from 'html-to-image'

/**
 * Downloads a file to the user's computer
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

/**
 * Exports the React Flow viewport canvas to a high-resolution PNG image
 */
export async function exportCanvasToImage(
  fileName = 'mapa-conceptual',
  format: 'png' | 'svg' = 'png'
): Promise<void> {
  const flowElement = document.querySelector('.react-flow__viewport') as HTMLElement
  if (!flowElement) {
    throw new Error('Canvas de React Flow no encontrado')
  }

  const exportFn = format === 'svg' ? toSvg : toPng

  const dataUrl = await exportFn(flowElement, {
    backgroundColor: '#faf9f6',
    quality: 0.98,
    pixelRatio: 2,
    filter: (node) => {

      // Exclude controls and minimap from image
      const className = (node as HTMLElement).className || ''
      if (typeof className === 'string') {
        if (
          className.includes('react-flow__minimap') ||
          className.includes('react-flow__controls')
        ) {
          return false
        }
      }
      return true
    }
  })

  const link = document.createElement('a')
  link.download = `${fileName}.${format}`
  link.href = dataUrl
  link.click()
}
