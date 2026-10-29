import React, { useState, useEffect, useRef } from 'react'
import { LANDING_CONFIG } from '../config'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
} from 'lucide-react'

export const ShipmentJourney: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const stages = LANDING_CONFIG.stages
  const currentStage = stages[activeStageIndex]
  const isAir = LANDING_CONFIG.transportMode === 'air'

  // Auto-cycle through stages if user turns on auto-play or on scroll
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % stages.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPlaying, stages.length])

  // Scroll observer to update stages when scrolling down the section
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const totalHeight = sectionRef.current.offsetHeight
      const viewportHeight = window.innerHeight

      // If section is in view
      if (rect.top <= viewportHeight * 0.4 && rect.bottom >= viewportHeight * 0.4) {
        const scrolledInside = Math.max(0, -rect.top + viewportHeight * 0.2)
        const progress = Math.min(1, Math.max(0, scrolledInside / (totalHeight - viewportHeight * 0.5)))
        const nextIndex = Math.min(stages.length - 1, Math.floor(progress * stages.length))
        setActiveStageIndex(nextIndex)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [stages.length])

  // Stage theme background styling
  const isDarkScene = currentStage.theme === 'dark'

  return (
    <section
      id='journey'
      ref={sectionRef}
      className={`relative w-full py-20 md:py-32 transition-colors duration-700 ease-in-out ${
        isDarkScene ? 'bg-[#0D1B2A] text-white' : 'bg-[#F5F7FA] text-slate-900'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Top Tagline */}
        <div className='text-center mb-10 md:mb-16'>
          <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase mb-4 transition-colors duration-300 border border-current opacity-70'>
            <span>STAGE 0{currentStage.id} OF 06</span>
            <span>•</span>
            <span>THE NETPACK LIFECYCLE</span>
          </div>

          <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight font-display max-w-4xl mx-auto leading-none'>
            THE SHIPMENT JOURNEY
          </h2>
          <p
            className={`mt-4 text-base sm:text-lg max-w-2xl mx-auto ${
              isDarkScene ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            A continuous chain of custody. Watch your parcel progress across all six checkpoints.
          </p>

          {/* Interactive Play/Pause & Stage Scrub Buttons */}
          <div className='mt-6 flex items-center justify-center gap-3'>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                isDarkScene
                  ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              {isPlaying ? <Pause className='w-3.5 h-3.5' /> : <Play className='w-3.5 h-3.5 fill-current' />}
              <span>{isPlaying ? 'Pause Auto-Scrub' : 'Auto-Play Story'}</span>
            </button>

            <button
              onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeStageIndex === 0}
              className='p-2 rounded-full border border-current opacity-50 hover:opacity-100 disabled:opacity-20 transition'
              aria-label='Previous Stage'
            >
              <ArrowLeft className='w-4 h-4' />
            </button>
            <button
              onClick={() => setActiveStageIndex((prev) => Math.min(stages.length - 1, prev + 1))}
              disabled={activeStageIndex === stages.length - 1}
              className='p-2 rounded-full border border-current opacity-50 hover:opacity-100 disabled:opacity-20 transition'
              aria-label='Next Stage'
            >
              <ArrowRight className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Main Interactive Stage Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center'>
          {/* LEFT: Stage Information & Progress Tracker */}
          <div className='lg:col-span-5 flex flex-col justify-between order-2 lg:order-1'>
            {/* Active Stage Detail Card */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border backdrop-blur-xl transition-all duration-500 shadow-xl ${
                isDarkScene
                  ? 'bg-[#132238]/90 border-white/10 text-white'
                  : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/50'
              }`}
            >
              <div className='flex items-center justify-between gap-4 mb-4'>
                <span className='px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30'>
                  {currentStage.badge}
                </span>
                <div
                  className={`flex items-center gap-1.5 text-xs font-mono ${
                    isDarkScene ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <Clock className='w-3.5 h-3.5' />
                  <span>{currentStage.eta}</span>
                </div>
              </div>

              <h3 className='text-2xl sm:text-3xl font-extrabold uppercase tracking-tight font-display mb-3'>
                {currentStage.title}
              </h3>

              <p
                className={`text-base sm:text-lg leading-relaxed ${
                  isDarkScene ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {currentStage.description}
              </p>

              {/* Progress Bar within active stage */}
              <div className='mt-6 pt-6 border-t border-current/10'>
                <div className='flex justify-between text-xs font-mono opacity-70 mb-2'>
                  <span>MILESTONE VERIFICATION</span>
                  <span>{Math.round(((activeStageIndex + 1) / stages.length) * 100)}% COMPLETE</span>
                </div>
                <div className='w-full h-1.5 rounded-full bg-slate-300/30 overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-[#2F6BFF] to-[#FF7A1A] transition-all duration-500 rounded-full'
                    style={{ width: `${((activeStageIndex + 1) / stages.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Vertical Tracker / Mobile Horizontal Bar */}
            <div className='mt-8 pt-4'>
              <div className='flex lg:flex-col justify-between items-center lg:items-start gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none'>
                {stages.map((stage, idx) => {
                  const isActive = idx === activeStageIndex
                  const isDone = idx < activeStageIndex

                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStageIndex(idx)}
                      className={`flex items-center gap-3 text-left transition-all py-1.5 px-3 rounded-xl ${
                        isActive
                          ? isDarkScene
                            ? 'bg-white/10 text-white font-bold'
                            : 'bg-slate-200 text-slate-900 font-bold'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-colors ${
                          isActive
                            ? 'bg-[#FF7A1A] text-white shadow-md shadow-[#FF7A1A]/30'
                            : isDone
                            ? 'bg-[#2F6BFF] text-white'
                            : isDarkScene
                            ? 'bg-white/10 text-slate-400'
                            : 'bg-slate-300 text-slate-600'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className='w-3.5 h-3.5' /> : stage.id}
                      </div>
                      <span className='hidden sm:inline text-xs font-mono uppercase tracking-wider whitespace-nowrap'>
                        {stage.shortLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: High-Definition Animated Inline SVG Visual Stage Scene */}
          <div className='lg:col-span-7 order-1 lg:order-2'>
            <div
              className={`relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-3xl border overflow-hidden transition-all duration-500 shadow-2xl flex items-center justify-center p-6 ${
                isDarkScene ? 'bg-[#0B1522] border-white/10' : 'bg-white border-slate-200/80 shadow-slate-300/40'
              }`}
            >
              {/* Scene Content Rendered According to activeStageIndex */}
              <div className='w-full h-full flex items-center justify-center'>
                {activeStageIndex === 0 && <StagePackingScene />}
                {activeStageIndex === 1 && <StageCustomsExportScene />}
                {activeStageIndex === 2 && <StageDepartureScene isAir={isAir} />}
                {activeStageIndex === 3 && <StageDestinationCustomsScene />}
                {activeStageIndex === 4 && <StageDeliveryVanScene />}
                {activeStageIndex === 5 && <StageDeliveredScene />}
              </div>

              {/* Stage Counter Corner Chip */}
              <div className='absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest bg-black/40 backdrop-blur-md text-white border border-white/10'>
                STAGE 0{currentStage.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   STAGE 1: PACKING (Light Scene)
   - Robotic Arm / Worker, Flaps fold, Tape slides, NETPACK label drops, Laser scan
   ========================================================================= */
const StagePackingScene: React.FC = () => {
  return (
    <svg viewBox='0 0 500 350' className='w-full h-full max-h-[380px] drop-shadow-md select-none' aria-hidden='true'>
      <defs>
        <linearGradient id='boxGrad' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#E6B17E' />
          <stop offset='100%' stopColor='#C28B57' />
        </linearGradient>
        <linearGradient id='laserGrad' x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0%' stopColor='rgba(47, 107, 255, 0)' />
          <stop offset='50%' stopColor='#2F6BFF' />
          <stop offset='100%' stopColor='rgba(47, 107, 255, 0)' />
        </linearGradient>
      </defs>

      {/* Grid Floor */}
      <line x1='50' y1='280' x2='450' y2='280' stroke='#E2E8F0' strokeWidth='2' />
      <line x1='100' y1='310' x2='400' y2='310' stroke='#F1F5F9' strokeWidth='1.5' />

      {/* Conveyor Rollers */}
      <g>
        {[100, 160, 220, 280, 340, 400].map((rx, idx) => (
          <ellipse key={idx} cx={rx} cy='280' rx='14' ry='5' fill='#CBD5E1' />
        ))}
        <rect x='80' y='275' width='340' height='10' rx='5' fill='#94A3B8' opacity='0.5' />
      </g>

      {/* Cardboard Box Body */}
      <g transform='translate(170, 150)'>
        {/* Box Shadow */}
        <ellipse cx='80' cy='125' rx='75' ry='12' fill='rgba(0,0,0,0.08)' />

        {/* Isometric Box Main Body */}
        <polygon points='80,30 150,65 150,120 80,85' fill='#C28B57' />
        <polygon points='10,65 80,30 80,85 10,120' fill='#D89D65' />
        <polygon points='80,85 150,120 80,155 10,120' fill='#B27C4B' />

        {/* Sealed Flaps with Tape animation */}
        <polygon points='10,65 80,30 150,65 80,100' fill='url(#boxGrad)' stroke='#A67140' strokeWidth='1' />
        {/* Packing Tape */}
        <line x1='80' y1='30' x2='80' y2='100' stroke='#F6D860' strokeWidth='7' strokeLinecap='round' />

        {/* NETPACK Branded Label */}
        <g transform='translate(45, 55) rotate(15)'>
          <rect x='0' y='0' width='55' height='32' rx='3' fill='#FFFFFF' stroke='#94A3B8' strokeWidth='0.8' />
          {/* NETPACK Wordmark on label */}
          <text x='5' y='12' fontSize='7' fontWeight='bold' fill='#0D1B2A' fontFamily='sans-serif'>
            NETPACK
          </text>
          <text x='38' y='12' fontSize='5' fill='#FF7A1A' fontWeight='bold'>
            EXP
          </text>
          {/* Barcode lines */}
          <line x1='6' y1='18' x2='6' y2='27' stroke='#0D1B2A' strokeWidth='1.5' />
          <line x1='10' y1='18' x2='10' y2='27' stroke='#0D1B2A' strokeWidth='1' />
          <line x1='14' y1='18' x2='14' y2='27' stroke='#0D1B2A' strokeWidth='2' />
          <line x1='19' y1='18' x2='19' y2='27' stroke='#0D1B2A' strokeWidth='1' />
          <line x1='23' y1='18' x2='23' y2='27' stroke='#0D1B2A' strokeWidth='2.5' />
          <line x1='29' y1='18' x2='29' y2='27' stroke='#0D1B2A' strokeWidth='1' />
          <line x1='34' y1='18' x2='34' y2='27' stroke='#0D1B2A' strokeWidth='1.5' />
          <line x1='40' y1='18' x2='40' y2='27' stroke='#0D1B2A' strokeWidth='1' />
          <line x1='45' y1='18' x2='45' y2='27' stroke='#0D1B2A' strokeWidth='2' />
        </g>

        {/* Animated Blue Laser Scan Line */}
        <line x1='10' y1='75' x2='150' y2='75' stroke='url(#laserGrad)' strokeWidth='3.5' opacity='0.9'>
          <animate attributeName='y1' values='40;110;40' dur='2.2s' repeatCount='indefinite' />
          <animate attributeName='y2' values='40;110;40' dur='2.2s' repeatCount='indefinite' />
        </line>
      </g>

      {/* Robotic Arm / Packing Mechanism */}
      <g stroke='#475569' strokeWidth='5' strokeLinecap='round' strokeLinejoin='round' fill='none'>
        <path d='M80 60 L140 100 L210 80 L250 140' />
        <circle cx='80' cy='60' r='10' fill='#0D1B2A' stroke='none' />
        <circle cx='140' cy='100' r='6' fill='#2F6BFF' stroke='none' />
        <circle cx='210' cy='80' r='6' fill='#2F6BFF' stroke='none' />
        <polygon points='245,140 255,140 250,155' fill='#FF7A1A' stroke='none' />
      </g>
    </svg>
  )
}

/* =========================================================================
   STAGE 2: CUSTOMS CLEARANCE (Light Grey Scene)
   - Conveyor into scanner booth, X-Ray beams, CLEARED green stamp slam
   ========================================================================= */
const StageCustomsExportScene: React.FC = () => {
  return (
    <svg viewBox='0 0 500 350' className='w-full h-full max-h-[380px] drop-shadow-md select-none' aria-hidden='true'>
      <defs>
        <linearGradient id='scannerBeam' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='rgba(47, 107, 255, 0.4)' />
          <stop offset='100%' stopColor='rgba(47, 107, 255, 0.05)' />
        </linearGradient>
      </defs>

      {/* Customs Scanner Tunnel Gate */}
      <g>
        <rect x='160' y='60' width='180' height='220' rx='12' fill='#1E293B' />
        <rect x='180' y='80' width='140' height='180' rx='8' fill='#0F172A' />
        <rect x='185' y='85' width='130' height='170' rx='4' fill='url(#scannerBeam)' />

        {/* Scanner Head Indicator */}
        <circle cx='250' cy='72' r='4' fill='#22C55E'>
          <animate attributeName='opacity' values='1;0.3;1' dur='1.2s' repeatCount='indefinite' />
        </circle>
        <text x='250' y='105' textAnchor='middle' fill='#38BDF8' fontSize='9' fontWeight='bold' fontFamily='monospace'>
          X-RAY SCAN IN PROGRESS
        </text>
      </g>

      {/* Moving Parcel on conveyor */}
      <g transform='translate(195, 175)'>
        <rect x='0' y='0' width='110' height='75' rx='5' fill='#C28B57' stroke='#9A6939' strokeWidth='1.5' />
        <line x1='55' y1='0' x2='55' y2='75' stroke='#F6D860' strokeWidth='6' />
        {/* Barcode stamp */}
        <rect x='15' y='20' width='35' height='20' fill='#FFF' rx='2' />
        <line x1='20' y1='25' x2='20' y2='35' stroke='#000' strokeWidth='1.5' />
        <line x1='25' y1='25' x2='25' y2='35' stroke='#000' strokeWidth='2' />
        <line x1='32' y1='25' x2='32' y2='35' stroke='#000' strokeWidth='1' />
        <line x1='40' y1='25' x2='40' y2='35' stroke='#000' strokeWidth='2' />
      </g>

      {/* Official Customs Document with Stamp */}
      <g transform='translate(60, 90) rotate(-6)'>
        <rect x='0' y='0' width='90' height='120' rx='4' fill='#FFFFFF' stroke='#CBD5E1' strokeWidth='1.5' />
        <rect x='10' y='12' width='45' height='6' fill='#0D1B2A' />
        <line x1='10' y1='28' x2='80' y2='28' stroke='#94A3B8' strokeWidth='2' />
        <line x1='10' y1='38' x2='75' y2='38' stroke='#94A3B8' strokeWidth='2' />
        <line x1='10' y1='48' x2='65' y2='48' stroke='#94A3B8' strokeWidth='2' />
        <line x1='10' y1='58' x2='78' y2='58' stroke='#94A3B8' strokeWidth='2' />

        {/* Slamming Green CLEARED Stamp */}
        <g transform='translate(15, 68) rotate(-12)'>
          <rect x='0' y='0' width='64' height='26' rx='4' fill='none' stroke='#16A34A' strokeWidth='2.5' />
          <text x='32' y='18' textAnchor='middle' fill='#16A34A' fontSize='11' fontWeight='900' fontFamily='monospace'>
            CLEARED
          </text>
        </g>
      </g>

      {/* Conveyor track */}
      <line x1='30' y1='250' x2='470' y2='250' stroke='#64748B' strokeWidth='6' />
    </svg>
  )
}

/* =========================================================================
   STAGE 3: SHIPMENT DEPARTURE (Dark Sky Transition)
   - Cargo Plane / Container Ship, Dotted flight route, parallax night clouds
   ========================================================================= */
const StageDepartureScene: React.FC<{ isAir: boolean }> = ({ isAir }) => {
  return (
    <svg viewBox='0 0 500 350' className='w-full h-full max-h-[380px] drop-shadow-md select-none' aria-hidden='true'>
      <defs>
        <radialGradient id='nightAura' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#1E3A8A' stopOpacity='0.4' />
          <stop offset='100%' stopColor='#0D1B2A' stopOpacity='0' />
        </radialGradient>
      </defs>

      {/* Deep Night Atmosphere with Stars */}
      <rect x='0' y='0' width='500' height='350' fill='#0B1522' />
      <circle cx='250' cy='160' r='180' fill='url(#nightAura)' />

      {/* Tiny stars */}
      {[
        [40, 50],
        [90, 80],
        [150, 40],
        [220, 60],
        [320, 45],
        [420, 70],
        [460, 110],
        [80, 200],
        [380, 190],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r='1.2' fill='#FFFFFF' opacity={0.6} />
      ))}

      {/* Dotted Arch Flight / Shipping Path */}
      <path
        d='M 50 260 Q 240 60 450 140'
        fill='none'
        stroke='#2F6BFF'
        strokeWidth='2.5'
        strokeDasharray='6 8'
        opacity='0.7'
      />

      {isAir ? (
        /* Heavy Cargo Aircraft */
        <g transform='translate(230, 95) rotate(-15)'>
          {/* Plane Body */}
          <ellipse cx='50' cy='30' rx='70' ry='16' fill='#FFFFFF' />
          {/* Cockpit & Windows */}
          <path d='M100 24 Q115 30 110 33 L100 33 Z' fill='#0D1B2A' />
          {/* Main Wings */}
          <polygon points='35,30 5,6 30,30' fill='#CBD5E1' />
          <polygon points='35,30 10,75 35,35' fill='#94A3B8' />
          {/* Tail Fin with NETPACK Orange Highlight */}
          <polygon points='-10,30 -25,2 0,30' fill='#2F6BFF' />
          <polygon points='-15,15 -25,2 -5,15' fill='#FF7A1A' />
          {/* Jet Turbines */}
          <rect x='25' y='50' width='22' height='8' rx='4' fill='#475569' />
          {/* Wingtip navigation strobe */}
          <circle cx='10' cy='75' r='3' fill='#22C55E'>
            <animate attributeName='opacity' values='1;0.1;1' dur='0.9s' repeatCount='indefinite' />
          </circle>
          {/* NETPACK Wordmark on Fuselage */}
          <text x='35' y='34' fontSize='8' fontWeight='bold' fill='#0D1B2A' fontFamily='sans-serif'>
            NETPACK CARGO
          </text>
        </g>
      ) : (
        /* Container Ship Alternative */
        <g transform='translate(180, 140)'>
          <polygon points='20,60 140,60 120,95 40,95' fill='#1E293B' />
          <rect x='45' y='25' width='25' height='35' fill='#FF7A1A' />
          <rect x='75' y='30' width='25' height='30' fill='#2F6BFF' />
          <rect x='105' y='35' width='20' height='25' fill='#10B981' />
          {/* Ocean Waves */}
          <path d='M 10 95 Q 40 105 80 95 T 160 95' fill='none' stroke='#38BDF8' strokeWidth='3' />
        </g>
      )}

      {/* Parallax Clouds at Bottom */}
      <g opacity='0.35'>
        <path d='M-20 280 Q 40 240 120 280 T 260 270 T 400 290 T 520 280 L520 350 L-20 350 Z' fill='#1E293B' />
        <path d='M20 300 Q 120 260 220 300 T 380 290 T 520 310 L520 350 L20 350 Z' fill='#334155' />
      </g>
    </svg>
  )
}

/* =========================================================================
   STAGE 4: CLEARANCE AT DESTINATION (Dark Navy Import Customs)
   - Unloading, Import scan, Destination Flag / Badge
   ========================================================================= */
const StageDestinationCustomsScene: React.FC = () => {
  return (
    <svg viewBox='0 0 500 350' className='w-full h-full max-h-[380px] drop-shadow-md select-none' aria-hidden='true'>
      {/* Background Dark Import Hub */}
      <rect x='0' y='0' width='500' height='350' fill='#0D1B2A' />

      {/* Cargo Gateway Structural Beams */}
      <line x1='60' y1='40' x2='440' y2='40' stroke='#334155' strokeWidth='8' />
      <line x1='120' y1='40' x2='120' y2='300' stroke='#1E293B' strokeWidth='8' />
      <line x1='380' y1='40' x2='380' y2='300' stroke='#1E293B' strokeWidth='8' />

      {/* Destination Airport Information Board */}
      <g transform='translate(170, 60)'>
        <rect x='0' y='0' width='160' height='45' rx='6' fill='#1E293B' stroke='#475569' strokeWidth='1.5' />
        <text x='15' y='20' fill='#F8FAFC' fontSize='10' fontWeight='bold' fontFamily='monospace'>
          DESTINATION: INTL
        </text>
        <text x='15' y='35' fill='#38BDF8' fontSize='9' fontFamily='monospace'>
          STATUS: IMPORT CLEARANCE
        </text>
        <circle cx='145' cy='22' r='4' fill='#22C55E' />
      </g>

      {/* Parcel on customs intake roller */}
      <g transform='translate(180, 160)'>
        <rect x='0' y='0' width='140' height='90' rx='6' fill='#D89D65' stroke='#B27C4B' strokeWidth='2' />
        <line x1='70' y1='0' x2='70' y2='90' stroke='#F6D860' strokeWidth='7' />

        {/* Scan Crosshairs */}
        <line x1='20' y1='45' x2='120' y2='45' stroke='#2F6BFF' strokeWidth='2' strokeDasharray='4 4' />
        <line x1='70' y1='10' x2='70' y2='80' stroke='#2F6BFF' strokeWidth='2' strokeDasharray='4 4' />
      </g>

      {/* IMPORT CLEARED Badge */}
      <g transform='translate(260, 200) rotate(8)'>
        <rect x='0' y='0' width='120' height='40' rx='6' fill='#10B981' stroke='#059669' strokeWidth='2' />
        <text x='60' y='25' textAnchor='middle' fill='#FFFFFF' fontSize='11' fontWeight='900' fontFamily='monospace'>
          IMPORT CLEARED
        </text>
      </g>

      {/* Warehouse Floor */}
      <line x1='40' y1='280' x2='460' y2='280' stroke='#334155' strokeWidth='3' />
    </svg>
  )
}

/* =========================================================================
   STAGE 5: OUT FOR DELIVERY (Light Dawn City Scene)
   - Delivery Van, Skyline with parallax, Pulsing map pin, ETA countdown
   ========================================================================= */
const StageDeliveryVanScene: React.FC = () => {
  return (
    <svg viewBox='0 0 500 350' className='w-full h-full max-h-[380px] drop-shadow-md select-none' aria-hidden='true'>
      {/* Dawn Sky Backdrop */}
      <defs>
        <linearGradient id='dawnSky' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#E0F2FE' />
          <stop offset='100%' stopColor='#F8FAFC' />
        </linearGradient>
      </defs>
      <rect x='0' y='0' width='500' height='350' fill='url(#dawnSky)' />

      {/* Distant City Skyline Silhouettes */}
      <g fill='#CBD5E1' opacity='0.7'>
        <rect x='40' y='140' width='45' height='120' />
        <rect x='95' y='110' width='60' height='150' />
        <rect x='165' y='160' width='50' height='100' />
        <rect x='225' y='90' width='70' height='170' />
        <rect x='305' y='130' width='55' height='130' />
        <rect x='370' y='150' width='65' height='110' />
      </g>

      {/* Pulsing Map Destination Pin */}
      <g transform='translate(380, 110)'>
        <circle cx='15' cy='15' r='18' fill='#FF7A1A' opacity='0.25'>
          <animate attributeName='r' values='12;26;12' dur='2s' repeatCount='indefinite' />
          <animate attributeName='opacity' values='0.4;0.05;0.4' dur='2s' repeatCount='indefinite' />
        </circle>
        <path d='M15 0 C7 0 0 7 0 15 C0 26 15 40 15 40 C15 40 30 26 30 15 C30 7 23 0 15 0 Z' fill='#FF7A1A' />
        <circle cx='15' cy='14' r='5' fill='#FFFFFF' />
        {/* ETA Countdown Tag */}
        <rect x='-25' y='-22' width='80' height='18' rx='4' fill='#0D1B2A' />
        <text x='15' y='-10' textAnchor='middle' fill='#FFFFFF' fontSize='9' fontWeight='bold' fontFamily='monospace'>
          ETA: 18 MINS
        </text>
      </g>

      {/* Road Highway */}
      <rect x='0' y='250' width='500' height='50' fill='#334155' />
      <line x1='0' y1='275' x2='500' y2='275' stroke='#F8FAFC' strokeWidth='3' strokeDasharray='20 15' />

      {/* NetPack Delivery Van driving */}
      <g transform='translate(150, 185)'>
        {/* Van Main Body */}
        <path d='M 10 50 L 10 10 Q 10 0 20 0 L 110 0 L 135 25 L 155 25 Q 160 25 160 30 L 160 55 L 10 55 Z' fill='#FFFFFF' />
        {/* Electric Blue Lower Accent Bar */}
        <rect x='10' y='45' width='150' height='10' fill='#2F6BFF' />
        {/* Cab Windshield */}
        <polygon points='112,5 132,25 112,25' fill='#0D1B2A' />
        {/* Netpack Logo on van flank */}
        <text x='25' y='30' fontSize='12' fontWeight='900' fill='#0D1B2A' fontFamily='sans-serif'>
          NETPACK
        </text>
        <text x='85' y='30' fontSize='9' fontWeight='bold' fill='#FF7A1A'>
          EXPRESS
        </text>
        {/* Headlight beam */}
        <polygon points='160,35 220,25 220,55 160,45' fill='rgba(255, 255, 200, 0.4)' />
        {/* Wheels */}
        <circle cx='40' cy='60' r='14' fill='#0F172A' />
        <circle cx='40' cy='60' r='6' fill='#94A3B8' />
        <circle cx='130' cy='60' r='14' fill='#0F172A' />
        <circle cx='130' cy='60' r='6' fill='#94A3B8' />
      </g>
    </svg>
  )
}

/* =========================================================================
   STAGE 6: DELIVERED (Light Scene with Confetti & Signature)
   - Doorstep handover, bouncing parcel, green check, verified signature
   ========================================================================= */
const StageDeliveredScene: React.FC = () => {
  return (
    <svg viewBox='0 0 500 350' className='w-full h-full max-h-[380px] drop-shadow-md select-none' aria-hidden='true'>
      {/* Front Porch Entrance Frame */}
      <rect x='80' y='50' width='130' height='220' rx='6' fill='#F1F5F9' stroke='#CBD5E1' strokeWidth='2' />
      <rect x='95' y='65' width='100' height='205' rx='3' fill='#E2E8F0' />
      <circle cx='180' cy='160' r='5' fill='#64748B' />

      {/* Welcome Mat */}
      <rect x='90' y='270' width='110' height='15' rx='3' fill='#475569' />

      {/* Delivered Cardboard Box on Doorstep with subtle bounce */}
      <g transform='translate(110, 205)'>
        <rect x='0' y='0' width='70' height='55' rx='4' fill='#D89D65' stroke='#B27C4B' strokeWidth='1.5' />
        <line x1='35' y1='0' x2='35' y2='55' stroke='#F6D860' strokeWidth='5' />
        <rect x='10' y='12' width='22' height='14' rx='2' fill='#FFF' />
      </g>

      {/* Giant Animated Green Checkmark Badge */}
      <g transform='translate(290, 80)'>
        <circle cx='45' cy='45' r='38' fill='#10B981' opacity='0.15' />
        <circle cx='45' cy='45' r='30' fill='#10B981' />
        <path d='M34 45 L42 53 L58 37' fill='none' stroke='#FFFFFF' strokeWidth='5' strokeLinecap='round' />
      </g>

      {/* Proof of Delivery / Signature Card */}
      <g transform='translate(240, 160)'>
        <rect
          x='0'
          y='0'
          width='200'
          height='105'
          rx='10'
          fill='#FFFFFF'
          stroke='#E2E8F0'
          strokeWidth='1.5'
          filter='drop-shadow(0 10px 15px rgba(0,0,0,0.08))'
        />

        <text x='15' y='24' fill='#0D1B2A' fontSize='11' fontWeight='bold' fontFamily='sans-serif'>
          DELIVERY RECEIPT
        </text>
        <rect x='130' y='12' width='55' height='16' rx='8' fill='#DCFCE7' />
        <text x='157' y='23' textAnchor='middle' fill='#15803D' fontSize='8' fontWeight='bold'>
          VERIFIED
        </text>

        <text x='15' y='42' fill='#64748B' fontSize='9' fontFamily='monospace'>
          Time: Today, 02:40 PM
        </text>
        <text x='15' y='55' fill='#64748B' fontSize='9' fontFamily='monospace'>
          Signed by: R. Shrestha (Consignee)
        </text>

        {/* Signature Line */}
        <line x1='15' y1='85' x2='185' y2='85' stroke='#E2E8F0' strokeWidth='1' />
        <path
          d='M 20 80 Q 40 65 60 80 T 100 75 T 140 82'
          fill='none'
          stroke='#2F6BFF'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <text x='150' y='98' fill='#94A3B8' fontSize='8' fontFamily='sans-serif'>
          E-SIGNATURE
        </text>
      </g>

      {/* Festive celebration confetti bursts */}
      {[
        [240, 60, '#FF7A1A'],
        [260, 40, '#2F6BFF'],
        [370, 50, '#10B981'],
        [410, 80, '#F59E0B'],
        [430, 50, '#EC4899'],
        [320, 30, '#8B5CF6'],
      ].map(([cx, cy, color], idx) => (
        <rect
          key={idx}
          x={cx}
          y={cy}
          width='6'
          height='6'
          rx='1'
          fill={color as string}
          transform={`rotate(${idx * 35} ${cx} ${cy})`}
        />
      ))}
    </svg>
  )
}
