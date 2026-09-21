import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import oldLogoUrl from '@/assets/alzerianlogo.png'
import logoTextUrl from '@/assets/name.png'

export interface ShippingLabelSenderReceiver {
  name?: string
  address?: string
  phone?: string
}

export interface ShippingLabelPackageDetails {
  weight?: string
  dimensions?: string
  contents?: string
  value?: string
  hsCode?: string
  countryOfOrigin?: string
}

export interface ShippingLabelAdditionalInfo {
  insurance?: string
  signatureRequired?: string
  specialInstructions?: string
}

export interface ShippingLabelOptions {
  sender?: ShippingLabelSenderReceiver
  receiver?: ShippingLabelSenderReceiver
  packageDetails?: ShippingLabelPackageDetails
  additionalInfo?: ShippingLabelAdditionalInfo
  date?: string
  fragile?: boolean | string
  handleWithCareMessage?: string
  labelNumberFetcher: () => Promise<string>
  trackingNumber?: string | null
}

export async function generateShippingLabelPDF(options: any) {
  const { labels = [] } = options

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210

  // 3 labels per A4 page
  const labelH = 97
  const labelGap = 1
  const pageMarginY = 1

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setFill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b)
  const setDraw = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b)
  const setColor = (r: number, g: number, b: number) =>
    doc.setTextColor(r, g, b)

  const setDash = (pattern: number[]) => {
    const d = doc as any
    if (d.setLineDash) d.setLineDash(pattern, 0)
    else if (d.setLineDashPattern) d.setLineDashPattern(pattern, 0)
  }

  const setOpacity = (val: number) => {
    const d = doc as any
    if (d.setGState && d.GState) {
      d.setGState(new d.GState({ opacity: val, 'fill-opacity': val }))
    }
  }

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((res) => {
      const img = new Image()
      img.onload = () => res(img)
      img.onerror = () => res(img)
      img.src = src
    })

  const logoName = await loadImg(logoTextUrl)
  const oldLogo = await loadImg(oldLogoUrl)

  // Render wrapped lines, returns Y of last line
  const wrappedText = (
    text: string,
    x: number,
    y: number,
    maxW: number,
    fontSize: number,
    lineGap: number,
    bold = false
  ): number => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines: string[] = doc.splitTextToSize(text || '', maxW)
    lines.forEach((line, idx) => doc.text(line, x, y + idx * lineGap))
    return y + (lines.length - 1) * lineGap
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LABEL LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]
    const posOnPage = i % 3
    const Y = pageMarginY + posOnPage * (labelH + labelGap)

    if (i > 0 && posOnPage === 0) doc.addPage()

    // Outer border
    setDraw(190, 190, 190)
    doc.setLineWidth(0.4)
    doc.rect(5, Y, pageWidth - 10, labelH, 'S')

    // =========================================================================
    // ZONE A · RED TOP RULE
    // =========================================================================
    setFill(220, 30, 30)
    doc.rect(5, Y, pageWidth - 10, 2.5, 'F')

    // =========================================================================
    // ZONE B · META ROW
    // NETPACK LOGISTICS left  |  Date centre  |  BOX right
    // =========================================================================
    const metaY = Y + 2.5
    const metaH = 11

    setFill(255, 255, 255)
    doc.rect(5, metaY, pageWidth - 10, metaH, 'F')

    // NETPACK LOGISTICS — left
    setColor(15, 15, 15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    if (logoName.complete && logoName.naturalWidth > 0) {
      const logoW = 30
      const logoH = logoW * (logoName.naturalHeight / logoName.naturalWidth)

      doc.addImage(oldLogo, 'PNG', 10, metaY + 2, logoW, logoH)
    }

    // Date — centred
    // Date — centred
    const rawDate = label.date || labels[0]?.date || new Date().toISOString()
    const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    setColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Date: ${formattedDate}`, pageWidth / 2, metaY + metaH / 2 + 1.5, {
      align: 'center',
    })

    // BOX X OF Y — right, auto-calculated
    const boxLabel = `BOX ${i + 1} OF ${labels.length}`
    setColor(220, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(boxLabel, pageWidth - 10, metaY + metaH / 2 + 1.5, {
      align: 'right',
    })

    // Bottom rule
    setDraw(210, 210, 210)
    doc.setLineWidth(0.3)
    doc.line(5, metaY + metaH, pageWidth - 5, metaY + metaH)

    // =========================================================================
    // ZONE C · BODY  15% | 65% | 20%
    // =========================================================================
    const bodyTop = metaY + metaH + 4
    const hwcH = 11
    const footerH = 7
    const bodyBot = Y + labelH - hwcH - footerH
    const bodyH = bodyBot - bodyTop

    const innerL = 6
    const innerW = pageWidth - 12

    const col1W = Math.round(innerW * 0.15) // ~29.7 mm  QR
    const col2W = Math.round(innerW * 0.65) // ~128.7 mm Ship info
    const col3W = innerW - col1W - col2W // ~39.6 mm  Package

    const col1L = innerL
    const col2L = col1L + col1W
    const col3L = col2L + col2W
    const div1X = col2L
    const div2X = col3L

    // Vertical dividers
    setDraw(210, 210, 210)
    doc.setLineWidth(0.3)
    doc.line(div1X, bodyTop - 1, div1X, bodyBot)
    doc.line(div2X, bodyTop - 1, div2X, bodyBot)

    // Watermark
    if (logoName.complete && logoName.naturalWidth > 0) {
      const wmW = 65
      const wmH = wmW * (logoName.naturalHeight / logoName.naturalWidth)
      const wmX = (pageWidth - wmW) / 2
      const wmY = bodyTop + (bodyH - wmH) / 2
      setOpacity(0.06)
      doc.addImage(logoName, 'PNG', wmX, wmY, wmW, wmH)
      setOpacity(1)
    }

    // ── COL 1 · QR centred ───────────────────────────────────────────────────
    const qrSize = Math.min(col1W - 4, 34)
    const qrX = col1L + (col1W - qrSize) / 2
    const qrY = bodyTop + 3

    const qrPayload = JSON.stringify({
      name: label.receiver?.name || '',
      phone: label.receiver?.phone || '',
      address: label.receiver?.address || '',
    })
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })

    setDraw(200, 200, 200)
    doc.setLineWidth(0.4)
    doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'S')
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

    setColor(170, 170, 170)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.text('SCAN TO VERIFY', col1L + col1W / 2, qrY + qrSize + 5, {
      align: 'center',
      charSpace: 0.4,
    })

    // ── COL 2 · SHIP FROM (top, subdued) → SHIP TO (below, bold/large) ───────
    const c2Pad = 5
    const c2X = col2L + c2Pad
    const c2MaxW = col2W - c2Pad - 4

    let rvY = bodyTop + 1

    // ── SHIP FROM — top, smaller ─────────────────────────────────────────────
    setColor(110, 110, 110)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('SHIP FROM', c2X, rvY)
    rvY += 5.5

    // Sender name
    setColor(50, 50, 50)
    rvY =
      wrappedText(label.sender?.name || '', c2X, rvY, c2MaxW, 10, 5.5, true) +
      3.5

    // Sender address
    setColor(120, 120, 120)
    rvY =
      wrappedText(
        label.sender?.address || '',
        c2X,
        rvY,
        c2MaxW,
        8,
        4.5,
        false
      ) + 3

    // Sender phone
    setColor(50, 50, 50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`Tel: ${label.sender?.phone || ''}`, c2X, rvY)
    rvY += 6

    // Dashed separator
    setDash([2, 2])
    setDraw(190, 190, 190)
    doc.setLineWidth(0.3)
    doc.line(c2X, rvY, div2X - 3, rvY)
    setDash([])
    rvY += 6

    // ── SHIP TO — below, prominent ───────────────────────────────────────────
    setColor(220, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('SHIP TO', c2X, rvY)
    rvY += 6

    // Receiver name — largest text on label
    setColor(10, 10, 10)
    rvY =
      wrappedText(label.receiver?.name || '', c2X, rvY, c2MaxW, 14, 7, true) + 4

    // Receiver address
    setColor(70, 70, 70)
    rvY =
      wrappedText(
        label.receiver?.address || '',
        c2X,
        rvY,
        c2MaxW,
        9,
        5,
        false
      ) + 4

    // Receiver phone
    setColor(10, 10, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.text(`Tel: ${label.receiver?.phone || ''}`, c2X, rvY)

    // Tracking Number
    if (label.trackingNumber) {
      rvY += 6
      setColor(10, 10, 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`Tracking No: ${label.trackingNumber}`, c2X, rvY)
    }

    // ── COL 3 · PACKAGE DETAILS ───────────────────────────────────────────────
    const c3Pad = 4
    const c3X = col3L + c3Pad
    const c3MaxW = col3W - c3Pad - 2

    let pkY = bodyTop + 1

    setColor(220, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('PACKAGE', c3X, pkY)
    pkY += 4
    doc.text('DETAILS', c3X, pkY)
    pkY += 8

    const pkgRows: [string, string][] = [
      ['WEIGHT', label.packageDetails?.weight || 'N/A'],
      ['DIMENSIONS', label.packageDetails?.dimensions || 'N/A'],
      ['SERVICE', 'Priority Mail'],
    ]

    pkgRows.forEach(([key, value]) => {
      setColor(160, 160, 160)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(key, c3X, pkY)
      pkY += 5

      setColor(10, 10, 10)
      pkY = wrappedText(value, c3X, pkY, c3MaxW, 10.5, 5, true) + 7
    })

    // =========================================================================
    // ZONE D · HANDLE WITH CARE
    // =========================================================================
    const hwcY = bodyBot
    setFill(245, 245, 245)
    doc.rect(5, hwcY, pageWidth - 10, hwcH, 'F')
    setDraw(210, 210, 210)
    doc.setLineWidth(0.3)
    doc.line(5, hwcY, pageWidth - 5, hwcY)

    setFill(220, 30, 30)
    const bW = 5,
      bH = 8,
      bGap = 2
    for (let b = 0; b < 4; b++) {
      doc.rect(10 + b * (bW + bGap), hwcY + 1.5, bW, bH, 'F')
    }
    const barsR = pageWidth - 10 - (4 * bW + 3 * bGap)
    for (let b = 0; b < 4; b++) {
      doc.rect(barsR + b * (bW + bGap), hwcY + 1.5, bW, bH, 'F')
    }

    setColor(15, 15, 15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)

    const hwcText = 'HANDLE WITH CARE'
    const hwcSpacing = 1.2
    const hwcNormalWidth = doc.getTextWidth(hwcText)
    const hwcTotalWidth = hwcNormalWidth + (hwcText.length - 1) * hwcSpacing
    const hwcX = (pageWidth - hwcTotalWidth) / 2

    doc.text(hwcText, hwcX, hwcY + hwcH / 2 + 1.2, {
      charSpace: hwcSpacing,
    })

    // =========================================================================
    // ZONE E · FOOTER
    // =========================================================================
    const ftY = hwcY + hwcH
    setDraw(210, 210, 210)
    doc.setLineWidth(0.3)
    doc.line(5, ftY, pageWidth - 5, ftY)

    setColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)

    const ftText =
      'NETPACK LOGISTIC  |   015339942  |  KATHMANDU, NEPAL  |  www.netpacklogistic.com'
    const ftSpacing = 0.2
    const ftNormalWidth = doc.getTextWidth(ftText)
    const ftTotalWidth = ftNormalWidth + (ftText.length - 1) * ftSpacing
    const ftX = (pageWidth - ftTotalWidth) / 2

    doc.text(ftText, ftX, ftY + 4.5, {
      charSpace: ftSpacing,
    })

    // =========================================================================
    // CUT LINE
    // =========================================================================
    if (posOnPage < 2 && i < labels.length - 1) {
      const cutY = Y + labelH + labelGap / 2
      setDash([3, 3])
      setDraw(180, 180, 180)
      doc.setLineWidth(0.4)
      doc.line(3, cutY, pageWidth - 3, cutY)
      setDash([])
      setColor(180, 180, 180)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text('cut here', pageWidth / 2, cutY + 1.5, { align: 'center' })
    }
  }

  doc.save('shipping-labels.pdf')
}
