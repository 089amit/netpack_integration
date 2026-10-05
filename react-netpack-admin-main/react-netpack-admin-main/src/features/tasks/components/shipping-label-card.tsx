import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { NETPACK_LOGO_DATA_URL } from './netpack-logo-base64'
import { generateBarcodeSvg } from './barcode-utils'

export interface ShippingLabelBoxData {
  boxNumber: number
  totalBoxes: number
  weight?: string | number
  dimensions?: string
  length?: string | number
  breadth?: string | number
  height?: string | number
  volumetricWeight?: string | number
  chargeableWeight?: string | number
  declaredValue?: string | number
  currency?: string
  commodity?: string
  boxTrackingNumber?: string
  items?: Array<{
    description?: string
    quantity?: number | string
    unitPrice?: number | string
    hsCode?: string
  }>
}

export interface ShippingLabelData {
  trackingNumber: string
  date?: string
  serviceType?: string
  sender: {
    name?: string
    company?: string
    phone?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
  receiver: {
    name?: string
    company?: string
    phone?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    email?: string
  }
  boxes: ShippingLabelBoxData[]
  currency?: string
  totalWeight?: string | number
  totalDimWeight?: string | number
  totalChargeableWeight?: string | number
  commodity?: string
  specialInstructions?: string
}

interface ShippingLabelCardProps {
  data: ShippingLabelData
  boxIndex: number
  scale?: number // Visual scale for preview modal (default 1)
  className?: string
}

export const ShippingLabelCard: React.FC<ShippingLabelCardProps> = ({
  data,
  boxIndex,
  scale = 1,
  className = '',
}) => {
  const box = data.boxes[boxIndex] || {
    boxNumber: boxIndex + 1,
    totalBoxes: data.boxes.length || 1,
  }

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  const trackingNo = box.boxTrackingNumber || data.trackingNumber || 'NP-TRACK-PENDING'
  const boxNoStr = `BOX ${box.boxNumber || boxIndex + 1} OF ${box.totalBoxes || data.boxes.length || 1}`

  // Format tracking URL for QR
  useEffect(() => {
    let isMounted = true
    const trackingUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/track?tracking=${encodeURIComponent(data.trackingNumber || trackingNo)}`
        : `https://netpacklogistic.com/track?tracking=${encodeURIComponent(data.trackingNumber || trackingNo)}`

    QRCode.toDataURL(trackingUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url)
      })
      .catch((err) => {
        console.error('QR code generation error:', err)
      })

    return () => {
      isMounted = false
    }
  }, [data.trackingNumber, trackingNo])

  // Format dates
  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })

  // Determine destination country display
  const destCountry = (data.receiver.country || 'INTERNATIONAL').toUpperCase()

  // Weight calculations
  const actualWt = box.weight
    ? `${parseFloat(String(box.weight)).toFixed(2)} KG`
    : data.totalWeight
    ? `${parseFloat(String(data.totalWeight)).toFixed(2)} KG`
    : 'N/A'

  // Format spaced tracking number for display under barcode (e.g. "Z F R J P 3 O Z Q")
  const cleanTracking = trackingNo.replace(/\s+/g, '')
  const spacedTracking = cleanTracking.split('').join(' ')

  // Formatted consignee address lines matching mockup
  const consigneeLine1 = data.receiver.addressLine1 || '[Street / Tole, Ward No.]'
  const consigneeLine2 = [data.receiver.addressLine2, data.receiver.city].filter(Boolean).join(', ') || '[City, District]'
  const stateAndPostcode = [data.receiver.state, data.receiver.postcode].filter(Boolean).join(', ')
  const consigneeLine3 = stateAndPostcode ? `${stateAndPostcode}, ${destCountry}` : `[Province, Postal Code], ${destCountry}`

  // Dimensions string (e.g. 55x35x35)
  const dimsVal =
    box.length && box.breadth && box.height
      ? `${box.length}x${box.breadth}x${box.height}`
      : box.dimensions
      ? box.dimensions.replace(/×/g, 'x').replace(/\s*CM\s*/gi, '')
      : '55x35x35'

  // Customs value string (e.g. NVD or USD 50)
  const customsVal = box.declaredValue
    ? `${box.currency || data.currency || 'USD'} ${box.declaredValue}`
    : 'NVD'

  // Commodity string
  const commodityVal = (box.commodity || data.commodity || 'COURIER CARGO').toUpperCase()

  // Generate SVG barcode
  const barcodeSvgHtml = generateBarcodeSvg(cleanTracking, {
    height: 48,
    moduleWidth: 2,
    quietZone: 8,
    color: '#000000',
    backgroundColor: '#ffffff',
    includeText: false,
  })

  return (
    <div
      className={`shipping-label-page relative bg-white text-black font-sans box-border select-none shadow-sm ${className}`}
      style={{
        width: '100mm',
        height: '150mm',
        maxWidth: '100mm',
        maxHeight: '150mm',
        padding: '2.5mm',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Outer border conforming to user mockup */}
      <div className='w-full h-full border-[2px] border-black flex flex-col justify-between overflow-hidden bg-white text-[11px] leading-tight'>
        
        {/* ================= 1. HEADER SECTION ================= */}
        <div className='flex items-center justify-between px-3 py-2 border-b-[2px] border-black bg-white'>
          {/* Left: Netpack Official Logo (Algerian font matching mockup) */}
          <div className='flex items-center'>
            <img
              src={NETPACK_LOGO_DATA_URL}
              alt='NETPACK'
              className='h-8 max-w-[155px] object-contain'
            />
          </div>

          {/* Right: Box Count, Origin, Date */}
          <div className='text-right flex flex-col items-end'>
            <div className='bg-black text-white text-[11px] font-black px-2.5 py-0.5 tracking-wider uppercase mb-0.5'>
              {boxNoStr}
            </div>
            <div className='text-[8.5px] font-semibold text-gray-700 tracking-wide'>
              ORIGIN: <strong className='text-black font-bold'>KTM / NP</strong>
            </div>
            <div className='text-[8px] font-semibold text-gray-700 tracking-wide'>
              DATE: <span className='font-mono font-bold text-black'>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* ================= 2. BARCODE SECTION ================= */}
        <div className='border-b-[2px] border-black py-2 px-3 flex flex-col items-center justify-center bg-white'>
          <div
            className='w-full flex justify-center [&>svg]:w-full [&>svg]:max-w-[90mm] [&>svg]:h-[13mm]'
            dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
          />
          <div className='font-mono font-bold text-[13px] tracking-[4px] mt-1 text-black text-center uppercase'>
            {spacedTracking}
          </div>
        </div>

        {/* ================= 3. SHIP FROM (SENDER) ================= */}
        <div className='border-b-[2px] border-black px-3 py-1.5 bg-[#f5f5f5]'>
          <div className='flex items-center justify-between text-[9px] font-bold text-gray-700 uppercase tracking-wider'>
            <span>SHIP FROM (SENDER):</span>
            <span className='font-mono font-bold text-black'>
              TEL: {data.sender.phone || '—'}
            </span>
          </div>
          <div className='font-black text-[15px] text-black tracking-tight mt-0.5 uppercase truncate'>
            {data.sender.company || data.sender.name || 'DIRECT SHIPPER'}
          </div>
        </div>

        {/* ================= 4. SHIP TO (CONSIGNEE) ================= */}
        <div className='border-b-[2px] border-black px-3 py-1.5 flex flex-col justify-between flex-1 bg-white'>
          {/* Header Row: Red SHIP TO + Black Country Badge */}
          <div className='flex items-center justify-between'>
            <div className='text-[10px] font-black text-[#D32F2F] uppercase tracking-wider'>
              SHIP TO (CONSIGNEE):
            </div>
            <div className='bg-black text-white text-[12px] font-black px-3 py-0.5 tracking-wider uppercase'>
              {destCountry}
            </div>
          </div>

          {/* Consignee Name */}
          <div className='font-black text-[17px] text-black leading-tight tracking-tight mt-0.5 uppercase'>
            {data.receiver.name || 'Dinesh Basnet'}
          </div>

          {/* Consignee Structured Address Lines */}
          <div className='text-[10px] text-black font-semibold leading-tight my-1 space-y-0.5'>
            <div>{consigneeLine1}</div>
            <div>{consigneeLine2}</div>
            <div>{consigneeLine3}</div>
          </div>

          {/* Bottom Dest, Tel & Email */}
          <div className='border-t border-black/40 pt-1'>
            <div className='flex items-center justify-between text-[10.5px] font-bold text-black'>
              <div>
                DEST: <span className='font-black uppercase'>{destCountry}</span>
              </div>
              <div>
                TEL: <span className='font-mono font-bold'>{data.receiver.phone || '+61 425 625 963'}</span>
              </div>
            </div>
            <div className='text-[10px] font-bold text-black mt-0.5 truncate'>
              EMAIL: <span className='font-mono font-semibold'>{data.receiver.email || '[consignee email]'}</span>
            </div>
          </div>
        </div>

        {/* ================= 5. 4-COLUMN SPECS GRID ================= */}
        <div className='border-b-[2px] border-black bg-white'>
          <div className='grid grid-cols-4 divide-x-[2px] divide-black text-center'>
            <div className='py-1.5 px-0.5'>
              <div className='text-[7.5px] font-bold text-gray-600 uppercase tracking-tight'>ACTUAL WT</div>
              <div className='font-black text-[12px] font-mono mt-0.5'>{actualWt}</div>
            </div>
            <div className='py-1.5 px-0.5'>
              <div className='text-[7.5px] font-bold text-gray-600 uppercase tracking-tight'>DIMS (CM)</div>
              <div className='font-black text-[11px] font-mono mt-0.5 truncate'>{dimsVal}</div>
            </div>
            <div className='py-1.5 px-0.5'>
              <div className='text-[7.5px] font-bold text-gray-600 uppercase tracking-tight'>COMMODITY</div>
              <div className='font-bold text-[9.5px] mt-0.5 truncate uppercase'>{commodityVal}</div>
            </div>
            <div className='py-1.5 px-0.5'>
              <div className='text-[7.5px] font-bold text-gray-600 uppercase tracking-tight'>CUSTOMS VAL</div>
              <div className='font-black text-[12px] font-mono mt-0.5'>{customsVal}</div>
            </div>
          </div>
        </div>

        {/* ================= 6. SCAN & COMPLIANCE BOX ================= */}
        <div className='p-2 flex items-center justify-between gap-3 bg-white border-b-[2px] border-black'>
          {/* QR Code + SCAN TO TRACK */}
          <div className='flex items-center gap-2'>
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt='Scan Track'
                className='w-[15mm] h-[15mm] object-contain shrink-0'
              />
            ) : (
              <div className='w-[15mm] h-[15mm] border border-black flex items-center justify-center text-[7px]'>
                QR
              </div>
            )}
            <div className='font-black text-[12px] text-black tracking-wide leading-tight uppercase'>
              SCAN TO TRACK
            </div>
          </div>

          {/* Security Compliance Badges */}
          <div className='flex flex-col gap-1.5 flex-1 max-w-[50mm]'>
            <div className='border-[1.5px] border-black py-1 px-1.5 text-center font-black text-[8px] tracking-wider uppercase text-black'>
              SECURITY SCREENED - SPX
            </div>
            <div className='border-[1.5px] border-black py-1 px-1.5 text-center font-black text-[7.5px] tracking-wider uppercase text-black'>
              NON-DG / PASSENGER & CARGO
            </div>
          </div>
        </div>

        {/* ================= 7. SOLID BLACK HANDLING BAR ================= */}
        <div className='bg-black text-white px-2.5 py-1.5 flex items-center justify-between'>
          {/* THIS SIDE UP with Double Up Arrows */}
          <div className='flex items-center gap-1.5'>
            <svg className='w-5 h-5 text-white fill-current shrink-0' viewBox='0 0 24 24'>
              <path d='M4 11l4-5 4 5H9v7H7v-7H4zm10 0l4-5 4 5h-3v7h-2v-7h-3z' />
            </svg>
            <span className='font-black text-[9px] tracking-wider leading-tight text-white uppercase text-left'>
              THIS SIDE<br />UP
            </span>
          </div>

          {/* Vertical white divider */}
          <div className='h-6 w-[1.5px] bg-white/70 mx-1' />

          {/* FRAGILE in vibrant yellow/gold */}
          <div className='font-black text-[14px] tracking-[2px] text-[#FFD700] uppercase text-center flex-1'>
            FRAGILE
          </div>

          {/* Vertical white divider */}
          <div className='h-6 w-[1.5px] bg-white/70 mx-1' />

          {/* HANDLE WITH CARE */}
          <div className='font-black text-[9px] tracking-wider leading-tight text-white uppercase text-right'>
            HANDLE<br />WITH CARE
          </div>
        </div>

        {/* ================= 8. FOOTER ================= */}
        <div className='py-1 px-2 text-center text-[7px] text-black font-semibold leading-tight bg-white'>
          <div>NETPACK LOGISTIC | TEL: +977-1-5339942 | KATHMANDU, NEPAL</div>
          <div className='text-gray-700'>www.netpacklogistic.com | admin@netpacklogistic.com</div>
        </div>

      </div>
    </div>
  )
}
export default ShippingLabelCard
