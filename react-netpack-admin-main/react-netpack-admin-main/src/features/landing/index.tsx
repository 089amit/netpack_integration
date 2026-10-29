'use client'

import React, { useState, useEffect } from 'react'
import { LANDING_CONFIG } from './config'
import { HeroGlobe } from './components/Globe'
import { ShipmentJourney } from './components/ShipmentJourney'
import { SplitReveal } from './components/SplitReveal'
import { ServicesSection } from './components/ServicesSection'
import { TrackingWidget } from './components/TrackingWidget'
import { QuoteSection } from './components/QuoteSection'
import { MobileAppModal } from './components/MobileAppModal'
import { isAuthenticated } from '@/lib/auth'

import {
  Menu,
  X,
  Search,
  ArrowRight,
  MessageCircle,
  Smartphone,
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)
  const [activeTrackingPrefill, setActiveTrackingPrefill] = useState('')
  const [prefilledService, setPrefilledService] = useState('')
  const [heroTrackInput, setHeroTrackInput] = useState('')
  const [showHeroTrackBar, setShowHeroTrackBar] = useState(false)

  // Set document title & metadata on mount
  useEffect(() => {
    document.title = `${LANDING_CONFIG.brandName} | Courier & International Shipping`
    setIsAuth(isAuthenticated())
  }, [])

  // Smooth scroll handler
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleHeroTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!heroTrackInput.trim()) return
    setActiveTrackingPrefill(heroTrackInput.trim())
    scrollTo('tracking')
  }

  return (
    <div className='min-h-screen bg-[#0D1B2A] text-slate-100 font-sans antialiased selection:bg-[#2F6BFF] selection:text-white'>
      {/* ──────────────────────────────────────────────────────────
          NAVIGATION BAR (Minimal Sticky Top Nav)
          ────────────────────────────────────────────────────────── */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-[#0D1B2A]/85 backdrop-blur-xl border-b border-white/10 transition-all'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between'>
          {/* Brand Logo Wordmark */}
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className='flex items-center gap-3 group'
          >
            {/* Minimalist Vector Box Node Icon */}
            <div className='w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#FF7A1A] p-0.5 shadow-lg shadow-[#2F6BFF]/20 group-hover:scale-105 transition-transform'>
              <div className='w-full h-full rounded-[14px] bg-[#0D1B2A] flex items-center justify-center font-display font-extrabold text-white text-base tracking-tighter'>
                NP
              </div>
            </div>

            <div className='flex flex-col'>
              <span className='font-display font-extrabold text-xl tracking-tight text-white leading-none'>
                {LANDING_CONFIG.brandName.split(' ')[0]}
              </span>
              <span className='font-mono text-[9px] tracking-[0.25em] text-[#FF7A1A] uppercase leading-tight'>
                {LANDING_CONFIG.brandName.split(' ')[1] || 'LOGISTIC'}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className='hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-slate-300'>
            <button onClick={() => scrollTo('services')} className='hover:text-white transition'>
              Services
            </button>
            <button onClick={() => scrollTo('tracking')} className='hover:text-white transition'>
              Tracking
            </button>
            <button onClick={() => scrollTo('journey')} className='hover:text-white transition'>
              Journey
            </button>
            <button onClick={() => scrollTo('quote')} className='hover:text-white transition'>
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className='hidden md:flex items-center gap-4'>
            {/* Mobile App Download Button */}
            <button
              onClick={() => setShowAppModal(true)}
              className='p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition'
              title='Download Android Mobile APKs'
            >
              <Smartphone className='w-4 h-4' />
            </button>

            {/* Discreet Staff / Admin Login */}
            <a
              href={isAuth ? '/enquiries' : '/sign-in'}
              className='text-xs font-mono uppercase text-slate-400 hover:text-white transition px-2 py-1'
            >
              {isAuth ? 'Dashboard' : 'Login'}
            </a>

            {/* Primary Quote CTA */}
            <button
              onClick={() => scrollTo('quote')}
              className='px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#e66c14] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-[#FF7A1A]/20'
            >
              Get Quote
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white'
            aria-label='Toggle Menu'
          >
            {mobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>

        {/* Mobile Slide-Down Dropdown Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden bg-[#0D1B2A] border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200'>
            <nav className='flex flex-col space-y-3 text-sm font-mono tracking-wider uppercase text-slate-300'>
              <button
                onClick={() => scrollTo('services')}
                className='text-left py-2 border-b border-white/5 hover:text-white'
              >
                Services
              </button>
              <button
                onClick={() => scrollTo('tracking')}
                className='text-left py-2 border-b border-white/5 hover:text-white'
              >
                Tracking Checkpoints
              </button>
              <button
                onClick={() => scrollTo('journey')}
                className='text-left py-2 border-b border-white/5 hover:text-white'
              >
                The 6-Stage Journey
              </button>
              <button
                onClick={() => scrollTo('quote')}
                className='text-left py-2 border-b border-white/5 hover:text-white'
              >
                Contact & Address
              </button>
            </nav>

            <div className='pt-2 flex flex-col gap-3'>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowAppModal(true)
                }}
                className='w-full py-3 rounded-xl bg-white/10 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2'
              >
                <Smartphone className='w-4 h-4 text-[#FF7A1A]' />
                <span>Download Android APKs</span>
              </button>

              <button
                onClick={() => scrollTo('quote')}
                className='w-full py-3.5 rounded-xl bg-[#FF7A1A] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF7A1A]/20'
              >
                Get a Fast Quote
              </button>

              <a
                href={isAuth ? '/enquiries' : '/sign-in'}
                className='text-center py-2 text-xs font-mono text-slate-400 hover:text-white'
              >
                {isAuth ? 'Open Staff Dashboard →' : 'Staff / Agent Login →'}
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ──────────────────────────────────────────────────────────
          SECTION 1: HERO (Dark Navy Full-Screen Scene)
          ────────────────────────────────────────────────────────── */}
      <section className='relative min-h-screen pt-28 pb-20 flex items-center justify-center overflow-hidden bg-[#0D1B2A]'>
        {/* Subtle radial ambient grid */}
        <div className='absolute inset-0 bg-[radial-gradient(#2F6BFF_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none' />

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
            {/* Hero Left Content */}
            <div className='lg:col-span-7 space-y-6 text-center lg:text-left'>
              {/* Operational Status Pill */}
              <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono tracking-wider text-slate-300'>
                <span className='w-2 h-2 rounded-full bg-[#10B981] animate-pulse' />
                <span>KATHMANDU INTERNATIONAL CARGO TERMINAL • LIVE</span>
              </div>

              {/* Huge Bold Grotesk Headline */}
              <h1 className='text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase font-display tracking-tight leading-[0.92] text-white'>
                {LANDING_CONFIG.tagline}
              </h1>

              {/* Subheadline */}
              <p className='text-lg sm:text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed'>
                {LANDING_CONFIG.subheadline}
              </p>

              {/* Hero Call-to-Actions */}
              <div className='pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4'>
                <button
                  onClick={() => setShowHeroTrackBar(!showHeroTrackBar)}
                  className='w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF7A1A] hover:bg-[#e66c14] text-white font-extrabold text-sm uppercase tracking-wider transition duration-200 shadow-xl shadow-[#FF7A1A]/30 flex items-center justify-center gap-2 group'
                >
                  <Search className='w-4 h-4' />
                  <span>Track Shipment</span>
                </button>

                <button
                  onClick={() => scrollTo('quote')}
                  className='w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2'
                >
                  <span>Get a Quote</span>
                  <ArrowRight className='w-4 h-4' />
                </button>
              </div>

              {/* Expandable Fast Track Input in Hero */}
              {showHeroTrackBar && (
                <form
                  onSubmit={handleHeroTrackSubmit}
                  className='max-w-md mx-auto lg:mx-0 p-2 rounded-2xl bg-[#132238] border border-white/20 shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200'
                >
                  <input
                    type='text'
                    autoFocus
                    value={heroTrackInput}
                    onChange={(e) => setHeroTrackInput(e.target.value)}
                    placeholder='Enter AWB (e.g. NP-TEST-1001)'
                    className='w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none'
                  />
                  <button
                    type='submit'
                    className='px-4 py-2 rounded-xl bg-[#2F6BFF] text-white text-xs font-mono font-bold uppercase shrink-0 hover:bg-blue-600 transition'
                  >
                    Go
                  </button>
                </form>
              )}
            </div>

            {/* Hero Right Visual: 60FPS Rotating Wireframe Globe */}
            <div className='lg:col-span-5 flex items-center justify-center'>
              <HeroGlobe />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 2: PROOF (Light Off-White Scene)
          ────────────────────────────────────────────────────────── */}
      <section className='relative w-full py-20 md:py-28 bg-[#F5F7FA] text-slate-900 border-t border-b border-slate-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
            {/* Left: Looping Branded Parcel Graphic */}
            <div className='lg:col-span-4 flex items-center justify-center'>
              <div className='relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center'>
                {/* Floating ambient shadow */}
                <div className='absolute bottom-2 w-32 h-6 bg-slate-300 rounded-full blur-md opacity-70' />

                {/* Inline SVG Cardboard Parcel Box */}
                <svg
                  viewBox='0 0 200 200'
                  className='w-full h-full drop-shadow-xl animate-bounce duration-1000'
                  style={{ animationDuration: '3s' }}
                >
                  <polygon points='100,20 170,55 170,130 100,165 30,130 30,55' fill='#D89D65' stroke='#B27C4B' strokeWidth='2' />
                  <polygon points='100,20 170,55 100,90 30,55' fill='#E6B17E' />
                  <line x1='100' y1='90' x2='100' y2='165' stroke='#B27C4B' strokeWidth='2' />
                  {/* Yellow Tape */}
                  <line x1='100' y1='20' x2='100' y2='90' stroke='#F6D860' strokeWidth='8' />
                  {/* Label */}
                  <rect x='60' y='65' width='40' height='22' rx='2' fill='#FFF' transform='rotate(10 80 75)' />
                  <text x='65' y='76' fontSize='6' fontWeight='bold' fill='#0D1B2A' transform='rotate(10 80 75)'>
                    NETPACK
                  </text>
                  <line x1='65' y1='80' x2='95' y2='80' stroke='#000' strokeWidth='1' transform='rotate(10 80 75)' />
                </svg>
              </div>
            </div>

            {/* Right: Big Headline & Animated Proof Metrics */}
            <div className='lg:col-span-8 space-y-8'>
              <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#2F6BFF] uppercase'>
                <span>VERIFIABLE PERFORMANCE</span>
                <span>•</span>
                <span>NO SHORTCUTS</span>
              </div>

              <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase font-display tracking-tight leading-none text-slate-900'>
                WE MOVE PARCELS. WE OWN THE OUTCOME.
              </h2>

              {/* 3 Count-Up Stats */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4'>
                {LANDING_CONFIG.stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className='p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow'
                  >
                    <div className='text-3xl sm:text-4xl md:text-5xl font-black font-display text-slate-900 tracking-tight'>
                      {stat.value}
                    </div>
                    <div className='text-xs font-mono font-bold uppercase tracking-wider text-[#2F6BFF] mt-1'>
                      {stat.label}
                    </div>
                    <div className='text-xs text-slate-500 mt-1 font-sans'>
                      {stat.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 3: THE SHIPMENT JOURNEY (Pinned 6-Stage Lifecycle)
          ────────────────────────────────────────────────────────── */}
      <ShipmentJourney />

      {/* ──────────────────────────────────────────────────────────
          SECTION 4: SPLIT REVEAL (Reliability at Every Milestone)
          ────────────────────────────────────────────────────────── */}
      <SplitReveal />

      {/* ──────────────────────────────────────────────────────────
          SECTION 5: SERVICES (Horizontal Kinetic Header + Cards)
          ────────────────────────────────────────────────────────── */}
      <ServicesSection
        onSelectServiceForQuote={(serviceTitle) => {
          setPrefilledService(serviceTitle)
        }}
      />

      {/* ──────────────────────────────────────────────────────────
          SECTION 6: TRACKING WIDGET (Real API + Mock Fallback)
          ────────────────────────────────────────────────────────── */}
      <TrackingWidget initialTrackingId={activeTrackingPrefill} />

      {/* ──────────────────────────────────────────────────────────
          SECTION 7: CTA & FOOTER (Dark Navy)
          ────────────────────────────────────────────────────────── */}
      <QuoteSection
        prefilledService={prefilledService}
        onOpenAppModal={() => setShowAppModal(true)}
      />

      {/* ──────────────────────────────────────────────────────────
          FLOATING WHATSAPP BUTTON (Bottom-Right)
          ────────────────────────────────────────────────────────── */}
      <a
        href={`https://wa.me/${LANDING_CONFIG.whatsapp.phone}?text=${encodeURIComponent(
          LANDING_CONFIG.whatsapp.defaultMessage
        )}`}
        target='_blank'
        rel='noopener noreferrer'
        className='fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group'
        aria-label='Direct WhatsApp Support'
        title={`WhatsApp Support: ${LANDING_CONFIG.whatsapp.displayNumber}`}
      >
        <MessageCircle className='w-6 h-6 fill-current' />
        <span className='max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-out font-mono text-xs font-bold pl-0 group-hover:pl-2'>
          WhatsApp Desk
        </span>
      </a>

      {/* ──────────────────────────────────────────────────────────
          MOBILE APPLICATION INSTALL MODAL
          ────────────────────────────────────────────────────────── */}
      <MobileAppModal
        open={showAppModal}
        onClose={() => setShowAppModal(false)}
      />
    </div>
  )
}
