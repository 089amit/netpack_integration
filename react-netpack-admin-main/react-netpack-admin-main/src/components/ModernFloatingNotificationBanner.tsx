import { useEffect, useState, useRef } from 'react'
import {
  Bell,
  CheckCircle2,
  Package,
  Truck,
  ExternalLink,
  X,
  Plane,
} from 'lucide-react'

export interface ModernNotificationData {
  id: string
  title: string
  message: string
  tracking?: string
  status?: string
  type?: 'update' | 'delivered' | 'pickup' | 'alert' | 'welcome'
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
  durationMs?: number
}

interface Props {
  notification: ModernNotificationData | null
  onDismiss: () => void
}

export function ModernFloatingNotificationBanner({ notification, onDismiss }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const duration = notification?.durationMs || 6500

  // Play modern harmonic chime and trigger haptic pulse
  const playAudioAlert = () => {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContext()
        if (ctx.state === 'suspended') {
          ctx.resume()
        }

        const now = ctx.currentTime
        // Note 1: E5 (659.25Hz)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(659.25, now)
        gain1.gain.setValueAtTime(0.08, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.35)

        // Note 2: B5 (987.77Hz)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(987.77, now + 0.1)
        gain2.gain.setValueAtTime(0.12, now + 0.1)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.1)
        osc2.stop(now + 0.5)
      }
    } catch {
      // Audio autoplay policy fallback
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 50, 40])
      }
    } catch {
      // Vibration fallback
    }
  }

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      setProgress(100)
      playAudioAlert()

      const startTime = Date.now()
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
          setProgress(remaining)
          if (remaining <= 0) {
            handleClose()
          }
        }
      }, 50)
    } else {
      setIsVisible(false)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [notification, isPaused])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss()
      notification?.onDismiss?.()
    }, 280)
  }

  if (!notification && !isVisible) return null

  // Icon & theme styling according to notification category
  const getTypeConfig = () => {
    switch (notification?.type) {
      case 'delivered':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-500 to-teal-500',
          indicatorColor: 'bg-emerald-400',
          label: 'DELIVERED',
        }
      case 'pickup':
        return {
          icon: <Truck className="w-4 h-4 text-amber-400" />,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          gradient: 'from-amber-500 to-orange-500',
          indicatorColor: 'bg-amber-400',
          label: 'PICKUP ALERT',
        }
      case 'alert':
        return {
          icon: <Bell className="w-4 h-4 text-rose-400" />,
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          gradient: 'from-rose-500 to-red-600',
          indicatorColor: 'bg-rose-400',
          label: 'PRIORITY ALERT',
        }
      default:
        return {
          icon: <Plane className="w-4 h-4 text-sky-400" />,
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          gradient: 'from-sky-500 to-blue-600',
          indicatorColor: 'bg-sky-400',
          label: 'LIVE UPDATE',
        }
    }
  }

  const config = getTypeConfig()

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[999999] transition-all duration-300 ease-out select-none ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#091322]/95 dark:bg-[#070D18]/95 backdrop-blur-2xl border border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
        {/* Ambient Top Glow Line */}
        <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${config.gradient} opacity-90`} />

        <div className="p-3.5 sm:p-4">
          {/* Header Row: NetPack Brand, Category Pill, Live Pulse, Close button */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* App Icon Capsule */}
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm shrink-0`}
              >
                {config.icon}
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-black tracking-wider text-white uppercase font-sans truncate">
                  NetPack Logistic
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wider uppercase ${config.badgeBg}`}
                >
                  {config.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Live Pulsing Dot */}
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.indicatorColor} opacity-75`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${config.indicatorColor}`}
                  />
                </span>
                <span>NOW</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-1">
            <h4 className="text-[14px] font-bold text-white tracking-tight leading-snug">
              {notification?.title}
            </h4>
            <p className="text-[12px] text-slate-300 leading-relaxed line-clamp-2">
              {notification?.message}
            </p>
          </div>

          {/* Footer Action Row: AWB Pill & Track/Accept Button */}
          {(notification?.tracking || notification?.onAction) && (
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              {notification.tracking ? (
                <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-md truncate">
                  <Package className="w-3 h-3 shrink-0" />
                  <span>AWB: {notification.tracking}</span>
                </div>
              ) : (
                <div />
              )}

              {notification.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose()
                    notification.onAction?.()
                  }}
                  className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-bold text-white shadow-md active:scale-95 transition-all bg-gradient-to-r ${config.gradient} hover:brightness-110`}
                >
                  <span>{notification.actionLabel || 'View Details'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Countdown Progress Bar */}
        <div className="w-full bg-white/5 h-[3px]">
          <div
            className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-75 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
