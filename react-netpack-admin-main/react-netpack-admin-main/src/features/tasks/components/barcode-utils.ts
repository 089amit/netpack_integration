/**
 * Pure TypeScript Code 128 (Subset B) Barcode Generator.
 * Outputs sharp SVG elements, strings, and Canvas/DataURLs.
 * Supports all standard ASCII printable characters (32 - 126).
 */

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', // 0-4
  '131222', '122213', '122312', '132212', '221213', // 5-9
  '221312', '231212', '112232', '122132', '122231', // 10-14
  '113222', '123122', '123221', '223211', '221132', // 15-19
  '221231', '213212', '223112', '312131', '311222', // 20-24
  '321122', '321221', '312212', '322112', '322211', // 25-29
  '212123', '212321', '232121', '111323', '131123', // 30-34
  '131321', '112313', '132113', '132311', '211313', // 35-39
  '231113', '231311', '112133', '112331', '132131', // 40-44
  '113123', '113321', '133121', '313121', '211331', // 45-49
  '231131', '213113', '213311', '213131', '311123', // 50-54
  '311321', '331121', '312113', '312311', '332111', // 55-59
  '314111', '221411', '431111', '111224', '111422', // 60-64
  '121124', '121421', '141122', '141221', '112214', // 65-69
  '112412', '122114', '122411', '142112', '142211', // 70-74
  '241211', '221114', '413111', '241112', '134111', // 75-79
  '111242', '121142', '121241', '114212', '124112', // 80-84
  '124211', '411212', '421112', '421211', '212141', // 85-89
  '214121', '412121', '111143', '111341', '131141', // 90-94
  '114113', '114311', '411113', '411311', '113141', // 95-99
  '114131', '311141', '411131', '211412', '211214', // 100-104 (104 = Start B)
  '211232', '2331112'                                 // 105 (Start C), 106 (Stop)
]

const START_B = 104
const STOP = 106

export interface BarcodeOptions {
  height?: number
  moduleWidth?: number
  quietZone?: number
  includeText?: boolean
  fontSize?: number
  color?: string
  backgroundColor?: string
}

/**
 * Encodes text into Code 128 module sequence (string of alternating bar/space widths).
 */
export function encodeCode128B(text: string): { widths: number[]; checksum: number } {
  const clean = text || 'NETPACK'
  const codes: number[] = [START_B]
  let sum = START_B

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32
    const safeCode = code >= 0 && code <= 95 ? code : 0
    codes.push(safeCode)
    sum += safeCode * (i + 1)
  }

  const checksum = sum % 103
  codes.push(checksum)
  codes.push(STOP)

  const widths: number[] = []
  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0]
    for (let j = 0; j < pattern.length; j++) {
      widths.push(parseInt(pattern[j], 10))
    }
  }

  return { widths, checksum }
}

/**
 * Generates an SVG string of the Code 128 barcode.
 */
export function generateBarcodeSvg(text: string, options: BarcodeOptions = {}): string {
  const {
    height = 50,
    moduleWidth = 2,
    quietZone = 10,
    includeText = false,
    fontSize = 12,
    color = '#000000',
    backgroundColor = '#ffffff',
  } = options

  const { widths } = encodeCode128B(text)
  const totalModules = widths.reduce((acc, w) => acc + w, 0)
  const totalWidth = totalModules * moduleWidth + quietZone * 2
  const textHeight = includeText ? fontSize + 4 : 0
  const totalHeight = height + textHeight

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`
  if (backgroundColor && backgroundColor !== 'transparent') {
    svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="${backgroundColor}" />`
  }

  let currentX = quietZone
  let isBar = true

  for (const w of widths) {
    const barW = w * moduleWidth
    if (isBar) {
      svg += `<rect x="${currentX}" y="0" width="${barW}" height="${height}" fill="${color}" />`
    }
    currentX += barW
    isBar = !isBar
  }

  if (includeText) {
    svg += `<text x="${totalWidth / 2}" y="${height + fontSize}" text-anchor="middle" font-family="monospace, Courier, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}">${text}</text>`
  }

  svg += '</svg>'
  return svg
}

/**
 * Generates a PNG DataURL for the barcode using HTML5 Canvas.
 */
export async function getBarcodeDataUrl(
  text: string,
  options: BarcodeOptions = {}
): Promise<string> {
  const {
    height = 60,
    moduleWidth = 2,
    quietZone = 10,
    includeText = false,
    fontSize = 12,
    color = '#000000',
    backgroundColor = '#ffffff',
  } = options

  const { widths } = encodeCode128B(text)
  const totalModules = widths.reduce((acc, w) => acc + w, 0)
  const totalWidth = totalModules * moduleWidth + quietZone * 2
  const textHeight = includeText ? fontSize + 6 : 0
  const totalHeight = height + textHeight

  if (typeof document === 'undefined') {
    // SSR fallback: return encoded SVG data uri
    const svg = generateBarcodeSvg(text, options)
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  const canvas = document.createElement('canvas')
  canvas.width = totalWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    const svg = generateBarcodeSvg(text, options)
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, totalWidth, totalHeight)
  }

  ctx.fillStyle = color
  let currentX = quietZone
  let isBar = true

  for (const w of widths) {
    const barW = w * moduleWidth
    if (isBar) {
      ctx.fillRect(currentX, 0, barW, height)
    }
    currentX += barW
    isBar = !isBar
  }

  if (includeText) {
    ctx.font = `bold ${fontSize}px monospace, Courier, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(text, totalWidth / 2, height + fontSize)
  }

  return canvas.toDataURL('image/png')
}
