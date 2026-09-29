import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import logoTextUrl from '@/assets/name.png'
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

  // Format addresses cleanly
  const senderAddressParts = [
    data.sender.addressLine1,
    data.sender.addressLine2,
    data.sender.city,
    data.sender.state,
    data.sender.postcode,
    data.sender.country || 'Nepal',
  ].filter(Boolean)

  const receiverAddressParts = [
    data.receiver.addressLine1,
    data.receiver.addressLine2,
    data.receiver.city,
    data.receiver.state,
    data.receiver.postcode,
  ].filter(Boolean)

  // Determine destination country display
  const destCountry = (data.receiver.country || 'INTERNATIONAL').toUpperCase()

  // Weight calculations
  const actualWt = box.weight
    ? `${parseFloat(String(box.weight)).toFixed(2)} KG`
    : data.totalWeight
    ? `${parseFloat(String(data.totalWeight)).toFixed(2)} KG`
    : 'N/A'

  const dimsStr =
    box.dimensions ||
    (box.length && box.breadth && box.height
      ? `${box.length}×${box.breadth}×${box.height} CM`
      : 'N/A')

  // Generate SVG barcode
  const barcodeSvgHtml = generateBarcodeSvg(trackingNo, {
    height: 48,
    moduleWidth: 2,
    quietZone: 8,
    color: '#000000',
    backgroundColor: '#ffffff',
    includeText: false,
  })

  return (
    <div
      className={`shipping-label-page relative bg-white text-black font-sans box-border select-none border border-black shadow-sm ${className}`}
      style={{
        width: '100mm',
        height: '150mm',
        maxWidth: '100mm',
        maxHeight: '150mm',
        padding: '3mm',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* Container with thin black border conforming to courier standards */}
      <div className='w-full h-full border-[1.5px] border-black flex flex-col justify-between overflow-hidden bg-white text-[11px] leading-tight'>
        
        {/* ================= HEADER SECTION ================= */}
        <div className='border-b-[1.5px] border-black bg-white'>
          {/* Top Brand & Gateway Bar */}
          <div className='flex items-center justify-between px-2 py-1.5 border-b border-gray-300'>
            <div className='flex items-center gap-1.5'>
              <img
                src={logoTextUrl}
                alt='NetPack'
                className='h-6 max-w-[110px] object-contain'
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
              <div>
                <span className='font-black tracking-tighter text-[13px] uppercase block leading-none text-red-600'>
                  NETPACK LOGISTICS
                </span>
                <span className='text-[8px] font-bold tracking-wider text-gray-700 block uppercase'>
                  Worldwide Express Courier
                </span>
              </div>
            </div>

            <div className='text-right'>
              <span className='inline-block bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-xs tracking-wider'>
                {boxNoStr}
              </span>
              <div className='text-[8px] font-semibold text-gray-600 mt-0.5'>
                ORIGIN: <strong className='text-black'>KTM / NP</strong>
              </div>
            </div>
          </div>

          {/* Subheader: Service Type & Date */}
          <div className='flex items-center justify-between px-2 py-1 bg-gray-100/80 text-[9px] font-bold border-b border-black'>
            <div className='flex items-center gap-1 text-gray-800'>
              <span>SERVICE:</span>
              <span className='bg-red-600 text-white px-1.5 py-0.2 rounded-xs font-black uppercase text-[8.5px] tracking-wide'>
                {data.serviceType || 'PRIORITY AIR CARGO'}
              </span>
            </div>
            <div className='text-gray-700'>
              DATE: <span className='font-mono font-bold text-black'>{formattedDate}</span>
            </div>
          </div>

          {/* PRIMARY BARCODE (Code 128) */}
          <div className='px-2 py-1.5 flex flex-col items-center justify-center bg-white'>
            <div
              className='w-full flex justify-center [&>svg]:w-full [&>svg]:max-w-[88mm] [&>svg]:h-[11mm]'
              dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
            />
            <div className='font-mono font-black text-[12px] tracking-[2.5px] mt-0.5 text-black text-center'>
              {trackingNo}
            </div>
          </div>
        </div>

        {/* ================= ADDRESSES SECTION ================= */}
        <div className='flex-1 border-b-[1.5px] border-black flex flex-col'>
          {/* SHIP FROM (Shipper / Origin) - Compact */}
          <div className='px-2 py-1 border-b border-gray-400 bg-gray-50/50'>
            <div className='flex items-center justify-between text-[8px] font-black text-gray-500 uppercase tracking-wider mb-0.5'>
              <span>SHIP FROM (SENDER):</span>
              <span className='font-mono font-semibold text-gray-600'>TEL: {data.sender.phone || 'N/A'}</span>
            </div>
            <div className='font-bold text-[10px] text-gray-900 truncate'>
              {data.sender.name || 'NetPack Logistics Shipper'}
            </div>
            <div className='text-[8.5px] text-gray-700 line-clamp-2 leading-tight'>
              {senderAddressParts.join(', ')}
            </div>
          </div>

          {/* SHIP TO (Consignee / Destination - HERO PROMINENT SECTION) */}
          <div className='flex-1 px-2.5 py-1.5 flex flex-col justify-between bg-white'>
            {/* Destination Country Banner */}
            <div className='flex items-center justify-between border-b-[1.5px] border-black pb-1 mb-1'>
              <div className='text-[8.5px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1'>
                <span className='inline-block w-1.5 h-1.5 bg-red-600 rounded-full' />
                SHIP TO (CONSIGNEE)
              </div>
              <div className='bg-black text-white font-black text-[13px] px-2.5 py-0.5 tracking-wider uppercase rounded-xs'>
                {destCountry}
              </div>
            </div>

            {/* Consignee Name - Largest address text */}
            <div className='font-black text-[13px] leading-tight text-black tracking-tight uppercase line-clamp-1'>
              {data.receiver.name || 'CONSIGNEE NAME'}
            </div>

            {/* Consignee Full Address */}
            <div className='font-semibold text-[10px] text-gray-800 line-clamp-3 leading-snug my-0.5'>
              {receiverAddressParts.join(', ')}
            </div>

            {/* Destination Country Full Line & Phone */}
            <div className='pt-1 border-t border-dashed border-gray-300 flex items-center justify-between text-[9.5px]'>
              <div className='font-black text-black uppercase tracking-wide'>
                DESTINATION: <span className='underline font-black'>{destCountry}</span>
              </div>
              <div className='font-bold font-mono text-black'>
                TEL: <span className='font-black'>{data.receiver.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SPECIFICATIONS & CUSTOMS GRID ================= */}
        <div className='border-b-[1.5px] border-black bg-white'>
          <div className='grid grid-cols-4 divide-x divide-black text-center border-b border-black text-[8px] font-bold'>
            <div className='p-1'>
              <span className='text-gray-500 block uppercase text-[7px]'>ACTUAL WT</span>
              <span className='font-black text-[10px] font-mono'>{actualWt}</span>
            </div>
            <div className='p-1'>
              <span className='text-gray-500 block uppercase text-[7px]'>DIMENSIONS</span>
              <span className='font-bold text-[8.5px] font-mono truncate block'>{dimsStr}</span>
            </div>
            <div className='p-1'>
              <span className='text-gray-500 block uppercase text-[7px]'>COMMODITY</span>
              <span className='font-bold text-[8.5px] truncate block uppercase'>
                {box.commodity || data.commodity || 'COURIER CARGO'}
              </span>
            </div>
            <div className='p-1 bg-gray-50'>
              <span className='text-gray-500 block uppercase text-[7px]'>CUSTOMS VAL</span>
              <span className='font-black text-[9.5px] font-mono'>
                {box.declaredValue ? `${box.currency || data.currency || 'USD'} ${box.declaredValue}` : 'NVD'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= ROUTING & 2D QR VERIFICATION SECTION ================= */}
        <div className='p-1.5 flex items-center justify-between gap-2 bg-white border-b border-black'>
          {/* 2D QR Code */}
          <div className='flex items-center gap-1.5 flex-shrink-0'>
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt='Live Track QR'
                className='w-[16mm] h-[16mm] border border-gray-400 p-0.5 object-contain'
              />
            ) : (
              <div className='w-[16mm] h-[16mm] border border-gray-400 flex items-center justify-center text-[7px] text-gray-400'>
                QR CODE
              </div>
            )}
            <div className='flex flex-col text-[7px] font-bold text-gray-600 leading-tight'>
              <span className='text-black font-black uppercase text-[7.5px]'>SCAN TO TRACK</span>
              <span>LIVE CARGO STATUS</span>
              <span className='text-gray-400 font-mono'>PWA / MOBILE</span>
            </div>
          </div>

          {/* Security & Aviation Compliance Badges */}
          <div className='flex-1 flex flex-col justify-center gap-1 text-[7.5px] font-bold'>
            <div className='border border-black px-1.5 py-0.5 rounded-xs flex items-center justify-between bg-gray-50'>
              <span className='text-gray-700'>SECURITY SCREENING:</span>
              <span className='font-black text-black uppercase'>SPX / CLEARED</span>
            </div>
            <div className='border border-black px-1.5 py-0.5 rounded-xs flex items-center justify-between'>
              <span className='text-gray-700'>CARGO TYPE:</span>
              <span className='font-black text-black uppercase'>GEN / NON-DG</span>
            </div>
          </div>
        </div>

        {/* ================= HAZARD & HANDLING BANNER ================= */}
        <div className='bg-black text-white px-2 py-1 flex items-center justify-between text-[9px] font-black tracking-wider uppercase'>
          <div className='flex items-center gap-1'>
            <span>▲</span>
            <span>HANDLE WITH CARE</span>
          </div>
          <div className='text-[8px] font-bold tracking-normal text-yellow-300'>
            FRAGILE • KEEP DRY • THIS WAY UP ↑↑
          </div>
          <div className='flex items-center gap-1'>
            <span>▲</span>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className='px-2 py-0.5 bg-gray-100 flex items-center justify-between text-[7px] font-semibold text-gray-600'>
          <span>NETPACK LOGISTIC GATEWAY • KATHMANDU</span>
          <span className='font-mono'>TEL: +977-1-5339942</span>
          <span>WWW.NETPACKLOGISTIC.COM</span>
        </div>

      </div>
    </div>
  )
}
export default ShippingLabelCard
