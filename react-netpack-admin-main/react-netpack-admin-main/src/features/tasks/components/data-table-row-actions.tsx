import { useState, useEffect } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconTrash } from '@tabler/icons-react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { getUserRole } from '@/lib/auth'
import http from '@/utils/http'
import { SHIPMENT_ENDPOINT } from '@/constants/endpoint'
import { ENQUIRY_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from '../context/tasks-context'
import { generateInvoicePDF } from './invoice-pdf'
import { generateShippingLabelPDF } from './shipping-label-pdf'

interface DataTableRowActionsProps<
  TData extends { id: string | number; status?: string },
> {
  row: Row<TData>
}

export function DataTableRowActions<
  TData extends { id: string | number; status?: string },
>({ row }: DataTableRowActionsProps<TData>) {
  const task = row.original
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [enquiryData, setEnquiryData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const { setOpen, setCurrentRow, onRefresh } = useTasks()

  const isEditableStatus = [
    'ENQUIRY_GENERATED',
    'PENDING',
    'PICKED_UP',
  ].includes((task?.status || '').toUpperCase())

  const role = getUserRole()
  const isAdmin = ['ADMIN', 'OPERATIONS', 'CSD'].includes(
    (role || '').toUpperCase()
  )
  const isPickup = (role || '').toUpperCase() === 'PICKUP'

  // Fetch full enquiry data when opening the invoice modal
  useEffect(() => {
    if (showInvoiceModal && task?.id) {
      setLoading(true)
      setEnquiryData(null)
      fetch(`${ENQUIRY_ENDPOINTS.GET_BY_ID_ENQUIRY}/${task.id}`)
        .then((res) => res.json())
        .then((data) => setEnquiryData(data))
        .catch(() => setEnquiryData(null))
        .finally(() => setLoading(false))
    }
    if (!showInvoiceModal) {
      setEnquiryData(null)
    }
  }, [showInvoiceModal, task?.id])

  // Use flat fields from EnquiryTableRow for sender/receiver
  const sender = enquiryData
    ? {
        name: enquiryData.senderName || '',
        addressLine1: enquiryData.senderAddressLine1 || '',
        addressLine2: enquiryData.senderAddressLine2 || '',
        postcodeCity: enquiryData.senderPostcodeCity || '',
        country: enquiryData.senderCountry || '',
        telephone: enquiryData.senderPhone || '',
        email: enquiryData.senderEmail || '',
      }
    : { name: '' }
  const receiver = enquiryData
    ? {
        name: enquiryData.receiverName || '',
        companyName: enquiryData.receiverCompanyName || '',
        addressLine1: enquiryData.receiverAddressLine1 || '',
        addressLine2: enquiryData.receiverAddressLine2 || '',
        postcodeCity: enquiryData.receiverPostcodeCity || '',
        country: enquiryData.receiverCountry || '',
        telephone: enquiryData.receiverTelephone || '',
        email: enquiryData.receiverEmail || '',
      }
    : { name: '' }
  const items = enquiryData?.items || []

  const handleGenerateInvoicePDF = () => {
    if (!enquiryData) return
    generateInvoicePDF({
      sender,
      receiver,
      items: items.map((item: any) => ({
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        hsCode: item.hsCode,
      })),
      details: {
        invoiceNumber: String(enquiryData.id || ''),
        date: enquiryData.createdAt
          ? new Date(enquiryData.createdAt).toLocaleDateString()
          : '',
        dueDate: enquiryData.dueDate
          ? new Date(enquiryData.dueDate).toLocaleDateString()
          : '',
      },
    })
  }

  // DEMO: Generate shipping label with hardcoded values matching the image
  const handleDemoShippingLabel = async () => {
    function formatAddress(data: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postcode?: string
      country?: string
    }) {
      const parts = [
        data.line1,
        data.line2,
        data.city,
        data.state,
        data.postcode,
        data.country,
      ]
        .filter(Boolean)
        .map((p) => p!.trim())

      // Remove duplicates
      const uniqueParts = [...new Set(parts)]

      return uniqueParts.join(', ')
    }
    if (!task?.id) return
    try {
      const res = await fetch(
        `${ENQUIRY_ENDPOINTS.GET_BY_ID_ENQUIRY}/${task.id}`
      )
      if (!res.ok) throw new Error('Failed to fetch enquiry details')
      const data = await res.json()
      await generateShippingLabelPDF({
        labels: data.boxes.map((box: any, index: number) => ({
          date: data.createdAt,
          sender: {
            name: data.senderName,
            address: formatAddress({
              line1: data.senderAddressLine1,
              line2: data.senderAddressLine2,
              city: data.senderCity,
              postcode: data.senderPostcode,
              country: data.senderCountry,
            }),
            phone: data.senderPhone,
          },

          receiver: {
            name: data.receiverName,
            address: formatAddress({
              line1: data.receiverAddressLine1,
              line2: data.receiverAddressLine2,
              city: data.receiverCity,
              state: data.receiverState,
              postcode: data.receiverPostcode,
              country: data.receiverCountry,
            }),
            phone: data.receiverTelephone,
          },

          packageDetails: {
            weight: box.weight + ' kg',
            dimensions: `${box.length}x${box.breadth}x${box.height}`,
          },

          additionalInfo: {
            boxNumber: `Box ${index + 1}/${data.boxes.length}`,
          },
          trackingNumber: data.trackingNumber,
        })),
      })
    } catch (err) {
      console.log(err)
      toast.error('Failed to generate shipping label', { duration: 3000 })
    }
  }

  const handleDelete = async () => {
    if (!task) return
    try {
      await http.delete(`${ENQUIRY_ENDPOINTS.DELETE_ENQUIRY}/${task.id}`)
      toast.success('Enquiry deleted successfully!', { duration: 3000 })
      onRefresh()
    } catch (err) {
      toast.error('Failed to delete enquiry', { duration: 3000 })
    }
  }

  const handleGenerateInvoiceExcel = () => {
    const enquiry: any = enquiryData || {}
    const itemsSafe: any[] = Array.isArray(items) ? items : []
    const boxesSafe: any[] = Array.isArray(enquiry?.boxes) ? enquiry?.boxes : []

    const totalBoxes = enquiry?.noOfBox || ''
    const totalWeight = enquiry?.weight || ''
    const totalDimWeight = enquiry?.dimWeight || ''
    const currency = enquiry?.currency || 'USD'

    // ==================== COMMON HEADER ====================
    const buildCommonHeader = () => {
      const rows: any[][] = []

      rows.push(['INVOICE CUM PACKING LIST', '', '', '', '', '', ''])
      rows.push([''])

      rows.push([
        'From:',
        'SHIPPER DETAILS',
        '',
        '',
        'INVOICE REFERENCE :',
        '',
        '',
      ])
      rows.push([
        'Consignee Name',
        'NETPACK TRADEIN',
        '',
        '',
        'TOTAL PCS :',
        totalBoxes,
        'BOXES',
      ])
      rows.push(['Country:', 'NEPAL', '', '', 'TOTAL WT :', totalWeight, 'KGS'])
      rows.push([
        'Tel.#',
        'TEL: 015339942',
        '',
        '',
        'TOTAL DIM WGT :',
        totalDimWeight,
        '',
      ])
      rows.push([''])

      const sender = {
        name: enquiry.senderName || '',
        address1: enquiry.senderAddressLine1 || '',
        address2: enquiry.senderAddressLine2 || '',
        postcodeCity: enquiry.senderPostcodeCity || '',
        country: enquiry.senderCountry || '',
        phone: enquiry.senderPhone ? `Phone: ${enquiry.senderPhone}` : '',
        email: enquiry.senderEmail ? `Email: ${enquiry.senderEmail}` : '',
      }

      const receiver = {
        name: enquiry.receiverName || '',
        address1: enquiry.receiverAddressLine1 || '',
        address2: enquiry.receiverAddressLine2 || '',
        postcodeCity: enquiry.receiverPostcodeCity || '',
        country: enquiry.receiverCountry || '',
        phone: enquiry.receiverTelephone
          ? `Phone: ${enquiry.receiverTelephone}`
          : '',
        email: enquiry.receiverEmail ? `Email: ${enquiry.receiverEmail}` : '',
      }

      const labels = [
        'Exporter (Sender):',
        'Name:',
        'Address Line 1:',
        'Address Line 2:',
        'City & Postcode:',
        'Country:',
        'Phone:',
        'Email:',
      ]

      const senderValues = [
        '',
        sender.name,
        sender.address1,
        sender.address2,
        sender.postcodeCity,
        sender.country,
        sender.phone,
        sender.email,
      ]

      const receiverValues = [
        receiver.name,
        receiver.address1,
        receiver.address2,
        receiver.postcodeCity,
        receiver.country,
        receiver.phone,
        receiver.email,
      ]

      for (let i = 0; i < labels.length; i++) {
        rows.push([
          labels[i],
          senderValues[i] || '',
          '',
          '',
          i === 0 ? 'Consignee (Receiver):' : '',
          receiverValues[i] || '',
          '',
        ])
      }

      rows.push([''])
      return rows
    }

    // ==================== INVOICE SHEET ====================
    const invoiceRows: any[][] = [...buildCommonHeader()]

    invoiceRows.push([
      'S.No',
      'Description of Goods',
      'HS Code',
      'Unit Price',
      'Quantity',
      'Subtotal',
      '',
    ])

    let grandTotal = 0
    itemsSafe.forEach((it: any, idx: number) => {
      const price = Number(it?.unitPrice || 0)
      const qty = Number(it?.quantity || 0)
      const subtotal = price * qty
      grandTotal += subtotal

      invoiceRows.push([
        String(idx + 1),
        it?.description || '',
        it?.hsCode || '',
        price,
        qty,
        subtotal,
        '',
      ])
    })

    invoiceRows.push([''])
    invoiceRows.push(['', 'Grand Total', '', '', '', grandTotal, ''])
    invoiceRows.push([''])
    invoiceRows.push([
      `Amount in words: ${numberToWordsUSD(grandTotal)}`,
      '',
      '',
      '',
      '',
      '',
      '',
    ])
    invoiceRows.push(['Currency', currency, 'w', '', '', ''])

    const wsInvoice = XLSX.utils.aoa_to_sheet(invoiceRows)

    const commonCols = [
      { wch: 20 },
      { wch: 39 },
      { wch: 13 },
      { wch: 18 },
      { wch: 20 },
      { wch: 39 },
      { wch: 9 },
    ]

    wsInvoice['!cols'] = commonCols
    wsInvoice['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      {
        s: { r: invoiceRows.length - 3, c: 3 },
        e: { r: invoiceRows.length - 3, c: 4 },
      },
      {
        s: { r: invoiceRows.length - 2, c: 0 },
        e: { r: invoiceRows.length - 2, c: 6 },
      },
    ]

    // ==================== PACKING LIST SHEET ====================
    const packingRows: any[][] = [...buildCommonHeader()]

    packingRows.push([
      'Box No',
      'Particulars',
      'QTY',
      'Weight (KG)',
      '',
      'Remarks',
      '',
    ])
    packingRows.push(['', '', '', '', '', '', ''])

    let totalQuantity = 0

    boxesSafe.forEach((box: any, boxIndex: number) => {
      const boxNo = boxIndex + 1
      const boxItems = box.items || []

      if (boxItems.length > 0) {
        const firstItem = boxItems[0]
        const qty = firstItem.quantity || 0
        totalQuantity += qty

        packingRows.push([
          String(boxNo),
          firstItem.enquiryItem?.description || '',
          qty,
          box.weight || 0,
          '',
          '',
          '',
        ])

        for (let i = 1; i < boxItems.length; i++) {
          const item = boxItems[i]
          totalQuantity += item.quantity || 0

          packingRows.push([
            '',
            item.enquiryItem?.description || '',
            item.quantity || 0,
            '',
            '',
            '',
            '',
          ])
        }
      } else {
        packingRows.push([String(boxNo), '', '', box.weight || 0, '', '', ''])
      }

      packingRows.push(['', '', '', '', '', '', ''])
    })

    packingRows.push(['', 'Total', totalQuantity, '', '', '', ''])
    packingRows.push(['', '', '', '', '', '', ''])
    packingRows.push([
      `In words: ${numberToWordsSimple(totalQuantity)} Pieces Only.`,
      '',
      '',
      '',
      '',
      '',
      '',
    ])

    const wsPacking = XLSX.utils.aoa_to_sheet(packingRows)

    // ✅ SAME WIDTH AS INVOICE
    wsPacking['!cols'] = commonCols

    wsPacking['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      {
        s: { r: packingRows.length - 1, c: 0 },
        e: { r: packingRows.length - 1, c: 6 },
      },
    ]

    // ==================== WORKBOOK ====================
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsInvoice, 'Invoice')
    XLSX.utils.book_append_sheet(wb, wsPacking, 'Packing List')

    const sanitize = (value: string) =>
      (value || 'unknown')
        .replace(/[^\w\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '_') // replace spaces with underscore

    const senderName = sanitize(enquiry.senderName || 'customer')
    const receiverName = sanitize(enquiry.receiverName || 'receiver')

    const fileName = `${senderName} - ${receiverName}.xlsx`
    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    })

    saveAs(
      new Blob([excelBuffer], { type: 'application/octet-stream' }),
      fileName
    )
  }

  // Helper function: Number to words for USD
  const numberToWordsUSD = (num: number): string => {
    if (num === 0) return 'Zero US Dollars Only'

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
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
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
      return (
        inWords(Math.floor(n / 1000000000)) +
        ' Billion' +
        (n % 1000000000 ? ' ' + inWords(n % 1000000000) : '')
      )
    }

    const [whole, decimal] = num.toFixed(2).split('.')
    let words = inWords(parseInt(whole, 10))

    if (parseInt(decimal, 10) > 0) {
      words += ` and ${decimal}/100`
    }

    return words + ' Only'
  }

  // Helper function: Simple number to words for quantity
  const numberToWordsSimple = (num: number): string => {
    if (num === 0) return 'Zero'

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
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
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
      return (
        inWords(Math.floor(n / 1000000)) +
        ' Million' +
        (n % 1000000 ? ' ' + inWords(n % 1000000) : '')
      )
    }

    return inWords(num)
  }

  const handlePickedUp = async () => {
    if (!task?.id) return
    try {
      await http.patch(ENQUIRY_ENDPOINTS.UPDATE_STATUS(task.id), {
        status: 'PICKED_UP',
      })
      toast.success('Enquiry marked as Picked Up!', { duration: 3000 })
      onRefresh()
    } catch (err) {
      toast.error('Failed to update status', { duration: 3000 })
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          {isPickup ? (
            <>
              <DropdownMenuItem
                onClick={() => {
                  if (!task) return
                  setCurrentRow(task as any)
                  setOpen('info')
                }}
              >
                Get Information / Pickup Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePickedUp}>
                Picked Up
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                disabled={!isEditableStatus}
                onClick={() => {
                  if (!task) return
                  setCurrentRow(task as any)
                  setOpen('modal')
                }}
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  if (!task) return
                  setCurrentRow(task as any)
                  setOpen('info')
                }}
              >
                Get Information / Pickup Instruction
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem
                  onClick={async () => {
                    if (!task) return
                    try {
                      await http.post(
                        SHIPMENT_ENDPOINT.PUSH_TO_SHIPMENT(task.id),
                        {}
                      )
                      toast.success('Pushed to shipment!', { duration: 3000 })
                      onRefresh()
                    } catch (err) {
                      toast.error('Failed to push to shipment', {
                        duration: 3000,
                      })
                    }
                  }}
                >
                  Push to Shipment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowInvoiceModal(true)}>
                Generate Invoice
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDemoShippingLabel}>
                Generate Shipping Label
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isEditableStatus && (
                <DropdownMenuItem
                  onClick={() => {
                    if (!task) return
                    setShowDeleteConfirm(true)
                  }}
                >
                  Delete
                  <DropdownMenuShortcut>
                    <IconTrash size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Delete this enquiry: ${task?.id} ?`}
        desc={
          <>
            You are about to delete an enquiry with the ID{' '}
            <strong>{task?.id}</strong>. <br />
            This action cannot be undone.
          </>
        }
        confirmText='Delete'
        destructive
        handleConfirm={handleDelete}
      />

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className='flex max-h-[90vh] max-w-4xl flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>
              <span className='mb-2 block text-center text-2xl font-bold tracking-widest'>
                INVOICE
              </span>
            </DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className='py-8 text-center'>Loading...</div>
          ) : enquiryData ? (
            <div className='flex-1 overflow-y-auto'>
              <div className='bg-muted/40 mb-8 grid grid-cols-1 gap-8 rounded-lg border p-6 md:grid-cols-2'>
                <div>
                  <div className='text-primary mb-3 text-lg font-semibold'>
                    Sender Details
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Name:
                    </span>{' '}
                    {sender.name}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Address Line 1:
                    </span>{' '}
                    {sender.addressLine1}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Address Line 2:
                    </span>{' '}
                    {sender.addressLine2}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Postcode/City:
                    </span>{' '}
                    {sender.postcodeCity}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Country:
                    </span>{' '}
                    {sender.country}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Phone:
                    </span>{' '}
                    {sender.telephone}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Email:
                    </span>{' '}
                    {sender.email}
                  </div>
                </div>
                <div>
                  <div className='text-primary mb-3 text-lg font-semibold'>
                    Receiver Details
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Name:
                    </span>{' '}
                    {receiver.name}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Address Line 1:
                    </span>{' '}
                    {receiver.addressLine1}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Address Line 2:
                    </span>{' '}
                    {receiver.addressLine2}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Postcode/City:
                    </span>{' '}
                    {receiver.postcodeCity}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Country:
                    </span>{' '}
                    {receiver.country}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Phone:
                    </span>{' '}
                    {receiver.telephone}
                  </div>
                  <div className='mb-1'>
                    <span className='text-muted-foreground font-medium'>
                      Email:
                    </span>{' '}
                    {receiver.email}
                  </div>
                </div>
              </div>
              <div className='mb-4'>
                <div className='text-primary mb-2 text-lg font-semibold'>
                  Items
                </div>
                <div className='overflow-x-auto rounded-lg border bg-white shadow-sm'>
                  <table className='min-w-full text-sm'>
                    <thead className='bg-muted/60'>
                      <tr>
                        <th className='border px-4 py-2 text-left font-semibold'>
                          Description
                        </th>
                        <th className='border px-4 py-2 text-left font-semibold'>
                          Unit Value
                        </th>
                        <th className='border px-4 py-2 text-left font-semibold'>
                          Quantity
                        </th>
                        <th className='border px-4 py-2 text-left font-semibold'>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, idx: number) => (
                        <tr key={idx} className='even:bg-muted/20'>
                          <td className='border px-4 py-2'>
                            {item.description}
                          </td>
                          <td className='border px-4 py-2'>{item.unitPrice}</td>
                          <td className='border px-4 py-2'>{item.quantity}</td>
                          <td className='border px-4 py-2'>
                            {(
                              (parseFloat(item.unitPrice) || 0) *
                              (parseFloat(item.quantity) || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          className='border px-4 py-2 text-right font-bold'
                          colSpan={3}
                        >
                          Grand Total
                        </td>
                        <td className='bg-muted/40 border px-4 py-2 font-bold'>
                          {items
                            .reduce(
                              (sum: number, item: any) =>
                                sum +
                                (parseFloat(item.unitPrice) || 0) *
                                  (parseFloat(item.quantity) || 0),
                              0
                            )
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className='mt-6 flex justify-end'>
                <Button
                  onClick={handleGenerateInvoicePDF}
                  className='bg-primary hover:bg-primary/90 rounded px-6 py-2 text-white shadow transition'
                >
                  Generate Invoice PDF
                </Button>
                <Button
                  onClick={handleGenerateInvoiceExcel}
                  className='rounded bg-green-600 px-6 py-2 text-white shadow transition hover:bg-green-700'
                >
                  Generate Invoice Excel
                </Button>
              </div>
            </div>
          ) : (
            <div className='py-8 text-center text-red-500'>
              Failed to load enquiry data.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
