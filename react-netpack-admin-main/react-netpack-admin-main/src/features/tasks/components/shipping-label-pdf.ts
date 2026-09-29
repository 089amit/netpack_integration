import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import logoTextUrl from '@/assets/name.png'
import { getBarcodeDataUrl } from './barcode-utils'
import { ShippingLabelData, ShippingLabelBoxData } from './shipping-label-card'

/**
 * Loads an image from a URL as an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Generates an international courier standard 100mm x 150mm (4" x 6") PDF.
 * Each box in the shipment generates one dedicated 100x150mm page.
 */
export async function generateShippingLabel100x150PDF(
  data: ShippingLabelData,
  options?: { autoDownload?: boolean; filename?: string }
): Promise<jsPDF> {
  const { autoDownload = false, filename } = options || {}

  // 100mm x 150mm portrait document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150],
  })

  const logoImg = await loadImage(logoTextUrl)

  const boxes: ShippingLabelBoxData[] =
    data.boxes && data.boxes.length > 0
      ? data.boxes
      : [
          {
            boxNumber: 1,
            totalBoxes: 1,
            weight: data.totalWeight || 'N/A',
          },
        ]

  const totalBoxes = boxes.length

  for (let i = 0; i < totalBoxes; i++) {
    const box = boxes[i]
    if (i > 0) {
      doc.addPage([100, 150], 'portrait')
    }

    const boxTracking =
      box.boxTrackingNumber || data.trackingNumber || 'NP-TRACK-PENDING'
    const boxNoStr = `BOX ${box.boxNumber || i + 1} OF ${totalBoxes}`

    // ── Setup Dimensions & Margins ──
    const margin = 3
    const cardW = 100 - margin * 2 // 94 mm
    const cardH = 150 - margin * 2 // 144 mm
    const startX = margin
    const startY = margin

    // Outer border
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.4)
    doc.rect(startX, startY, cardW, cardH, 'S')

    // Helper functions
    const setFill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b)
    const setDraw = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b)
    const setColor = (r: number, g: number, b: number) => doc.setTextColor(r, g, b)

    let currentY = startY

    // =========================================================================
    // 1. TOP HEADER: LOGO, BRAND, BOX COUNTER, ORIGIN
    // =========================================================================
    const headerH = 12
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, headerH, 'F')

    // Logo & Brand
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const logoW = 28
      const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth)
      try {
        doc.addImage(logoImg, 'PNG', startX + 2, currentY + 1.5, logoW, Math.min(logoH, 9))
      } catch (e) {
        // Fallback text if addImage fails
        setColor(220, 30, 30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('NETPACK', startX + 3, currentY + 5)
      }
    } else {
      setColor(220, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('NETPACK LOGISTICS', startX + 3, currentY + 5)
      setColor(80, 80, 80)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text('WORLDWIDE EXPRESS COURIER', startX + 3, currentY + 8.5)
    }

    // Box Counter Badge (black rectangle with white text)
    const badgeW = 24
    const badgeH = 5
    const badgeX = startX + cardW - badgeW - 2
    const badgeY = currentY + 2
    setFill(0, 0, 0)
    doc.rect(badgeX, badgeY, badgeW, badgeH, 'F')

    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(boxNoStr, badgeX + badgeW / 2, badgeY + 3.6, { align: 'center' })

    // Origin Gateway
    setColor(70, 70, 70)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text('ORIGIN: KTM / NP', badgeX + badgeW / 2, badgeY + 8.5, { align: 'center' })

    currentY += headerH

    // Line below header
    setDraw(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 2. SUBHEADER: SERVICE & DATE
    // =========================================================================
    const subH = 5
    setFill(245, 245, 245)
    doc.rect(startX, currentY, cardW, subH, 'F')

    setColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(`SERVICE: ${data.serviceType || 'PRIORITY AIR CARGO'}`, startX + 3, currentY + 3.5)

    const rawDate = data.date || new Date().toISOString()
    const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    doc.setFont('helvetica', 'normal')
    doc.text(`DATE: ${formattedDate}`, startX + cardW - 3, currentY + 3.5, { align: 'right' })

    currentY += subH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 3. MASTER BARCODE (Code 128)
    // =========================================================================
    const barcodeSectionH = 18
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, barcodeSectionH, 'F')

    try {
      const barcodeDataUrl = await getBarcodeDataUrl(boxTracking, {
        height: 50,
        moduleWidth: 2,
        quietZone: 8,
        color: '#000000',
        backgroundColor: '#ffffff',
        includeText: false,
      })
      doc.addImage(barcodeDataUrl, 'PNG', startX + 6, currentY + 1.5, cardW - 12, 10.5)
    } catch (err) {
      console.error('Barcode PDF render error:', err)
    }

    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.setFontSize(10.5)
    doc.text(boxTracking, startX + cardW / 2, currentY + 15.5, {
      align: 'center',
      charSpace: 0.8,
    })

    currentY += barcodeSectionH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 4. SHIP FROM (SENDER) - Compact
    // =========================================================================
    const senderH = 17
    setFill(250, 250, 250)
    doc.rect(startX, currentY, cardW, senderH, 'F')

    setColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text('SHIP FROM (SENDER):', startX + 3, currentY + 3.8)

    doc.text(`TEL: ${data.sender.phone || 'N/A'}`, startX + cardW - 3, currentY + 3.8, { align: 'right' })

    setColor(20, 20, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(data.sender.name || 'NetPack Logistics Shipper', startX + 3, currentY + 7.5)

    const senderAddr = [
      data.sender.addressLine1,
      data.sender.addressLine2,
      data.sender.city,
      data.sender.state,
      data.sender.postcode,
      data.sender.country || 'Nepal',
    ]
      .filter(Boolean)
      .join(', ')

    setColor(70, 70, 70)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const senderLines = doc.splitTextToSize(senderAddr, cardW - 6)
    doc.text(senderLines.slice(0, 2), startX + 3, currentY + 11.5)

    currentY += senderH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 5. SHIP TO (CONSIGNEE - HERO SECTION)
    // =========================================================================
    const receiverH = 34
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, receiverH, 'F')

    // Consignee Header + Destination Country Pill
    setColor(220, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('SHIP TO (CONSIGNEE):', startX + 3, currentY + 4)

    const destCountry = (data.receiver.country || 'INTERNATIONAL').toUpperCase()
    const countryW = Math.max(doc.getTextWidth(destCountry) + 6, 26)
    const countryH = 5.5
    const countryX = startX + cardW - countryW - 3
    const countryY = currentY + 1.2

    setFill(0, 0, 0)
    doc.rect(countryX, countryY, countryW, countryH, 'F')
    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(destCountry, countryX + countryW / 2, countryY + 4, { align: 'center' })

    // Consignee Name (large bold)
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(data.receiver.name || 'CONSIGNEE NAME', startX + 3, currentY + 10)

    // Consignee Address
    const receiverAddr = [
      data.receiver.addressLine1,
      data.receiver.addressLine2,
      data.receiver.city,
      data.receiver.state,
      data.receiver.postcode,
    ]
      .filter(Boolean)
      .join(', ')

    setColor(40, 40, 40)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const receiverLines = doc.splitTextToSize(receiverAddr, cardW - 6)
    doc.text(receiverLines.slice(0, 3), startX + 3, currentY + 14.5)

    // Receiver Destination & Telephone line
    const rBottomY = currentY + receiverH - 3
    setDraw(200, 200, 200)
    doc.line(startX + 3, rBottomY - 4, startX + cardW - 3, rBottomY - 4)

    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`DEST: ${destCountry}`, startX + 3, rBottomY)
    doc.text(`TEL: ${data.receiver.phone || 'N/A'}`, startX + cardW - 3, rBottomY, { align: 'right' })

    currentY += receiverH
    setDraw(0, 0, 0)
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 6. SPECIFICATIONS & CUSTOMS GRID
    // =========================================================================
    const specsH = 14
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, specsH, 'F')

    const colW = cardW / 4
    // Vertical dividers
    for (let c = 1; c < 4; c++) {
      doc.line(startX + c * colW, currentY, startX + c * colW, currentY + specsH)
    }

    const actualWt = box.weight
      ? `${parseFloat(String(box.weight)).toFixed(2)} KG`
      : data.totalWeight
      ? `${parseFloat(String(data.totalWeight)).toFixed(2)} KG`
      : 'N/A'

    const dimsStr =
      box.dimensions ||
      (box.length && box.breadth && box.height
        ? `${box.length}x${box.breadth}x${box.height}`
        : 'N/A')

    const commodityStr = box.commodity || data.commodity || 'COURIER CARGO'
    const customsValStr = box.declaredValue
      ? `${box.currency || data.currency || 'USD'} ${box.declaredValue}`
      : 'NVD'

    // Col 1: Actual Wt
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('ACTUAL WT', startX + colW * 0.5, currentY + 4, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(actualWt, startX + colW * 0.5, currentY + 9.5, { align: 'center' })

    // Col 2: Dimensions
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('DIMS (CM)', startX + colW * 1.5, currentY + 4, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(dimsStr, startX + colW * 1.5, currentY + 9.5, { align: 'center' })

    // Col 3: Commodity
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('COMMODITY', startX + colW * 2.5, currentY + 4, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    const commLines = doc.splitTextToSize(commodityStr.toUpperCase(), colW - 2)
    doc.text(commLines[0] || 'CARGO', startX + colW * 2.5, currentY + 9.5, { align: 'center' })

    // Col 4: Customs Val
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('CUSTOMS VAL', startX + colW * 3.5, currentY + 4, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(customsValStr, startX + colW * 3.5, currentY + 9.5, { align: 'center' })

    currentY += specsH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 7. ROUTING & 2D QR CODE
    // =========================================================================
    const routingH = 22
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, routingH, 'F')

    // QR Code
    const trackingUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/track?tracking=${encodeURIComponent(boxTracking)}`
        : `https://netpacklogistic.com/track?tracking=${encodeURIComponent(boxTracking)}`

    try {
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 160,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
      doc.addImage(qrDataUrl, 'PNG', startX + 3, currentY + 2, 17, 17)
    } catch (err) {
      console.error('QR code error in PDF:', err)
    }

    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text('SCAN TO TRACK', startX + 22, currentY + 6.5)
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('Live PWA tracking status', startX + 22, currentY + 10.5)
    doc.text('Door-to-door transit events', startX + 22, currentY + 14.5)

    // Compliance Badges (Right side)
    const badgeBoxX = startX + 56
    const badgeBoxW = cardW - 56 - 3
    setDraw(0, 0, 0)
    doc.rect(badgeBoxX, currentY + 3, badgeBoxW, 6.5, 'S')
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.text('SECURITY SCREENED - SPX', badgeBoxX + badgeBoxW / 2, currentY + 7.2, { align: 'center' })

    doc.rect(badgeBoxX, currentY + 11.5, badgeBoxW, 6.5, 'S')
    doc.text('NON-DG / PASSENGER & CARGO', badgeBoxX + badgeBoxW / 2, currentY + 15.7, { align: 'center' })

    currentY += routingH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 8. HAZARD & FRAGILE BANNER
    // =========================================================================
    const hazardH = 8
    setFill(0, 0, 0)
    doc.rect(startX, currentY, cardW, hazardH, 'F')

    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('▲  HANDLE WITH CARE  ▲', startX + 4, currentY + 5.2)

    setColor(255, 240, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text('FRAGILE • KEEP DRY • THIS WAY UP ↑↑', startX + cardW - 4, currentY + 5.2, { align: 'right' })

    currentY += hazardH

    // =========================================================================
    // 9. FOOTER
    // =========================================================================
    const footerH = cardH - (currentY - startY)
    setFill(245, 245, 245)
    doc.rect(startX, currentY, cardW, footerH, 'F')

    setColor(90, 90, 90)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.text(
      'NETPACK LOGISTICS LTD.  |  TEL: +977-1-5339942  |  KATHMANDU, NEPAL  |  WWW.NETPACKLOGISTIC.COM',
      startX + cardW / 2,
      currentY + footerH / 2 + 1,
      { align: 'center' }
    )
  }

  if (autoDownload) {
    const saveName = filename || `shipping-label-${data.trackingNumber || 'consignment'}-100x150mm.pdf`
    doc.save(saveName)
  }

  return doc
}

/**
 * Backwards compatibility helper for existing callers.
 * Now points to the 100x150mm international standard generator.
 */
export async function generateShippingLabelPDF(options: any) {
  const { labels = [] } = options
  if (!labels.length) return

  const first = labels[0]
  const adaptedData: ShippingLabelData = {
    trackingNumber: first.trackingNumber || 'NP-PENDING',
    date: first.date,
    sender: {
      name: first.sender?.name,
      addressLine1: first.sender?.address,
      phone: first.sender?.phone,
    },
    receiver: {
      name: first.receiver?.name,
      addressLine1: first.receiver?.address,
      phone: first.receiver?.phone,
    },
    boxes: labels.map((l: any, idx: number) => ({
      boxNumber: idx + 1,
      totalBoxes: labels.length,
      weight: l.packageDetails?.weight?.replace(' kg', ''),
      dimensions: l.packageDetails?.dimensions,
    })),
  }

  return generateShippingLabel100x150PDF(adaptedData, { autoDownload: true })
}
