'use client'

import React, { useState, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

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
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const [showAppModal, setShowAppModal] = useState(false)
  const [activeTrackingPrefill, setActiveTrackingPrefill] = useState('')
  const [prefilledService, setPrefilledService] = useState('')
  const [heroTrackInput, setHeroTrackInput] = useState('')
  const [showHeroTrackBar, setShowHeroTrackBar] = useState(false)

  const lenisRef = useRef<Lenis | null>(null)

  // Initialize Butter-Smooth Scrolling via Lenis
  useEffect(() => {
    document.title = `${LANDING_CONFIG.brandName} | Courier & International Shipping`
    setIsAuth(isAuthenticated())

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis

    let animationFrameId: number
    function raf(time: number) {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }
    animationFrameId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(animationFrameId)
      lenis.destroy()
    }
  }, [])

  // Smooth scroll handler using Lenis
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(el, { offset: -80, duration: 1.2 })
      } else {
        el.scrollIntoView({ behavior: 'smooth' })
      }
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
          NAVIGATION BAR (Minimal & Clean Sticky Top Nav)
          ────────────────────────────────────────────────────────── */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-[#0D1B2A]/90 backdrop-blur-xl border-b border-white/10 transition-all'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between'>
          {/* Official NetPack Brand Logo */}
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              if (lenisRef.current) {
                lenisRef.current.scrollTo(0, { duration: 1.2 })
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            className='flex items-center active:scale-95 transition-transform'
            title='NetPack Logistic'
          >
            <img
              src='/alzlogo.png'
              alt='NetPack Logistic'
              style={{ filter: 'brightness(0) invert(1)' }}
              className='h-8 sm:h-9 md:h-10 w-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] hover:opacity-90 transition-opacity'
            />
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
          SECTION 2: PROOF (Clean Minimalist Metrics Scene)
          ────────────────────────────────────────────────────────── */}
      <section className='relative w-full py-20 md:py-28 bg-[#F5F7FA] text-slate-900 border-t border-b border-slate-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'>
            {/* Left: Statement */}
            <div className='lg:col-span-5 space-y-4'>
              <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#2F6BFF] uppercase'>
                <span className='w-2 h-2 rounded-full bg-[#2F6BFF]' />
                <span>VERIFIABLE PERFORMANCE</span>
              </div>

              <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase font-display tracking-tight leading-none text-slate-900'>
                WE MOVE PARCELS. WE OWN THE OUTCOME.
              </h2>

              <p className='text-slate-600 text-sm sm:text-base leading-relaxed font-sans pt-1'>
                Door-to-door courier dispatch and international air freight with zero blind spots. Every handover logged with verified timestamps.
              </p>
            </div>

            {/* Right: 3 Clean Minimal Count-Up Stats */}
            <div className='lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5'>
              {LANDING_CONFIG.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className='p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300'
                >
                  <div className='text-3xl sm:text-4xl md:text-5xl font-black font-display text-slate-900 tracking-tight'>
                    {stat.value}
                  </div>
                  <div className='text-xs font-mono font-bold uppercase tracking-wider text-[#2F6BFF] mt-2'>
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
      </section>

      {/* ──────────────────────────────────────────────────────────
          SECTION 3: THE SHIPMENT JOURNEY (Pinned 6-Stage 3D Lifecycle)
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
          SECTION 6: TRACKING WIDGET (Live Real Backend API)
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
