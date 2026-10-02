import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { NETPACK_LOGO_DATA_URL } from './netpack-logo-base64'
import { getBarcodeDataUrl } from './barcode-utils'
import { ShippingLabelData, ShippingLabelBoxData } from './shipping-label-card'


/**
 * Generates an international courier standard 100mm x 150mm (4" x 6") PDF.
 * Each box in the shipment generates one dedicated 100x150mm page.
 * Styled to pixel-perfect match the NetPack standard shipping label mockup.
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
    doc.setLineWidth(0.5)
    doc.rect(startX, startY, cardW, cardH, 'S')

    // Helper functions
    const setFill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b)
    const setDraw = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b)
    const setColor = (r: number, g: number, b: number) => doc.setTextColor(r, g, b)

    let currentY = startY

    // =========================================================================
    // 1. TOP HEADER: LOGO, BRAND, BOX COUNTER, ORIGIN, DATE (Height: 13mm)
    // =========================================================================
    const headerH = 13
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, headerH, 'F')

    // Official NetPack Algerian Wordmark Logo (Aspect Ratio: 1307 / 206 = ~6.345)
    const logoW = 50
    const logoH = 50 * (206 / 1307) // ~7.88 mm
    try {
      doc.addImage(NETPACK_LOGO_DATA_URL, 'PNG', startX + 2, currentY + 2.5, logoW, logoH)
    } catch {
      setColor(0, 1, 97)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('NETPACK', startX + 3, currentY + 8.5)
    }

    // Right-aligned Box Counter Badge (black rectangle with white text)
    const badgeW = 26
    const badgeH = 4.6
    const badgeX = startX + cardW - badgeW - 2
    const badgeY = currentY + 1.2
    setFill(0, 0, 0)
    doc.rect(badgeX, badgeY, badgeW, badgeH, 'F')

    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(boxNoStr, badgeX + badgeW / 2, badgeY + 3.2, { align: 'center' })

    // Origin Gateway
    setColor(80, 80, 80)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text('ORIGIN: ', badgeX + badgeW - 14, badgeY + 7.5, { align: 'right' })
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('KTM / NP', badgeX + badgeW, badgeY + 7.5, { align: 'right' })

    // Date
    const rawDate = data.date || new Date().toISOString()
    const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    setColor(80, 80, 80)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    doc.text('DATE: ', badgeX + badgeW - 17, badgeY + 11, { align: 'right' })
    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.text(formattedDate, badgeX + badgeW, badgeY + 11, { align: 'right' })

    currentY += headerH

    // Line below header
    setDraw(0, 0, 0)
    doc.setLineWidth(0.4)
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 2. MASTER BARCODE (Code 128) (Height: 16mm)
    // =========================================================================
    const barcodeSectionH = 16
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, barcodeSectionH, 'F')

    const cleanTracking = boxTracking.replace(/\s+/g, '')
    const spacedTracking = cleanTracking.split('').join(' ')

    try {
      const barcodeDataUrl = await getBarcodeDataUrl(cleanTracking, {
        height: 48,
        moduleWidth: 2,
        quietZone: 8,
        color: '#000000',
        backgroundColor: '#ffffff',
        includeText: false,
      })
      doc.addImage(barcodeDataUrl, 'PNG', startX + 5, currentY + 1, cardW - 10, 9.5)
    } catch (err) {
      console.error('Barcode PDF render error:', err)
    }

    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.setFontSize(10.5)
    doc.text(spacedTracking, startX + cardW / 2, currentY + 14, {
      align: 'center',
    })

    currentY += barcodeSectionH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 3. SHIP FROM (SENDER) (Height: 11mm)
    // =========================================================================
    const senderH = 11
    setFill(245, 245, 245)
    doc.rect(startX, currentY, cardW, senderH, 'F')

    setColor(90, 90, 90)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.text('SHIP FROM (SENDER):', startX + 3, currentY + 3.8)

    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.text(`TEL: ${data.sender.phone || '015339942'}`, startX + cardW - 3, currentY + 3.8, { align: 'right' })

    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    const senderName = (data.sender.company || data.sender.name || 'DANFE LOGISTICS').toUpperCase()
    doc.text(senderName, startX + 3, currentY + 8.5)

    currentY += senderH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 4. SHIP TO (CONSIGNEE - HERO SECTION) (Height: 37mm)
    // =========================================================================
    const receiverH = 37
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, receiverH, 'F')

    // Consignee Header (Red) + Destination Country Badge (Solid Black)
    setColor(211, 47, 47)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('SHIP TO (CONSIGNEE):', startX + 3, currentY + 4.2)

    const destCountry = (data.receiver.country || 'INTERNATIONAL').toUpperCase()
    const countryW = Math.max(doc.getTextWidth(destCountry) + 8, 28)
    const countryH = 5
    const countryX = startX + cardW - countryW - 3
    const countryY = currentY + 1.2

    setFill(0, 0, 0)
    doc.rect(countryX, countryY, countryW, countryH, 'F')
    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(destCountry, countryX + countryW / 2, countryY + 3.6, { align: 'center' })

    // Consignee Name (large bold)
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text((data.receiver.name || 'Dinesh Basnet').toUpperCase(), startX + 3, currentY + 10)

    // Structured 3-Line Address
    const consigneeLine1 = data.receiver.addressLine1 || '[Street / Tole, Ward No.]'
    const consigneeLine2 = [data.receiver.addressLine2, data.receiver.city].filter(Boolean).join(', ') || '[City, District]'
    const stateAndPostcode = [data.receiver.state, data.receiver.postcode].filter(Boolean).join(', ')
    const consigneeLine3 = stateAndPostcode ? `${stateAndPostcode}, ${destCountry}` : `[Province, Postal Code], ${destCountry}`

    setColor(20, 20, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.text(consigneeLine1, startX + 3, currentY + 15)
    doc.text(consigneeLine2, startX + 3, currentY + 19)
    doc.text(consigneeLine3, startX + 3, currentY + 23)

    // Thin separator above contact details
    setDraw(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.line(startX + 3, currentY + 26, startX + cardW - 3, currentY + 26)

    // DEST and TEL
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(`DEST: ${destCountry}`, startX + 3, currentY + 30)

    doc.setFont('courier', 'bold')
    doc.text(`TEL: ${data.receiver.phone || '+61 425 625 963'}`, startX + cardW - 3, currentY + 30, { align: 'right' })

    // EMAIL
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text('EMAIL: ', startX + 3, currentY + 34.5)
    doc.setFont('courier', 'normal')
    doc.text(data.receiver.email || 'dinesh.basnet@example.com', startX + 14, currentY + 34.5)

    currentY += receiverH
    setDraw(0, 0, 0)
    doc.setLineWidth(0.4)
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 5. 4-COLUMN SPECS GRID (Height: 13mm)
    // =========================================================================
    const specsH = 13
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, specsH, 'F')

    const colW = cardW / 4
    for (let c = 1; c < 4; c++) {
      doc.line(startX + c * colW, currentY, startX + c * colW, currentY + specsH)
    }

    const actualWt = box.weight
      ? `${parseFloat(String(box.weight)).toFixed(2)} KG`
      : data.totalWeight
      ? `${parseFloat(String(data.totalWeight)).toFixed(2)} KG`
      : 'N/A'

    const dimsVal =
      box.length && box.breadth && box.height
        ? `${box.length}x${box.breadth}x${box.height}`
        : box.dimensions
        ? box.dimensions.replace(/×/g, 'x').replace(/\s*CM\s*/gi, '')
        : '55x35x35'

    const commodityVal = (box.commodity || data.commodity || 'COURIER CARGO').toUpperCase()
    const customsVal = box.declaredValue
      ? `${box.currency || data.currency || 'USD'} ${box.declaredValue}`
      : 'NVD'

    // Col 1: Actual Wt
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    doc.text('ACTUAL WT', startX + colW * 0.5, currentY + 3.8, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.setFontSize(9)
    doc.text(actualWt, startX + colW * 0.5, currentY + 9, { align: 'center' })

    // Col 2: Dimensions
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    doc.text('DIMS (CM)', startX + colW * 1.5, currentY + 3.8, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.setFontSize(8)
    doc.text(dimsVal, startX + colW * 1.5, currentY + 9, { align: 'center' })

    // Col 3: Commodity
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    doc.text('COMMODITY', startX + colW * 2.5, currentY + 3.8, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.text(commodityVal, startX + colW * 2.5, currentY + 9, { align: 'center' })

    // Col 4: Customs Val
    setColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.2)
    doc.text('CUSTOMS VAL', startX + colW * 3.5, currentY + 3.8, { align: 'center' })
    setColor(0, 0, 0)
    doc.setFont('courier', 'bold')
    doc.setFontSize(9)
    doc.text(customsVal, startX + colW * 3.5, currentY + 9, { align: 'center' })

    currentY += specsH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 6. SCAN & COMPLIANCE BOX (Height: 23mm)
    // =========================================================================
    const scanH = 23
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, scanH, 'F')

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
      doc.addImage(qrDataUrl, 'PNG', startX + 3, currentY + 3.5, 16, 16)
    } catch (err) {
      console.error('QR code error in PDF:', err)
    }

    // "SCAN TO TRACK" text
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('SCAN TO TRACK', startX + 21, currentY + 12.5)

    // Security Compliance Badges (Right side)
    const badgeBoxX = startX + 53
    const badgeBoxW = cardW - 53 - 3
    setDraw(0, 0, 0)
    doc.setLineWidth(0.35)

    // Badge 1: SECURITY SCREENED - SPX
    doc.rect(badgeBoxX, currentY + 4, badgeBoxW, 6.2, 'S')
    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.text('SECURITY SCREENED - SPX', badgeBoxX + badgeBoxW / 2, currentY + 8.2, { align: 'center' })

    // Badge 2: NON-DG / PASSENGER & CARGO
    doc.rect(badgeBoxX, currentY + 12.5, badgeBoxW, 6.2, 'S')
    doc.setFontSize(6.4)
    doc.text('NON-DG / PASSENGER & CARGO', badgeBoxX + badgeBoxW / 2, currentY + 16.7, { align: 'center' })

    currentY += scanH
    doc.line(startX, currentY, startX + cardW, currentY)

    // =========================================================================
    // 7. SOLID BLACK HANDLING BAR (Height: 12mm)
    // =========================================================================
    const handlingH = 12
    setFill(0, 0, 0)
    doc.rect(startX, currentY, cardW, handlingH, 'F')

    // Section 1 (Left): THIS SIDE UP with vector double arrows
    setFill(255, 255, 255)
    // Arrow 1
    doc.triangle(startX + 6, currentY + 2.5, startX + 4.5, currentY + 5.5, startX + 7.5, currentY + 5.5, 'F')
    doc.rect(startX + 5.5, currentY + 5.5, 1, 2.5, 'F')
    // Arrow 2
    doc.triangle(startX + 10, currentY + 2.5, startX + 8.5, currentY + 5.5, startX + 11.5, currentY + 5.5, 'F')
    doc.rect(startX + 9.5, currentY + 5.5, 1, 2.5, 'F')

    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('THIS SIDE', startX + 13.5, currentY + 5.2)
    doc.text('UP', startX + 13.5, currentY + 8.6)

    // Vertical white divider 1
    setDraw(255, 255, 255)
    doc.setLineWidth(0.3)
    doc.line(startX + 30, currentY + 1.5, startX + 30, currentY + handlingH - 1.5)

    // Section 2 (Center): FRAGILE in vibrant yellow
    setColor(255, 215, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('FRAGILE', startX + 49, currentY + 7.5, { align: 'center' })

    // Vertical white divider 2
    doc.line(startX + 67, currentY + 1.5, startX + 67, currentY + handlingH - 1.5)

    // Section 3 (Right): HANDLE WITH CARE
    setColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.text('HANDLE', startX + 81, currentY + 5.2, { align: 'center' })
    doc.text('WITH CARE', startX + 81, currentY + 8.6, { align: 'center' })

    currentY += handlingH

    // =========================================================================
    // 8. FOOTER (Remaining height: 16mm)
    // =========================================================================
    const footerH = cardH - (currentY - startY)
    setFill(255, 255, 255)
    doc.rect(startX, currentY, cardW, footerH, 'F')

    setColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text(
      'NETPACK LOGISTIC | TEL: +977-1-5339942 | KATHMANDU, NEPAL',
      startX + cardW / 2,
      currentY + 5.5,
      { align: 'center' }
    )

    setColor(90, 90, 90)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text(
      'www.netpacklogistic.com | admin@netpacklogistic.com',
      startX + cardW / 2,
      currentY + 9.5,
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
