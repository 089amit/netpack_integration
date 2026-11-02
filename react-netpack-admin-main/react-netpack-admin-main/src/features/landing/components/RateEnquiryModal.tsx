import React, { useState, useEffect } from 'react'
import {
  X,
  CheckCircle2,
  MapPin,
  Scale,
  Receipt,
  RotateCcw,
  MessageCircle,
  Smartphone,
  ChevronDown,
  Loader2,
  Clock,
  Plane,
} from 'lucide-react'
import { SERVER_URL } from '@/constants/endpoint'
import { COUNTRIES } from '@/features/pwa/countries'
import { LANDING_CONFIG } from '../config'

interface RateEnquiryModalProps {
  open: boolean
  onClose: () => void
  initialService?: string
  onOpenAppModal?: () => void
}

interface RateResult {
  rate: string
  totalRateNum?: number
  transit: string
  service: string
  destination: string
  weight: number
  breakdown?: {
    baseRate?: number
    tiaCharge?: number
    customCharge?: number
  }
}

export const RateEnquiryModal: React.FC<RateEnquiryModalProps> = ({
  open,
  onClose,
  onOpenAppModal,
}) => {
  const [destCountry, setDestCountry] = useState('')
  const [weight, setWeight] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<RateResult | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setResult(null)
    }
  }, [open])

  if (!open) return null

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const wt = parseFloat(weight)
    const dest = destCountry.trim()

    if (!dest || isNaN(wt) || wt <= 0) return

    setCalculating(true)
    try {
      const res = await fetch(`${SERVER_URL}/api/rate/rate-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: wt,
          destination: dest,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data && typeof data.totalRate === 'number') {
          setResult({
            rate: `NPR ${Math.round(data.totalRate).toLocaleString()}`,
            totalRateNum: Math.round(data.totalRate),
            transit: '5–9 Business Days',
            service: 'International Air Cargo Express',
            destination: dest,
            weight: wt,
            breakdown: data.breakdown ? {
              baseRate: data.breakdown.baseRate,
              tiaCharge: data.breakdown.tiaCharge,
              customCharge: data.breakdown.customCharge,
            } : undefined,
          })
          return
        }
      }
      throw new Error('Fallback to tariff estimator')
    } catch {
      // Offline / unconfigured slab fallback matching Customer App formula
      const base = 15 + wt * 8.5
      const low = Math.round(base * 135)
      const high = Math.round(base * 145)
      setResult({
        rate: `NPR ${low.toLocaleString()} – NPR ${high.toLocaleString()}`,
        transit: '7–12 Business Days',
        service: 'International Air Cargo Express',
        destination: dest,
        weight: wt,
      })
    } finally {
      setCalculating(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setWeight('')
    setDestCountry('')
  }

  const whatsappMessage = result
    ? `Hi NetPack, I checked the rate for ${result.weight} kg to ${result.destination} (${result.rate}). I would like to book a shipment.`
    : `Hi NetPack, I need rate information for international shipping.`

  const whatsappUrl = `https://wa.me/${LANDING_CONFIG.whatsapp.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto'>
      <div className='relative w-full max-w-lg bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col'>
        
        {/* Modal Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0'>
          <div className='flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-[#0066CC]' />
            <span className='text-xs font-mono font-bold tracking-wider text-[#0066CC] uppercase'>
              RATE ENQUIRY & ESTIMATOR
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer'
            title='Close dialog'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content Body */}
        <div className='p-6 sm:p-7 overflow-y-auto space-y-5'>
          
          {/* Header Title */}
          <div>
            <h3 className='text-2xl font-extrabold uppercase font-display tracking-tight text-slate-900'>
              {result ? 'YOUR ESTIMATED QUOTATION' : 'CALCULATE CARGO RATE'}
            </h3>
            <p className='text-xs text-slate-500 mt-1 leading-relaxed'>
              {result
                ? 'Instant estimated tariff based on scheduled export customs and air routing.'
                : 'Select your destination country and cargo weight for instant tariff pricing.'}
            </p>
          </div>

          {!result ? (
            /* Input Form: Only Destination Country & Weight (matching Customer App) */
            <form onSubmit={handleCalculate} className='space-y-4'>
              {/* Destination Country */}
              <div>
                <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5'>
                  <MapPin className='w-3.5 h-3.5 text-[#0066CC]' />
                  <span>Destination Country <span className='text-red-500'>*</span></span>
                </label>
                <div className='relative'>
                  <select
                    value={destCountry}
                    onChange={(e) => setDestCountry(e.target.value)}
                    required
                    className='w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition appearance-none cursor-pointer'
                  >
                    <option value=''>Select destination country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none' />
                </div>
              </div>

              {/* Approximate Weight */}
              <div>
                <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5'>
                  <Scale className='w-3.5 h-3.5 text-[#0066CC]' />
                  <span>Approximate Weight (kg) <span className='text-red-500'>*</span></span>
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    step='0.1'
                    min='0.1'
                    max='5000'
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder='e.g., 2.5'
                    className='w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                  />
                  <span className='absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400'>
                    KG
                  </span>
                </div>
              </div>

              {/* Calculate Button */}
              <div className='pt-2'>
                <button
                  type='submit'
                  disabled={!destCountry || !weight || calculating}
                  className='w-full py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md shadow-[#0066CC]/25 flex items-center justify-center gap-2 cursor-pointer'
                >
                  {calculating ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>Fetching Live Tariff...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className='w-4 h-4' />
                      <span>Calculate Rate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Result Card: Beautiful unified quotation display (matching Customer App) */
            <div className='space-y-4 animate-in fade-in-50 duration-200'>
              <div className='rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-xs'>
                <div className='bg-emerald-600 px-4 py-3 flex items-center justify-between text-white'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='w-5 h-5 text-emerald-100' />
                    <span className='font-bold text-sm font-display tracking-tight'>
                      ESTIMATED QUOTATION
                    </span>
                  </div>
                  <span className='text-[10px] font-mono uppercase bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100 font-bold'>
                    Export Ready
                  </span>
                </div>

                <div className='p-4 space-y-2.5 text-xs'>
                  <div className='flex justify-between items-center py-1.5 border-b border-slate-100'>
                    <span className='text-slate-500 font-medium'>Destination</span>
                    <span className='font-bold text-slate-900'>{result.destination}</span>
                  </div>

                  <div className='flex justify-between items-center py-1.5 border-b border-slate-100'>
                    <span className='text-slate-500 font-medium'>Cargo Weight</span>
                    <span className='font-bold text-slate-900'>{result.weight} kg</span>
                  </div>

                  <div className='flex justify-between items-center py-1.5 border-b border-slate-100'>
                    <span className='text-slate-500 font-medium flex items-center gap-1'>
                      <Plane className='w-3.5 h-3.5 text-slate-400' />
                      Service
                    </span>
                    <span className='font-bold text-slate-900'>{result.service}</span>
                  </div>

                  <div className='flex justify-between items-center py-1.5 border-b border-slate-100'>
                    <span className='text-slate-500 font-medium flex items-center gap-1'>
                      <Clock className='w-3.5 h-3.5 text-amber-500' />
                      Transit Time
                    </span>
                    <span className='font-bold text-amber-700'>{result.transit}</span>
                  </div>

                  {result.breakdown && (
                    <div className='py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] text-slate-600'>
                      <div className='flex justify-between'>
                        <span>Base Air Freight:</span>
                        <span className='font-mono font-semibold'>NPR {result.breakdown.baseRate?.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>TIA Airport Cargo Fee:</span>
                        <span className='font-mono font-semibold'>NPR {result.breakdown.tiaCharge?.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Customs Clearance:</span>
                        <span className='font-mono font-semibold'>NPR {result.breakdown.customCharge?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className='flex justify-between items-center pt-2 text-sm'>
                    <span className='font-extrabold text-slate-800 uppercase text-xs font-mono tracking-wider'>
                      Estimated Cost:
                    </span>
                    <span className='text-lg font-black font-display text-emerald-600'>
                      {result.rate}
                    </span>
                  </div>
                </div>

                <div className='px-4 pb-3.5 pt-1'>
                  <p className='text-[10px] text-slate-400 italic leading-relaxed'>
                    * Estimate only. Final rate confirmed after warehouse electronic scale weighing and volumetric inspection at Teku Hub.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1'>
                <a
                  href={whatsappUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm'
                >
                  <MessageCircle className='w-4 h-4' />
                  <span>Chat on WhatsApp</span>
                </a>

                {onOpenAppModal ? (
                  <button
                    type='button'
                    onClick={onOpenAppModal}
                    className='w-full py-3 px-4 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm cursor-pointer'
                  >
                    <Smartphone className='w-4 h-4' />
                    <span>Book on Mobile App</span>
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={onClose}
                    className='w-full py-3 px-4 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm cursor-pointer'
                  >
                    <span>Done</span>
                  </button>
                )}
              </div>

              <div className='text-center pt-1'>
                <button
                  type='button'
                  onClick={handleReset}
                  className='inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer'
                >
                  <RotateCcw className='w-3 h-3' />
                  <span>Calculate Another Rate</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
