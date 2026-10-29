import React, { useState } from 'react'
import { LANDING_CONFIG } from '../config'
import {
  Send,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Smartphone,
  Facebook,
  Instagram,
  Linkedin,
  ArrowUp,
} from 'lucide-react'
import { toast } from 'sonner'

export async function submitQuote(_formData: {
  name: string
  email: string
  phone: string
  origin: string
  destination: string
  weight: number
  shipmentType: string
  notes?: string
}): Promise<boolean> {
  // Simulates instant quote dispatch or saves to API
  await new Promise((resolve) => setTimeout(resolve, 800))
  return true
}

export const QuoteSection: React.FC<{
  onOpenAppModal?: () => void
  prefilledService?: string
}> = ({ onOpenAppModal, prefilledService = '' }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    origin: 'Kathmandu, Nepal',
    destination: '',
    weight: '2.5',
    shipmentType: prefilledService || 'Express Priority Courier',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.destination) {
      toast.error('Please fill in your name, phone number, and destination country.')
      return
    }

    setSubmitting(true)
    try {
      await submitQuote({
        name: form.name,
        email: form.email,
        phone: form.phone,
        origin: form.origin,
        destination: form.destination,
        weight: parseFloat(form.weight) || 1.0,
        shipmentType: form.shipmentType,
        notes: form.notes,
      })
      setSubmitted(true)
      toast.success('Quote request submitted! Our operations officer will contact you within 15 minutes.')
    } catch {
      toast.error('Failed to submit quote request. Please call us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id='quote' className='relative w-full bg-[#0D1B2A] text-white border-t border-white/10 overflow-hidden'>
      {/* Background ambient lighting */}
      <div className='absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none' />

      {/* PART A: Quote Request & Call to Action */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start'>
          {/* Left Column: Headlines & Guarantee */}
          <div className='lg:col-span-5 space-y-6'>
            <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#FF7A1A] uppercase'>
              <span className='w-2 h-2 rounded-full bg-[#FF7A1A]' />
              <span>INSTANT DISPATCH QUOTE</span>
            </div>

            <h2 className='text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase font-display tracking-tight leading-none'>
              SHIP WITH CONFIDENCE.
            </h2>

            <p className='text-base sm:text-lg text-slate-300 leading-relaxed'>
              Get verified volume rates, customs duty pre-assessments, and door-to-door courier schedules within minutes.
            </p>

            {/* Direct Contact Hotline Card */}
            <div className='p-6 rounded-2xl bg-[#132238] border border-white/10 space-y-4'>
              <div className='text-xs font-mono text-slate-400 uppercase tracking-wider'>
                OPERATIONS DESK KATHMANDU
              </div>
              <div className='flex items-center gap-3 text-lg font-bold font-mono text-white'>
                <Phone className='w-5 h-5 text-[#2F6BFF]' />
                <a href={`tel:${LANDING_CONFIG.contact.phone}`} className='hover:text-[#2F6BFF] transition'>
                  {LANDING_CONFIG.contact.phone}
                </a>
              </div>
              <div className='flex items-center gap-3 text-sm font-mono text-slate-300'>
                <Mail className='w-4 h-4 text-[#2F6BFF]' />
                <a href={`mailto:${LANDING_CONFIG.contact.email}`} className='hover:underline'>
                  {LANDING_CONFIG.contact.email}
                </a>
              </div>
              <div className='flex items-start gap-3 text-xs font-sans text-slate-400'>
                <MapPin className='w-4 h-4 text-[#FF7A1A] shrink-0 mt-0.5' />
                <span>{LANDING_CONFIG.contact.address}</span>
              </div>
            </div>

            {/* Mobile APK Download Pill */}
            {onOpenAppModal && (
              <div className='pt-2'>
                <button
                  type='button'
                  onClick={onOpenAppModal}
                  className='inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono tracking-wider uppercase text-slate-200 transition'
                >
                  <Smartphone className='w-4 h-4 text-[#FF7A1A]' />
                  <span>Download Mobile APKs (Customer & Rider)</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Quote Submission Form */}
          <div className='lg:col-span-7'>
            <div className='p-6 sm:p-10 rounded-3xl bg-[#132238]/95 border border-white/10 backdrop-blur-xl shadow-2xl'>
              {submitted ? (
                <div className='text-center py-12 space-y-4 animate-in fade-in'>
                  <div className='w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto'>
                    <CheckCircle2 className='w-8 h-8' />
                  </div>
                  <h3 className='text-2xl font-bold font-display uppercase tracking-tight'>
                    QUOTE REQUEST RECEIVED
                  </h3>
                  <p className='text-sm text-slate-300 max-w-md mx-auto'>
                    Thank you, <span className='text-white font-bold'>{form.name}</span>. Our duty desk in Teku has received your request for shipping to{' '}
                    <span className='text-[#FF7A1A] font-bold'>{form.destination}</span>. We will call you at{' '}
                    <span className='text-white font-bold'>{form.phone}</span> shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className='mt-4 px-6 py-2.5 rounded-xl border border-white/20 text-xs font-mono tracking-wider uppercase hover:bg-white/10 transition'
                  >
                    Submit Another Consignment
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <h3 className='text-xl sm:text-2xl font-bold font-display uppercase tracking-tight mb-2'>
                    Request a Cargo or Courier Estimate
                  </h3>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Full Name / Company <span className='text-[#FF7A1A]'>*</span>
                      </label>
                      <input
                        type='text'
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder='e.g. Ramesh Shrestha'
                        className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Phone / WhatsApp <span className='text-[#FF7A1A]'>*</span>
                      </label>
                      <input
                        type='tel'
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder='+977 9801000000'
                        className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Email Address
                      </label>
                      <input
                        type='email'
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder='client@example.com'
                        className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Service Tier
                      </label>
                      <select
                        value={form.shipmentType}
                        onChange={(e) => setForm({ ...form, shipmentType: e.target.value })}
                        className='w-full px-4 py-3 rounded-xl bg-[#09131E] border border-white/15 text-white text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      >
                        <option>Express Priority Courier</option>
                        <option>International Air Cargo</option>
                        <option>Customs Clearance Brokerage</option>
                        <option>Door-to-Door Valley Pickup</option>
                        <option>Commercial Palletized Freight</option>
                      </select>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Origin
                      </label>
                      <input
                        type='text'
                        value={form.origin}
                        onChange={(e) => setForm({ ...form, origin: e.target.value })}
                        className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Destination <span className='text-[#FF7A1A]'>*</span>
                      </label>
                      <input
                        type='text'
                        required
                        value={form.destination}
                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                        placeholder='e.g. USA, UK, Japan, Australia'
                        className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                        Est. Weight (kg)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        min='0.1'
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-mono uppercase text-slate-300 mb-1.5'>
                      Goods Description / Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder='e.g. 2 boxes of woven garments, total box dimensions 40x30x20 cm'
                      className='w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-sm focus:border-[#2F6BFF] focus:outline-none font-sans'
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={submitting}
                    className='w-full py-4 rounded-xl bg-[#FF7A1A] hover:bg-[#e66c14] text-white font-extrabold text-sm uppercase tracking-wider transition duration-200 shadow-xl shadow-[#FF7A1A]/30 disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    <Send className='w-4 h-4' />
                    <span>{submitting ? 'Transmitting Request...' : 'Get Verified Quote & Schedule'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PART B: Clean Hairline Footer & Legal Disclosures */}
      <div className='border-t border-white/10 bg-[#09131E] py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-white/10'>
            {/* Official NetPack Brand Logo Wordmark */}
            <a
              href='#'
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className='flex items-center group active:scale-95 transition-transform'
              title='NetPack Logistic'
            >
              <img
                src='/alzlogo.png'
                alt='NetPack Logistic'
                style={{ filter: 'brightness(0) invert(1)' }}
                className='h-8 sm:h-9 w-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] group-hover:opacity-90 transition-opacity'
              />
            </a>

            {/* Quick Links Navigation */}
            <div className='flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-300'>
              <a href='#services' className='hover:text-white transition'>SERVICES</a>
              <a href='#tracking' className='hover:text-white transition'>TRACKING</a>
              <a href='#journey' className='hover:text-white transition'>JOURNEY</a>
              <a href='#quote' className='hover:text-white transition'>CONTACT</a>
              <a href='/sign-in' className='hover:text-[#FF7A1A] transition font-bold'>STAFF LOGIN</a>
            </div>

            {/* Social Icons & Back to Top */}
            <div className='flex items-center gap-4'>
              {LANDING_CONFIG.socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition border border-white/10'
                  aria-label={s.name}
                >
                  {s.name === 'Facebook' && <Facebook className='w-4 h-4' />}
                  {s.name === 'Instagram' && <Instagram className='w-4 h-4' />}
                  {s.name === 'LinkedIn' && <Linkedin className='w-4 h-4' />}
                </a>
              ))}

              <button
                onClick={scrollToTop}
                className='p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition border border-white/10'
                title='Back to Top'
              >
                <ArrowUp className='w-4 h-4' />
              </button>
            </div>
          </div>

          <div className='pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4'>
            <p>© {new Date().getFullYear()} {LANDING_CONFIG.legalName}. All rights reserved.</p>
            <div className='flex items-center gap-6'>
              <span>Teku Customs Gateway</span>
              <span>•</span>
              <span>License No: 4892/080</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
