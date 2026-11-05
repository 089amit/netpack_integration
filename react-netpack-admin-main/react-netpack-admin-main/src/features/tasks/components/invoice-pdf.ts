import jsPDF from 'jspdf'

// Flexible number to words converter supporting international currencies
export function numberToWords(num: number, currency: string = 'USD'): string {
  const normCur = (currency || 'USD').toUpperCase().trim()
  const [majorUnit, minorUnit] = (() => {
    switch (normCur) {
      case 'NPR':
      case 'RS':
      case 'INR':
        return ['Rupees', 'Paise']
      case 'EUR':
        return ['Euros', 'Cents']
      case 'GBP':
        return ['Pounds', 'Pence']
      case 'AUD':
        return ['Australian Dollars', 'Cents']
      case 'CAD':
        return ['Canadian Dollars', 'Cents']
      case 'USD':
      default:
        return ['US Dollars', 'Cents']
    }
  })()

  if (num === 0) return `Zero ${majorUnit} Only`

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 ? ' ' + inWords(n % 100) : '')
      )
    if (n < 1000000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 ? ' ' + inWords(n % 1000) : '')
      )
    if (n < 1000000000)
      return (
        inWords(Math.floor(n / 1000000)) +
        ' Million' +
        (n % 1000000 ? ' ' + inWords(n % 1000000) : '')
      )
    return String(n)
  }

  const parts = num.toFixed(2).split('.')
  const whole = parseInt(parts[0], 10)
  const decimal = parseInt(parts[1], 10)

  let words = inWords(whole) + ' ' + majorUnit
  if (decimal > 0) {
    words += ' and ' + inWords(decimal) + ' ' + minorUnit
  }
  return words + ' Only'
}

export function numberToWordsQuantity(num: number): string {
  if (num === 0) return 'Zero Pieces Only'
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]
  function inWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 ? ' ' + inWords(n % 100) : '')
      )
    return (
      inWords(Math.floor(n / 1000)) +
      ' Thousand' +
      (n % 1000 ? ' ' + inWords(n % 1000) : '')
    )
  }
  return `${inWords(Math.round(num))} Pieces Only`
}

export interface InvoiceSenderReceiver {
  name: string
  addressLine1?: string
  addressLine2?: string
  postcodeCity?: string
  country?: string
  telephone?: string
  email?: string
  company?: string
}

export interface InvoiceItem {
  description: string
  unitPrice: string | number
  quantity: string | number
  hsCode?: string
  boxNo?: number | string
  weight?: number | string
}

export interface InvoiceDetails {
  invoiceNumber: string
  trackingNumber?: string
  date: string
  dueDate?: string
  currency?: string
  noOfBox?: number | string
  weight?: number | string
  dimWeight?: number | string
}

// ==========================================
// 1. COMMERCIAL INVOICE GENERATOR
// ==========================================
export function generateInvoicePDF({
  sender,
  receiver,
  items,
  details,
}: {
  sender: InvoiceSenderReceiver
  receiver: InvoiceSenderReceiver
  items: InvoiceItem[]
  details: InvoiceDetails
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const left = 14
  const right = 196
  const currency = (details.currency || 'USD').toUpperCase()

  // 1. Company Letterhead Header
  doc.setFillColor(13, 27, 42) // Dark Navy
  doc.rect(left, 12, right - left, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('NETPACK LOGISTICS PVT. LTD.', left + 6, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 225, 235)
  doc.text('International Express Courier & Air Cargo Services', left + 6, 26)
  doc.text('Teku, Kathmandu, Nepal | info@netpackcargo.com | www.netpackcargo.com | Tel: +977-1-4245678', left + 6, 31)

  // Document Badge on Right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(245, 158, 11) // Amber
  doc.text('COMMERCIAL INVOICE', right - 6, 22, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(`Invoice No: ${details.invoiceNumber || 'N/A'}`, right - 6, 27, { align: 'right' })
  doc.text(`Date: ${details.date || new Date().toLocaleDateString()}`, right - 6, 32, { align: 'right' })

  // 2. Metadata Strip
  let y = 43
  doc.setFillColor(243, 244, 246)
  doc.roundedRect(left, y, right - left, 10, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)

  doc.text(`Tracking / AWB: ${details.trackingNumber || 'N/A'}`, left + 4, y + 6.5)
  doc.text(`Currency: ${currency}`, left + 80, y + 6.5)
  if (details.noOfBox) {
    doc.text(`Total Boxes: ${details.noOfBox}`, left + 120, y + 6.5)
  }
  if (details.weight) {
    doc.text(`Weight: ${details.weight} KG`, right - 4, y + 6.5, { align: 'right' })
  }

  // 3. Sender and Consignee Cards Side by Side
  y = 57
  const cardWidth = (right - left - 4) / 2
  const senderLeft = left
  const receiverLeft = left + cardWidth + 4

  // Sender Box Header
  doc.setFillColor(239, 246, 255) // Blue tint
  doc.rect(senderLeft, y, cardWidth, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 64, 175)
  doc.text('SHIPPER / EXPORTER (SENDER)', senderLeft + 3, y + 4.2)

  // Receiver Box Header
  doc.setFillColor(239, 246, 255)
  doc.rect(receiverLeft, y, cardWidth, 6, 'F')
  doc.text('CONSIGNEE (RECEIVER)', receiverLeft + 3, y + 4.2)

  // Draw Card Outlines
  doc.setDrawColor(209, 213, 219)
  doc.rect(senderLeft, y, cardWidth, 34)
  doc.rect(receiverLeft, y, cardWidth, 34)

  // Sender Content
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text(sender.name || 'Sender', senderLeft + 3, y + 10.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(55, 65, 81)
  let yS = y + 15
  if (sender.company) {
    doc.text(sender.company, senderLeft + 3, yS)
    yS += 4
  }
  const sAddr = [sender.addressLine1, sender.addressLine2, sender.postcodeCity].filter(Boolean).join(', ')
  if (sAddr) {
    const sAddrWrapped = doc.splitTextToSize(sAddr, cardWidth - 6)
    doc.text(sAddrWrapped, senderLeft + 3, yS)
    yS += sAddrWrapped.length * 3.5
  }
  if (sender.country) {
    doc.text(`Country: ${sender.country}`, senderLeft + 3, yS)
    yS += 4
  }
  if (sender.telephone) {
    doc.text(`Phone: ${sender.telephone}`, senderLeft + 3, yS)
  }

  // Receiver Content
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text(receiver.name || 'Consignee', receiverLeft + 3, y + 10.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(55, 65, 81)
  let yR = y + 15
  if (receiver.company) {
    doc.text(receiver.company, receiverLeft + 3, yR)
    yR += 4
  }
  const rAddr = [receiver.addressLine1, receiver.addressLine2, receiver.postcodeCity].filter(Boolean).join(', ')
  if (rAddr) {
    const rAddrWrapped = doc.splitTextToSize(rAddr, cardWidth - 6)
    doc.text(rAddrWrapped, receiverLeft + 3, yR)
    yR += rAddrWrapped.length * 3.5
  }
  if (receiver.country) {
    doc.text(`Country: ${receiver.country}`, receiverLeft + 3, yR)
    yR += 4
  }
  if (receiver.telephone) {
    doc.text(`Phone: ${receiver.telephone}`, receiverLeft + 3, yR)
  }

  // 4. Items Table
  y = 96
  const col1X = left
  const col1Width = 14
  const col2X = col1X + col1Width
  const col2Width = 84
  const col3X = col2X + col2Width
  const col3Width = 26
  const col4X = col3X + col3Width
  const col4Width = 22
  const col5X = col4X + col4Width
  const col5Width = 16
  const col6X = col5X + col5Width
  const col6Width = right - col6X

  // Table Header
  doc.setFillColor(31, 41, 55)
  doc.rect(left, y, right - left, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)

  doc.text('S.N.', col1X + col1Width / 2, y + 4.8, { align: 'center' })
  doc.text('Description of Goods', col2X + 3, y + 4.8)
  doc.text('HS Code', col3X + col3Width / 2, y + 4.8, { align: 'center' })
  doc.text(`Unit Price (${currency})`, col4X + col4Width / 2, y + 4.8, { align: 'center' })
  doc.text('Qty', col5X + col5Width / 2, y + 4.8, { align: 'center' })
  doc.text(`Total (${currency})`, col6X + col6Width - 3, y + 4.8, { align: 'right' })

  y += 7
  doc.setFont('helvetica', 'normal')
  let grandTotal = 0
  let totalPieces = 0
  const pageHeight = doc.internal.pageSize.getHeight()
  const bottomMargin = 30
  const baseRowHeight = 7.5
  const padding = 2

  items.forEach((item, index) => {
    const price = parseFloat(item.unitPrice as string) || 0
    const qty = parseFloat(item.quantity as string) || 0
    const subtotal = price * qty
    grandTotal += subtotal
    totalPieces += qty

    const description = String(item.description || 'General Cargo')
    const wrappedDesc = doc.splitTextToSize(description, col2Width - padding * 2)
    const lineHeight = 4
    const descHeight = wrappedDesc.length * lineHeight
    const requiredRowHeight = Math.max(baseRowHeight, descHeight + padding * 2)

    // Check for page overflow
    if (y + requiredRowHeight > pageHeight - bottomMargin) {
      doc.addPage()
      y = 20
      // Redraw table header on new page
      doc.setFillColor(31, 41, 55)
      doc.rect(left, y, right - left, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('S.N.', col1X + col1Width / 2, y + 4.8, { align: 'center' })
      doc.text('Description of Goods', col2X + 3, y + 4.8)
      doc.text('HS Code', col3X + col3Width / 2, y + 4.8, { align: 'center' })
      doc.text(`Unit Price (${currency})`, col4X + col4Width / 2, y + 4.8, { align: 'center' })
      doc.text('Qty', col5X + col5Width / 2, y + 4.8, { align: 'center' })
      doc.text(`Total (${currency})`, col6X + col6Width - 3, y + 4.8, { align: 'right' })
      y += 7
      doc.setFont('helvetica', 'normal')
    }

    // Row alternating background
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251)
      doc.rect(left, y, right - left, requiredRowHeight, 'F')
    }

    doc.setDrawColor(229, 231, 235)
    doc.rect(left, y, right - left, requiredRowHeight)

    doc.setFontSize(8)
    doc.setTextColor(55, 65, 81)
    doc.text(String(index + 1), col1X + col1Width / 2, y + requiredRowHeight / 2 + 1, { align: 'center' })
    doc.text(wrappedDesc, col2X + padding, y + padding + 3)
    doc.text(item.hsCode || '-', col3X + col3Width / 2, y + requiredRowHeight / 2 + 1, { align: 'center' })
    doc.text(price.toFixed(2), col4X + col4Width / 2, y + requiredRowHeight / 2 + 1, { align: 'center' })
    doc.text(String(qty), col5X + col5Width / 2, y + requiredRowHeight / 2 + 1, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.text(subtotal.toFixed(2), col6X + col6Width - 3, y + requiredRowHeight / 2 + 1, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    y += requiredRowHeight
  })

  // Grand Total Row
  doc.setFillColor(243, 244, 246)
  doc.rect(left, y, right - left, 8, 'F')
  doc.setDrawColor(209, 213, 219)
  doc.rect(left, y, right - left, 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text('GRAND TOTAL', col2X + 3, y + 5.5)
  doc.text(String(totalPieces), col5X + col5Width / 2, y + 5.5, { align: 'center' })
  doc.setTextColor(30, 64, 175)
  doc.text(`${currency} ${grandTotal.toFixed(2)}`, col6X + col6Width - 3, y + 5.5, { align: 'right' })
  y += 12

  // Amount in Words
  doc.setFillColor(254, 243, 199) // Light amber
  doc.roundedRect(left, y, right - left, 11, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(146, 64, 14)
  doc.text('Amount in Words:', left + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(31, 41, 55)
  doc.text(numberToWords(grandTotal, currency), left + 30, y + 4.5)

  y += 16
  // Declaration & Signature Footer
  if (y + 24 > pageHeight - 15) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text(
    'Declaration: We declare that this commercial invoice shows the actual price of the goods described and that all particulars are true and correct.',
    left,
    y
  )

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(17, 24, 39)
  doc.text('Authorized Signature & Stamp:', right - 60, y)
  doc.setDrawColor(156, 163, 175)
  doc.line(right - 60, y + 10, right, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text('For NetPack Logistics Pvt. Ltd.', right - 60, y + 14)

  const safeTracking = (details.trackingNumber || details.invoiceNumber || 'NetPack').replace(/[^\w-]/g, '_')
  doc.save(`Invoice-${safeTracking}.pdf`)
}

// ==========================================
// 2. OFFICIAL PACKING LIST GENERATOR (PDF)
// ==========================================
export function generatePackingListPDF({
  sender,
  receiver,
  boxes,
  items,
  details,
}: {
  sender: InvoiceSenderReceiver
  receiver: InvoiceSenderReceiver
  boxes: any[]
  items: InvoiceItem[]
  details: InvoiceDetails
}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const left = 14
  const right = 196
  const pageHeight = doc.internal.pageSize.getHeight()

  // 1. Company Letterhead Header
  doc.setFillColor(13, 27, 42) // Dark Navy
  doc.rect(left, 12, right - left, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('NETPACK LOGISTICS PVT. LTD.', left + 6, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 225, 235)
  doc.text('International Express Courier & Air Cargo Services', left + 6, 26)
  doc.text('Teku, Kathmandu, Nepal | info@netpackcargo.com | www.netpackcargo.com | Tel: +977-1-4245678', left + 6, 31)

  // Document Badge on Right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(16, 185, 129) // Emerald
  doc.text('PACKING LIST', right - 6, 22, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text(`Ref / No: ${details.invoiceNumber || 'N/A'}`, right - 6, 27, { align: 'right' })
  doc.text(`Date: ${details.date || new Date().toLocaleDateString()}`, right - 6, 32, { align: 'right' })

  // 2. Metadata Strip
  let y = 43
  doc.setFillColor(243, 244, 246)
  doc.roundedRect(left, y, right - left, 10, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)

  doc.text(`Tracking / AWB: ${details.trackingNumber || 'N/A'}`, left + 4, y + 6.5)
  doc.text(`Total Packages: ${details.noOfBox || (boxes && boxes.length) || 1} Box(es)`, left + 75, y + 6.5)
  doc.text(`Gross Wt: ${details.weight || '0'} KG`, left + 130, y + 6.5)
  if (details.dimWeight) {
    doc.text(`Vol Wt: ${details.dimWeight} KG`, right - 4, y + 6.5, { align: 'right' })
  }

  // 3. Sender and Consignee Cards
  y = 57
  const cardWidth = (right - left - 4) / 2
  const senderLeft = left
  const receiverLeft = left + cardWidth + 4

  // Sender Box Header
  doc.setFillColor(236, 253, 245) // Emerald tint
  doc.rect(senderLeft, y, cardWidth, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(6, 95, 70)
  doc.text('SHIPPER / EXPORTER', senderLeft + 3, y + 4.2)

  // Receiver Box Header
  doc.setFillColor(236, 253, 245)
  doc.rect(receiverLeft, y, cardWidth, 6, 'F')
  doc.text('CONSIGNEE (RECEIVER)', receiverLeft + 3, y + 4.2)

  // Draw Card Outlines
  doc.setDrawColor(209, 213, 219)
  doc.rect(senderLeft, y, cardWidth, 34)
  doc.rect(receiverLeft, y, cardWidth, 34)

  // Sender Content
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text(sender.name || 'Sender', senderLeft + 3, y + 10.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(55, 65, 81)
  let yS = y + 15
  if (sender.company) {
    doc.text(sender.company, senderLeft + 3, yS)
    yS += 4
  }
  const sAddr = [sender.addressLine1, sender.addressLine2, sender.postcodeCity].filter(Boolean).join(', ')
  if (sAddr) {
    const sAddrWrapped = doc.splitTextToSize(sAddr, cardWidth - 6)
    doc.text(sAddrWrapped, senderLeft + 3, yS)
    yS += sAddrWrapped.length * 3.5
  }
  if (sender.country) {
    doc.text(`Country: ${sender.country}`, senderLeft + 3, yS)
    yS += 4
  }
  if (sender.telephone) {
    doc.text(`Phone: ${sender.telephone}`, senderLeft + 3, yS)
  }

  // Receiver Content
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text(receiver.name || 'Consignee', receiverLeft + 3, y + 10.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(55, 65, 81)
  let yR = y + 15
  if (receiver.company) {
    doc.text(receiver.company, receiverLeft + 3, yR)
    yR += 4
  }
  const rAddr = [receiver.addressLine1, receiver.addressLine2, receiver.postcodeCity].filter(Boolean).join(', ')
  if (rAddr) {
    const rAddrWrapped = doc.splitTextToSize(rAddr, cardWidth - 6)
    doc.text(rAddrWrapped, receiverLeft + 3, yR)
    yR += rAddrWrapped.length * 3.5
  }
  if (receiver.country) {
    doc.text(`Country: ${receiver.country}`, receiverLeft + 3, yR)
    yR += 4
  }
  if (receiver.telephone) {
    doc.text(`Phone: ${receiver.telephone}`, receiverLeft + 3, yR)
  }

  // 4. Packing List Table
  y = 96
  const col1X = left
  const col1Width = 18 // Box No
  const col2X = col1X + col1Width
  const col2Width = 82 // Particulars
  const col3X = col2X + col2Width
  const col3Width = 20 // Qty
  const col4X = col3X + col3Width
  const col4Width = 24 // Weight (KG)
  const col5X = col4X + col4Width
  const col5Width = right - col5X // Dimensions / Remarks

  // Table Header
  doc.setFillColor(31, 41, 55)
  doc.rect(left, y, right - left, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)

  doc.text('Box No.', col1X + col1Width / 2, y + 4.8, { align: 'center' })
  doc.text('Particulars / Contents Description', col2X + 3, y + 4.8)
  doc.text('Qty (Pcs)', col3X + col3Width / 2, y + 4.8, { align: 'center' })
  doc.text('Box Wt (KG)', col4X + col4Width / 2, y + 4.8, { align: 'center' })
  doc.text('Dimensions / Remarks', col5X + col5Width / 2, y + 4.8, { align: 'center' })

  y += 7
  let totalQuantity = 0
  let totalWeight = 0
  const bottomMargin = 30
  const baseRowHeight = 7.5
  const padding = 2

  // Determine whether box data is present
  const boxesSafe = Array.isArray(boxes) && boxes.length > 0 ? boxes : null

  if (boxesSafe) {
    boxesSafe.forEach((box: any, bIdx: number) => {
      const boxNo = bIdx + 1
      const boxWeight = parseFloat(box.weight || box.actualWeight || 0)
      totalWeight += boxWeight
      const dims = [box.length, box.width, box.height].filter(Boolean).join(' x ')
      const dimStr = dims ? `${dims} cm` : (box.dimensions || '-')

      const boxItems = Array.isArray(box.items) && box.items.length > 0 ? box.items : []
      if (boxItems.length > 0) {
        boxItems.forEach((bItem: any, iIdx: number) => {
          const qty = parseFloat(bItem.quantity || bItem.qty || 1)
          totalQuantity += qty
          const desc = bItem.enquiryItem?.description || bItem.description || 'Assorted Items'
          const wrappedDesc = doc.splitTextToSize(desc, col2Width - padding * 2)
          const descHeight = wrappedDesc.length * 4
          const rowHeight = Math.max(baseRowHeight, descHeight + padding * 2)

          if (y + rowHeight > pageHeight - bottomMargin) {
            doc.addPage()
            y = 20
            // Redraw header
            doc.setFillColor(31, 41, 55)
            doc.rect(left, y, right - left, 7, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(255, 255, 255)
            doc.text('Box No.', col1X + col1Width / 2, y + 4.8, { align: 'center' })
            doc.text('Particulars / Contents Description', col2X + 3, y + 4.8)
            doc.text('Qty (Pcs)', col3X + col3Width / 2, y + 4.8, { align: 'center' })
            doc.text('Box Wt (KG)', col4X + col4Width / 2, y + 4.8, { align: 'center' })
            doc.text('Dimensions / Remarks', col5X + col5Width / 2, y + 4.8, { align: 'center' })
            y += 7
          }

          doc.setDrawColor(229, 231, 235)
          doc.rect(left, y, right - left, rowHeight)

          doc.setFont('helvetica', iIdx === 0 ? 'bold' : 'normal')
          doc.setFontSize(8)
          doc.setTextColor(31, 41, 55)

          // Only print Box No & Box Weight on first item of the box
          if (iIdx === 0) {
            doc.text(`Box ${boxNo}`, col1X + col1Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
            doc.text(boxWeight > 0 ? boxWeight.toFixed(2) : '-', col4X + col4Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
            doc.text(dimStr, col5X + col5Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
          }

          doc.text(wrappedDesc, col2X + padding, y + padding + 3)
          doc.text(String(qty), col3X + col3Width / 2, y + rowHeight / 2 + 1, { align: 'center' })

          y += rowHeight
        })
      } else {
        // Empty box or summary row
        const rowHeight = baseRowHeight
        if (y + rowHeight > pageHeight - bottomMargin) {
          doc.addPage()
          y = 20
        }
        doc.setDrawColor(229, 231, 235)
        doc.rect(left, y, right - left, rowHeight)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(31, 41, 55)
        doc.text(`Box ${boxNo}`, col1X + col1Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.text('Packed Consignment Goods', col2X + 3, y + rowHeight / 2 + 1)
        doc.text('-', col3X + col3Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
        doc.text(boxWeight > 0 ? boxWeight.toFixed(2) : '-', col4X + col4Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
        doc.text(dimStr, col5X + col5Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
        y += rowHeight
      }
    })
  } else {
    // Fallback: list items directly
    items.forEach((item, index) => {
      const qty = parseFloat(item.quantity as string) || 0
      totalQuantity += qty
      const desc = String(item.description || 'General Cargo')
      const wrappedDesc = doc.splitTextToSize(desc, col2Width - padding * 2)
      const descHeight = wrappedDesc.length * 4
      const rowHeight = Math.max(baseRowHeight, descHeight + padding * 2)

      if (y + rowHeight > pageHeight - bottomMargin) {
        doc.addPage()
        y = 20
      }

      doc.setDrawColor(229, 231, 235)
      doc.rect(left, y, right - left, rowHeight)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(31, 41, 55)
      doc.text(String(index + 1), col1X + col1Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
      doc.text(wrappedDesc, col2X + padding, y + padding + 3)
      doc.text(String(qty), col3X + col3Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
      doc.text('-', col4X + col4Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
      doc.text(item.hsCode ? `HS: ${item.hsCode}` : '-', col5X + col5Width / 2, y + rowHeight / 2 + 1, { align: 'center' })
      y += rowHeight
    })
  }

  // Summary Row
  doc.setFillColor(243, 244, 246)
  doc.rect(left, y, right - left, 8, 'F')
  doc.setDrawColor(209, 213, 219)
  doc.rect(left, y, right - left, 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(17, 24, 39)
  doc.text('TOTAL', col2X + 3, y + 5.5)
  doc.text(String(totalQuantity), col3X + col3Width / 2, y + 5.5, { align: 'center' })
  const displayTotalWeight = totalWeight > 0 ? totalWeight.toFixed(2) : (details.weight ? String(details.weight) : '-')
  doc.text(`${displayTotalWeight} KG`, col4X + col4Width / 2, y + 5.5, { align: 'center' })
  doc.text(`${details.noOfBox || (boxes && boxes.length) || 1} Box(es)`, col5X + col5Width / 2, y + 5.5, { align: 'center' })
  y += 12

  // Quantity in Words
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(left, y, right - left, 11, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(6, 95, 70)
  doc.text('Total Quantity:', left + 3, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(31, 41, 55)
  doc.text(numberToWordsQuantity(totalQuantity), left + 28, y + 4.5)

  y += 16
  // Declaration & Signature Footer
  if (y + 24 > pageHeight - 15) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text(
    'We hereby certify that the above mentioned goods are properly packed and labeled in accordance with international carriage standards.',
    left,
    y
  )

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(17, 24, 39)
  doc.text('Authorized Signature & Stamp:', right - 60, y)
  doc.setDrawColor(156, 163, 175)
  doc.line(right - 60, y + 10, right, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text('For NetPack Logistics Pvt. Ltd.', right - 60, y + 14)

  const safeTracking = (details.trackingNumber || details.invoiceNumber || 'NetPack').replace(/[^\w-]/g, '_')
  doc.save(`PackingList-${safeTracking}.pdf`)
}
