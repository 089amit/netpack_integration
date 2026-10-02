import React, { useState, useEffect, useRef } from 'react'
import {
  Printer,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Package,
  Layers,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import http from '@/utils/http'
import { ENQUIRY_ENDPOINTS, SHIPMENT_ENDPOINT } from '@/constants/endpoint'
import {
  ShippingLabelCard,
  ShippingLabelData,
  ShippingLabelBoxData,
} from './shipping-label-card'
import { generateShippingLabel100x150PDF } from './shipping-label-pdf'

interface ShippingLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enquiryId?: number | string | null
  shipmentId?: number | string | null
  initialData?: ShippingLabelData | null
}

export const ShippingLabelDialog: React.FC<ShippingLabelDialogProps> = ({
  open,
  onOpenChange,
  enquiryId,
  shipmentId,
  initialData,
}) => {
  const [labelData, setLabelData] = useState<ShippingLabelData | null>(
    initialData || null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('all') // 'all' or box index '0', '1', ...
  const [scale, setScale] = useState<number>(1)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const printableAreaRef = useRef<HTMLDivElement>(null)

  // Load data when dialog opens
  useEffect(() => {
    if (!open) {
      if (!initialData) setLabelData(null)
      return
    }

    if (initialData) {
      setLabelData(initialData)
      setActiveTab('all')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        if (enquiryId) {
          const res: any = await http.get(
            `${ENQUIRY_ENDPOINTS.GET_BY_ID_ENQUIRY}/${enquiryId}`
          )
          const data = res?.data || res
          transformEnquiryToLabel(data)
        } else if (shipmentId) {
          const res: any = await http.get(
            `${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}/${shipmentId}`
          )
          const data = res?.data || res
          transformShipmentToLabel(data)
        }
      } catch (err: any) {
        console.error('Failed to load shipping label details:', err)
        toast.error('Could not load shipping label information', {
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, enquiryId, shipmentId, initialData])

  // Transform enquiry payload into uniform ShippingLabelData
  const transformEnquiryToLabel = (data: any) => {
    const rawBoxes = Array.isArray(data.boxes) && data.boxes.length > 0
      ? data.boxes
      : [{ weight: data.weight || 0, length: 0, breadth: 0, height: 0 }]

    const boxes: ShippingLabelBoxData[] = rawBoxes.map((b: any, idx: number) => ({
      boxNumber: idx + 1,
      totalBoxes: rawBoxes.length,
      weight: b.weight || 0,
      dimensions:
        b.length && b.breadth && b.height
          ? `${b.length}×${b.breadth}×${b.height}`
          : undefined,
      length: b.length,
      breadth: b.breadth,
      height: b.height,
      declaredValue: b.declaredValue || b.value,
      commodity: b.commodity || data.commodity,
      boxTrackingNumber: b.trackingNumber || (rawBoxes.length > 1 ? `${data.trackingNumber || 'NP'}-B${idx + 1}` : data.trackingNumber),
    }))

    const transformed: ShippingLabelData = {
      trackingNumber: data.trackingNumber || 'NP-PENDING',
      date: data.createdAt || data.date,
      serviceType: data.serviceName || 'EXPRESS AIR CARGO',
      sender: {
        name: data.senderName,
        phone: data.senderPhone,
        addressLine1: data.senderAddressLine1,
        addressLine2: data.senderAddressLine2,
        city: data.senderCity,
        postcode: data.senderPostcode,
        country: data.senderCountry || 'Nepal',
      },
      receiver: {
        name: data.receiverName,
        phone: data.receiverTelephone || data.receiverPhone,
        addressLine1: data.receiverAddressLine1,
        addressLine2: data.receiverAddressLine2,
        city: data.receiverCity,
        state: data.receiverState,
        postcode: data.receiverPostcode,
        country: data.receiverCountry,
        email: data.receiverEmail,
      },
      boxes,
      currency: data.currency || 'USD',
      totalWeight: data.weight,
      totalDimWeight: data.dimWeight,
      totalChargeableWeight: data.chargeableWeight,
      commodity: data.commodity,
    }

    setLabelData(transformed)
    setActiveTab('all')
  }

  // Transform shipment payload into uniform ShippingLabelData
  const transformShipmentToLabel = (data: any) => {
    const enq = data.enquiryDetails || {}
    const rawBoxes = Array.isArray(data.boxDetails) && data.boxDetails.length > 0
      ? data.boxDetails
      : Array.isArray(enq.boxes) && enq.boxes.length > 0
      ? enq.boxes
      : [{ weight: data.weight || 0 }]

    const boxes: ShippingLabelBoxData[] = rawBoxes.map((b: any, idx: number) => ({
      boxNumber: idx + 1,
      totalBoxes: rawBoxes.length,
      weight: b.weight || 0,
      dimensions:
        b.length && b.breadth && b.height
          ? `${b.length}×${b.breadth}×${b.height}`
          : undefined,
      declaredValue: b.declaredValue || b.value,
      commodity: b.commodity || enq.commodity,
      boxTrackingNumber:
        b.trackingNumber ||
        (rawBoxes.length > 1
          ? `${data.hawbNumber || data.hawbno || 'NP'}-${idx + 1}`
          : data.hawbNumber || data.hawbno || data.trackingNumber),
    }))

    const calculatedWeight = rawBoxes.reduce(
      (acc: number, bx: any) => acc + parseFloat(String(bx.weight || 0)),
      0
    )

    const transformed: ShippingLabelData = {
      trackingNumber: data.hawbNumber || data.hawbno || data.trackingNumber || enq.trackingNumber || 'NP-SHIPMENT',
      date: data.createdAt || enq.createdAt,
      serviceType: data.serviceName || 'EXPRESS AIR CARGO',
      sender: {
        name: enq.senderName || 'NetPack Logistic',
        phone: enq.senderPhone,
        addressLine1: enq.senderAddressLine1,
        addressLine2: enq.senderAddressLine2,
        city: enq.senderCity,
        postcode: enq.senderPostcode,
        country: enq.senderCountry || 'Nepal',
      },
      receiver: {
        name: enq.receiverName || data.consigneeName,
        phone: enq.receiverTelephone || enq.receiverPhone,
        addressLine1: enq.receiverAddressLine1,
        addressLine2: enq.receiverAddressLine2,
        city: enq.receiverCity,
        state: enq.receiverState,
        postcode: enq.receiverPostcode,
        country: data.destinationCountryName || enq.receiverCountry,
      },
      boxes,
      currency: enq.currency || 'USD',
      totalWeight: calculatedWeight > 0 ? calculatedWeight : (data.chargeableWeight || data.weight),
      commodity: enq.commodity,
    }

    setLabelData(transformed)
    setActiveTab('all')
  }

  // Direct Browser Print Handler
  const handlePrint = () => {
    if (!labelData) return
    window.print()
  }

  // Dedicated Thermal Printer Window
  const handleOpenPrintWindow = () => {
    if (!labelData) return

    const printableHtml = printableAreaRef.current?.innerHTML
    if (!printableHtml) {
      window.print()
      return
    }

    const printWin = window.open('', '_blank', 'width=800,height=900')
    if (!printWin) {
      toast.error('Pop-up was blocked. Please allow pop-ups for direct printing.')
      window.print()
      return
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Labels - ${labelData.trackingNumber}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: 100mm 150mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #fff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .shipping-label-page {
              width: 100mm !important;
              height: 150mm !important;
              max-width: 100mm !important;
              max-height: 150mm !important;
              margin: 0 auto;
              padding: 3mm;
              page-break-after: always;
              break-after: page;
              overflow: hidden;
            }
            @media screen {
              body {
                background: #f1f5f9;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .shipping-label-page {
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                background: #fff;
              }
            }
          </style>
          <!-- Load Tailwind for exact rendering -->
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        </head>
        <body>
          ${printableHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  // On-demand PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!labelData) return
    setIsDownloading(true)
    try {
      await generateShippingLabel100x150PDF(labelData, {
        autoDownload: true,
        filename: `shipping-label-${labelData.trackingNumber || 'NP'}-100x150mm.pdf`,
      })
      toast.success('Shipping label PDF downloaded successfully', { duration: 3000 })
    } catch (err: any) {
      console.error('PDF generation error:', err)
      toast.error('Failed to generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const boxesCount = labelData?.boxes?.length || 1

  return (
    <>
      {/* ── DEDICATED PRINT STYLES FOR THERMAL 100x150mm LABELS ── */}
      <style>{`
        @page {
          size: 100mm 150mm;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #shipping-label-printable-container,
          #shipping-label-printable-container * {
            visibility: visible !important;
          }
          #shipping-label-printable-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100mm !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 999999 !important;
            background: white !important;
          }
          .shipping-label-page {
            width: 100mm !important;
            height: 150mm !important;
            max-width: 100mm !important;
            max-height: 150mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            padding: 3mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
            transform: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-4xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900 border-slate-700 text-slate-100'>
          
          {/* Header Bar */}
          <div className='flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/90 backdrop-blur-xs'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30'>
                <Package className='w-5 h-5' />
              </div>
              <div>
                <DialogTitle className='text-lg font-bold text-white flex items-center gap-2'>
                  Shipping Label Web Preview
                  <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono'>
                    100×150 mm (4×6")
                  </span>
                </DialogTitle>
                <DialogDescription className='text-xs text-slate-400'>
                  {labelData?.trackingNumber
                    ? `Tracking: ${labelData.trackingNumber} • ${boxesCount} Box${boxesCount > 1 ? 'es' : ''}`
                    : 'International courier thermal standard label'}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className='flex items-center gap-2'>
              {/* Zoom Controls */}
              <div className='hidden sm:flex items-center bg-slate-700 rounded-lg p-0.5 border border-slate-600 text-slate-300'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-600'
                  onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                  title='Zoom Out'
                >
                  <ZoomOut className='w-3.5 h-3.5' />
                </Button>
                <span className='px-1.5 text-[11px] font-mono'>{Math.round(scale * 100)}%</span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-600'
                  onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
                  title='Zoom In'
                >
                  <ZoomIn className='w-3.5 h-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-600'
                  onClick={() => setScale(1)}
                  title='Reset Zoom'
                >
                  <RotateCcw className='w-3 h-3' />
                </Button>
              </div>

              {/* Download PDF Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={handleDownloadPDF}
                disabled={loading || !labelData || isDownloading}
                className='h-9 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white gap-1.5 text-xs'
              >
                {isDownloading ? (
                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                ) : (
                  <Download className='w-3.5 h-3.5' />
                )}
                Download PDF
              </Button>

              {/* Direct Print Button */}
              <Button
                size='sm'
                onClick={handlePrint}
                disabled={loading || !labelData}
                className='h-9 bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 text-xs shadow-md shadow-red-950'
              >
                <Printer className='w-4 h-4' />
                Print Label{boxesCount > 1 && activeTab === 'all' ? 's' : ''}
              </Button>
            </div>
          </div>

          {/* Sub-bar: Multi-box Navigation Tabs */}
          {boxesCount > 1 && (
            <div className='flex items-center justify-between px-6 py-2 bg-slate-800/60 border-b border-slate-700'>
              <div className='flex items-center gap-2'>
                <Layers className='w-4 h-4 text-slate-400' />
                <span className='text-xs font-semibold text-slate-300'>Select Label:</span>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className='w-auto'>
                <TabsList className='bg-slate-700/80 p-0.5 h-8'>
                  <TabsTrigger
                    value='all'
                    className='text-xs h-7 px-3 data-[state=active]:bg-red-600 data-[state=active]:text-white'
                  >
                    All Boxes ({boxesCount})
                  </TabsTrigger>
                  {labelData?.boxes.map((_, idx) => (
                    <TabsTrigger
                      key={idx}
                      value={String(idx)}
                      className='text-xs h-7 px-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white'
                    >
                      Box {idx + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleOpenPrintWindow}
                className='h-7 text-xs text-slate-400 hover:text-slate-200 gap-1'
                title='Open in dedicated window for thermal printer'
              >
                <ExternalLink className='w-3 h-3' />
                Thermal Pop-up
              </Button>
            </div>
          )}

          {/* Label Preview Scroll Area */}
          <div className='flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start min-h-[460px] max-h-[calc(90vh-140px)] bg-slate-950/80'>
            {loading ? (
              <div className='flex flex-col items-center justify-center h-80 gap-3 text-slate-400'>
                <Loader2 className='w-8 h-8 animate-spin text-red-500' />
                <p className='text-sm'>Generating 100x150mm label preview...</p>
              </div>
            ) : labelData ? (
              <div
                id='shipping-label-printable-container'
                ref={printableAreaRef}
                className='flex flex-col items-center gap-8 py-2'
              >
                {activeTab === 'all' ? (
                  labelData.boxes.map((_, idx) => (
                    <div key={idx} className='flex flex-col items-center'>
                      <div className='mb-2 text-xs font-mono text-slate-400 print:hidden'>
                        PAGE {idx + 1} OF {labelData.boxes.length} • 100 × 150 MM
                      </div>
                      <ShippingLabelCard
                        data={labelData}
                        boxIndex={idx}
                        scale={scale}
                        className='shadow-2xl'
                      />
                    </div>
                  ))
                ) : (
                  <div className='flex flex-col items-center'>
                    <div className='mb-2 text-xs font-mono text-slate-400 print:hidden'>
                      BOX {parseInt(activeTab, 10) + 1} OF {labelData.boxes.length} • 100 × 150 MM
                    </div>
                    <ShippingLabelCard
                      data={labelData}
                      boxIndex={parseInt(activeTab, 10) || 0}
                      scale={scale}
                      className='shadow-2xl'
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-80 gap-2 text-slate-400'>
                <Package className='w-10 h-10 text-slate-600' />
                <p className='text-sm font-semibold'>No label information found</p>
                <p className='text-xs text-slate-500'>Please verify the consignment details.</p>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className='px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400'>
            <div className='flex items-center gap-4'>
              <span className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                Direct Thermal (Zebra/TSC/Citizen/Brother) Compatible
              </span>
              <span className='hidden md:inline'>•</span>
              <span className='hidden md:inline'>Code 128 + 2D QR Verification</span>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onOpenChange(false)}
                className='text-slate-400 hover:text-white'
              >
                Close
              </Button>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </>
  )
}

export default ShippingLabelDialog
