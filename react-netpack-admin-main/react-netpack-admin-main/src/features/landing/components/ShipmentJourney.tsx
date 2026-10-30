import React, { useEffect, useRef, useState, useCallback } from 'react'
import { LANDING_CONFIG } from '../config'
import { Clock, CheckCircle2, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'

export const ShipmentJourney: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [videoDuration, setVideoDuration] = useState(10.01)

  const stages = LANDING_CONFIG.stages
  const currentStage = stages[activeStageIndex]
  const isDarkScene = currentStage.theme === 'dark'

  const progressRef = useRef(0)
  const isPlayingRef = useRef(false)

  // Synchronize playing ref
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Video metadata loader
  const handleLoadedMetadata = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration) && videoRef.current.duration > 0) {
      setVideoDuration(videoRef.current.duration)
    }
  }

  // Smooth scroll scrubbing engine (Apple-style requestAnimationFrame seek)
  useEffect(() => {
    let animId: number

    const updateVideoScrub = () => {
      animId = requestAnimationFrame(updateVideoScrub)

      const video = videoRef.current
      if (!video || isPlayingRef.current || video.readyState < 1) return

      const duration = video.duration || videoDuration || 10
      const targetTime = Math.max(0, Math.min(duration - 0.05, progressRef.current * duration))

      // Only seek if difference is noticeable (> 0.03s) to prevent browser seek thrashing
      if (Math.abs(video.currentTime - targetTime) > 0.03) {
        // Direct assignment on HTML5 video provides instantaneous hardware scrub
        video.currentTime = targetTime
      }
    }

    animId = requestAnimationFrame(updateVideoScrub)
    return () => cancelAnimationFrame(animId)
  }, [videoDuration])

  // Scroll listener that updates progress through the pinned journey
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const totalHeight = sectionRef.current.offsetHeight
      const viewportHeight = window.innerHeight

      const stickyTop = window.innerWidth < 640 ? 64 : 80
      const stickyHeight = viewportHeight - stickyTop
      const pinnedScrollDistance = Math.max(1, totalHeight - stickyHeight)

      const pinnedScrolled = stickyTop - rect.top
      const p = Math.min(1, Math.max(0, pinnedScrolled / pinnedScrollDistance))
      progressRef.current = p
      setScrollProgress(p)

      const stageIdx = Math.min(stages.length - 1, Math.floor(p * stages.length))
      setActiveStageIndex(stageIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [stages.length])

  // Scroll directly to a specific stage on dot click
  const scrollToStage = (stageIdx: number) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const sectionTop = rect.top + scrollTop
    const totalHeight = sectionRef.current.offsetHeight
    const viewportHeight = window.innerHeight

    const stickyTop = window.innerWidth < 640 ? 64 : 80
    const stickyHeight = viewportHeight - stickyTop
    const pinnedScrollDistance = Math.max(1, totalHeight - stickyHeight)

    const targetRatio = (stageIdx + 0.5) / stages.length
    const targetScrollY = sectionTop - stickyTop + targetRatio * pinnedScrollDistance
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
  }

  // Toggle Video Play / Pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true)
      }).catch((err) => {
        console.warn('Autoplay prevented:', err)
      })
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  // Toggle Mute / Unmute
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  // Fullscreen video player
  const handleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (video.requestFullscreen) {
      video.requestFullscreen()
    }
  }

  return (
    <section
      id='journey'
      ref={sectionRef}
      className={`relative w-full min-h-[300vh] sm:min-h-[350vh] transition-colors duration-700 ease-in-out ${
        isDarkScene ? 'bg-[#0D1B2A] text-white' : 'bg-[#F5F7FA] text-slate-900'
      }`}
    >
      {/* Pinned Sticky Viewport Container */}
      <div className='sticky top-16 sm:top-20 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] flex flex-col justify-between py-2 sm:py-4 lg:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden'>
        {/* Top Header - clean & minimal */}
        <div className='text-center max-w-3xl mx-auto z-10 shrink-0'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight font-display leading-tight'>
            THE SHIPMENT JOURNEY
          </h2>
        </div>

        {/* Center: Split between Cinematic Video & Stage Narrative Card */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-center my-auto w-full z-10 min-h-0'>
          {/* LEFT: Active Stage Narrative */}
          <div className='lg:col-span-5 order-2 lg:order-1'>
            <div
              className={`p-3.5 sm:p-5 lg:p-7 rounded-2xl sm:rounded-3xl border backdrop-blur-xl transition-all duration-500 shadow-xl ${
                isDarkScene
                  ? 'bg-[#132238]/95 border-white/10 text-white'
                  : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/60'
              }`}
            >
              <div className='flex items-center justify-between gap-3 mb-2 sm:mb-3'>
                <span className='px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30'>
                  {currentStage.badge}
                </span>
                <div
                  className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-mono ${
                    isDarkScene ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <Clock className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
                  <span>{currentStage.eta}</span>
                </div>
              </div>

              <h3 className='text-lg sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight font-display mb-1.5 sm:mb-2'>
                {currentStage.title}
              </h3>

              <p
                className={`text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3 sm:line-clamp-none ${
                  isDarkScene ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {currentStage.description}
              </p>

              {/* Minimal Progress Bar within active stage */}
              <div className='mt-2.5 sm:mt-5 pt-2 sm:pt-3 border-t border-current/10'>
                <div className='w-full h-1 sm:h-1.5 rounded-full bg-slate-300/30 overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-[#2F6BFF] to-[#FF7A1A] transition-all duration-200 rounded-full'
                    style={{ width: `${scrollProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Real High-Def Cinematic Video Player (Scroll Scrubbed) */}
          <div className='lg:col-span-7 order-1 lg:order-2 flex items-center justify-center min-h-0'>
            <div
              className={`relative h-[210px] xs:h-[250px] sm:h-[300px] md:h-[340px] lg:h-[400px] xl:h-[430px] max-h-[48vh] w-full max-w-2xl rounded-2xl sm:rounded-3xl border overflow-hidden shadow-2xl transition-all duration-500 flex items-center justify-center group ${
                isDarkScene ? 'bg-[#060D17] border-white/15' : 'bg-[#060D17] border-slate-300'
              }`}
            >
              {/* HTML5 Video Element */}
              <video
                ref={videoRef}
                src='/journey_cinematic.mp4'
                playsInline
                muted={isMuted}
                preload='auto'
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className='w-full h-full object-cover rounded-2xl sm:rounded-3xl'
              />

              {/* Ambient Top Vignette & Subtle Stage Stamp */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none' />

              {/* Live Telemetry Stamp Overlay (Top-Left) */}
              <div className='absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none'>
                <span className='w-2 h-2 rounded-full bg-[#10B981] animate-pulse' />
                <span className='px-2.5 py-1 rounded-full text-[9px] sm:text-[11px] font-mono font-bold tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase'>
                  STAGE 0{currentStage.id} • {currentStage.shortLabel}
                </span>
              </div>

              {/* Interactive Video Controls Overlay (Bottom Bar) */}
              <div className='absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between gap-3'>
                {/* Play/Pause Button */}
                <button
                  type='button'
                  onClick={togglePlay}
                  className='p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md transition shadow-lg active:scale-95'
                  title={isPlaying ? 'Pause auto-play' : 'Play video preview'}
                >
                  {isPlaying ? (
                    <Pause className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF7A1A]' />
                  ) : (
                    <Play className='w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white' />
                  )}
                </button>

                {/* Video Scrubber Timeline Indicator */}
                <div className='flex-1 mx-2'>
                  <div className='w-full h-1 sm:h-1.5 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm'>
                    <div
                      className='h-full bg-gradient-to-r from-[#2F6BFF] to-[#FF7A1A] transition-all duration-75 rounded-full'
                      style={{ width: `${scrollProgress * 100}%` }}
                    />
                  </div>
                </div>

                <div className='flex items-center gap-1.5 sm:gap-2'>
                  {/* Mute/Unmute Button */}
                  <button
                    type='button'
                    onClick={toggleMute}
                    className='p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md transition shadow-lg active:scale-95'
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted ? (
                      <VolumeX className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300' />
                    ) : (
                      <Volume2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981]' />
                    )}
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    type='button'
                    onClick={handleFullscreen}
                    className='hidden sm:flex p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md transition shadow-lg active:scale-95'
                    title='Fullscreen'
                  >
                    <Maximize2 className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Clean 6-Dot Stage Progress Navigation */}
        <div className='w-full max-w-3xl mx-auto pt-1 sm:pt-2 pb-1 z-20 shrink-0'>
          <div className='flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none'>
            {stages.map((stage, idx) => {
              const isActive = idx === activeStageIndex
              const isDone = idx < activeStageIndex

              return (
                <button
                  key={stage.id}
                  onClick={() => scrollToStage(idx)}
                  className={`flex items-center gap-1.5 sm:gap-2 py-1 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl transition-all text-left ${
                    isActive
                      ? isDarkScene
                        ? 'bg-white/15 text-white font-bold'
                        : 'bg-slate-200 text-slate-900 font-bold'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-mono transition-colors ${
                      isActive
                        ? 'bg-[#FF7A1A] text-white shadow-md shadow-[#FF7A1A]/40'
                        : isDone
                        ? 'bg-[#2F6BFF] text-white'
                        : isDarkScene
                        ? 'bg-white/10 text-slate-400'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className='w-2.5 h-2.5 sm:w-3 sm:h-3' /> : stage.id}
                  </div>
                  <span className='hidden md:inline text-[11px] font-mono uppercase tracking-wider whitespace-nowrap'>
                    {stage.shortLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
