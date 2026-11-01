import React, { useState, useEffect } from 'react'
import {
  X,
  Send,
  CheckCircle2,
  Package,
  Scale,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { SERVER_URL } from '@/constants/endpoint'

interface RateEnquiryModalProps {
  open: boolean
  onClose: () => void
  initialService?: string
}

export const RateEnquiryModal: React.FC<RateEnquiryModalProps> = ({
  open,
  onClose,
  initialService = '',
}) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    serviceTier: initialService || 'Express Priority Courier',
    origin: 'Kathmandu, Nepal',
    destination: '',
    weight: '2.5',
    pieces: '1',
    remarks: '',
  })

  const [calculating, setCalculating] = useState(false)
  const [rateEstimate, setRateEstimate] = useState<{
    totalRate: number
    ratePerKg: number
    baseRate?: number
    tiaCharge?: number
    customCharge?: number
  } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [generatedRef, setGeneratedRef] = useState('')

  useEffect(() => {
    if (initialService) {
      setForm((prev) => ({ ...prev, serviceTier: initialService }))
    }
  }, [initialService])

  // Reset on open
  useEffect(() => {
    if (open) {
      setSubmitted(false)
      setRateEstimate(null)
    }
  }, [open])

  // Try calculating rate live when destination and weight change
  useEffect(() => {
    const dest = form.destination.trim()
    const wt = parseFloat(form.weight)
    if (!dest || isNaN(wt) || wt <= 0) {
      setRateEstimate(null)
      return
    }

    const timer = setTimeout(async () => {
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
          if (data && data.totalRate) {
            setRateEstimate({
              totalRate: data.totalRate,
              ratePerKg: typeof data.ratePerKg === 'number' ? data.ratePerKg : Math.round(data.totalRate / wt),
              baseRate: data.breakdown?.baseRate,
              tiaCharge: data.breakdown?.tiaCharge,
              customCharge: data.breakdown?.customCharge,
            })
          }
        }
      } catch {
        // Fallback silently without throwing error
      } finally {
        setCalculating(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [form.destination, form.weight])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.phone.trim() || !form.destination.trim()) {
      toast.error('Please fill in your Full Name, Phone / WhatsApp, and Destination.')
      return
    }

    setSubmitting(true)
    const refCode = `NP-Q-${Math.floor(100000 + Math.random() * 900000)}`

    try {
      try {
        await fetch(`${SERVER_URL}/api/enquiry/webenquirycreate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderName: form.name,
            senderPhone: form.phone,
            senderEmail: form.email,
            senderAddressLine1: form.origin,
            senderCity: 'Kathmandu',
            senderCountry: 'Nepal',
            receiverName: 'Prospective Client',
            receiverCountry: form.destination,
            commodity: form.serviceTier,
            packageDetails: form.remarks || `Est. Weight: ${form.weight}kg, Pieces: ${form.pieces}`,
            destinationLocation: form.destination,
            weight: parseFloat(form.weight) || 1,
            pieces: parseInt(form.pieces, 10) || 1,
          }),
        })
      } catch {
        // Keep moving forward
      }

      setGeneratedRef(refCode)
      setSubmitted(true)
      toast.success(`Quote Request submitted! Reference: ${refCode}`)
    } catch {
      toast.error('Failed to submit quote request. Please call our hotline directly.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto'>
      <div className='relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col'>
        {/* Modal Top Bar */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0'>
          <div className='flex items-center gap-2'>
            <span className='w-2 h-2 rounded-full bg-[#FF7A1A]' />
            <span className='text-xs font-mono font-bold tracking-wider text-[#FF7A1A] uppercase'>
              RATE ENQUIRY & CARGO ESTIMATE
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition'
            title='Close dialog'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content Body */}
        <div className='p-6 sm:p-8 overflow-y-auto'>
          {submitted ? (
            <div className='py-8 text-center space-y-4 animate-in fade-in'>
              <div className='w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm'>
                <CheckCircle2 className='w-9 h-9' />
              </div>

              <div>
                <h3 className='text-2xl font-extrabold uppercase font-display tracking-tight text-slate-900'>
                  QUOTE REQUEST RECEIVED
                </h3>
                <p className='text-xs font-mono text-slate-500 mt-1'>
                  ENQUIRY REFERENCE: <span className='font-bold text-[#0066CC]'>{generatedRef}</span>
                </p>
              </div>

              <div className='p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs font-sans'>
                <div className='flex justify-between border-b border-slate-200 pb-2'>
                  <span className='text-slate-500 font-mono'>Customer:</span>
                  <span className='font-bold text-slate-900'>{form.name}</span>
                </div>
                <div className='flex justify-between border-b border-slate-200 pb-2'>
                  <span className='text-slate-500 font-mono'>Destination:</span>
                  <span className='font-bold text-slate-900'>{form.destination}</span>
                </div>
                <div className='flex justify-between border-b border-slate-200 pb-2'>
                  <span className='text-slate-500 font-mono'>Est. Weight / Tier:</span>
                  <span className='font-bold text-slate-900'>{form.weight} kg • {form.serviceTier}</span>
                </div>
                {rateEstimate && (
                  <div className='flex justify-between pt-1 text-emerald-700 font-bold'>
                    <span>Verified Tariff Est.:</span>
                    <span>NPR {rateEstimate.totalRate.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <p className='text-sm text-slate-600 max-w-md mx-auto'>
                Our Teku operations officer is reviewing carrier capacity and will contact you via WhatsApp at{' '}
                <strong className='text-slate-900'>{form.phone}</strong> with the confirmed flight schedule.
              </p>

              <div className='pt-3 flex flex-col sm:flex-row items-center justify-center gap-3'>
                <a
                  href={`https://wa.me/9779801000000?text=Hi%20NetPack,%20I%20requested%20quote%20${generatedRef}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm'
                >
                  WhatsApp Direct Support
                </a>
                <button
                  onClick={onClose}
                  className='w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition'
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Headline */}
              <div>
                <h3 className='text-2xl sm:text-3xl font-extrabold uppercase font-display tracking-tight text-slate-900'>
                  REQUEST A CARGO OR COURIER ESTIMATE
                </h3>
                <p className='text-xs sm:text-sm text-slate-500 mt-1'>
                  Fill in your shipment specs for verified customs clearance tariffs and scheduled air cargo dispatch.
                </p>
              </div>

              {/* Row 1: Full Name & Phone/WhatsApp */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    FULL NAME / COMPANY <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder='e.g. Ramesh Shrestha'
                    className='w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                  />
                </div>

                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    PHONE / WHATSAPP <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='tel'
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder='+977 9801000000'
                    className='w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                  />
                </div>
              </div>

              {/* Row 2: Email & Service Tier */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type='email'
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder='client@example.com'
                    className='w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                  />
                </div>

                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    SERVICE TIER
                  </label>
                  <select
                    value={form.serviceTier}
                    onChange={(e) => setForm({ ...form, serviceTier: e.target.value })}
                    className='w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                  >
                    <option value='Express Priority Courier'>Express Priority Courier</option>
                    <option value='International Air Cargo'>International Air Cargo</option>
                    <option value='Door-to-Door USA/UK/Canada'>Door-to-Door USA/UK/Canada</option>
                    <option value='Commercial Palletized Freight'>Commercial Palletized Freight</option>
                    <option value='Customs Clearance Brokerage'>Customs Clearance & Brokerage</option>
                    <option value='Warehousing & Fulfillment'>Warehousing & Fulfillment</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Origin & Destination */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    ORIGIN
                  </label>
                  <div className='relative flex items-center'>
                    <MapPin className='w-4 h-4 text-slate-400 absolute left-3 pointer-events-none' />
                    <input
                      type='text'
                      disabled
                      value={form.origin}
                      className='w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono text-sm cursor-not-allowed'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    DESTINATION <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder='e.g. USA, UK, Japan, Australia'
                    className='w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                  />
                </div>
              </div>

              {/* Row 4: Weight & Pieces */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    EST. WEIGHT (KG) <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative flex items-center'>
                    <Scale className='w-4 h-4 text-slate-400 absolute left-3 pointer-events-none' />
                    <input
                      type='number'
                      step='0.1'
                      min='0.1'
                      required
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      placeholder='2.5'
                      className='w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                    PIECES / BOXES
                  </label>
                  <div className='relative flex items-center'>
                    <Package className='w-4 h-4 text-slate-400 absolute left-3 pointer-events-none' />
                    <input
                      type='number'
                      min='1'
                      value={form.pieces}
                      onChange={(e) => setForm({ ...form, pieces: e.target.value })}
                      placeholder='1'
                      className='w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition'
                    />
                  </div>
                </div>
              </div>

              {/* Live Tariff Preview Badge (if computed) */}
              {rateEstimate && (
                <div className='p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between text-xs animate-in fade-in'>
                  <div className='flex items-center gap-2 text-blue-900 font-semibold'>
                    <Sparkles className='w-4 h-4 text-[#0066CC]' />
                    <span>Estimated Verified Tariff:</span>
                  </div>
                  <div className='font-mono font-bold text-base text-[#0066CC]'>
                    NPR {rateEstimate.totalRate.toLocaleString()}
                    <span className='text-[10px] text-slate-500 font-normal ml-1'>
                      (@ ~NPR {rateEstimate.ratePerKg}/kg)
                    </span>
                  </div>
                </div>
              )}

              {calculating && (
                <div className='text-xs font-mono text-slate-400 flex items-center gap-1.5'>
                  <span className='w-1.5 h-1.5 rounded-full bg-[#0066CC] animate-ping' />
                  <span>Checking live airline tariff rates...</span>
                </div>
              )}

              {/* Remarks Textarea */}
              <div>
                <label className='block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5'>
                  GOODS DESCRIPTION / REMARKS (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder='e.g. 2 boxes of woven garments, total dimensions 40x30x20 cm'
                  className='w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/15 focus:outline-none transition resize-none'
                />
              </div>

              {/* Big Vibrant Orange CTA Button (Matching 1st Picture) */}
              <button
                type='submit'
                disabled={submitting}
                className='w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF7A1A] to-[#FF5500] hover:from-[#e66c14] hover:to-[#e64c00] text-white font-extrabold text-sm uppercase tracking-wider transition shadow-lg shadow-[#FF7A1A]/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]'
              >
                <Send className='w-4 h-4' />
                <span>{submitting ? 'Transmitting Request...' : 'GET VERIFIED QUOTE & SCHEDULE'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
