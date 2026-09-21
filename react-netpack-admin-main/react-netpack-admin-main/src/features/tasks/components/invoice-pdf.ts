import jsPDF from 'jspdf'

// Improved number to words for up to millions
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only'
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
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 ? ' ' + inWords(n % 1000) : '')
      )
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 ? ' ' + inWords(n % 100000) : '')
      )
    return (
      inWords(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 ? ' ' + inWords(n % 10000000) : '')
    )
  }
  const [whole, decimal] = num.toFixed(2).split('.')
  let words = inWords(parseInt(whole, 10)) + ' Rupees'
  if (parseInt(decimal, 10) > 0) {
    words += ' and ' + inWords(parseInt(decimal, 10)) + ' Paise'
  }
  return words + ' Only'
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
}

export interface InvoiceDetails {
  invoiceNumber: string
  date: string
  dueDate: string
}

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
  const left = 20
  const right = 190

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('INVOICE', left, 35)

  // Date on top right
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${details.date}`, right - 2, 20, { align: 'right' })

  let ySender = 50
  // Sender
  doc.setFont('helvetica', 'bold')
  doc.text('Sender:', left, ySender)
  doc.setFont('helvetica', 'normal')
  doc.text(sender.name || '', left, ySender + 5)
  let ySenderDetails = ySender + 10
  if (sender.company) {
    doc.text(sender.company, left, ySenderDetails)
    ySenderDetails += 5
  }
  if (sender.addressLine1) {
    doc.text(sender.addressLine1, left, ySenderDetails)
    ySenderDetails += 5
  }
  if (sender.addressLine2) {
    doc.text(sender.addressLine2, left, ySenderDetails)
    ySenderDetails += 5
  }
  if (sender.postcodeCity) {
    doc.text(sender.postcodeCity, left, ySenderDetails)
    ySenderDetails += 5
  }
  if (sender.country) {
    doc.text(sender.country, left, ySenderDetails)
    ySenderDetails += 5
  }
  if (sender.telephone) {
    doc.text('Phone: ' + sender.telephone, left, ySenderDetails)
    ySenderDetails += 5
  }
  if (sender.email) {
    doc.text('Email: ' + sender.email, left, ySenderDetails)
    ySenderDetails += 5
  }

  // Receiver
  let yReceiver = 50
  doc.setFont('helvetica', 'bold')
  doc.text('Receiver:', right - 50, yReceiver)
  doc.setFont('helvetica', 'normal')
  doc.text(receiver.name || '', right - 50, yReceiver + 5)
  let yReceiverDetails = yReceiver + 10
  if (receiver.company) {
    doc.text(receiver.company, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }
  if (receiver.addressLine1) {
    doc.text(receiver.addressLine1, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }
  if (receiver.addressLine2) {
    doc.text(receiver.addressLine2, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }
  if (receiver.postcodeCity) {
    doc.text(receiver.postcodeCity, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }
  if (receiver.country) {
    doc.text(receiver.country, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }
  if (receiver.telephone) {
    doc.text('Phone: ' + receiver.telephone, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }
  if (receiver.email) {
    doc.text('Email: ' + receiver.email, right - 50, yReceiverDetails)
    yReceiverDetails += 5
  }

  // Invoice number
  let y = Math.max(ySenderDetails, yReceiverDetails) + 8
  doc.setFont('helvetica', 'bold')
  doc.text('Invoice Number:', left, y)
  doc.setFont('helvetica', 'normal')
  doc.text(details.invoiceNumber, left + 40, y)
  y += 10

  // Divider line
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(left, y, right, y)
  y += 8

  // Table header
  doc.setFont('helvetica', 'bold')
  const col1X = left
  const col1Width = 50
  const col2X = col1X + col1Width
  const col2Width = 25
  const col3X = col2X + col2Width
  const col3Width = 25
  const col4X = col3X + col3Width
  const col4Width = 25
  const col5X = col4X + col4Width
  const col5Width = 45

  doc.text('Item Description', col1X + col1Width / 2, y + 7, {
    align: 'center',
  })
  doc.text('HS Code', col2X + col2Width / 2, y + 7, { align: 'center' })
  doc.text('Price', col3X + col3Width / 2, y + 7, { align: 'center' })
  doc.text('Quantity', col4X + col4Width / 2, y + 7, { align: 'center' })
  doc.text('Subtotal', col5X + col5Width / 2, y + 7, { align: 'center' })

  y += 12
  doc.setFont('helvetica', 'normal')
  let grandTotal = 0
  const pageHeight = doc.internal.pageSize.getHeight()
  const bottomMargin = 20
  const baseRowHeight = 12
  const padding = 3
  let page = 1

  items.forEach((item) => {
    // Check for new page
    if (y + baseRowHeight > pageHeight - bottomMargin) {
      doc.addPage()
      page++
      y = 30
    }

    const price = parseFloat(item.unitPrice as string) || 0
    const qty = parseFloat(item.quantity as string) || 0
    const subtotal = price * qty
    grandTotal += subtotal

    // === DYNAMIC ROW HEIGHT FIX ===
    const description = String(item.description || '')
    const wrappedDesc = doc.splitTextToSize(
      description,
      col1Width - padding * 2
    )
    const lineHeight = 5
    const descHeight = wrappedDesc.length * lineHeight
    const requiredRowHeight = Math.max(baseRowHeight, descHeight + padding * 2)

    // Draw row border
    doc.setDrawColor(0)
    doc.rect(left, y - padding, right - left + 10, requiredRowHeight)

    // Description
    doc.text(
      wrappedDesc,
      col1X + padding,
      y + (requiredRowHeight - descHeight) / 2 + lineHeight / 2
    )

    // HS Code
    doc.text(
      item.hsCode || '',
      col2X + col2Width / 2,
      y + requiredRowHeight / 2,
      {
        align: 'center',
      }
    )

    // Price
    doc.text(
      price.toFixed(2),
      col3X + col3Width / 2,
      y + requiredRowHeight / 2,
      {
        align: 'center',
      }
    )

    // Quantity
    doc.text(String(qty), col4X + col4Width / 2, y + requiredRowHeight / 2, {
      align: 'center',
    })

    // Subtotal
    doc.text(
      subtotal.toFixed(2),
      col5X + col5Width / 2,
      y + requiredRowHeight / 2,
      {
        align: 'center',
      }
    )

    y += requiredRowHeight
  })

  // Total row
  doc.setFont('helvetica', 'bold')
  doc.rect(left, y - padding, right - left + 10, baseRowHeight)
  doc.text('Total', col4X + col4Width / 2, y + baseRowHeight / 2, {
    align: 'center',
  })
  doc.text(
    grandTotal.toFixed(2),
    col5X + col5Width / 2,
    y + baseRowHeight / 2,
    {
      align: 'center',
    }
  )
  y += 14

  // Total in words
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.text('Grand Total (in words):', left, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(numberToWords(grandTotal), left, y)

  doc.save('invoice.pdf')
}
