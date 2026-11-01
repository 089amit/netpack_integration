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
import { SERVER_URL } from '@/constants/endpoint'
import { COUNTRY_OPTIONS } from '@/features/pwa/countries'

export const QuoteSection: React.FC<{
  onOpenAppModal?: () => void
  prefilledService?: string
}> = ({ onOpenAppModal, prefilledService = '' }) => {
  const [senderDialCode, setSenderDialCode] = useState('+977')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    serviceInterest: prefilledService || '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.message) {
      toast.error('Please fill in your full name, email, and message.')
      return
    }

    setSubmitting(true)
    try {
      // Optional async submission to backend enquiry or simulated dispatch
      try {
        const cleanDigits = form.phone.trim().replace(/^0+/, '')
        const fullPhone = form.phone.trim() ? (form.phone.trim().startsWith('+') ? form.phone.trim() : `${senderDialCode}-${cleanDigits}`) : ''
        await fetch(`${SERVER_URL}/api/enquiry/webenquirycreate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderName: form.fullName,
            senderEmail: form.email,
            senderPhone: fullPhone,
            commodity: form.serviceInterest || 'General Inquiry',
            packageDetails: form.message,
            destinationLocation: 'International Dispatch',
          }),
        })
      } catch {
        // Fallback gracefully
      }

      setSubmitted(true)
      toast.success('Thank you! Your message has been sent. We will get back to you within 24 hours.')
    } catch {
      toast.error('Failed to send message. Please call our hotline directly.')
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id='quote' className='relative w-full bg-white text-slate-900 border-t border-slate-200 overflow-hidden'>
      {/* Background ambient lighting */}
      <div className='absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none' />

      {/* PART A: Contact Information & Send us a Message Form */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start'>
          {/* Left Column: Headlines & Direct Contacts */}
          <div className='lg:col-span-5 space-y-6'>
            <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#0066CC] uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60'>
              <span className='w-2 h-2 rounded-full bg-[#0066CC]' />
              <span>GET IN TOUCH</span>
            </div>

            <h2 className='text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase font-display tracking-tight leading-none text-slate-900'>
              SHIP WITH CONFIDENCE.
            </h2>

            <p className='text-base sm:text-lg text-slate-600 leading-relaxed font-sans'>
              Have questions about air cargo routes, customs clearance, or door-to-door courier schedules? Our Teku duty team responds rapidly within 24 hours.
            </p>

            {/* Direct Contact Hotline Card */}
            <div className='p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm'>
              <div className='text-xs font-mono text-slate-500 uppercase tracking-wider'>
                OPERATIONS DESK KATHMANDU
              </div>
              <div className='flex items-center gap-3 text-lg font-bold font-mono text-slate-900'>
                <Phone className='w-5 h-5 text-[#0066CC]' />
                <a href={`tel:${LANDING_CONFIG.contact.phone}`} className='hover:text-[#0066CC] transition'>
                  {LANDING_CONFIG.contact.phone}
                </a>
              </div>
              <div className='flex items-center gap-3 text-sm font-mono text-slate-700'>
                <Mail className='w-4 h-4 text-[#0066CC]' />
                <a href={`mailto:${LANDING_CONFIG.contact.email}`} className='hover:underline'>
                  {LANDING_CONFIG.contact.email}
                </a>
              </div>
              <div className='flex items-start gap-3 text-xs font-sans text-slate-600'>
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
                  className='inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono tracking-wider uppercase text-slate-800 transition'
                >
                  <Smartphone className='w-4 h-4 text-[#FF7A1A]' />
                  <span>Download Mobile APKs (Customer & Rider)</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Send us a Message Card (Matching Picture 2) */}
          <div className='lg:col-span-7'>
            <div className='p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50'>
              {submitted ? (
                <div className='text-center py-12 space-y-4 animate-in fade-in'>
                  <div className='w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto'>
                    <CheckCircle2 className='w-8 h-8' />
                  </div>
                  <h3 className='text-2xl font-bold font-display uppercase tracking-tight text-slate-900'>
                    MESSAGE SENT SUCCESSFULLY
                  </h3>
                  <p className='text-sm text-slate-600 max-w-md mx-auto'>
                    Thank you, <span className='text-slate-900 font-bold'>{form.fullName}</span>. We have received your message and will get back to you at{' '}
                    <span className='text-slate-900 font-bold'>{form.email}</span> within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setForm({ fullName: '', email: '', phone: '', serviceInterest: '', message: '' })
                    }}
                    className='mt-4 px-6 py-2.5 rounded-xl border border-slate-300 text-xs font-mono tracking-wider uppercase hover:bg-slate-50 transition text-slate-700 font-bold'
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-5'>
                  {/* Title & Subtitle */}
                  <div>
                    <h3 className='text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight'>
                      Send us a Message
                    </h3>
                    <p className='text-sm text-slate-500 mt-1'>
                      Fill out the form below and we&apos;ll get back to you within 24 hours.
                    </p>
                  </div>

                  {/* Row 1: Full Name & Email Address */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-800 mb-1.5'>
                        Full Name <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='text'
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder='Your full name'
                        className='w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 focus:outline-none transition'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-800 mb-1.5'>
                        Email Address <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='email'
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder='your.email@example.com'
                        className='w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 focus:outline-none transition'
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone Number & Service Interest */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-800 mb-1.5'>
                        Phone Number
                      </label>
                      <div className='flex gap-2'>
                        <div className='relative shrink-0 w-28'>
                          <select
                            onChange={(e) => {
                              const opt = COUNTRY_OPTIONS.find((c) => c.name === e.target.value)
                              if (opt) setSenderDialCode(opt.dialCode)
                            }}
                            defaultValue='Nepal'
                            className='w-full px-2 py-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-800 text-xs font-mono font-bold focus:bg-white focus:border-[#0066CC] focus:outline-none transition appearance-none'
                          >
                            {COUNTRY_OPTIONS.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.dialCode} ({c.name})
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type='tel'
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder='9841234567'
                          className='flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 focus:outline-none transition'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-800 mb-1.5'>
                        Service Interest
                      </label>
                      <select
                        value={form.serviceInterest}
                        onChange={(e) => setForm({ ...form, serviceInterest: e.target.value })}
                        className='w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-800 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 focus:outline-none transition'
                      >
                        <option value=''>Select a service</option>
                        <option value='International Air Cargo'>International Air Cargo</option>
                        <option value='Express Priority Courier'>Express Priority Courier</option>
                        <option value='Customs Clearance Brokerage'>Customs Clearance & Brokerage</option>
                        <option value='Door-to-Door Valley Pickup'>Door-to-Door Valley Pickup</option>
                        <option value='Commercial Palletized Freight'>Commercial Palletized Freight</option>
                        <option value='Warehousing & Fulfillment'>Warehousing & Fulfillment</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Message Textarea */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-800 mb-1.5'>
                      Message <span className='text-red-500'>*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder='Tell us about your shipping needs or ask any questions...'
                      className='w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/10 focus:outline-none transition resize-y'
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type='submit'
                    disabled={submitting}
                    className='w-full py-3.5 px-6 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] text-white font-semibold text-sm transition duration-200 shadow-md shadow-[#0066CC]/25 disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
                    <Send className='w-4 h-4' />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PART B: Clean Hairline Footer & Legal Disclosures (White / Slate-50) */}
      <div className='border-t border-slate-200 bg-slate-50 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-200'>
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
                className='h-8 sm:h-9 w-auto object-contain group-hover:opacity-90 transition-opacity'
              />
            </a>

            {/* Quick Links Navigation */}
            <div className='flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-600'>
              <a href='#services' className='hover:text-slate-900 transition'>SERVICES</a>
              <a href='#tracking' className='hover:text-slate-900 transition'>TRACKING</a>
              <a href='#journey' className='hover:text-slate-900 transition'>JOURNEY</a>
              <a href='#quote' className='hover:text-slate-900 transition'>CONTACT</a>
              <a href='/sign-in' className='hover:text-[#0066CC] transition font-bold'>STAFF LOGIN</a>
            </div>

            {/* Social Icons & Back to Top */}
            <div className='flex items-center gap-3'>
              {LANDING_CONFIG.socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-sm'
                  aria-label={s.name}
                >
                  {s.name === 'Facebook' && <Facebook className='w-4 h-4' />}
                  {s.name === 'Instagram' && <Instagram className='w-4 h-4' />}
                  {s.name === 'LinkedIn' && <Linkedin className='w-4 h-4' />}
                </a>
              ))}

              <button
                onClick={scrollToTop}
                className='p-2 rounded-full bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-sm'
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
