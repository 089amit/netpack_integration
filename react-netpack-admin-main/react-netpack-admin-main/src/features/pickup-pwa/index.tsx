import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Truck,
  Phone,
  MapPin,
  Scale,
  Camera,
  CheckCircle2,
  Clock,
  Search,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Navigation,
  Copy,
  Check,
  RefreshCw,
  Box as BoxIcon,
  Plus,
  Trash2,
  AlertTriangle,
  Radio,
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  Bike,
  LogOut,
  Download,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ThemeSwitch } from '@/components/theme-switch'
import { SERVER_URL } from '@/constants/endpoint'

const API_BASE = SERVER_URL


// ─── Web Audio Chime Synthesizer ─────────────────────────────────────────────
// Generates a crisp, dual-tone logistics alert ping (C5 -> G5) without external sound files
function playLogisticsAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const now = ctx.currentTime

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.03)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.19)

    // Tone 2: 783.99 Hz (G5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(783.99, now + 0.15)
    gain2.gain.setValueAtTime(0, now + 0.15)
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.46)
  } catch (err) {
    console.warn('Audio chime error:', err)
  }
}

function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(659.25, now) // E5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.32)
  } catch {}
}

interface BoxItem {
  id?: number
  length: number | string
  breadth: number | string
  height: number | string
  weight: number | string
  quantity: number | string
  multiplier?: number | string
}

function InstallGuideModal({
  open,
  onClose,
  isIos,
}: {
  open: boolean
  onClose: () => void
  isIos: boolean
}) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200'>
      <div className='bg-white dark:bg-[#0D1B2A] rounded-3xl w-full max-w-sm border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-5'>
        <div className='flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs'>
              <Smartphone className='w-5 h-5' />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Jost, sans-serif' }} className='font-bold text-sm text-[#0D1B2A] dark:text-white'>Install Netpack Rider</h3>
              <p className='text-[11px] text-muted-foreground'>Home screen app installation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        <div className='py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300'>
          {isIos ? (
            <>
              <p className='font-semibold text-slate-900 dark:text-white text-[13px]'>
                Follow these 3 steps on iPhone / iPad:
              </p>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-xs font-bold'>1</div>
                <div className='leading-relaxed text-[12px]'>
                  In Safari, tap the <strong>Share</strong> button <span className='inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border text-[11px] font-mono'>⎋</span> or <span className='inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border text-[11px] font-mono'>[↑]</span> at the bottom bar.
                  <p className='text-[10px] text-muted-foreground mt-0.5'>(In Chrome for iOS: tap the 3 dots <strong>⋯</strong> in corner)</p>
                </div>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-xs font-bold'>2</div>
                <p className='leading-relaxed text-[12px]'>
                  Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> <span className='inline-block px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px] font-mono'>➕</span>.
                </p>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-xs font-bold'>3</div>
                <p className='leading-relaxed text-[12px]'>
                  Tap <strong>Add</strong> in the top right. Launch the <strong>Netpack Rider</strong> icon directly from your home screen!
                </p>
              </div>
            </>
          ) : (
            <>
              <p className='font-semibold text-slate-900 dark:text-white text-[13px]'>
                Follow these steps on Android / Chrome:
              </p>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-xs font-bold'>1</div>
                <p className='leading-relaxed text-[12px]'>
                  Tap the browser <strong>Three Dots (⋮)</strong> menu in the upper corner.
                </p>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-xs font-bold'>2</div>
                <p className='leading-relaxed text-[12px]'>
                  Choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-xs font-bold'>3</div>
                <p className='leading-relaxed text-[12px]'>
                  Confirm the installation prompt. Launch from your home screen for full-screen offline dispatch!
                </p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          style={{ fontFamily: 'Jost, sans-serif' }}
          className='w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-500/20'
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export default function PickupRiderPWA() {
  // Navigation & Filter Tabs: 'pending' | 'assigned' | 'picked_up' | 'all'
  const [activeTab, setActiveTab] = useState<'pending' | 'assigned' | 'picked_up' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Pickups Data
  const [pickups, setPickups] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    pendingCount: 0,
    pickedUpCount: 0,
    totalWeightToday: 0,
    totalBoxesToday: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // Rider Status & Settings
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return localStorage.getItem('netpack_rider_online') !== 'false'
  })
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('netpack_rider_sound') !== 'false'
  })
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [newPickupAlert, setNewPickupAlert] = useState<any | null>(null)
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  })
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false)

  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    )
  }, [])

  // Rider Authentication State
  const [riderToken, setRiderToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('netpack_rider_token') : null
  })
  const [riderUser, setRiderUser] = useState<any | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('netpack_rider_user')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })
  const [loginIdentifier, setLoginIdentifier] = useState<string>('')
  const [loginPassword, setLoginPassword] = useState<string>('')
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false)
  const [loginLoading, setLoginLoading] = useState<boolean>(false)

  // Validate existing rider token on mount / change
  useEffect(() => {
    if (!riderToken) return
    fetch(`${API_BASE}/api/pickups/auth/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: riderToken }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res && res.valid && res.rider) {
          setRiderUser(res.rider)
          localStorage.setItem('netpack_rider_user', JSON.stringify(res.rider))
        } else if (res && res.valid === false) {
          setRiderToken(null)
          setRiderUser(null)
          localStorage.removeItem('netpack_rider_token')
          localStorage.removeItem('netpack_rider_user')
        }
      })
      .catch(() => {
        // Offline tolerance: maintain cached session
      })
  }, [riderToken])

  // Weigh Modal State
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null)
  const [isWeighModalOpen, setIsWeighModalOpen] = useState<boolean>(false)
  const [actualWeight, setActualWeight] = useState<string>('')
  const [boxes, setBoxes] = useState<BoxItem[]>([
    { length: 30, breadth: 20, height: 20, weight: '', quantity: 1 },
  ])
  const [riderNotes, setRiderNotes] = useState<string>('')
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submittingWeigh, setSubmittingWeigh] = useState<boolean>(false)

  // Tracking last known pickup ID for delta alerts
  const lastKnownIdRef = useRef<number>(0)
  const isFirstLoadRef = useRef<boolean>(true)

  // ─── PWA Install Prompt Listener ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      if (typeof window !== 'undefined' && window.location.search.includes('install')) {
        setTimeout(() => {
          try {
            e.prompt()
          } catch (err) {
            console.warn('Auto prompt failed:', err)
          }
        }, 150)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])


  // Auto trigger install if ?install query parameter present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('install') && installPrompt) {
      const timer = setTimeout(() => {
        handleInstallClick()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [installPrompt])

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        if (outcome === 'accepted') {
          setInstallPrompt(null)
          setIsStandalone(true)
          toast.success('Netpack Rider App installed to your home screen!')
        }
        return
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
    }
    setShowInstallGuideModal(true)
  }

  // ─── Register Service Worker ──────────────────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-pickup.js')
        .then((reg) => {
          console.log('Pickup SW registered:', reg.scope)
        })
        .catch((err) => console.warn('Pickup SW registration error:', err))
    }
  }, [])

  // ─── Save Settings ────────────────────────────────────────────────────────
  const toggleOnline = (val: boolean) => {
    setIsOnline(val)
    localStorage.setItem('netpack_rider_online', String(val))
    if (val) {
      toast.success('You are ONLINE. Listening for incoming pickups.')
    } else {
      toast.info('You are OFFLINE. Pickup alerts are paused.')
    }
  }

  const toggleSound = (val: boolean) => {
    setSoundEnabled(val)
    localStorage.setItem('netpack_rider_sound', String(val))
    if (val) {
      playLogisticsAlertChime()
      toast.success('Audio chime enabled')
    } else {
      toast.info('Audio chime muted')
    }
  }

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Web notifications are not supported by this browser.')
      return
    }
    try {
      const perm = await Notification.requestPermission()
      setNotificationPermission(perm)
      if (perm === 'granted') {
        playLogisticsAlertChime()
        toast.success('Push notifications active! You will be alerted when new pickups arrive.')
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: '🟢 NetPack Rider Dispatch Active',
            options: {
              body: 'Ready to receive immediate Kathmandu cargo pickup alerts.',
            },
          })
        }
      } else {
        toast.warning('Notifications blocked. Please enable them in your browser site settings.')
      }
    } catch (e) {
      toast.error('Failed to request notification permission.')
    }
  }

  // ─── Trigger In-App & System Notification ──────────────────────────────────
  const notifyNewPickup = useCallback(
    (pickup: any) => {
      // 1. Play Audio Chime
      if (soundEnabled) {
        playLogisticsAlertChime()
      }

      // 2. Vibrate Device
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([300, 100, 300, 100, 300])
        } catch {}
      }

      // 3. Trigger Browser Native Notification via Service Worker or Notification API
      const notifTitle = `🚚 New Pickup: ${pickup.commodity || 'Consignment'}`
      const notifBody = `${pickup.senderName || 'Customer'} • ${pickup.pickupAddress || pickup.senderAddress || 'Kathmandu'}`

      if (notificationPermission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: notifTitle,
            options: {
              body: notifBody,
              data: { url: '/pickup-pwa', id: pickup.id },
            },
          })
        } else if (typeof Notification !== 'undefined') {
          try {
            new Notification(notifTitle, {
              body: notifBody,
              icon: '/alzlogo.png',
            })
          } catch {}
        }
      }

      // 4. In-App Banner Alert
      setNewPickupAlert(pickup)
      toast.custom(
        () => (
          <div className='flex items-center gap-3 p-3 bg-card text-card-foreground border border-sky-500 rounded-xl shadow-xl animate-in slide-in-from-top-4 duration-300'>
            <div className='p-2 bg-sky-600 text-white rounded-lg animate-pulse shrink-0'>
              <BellRing className='h-5 w-5' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-xs font-bold uppercase tracking-wider text-sky-500'>
                Incoming Pickup Request!
              </div>
              <div className='text-sm font-semibold truncate'>
                {pickup.senderName} • {pickup.commodity || 'Cargo'}
              </div>
              <div className='text-xs text-muted-foreground truncate'>
                {pickup.pickupAddress || pickup.senderAddress}
              </div>
            </div>
            <Button
              size='sm'
              className='bg-sky-600 hover:bg-sky-500 text-white text-xs h-8 px-3'
              onClick={() => {
                setActiveTab('pending')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              View
            </Button>
          </div>
        ),
        { duration: 8000 }
      )
    },
    [soundEnabled, notificationPermission]
  )

  // ─── Fetch Pickups List & Stats ───────────────────────────────────────────
  const fetchPickups = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      // 1. Stats
      const statsRes = await fetch(`${API_BASE}/api/pickups/stats`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
      if (statsRes) setStats(statsRes)

      // 2. Pickups list
      const listRes = await fetch(`${API_BASE}/api/pickups?status=ALL&limit=100`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)

      if (listRes?.pickups) {
        setPickups(listRes.pickups)

        if (isFirstLoadRef.current) {
          const maxId = listRes.pickups.reduce(
            (max: number, p: any) => (p.id > max ? p.id : max),
            0
          )
          lastKnownIdRef.current = maxId
          isFirstLoadRef.current = false
        }
      }
      setLastSyncTime(new Date())
    } catch (err) {
      console.error('Fetch pickups error:', err)
    } finally {
      setLoading(false)
      if (showSpinner) setRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPickups(true)
  }, [])

  // ─── Live Alerts Polling Loop (Every 6 seconds) ───────────────────────────
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(async () => {
      try {
        const sinceId = lastKnownIdRef.current
        const res = await fetch(`${API_BASE}/api/pickups/live-alerts?since_id=${sinceId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)

        if (res && res.hasNew && res.newPickups?.length > 0) {
          const latestId = res.latestId || lastKnownIdRef.current
          lastKnownIdRef.current = Math.max(lastKnownIdRef.current, latestId)

          setPickups((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const fresh = res.newPickups.filter((p: any) => !existingIds.has(p.id))
            return [...fresh, ...prev]
          })

          notifyNewPickup(res.newPickups[0])

          fetch(`${API_BASE}/api/pickups/stats`)
            .then((r) => (r.ok ? r.json() : null))
            .then((st) => st && setStats(st))
            .catch(() => {})
        } else if (res && res.latestId) {
          lastKnownIdRef.current = Math.max(lastKnownIdRef.current, res.latestId)
        }
        setLastSyncTime(new Date())
      } catch (e) {
        // silent
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [isOnline, notifyNewPickup])


  // ─── Copy Tracking Number ─────────────────────────────────────────────────
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTracking(text)
    toast.success(`Copied: ${text}`)
    setTimeout(() => setCopiedTracking(null), 2000)
  }

  // ─── Rider Auth Handlers ──────────────────────────────────────────────────
  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error('Please enter your Rider ID / Email and password.')
      return
    }

    setLoginLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/pickups/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed. Please check credentials.')
      }

      setRiderToken(data.token)
      setRiderUser(data.rider)
      localStorage.setItem('netpack_rider_token', data.token)
      localStorage.setItem('netpack_rider_user', JSON.stringify(data.rider))
      playSuccessChime()
      toast.success(`Welcome back, ${data.rider.name}! Rider portal active.`)
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRiderLogout = () => {
    setRiderToken(null)
    setRiderUser(null)
    localStorage.removeItem('netpack_rider_token')
    localStorage.removeItem('netpack_rider_user')
    toast.info('Signed out from Rider Portal.')
  }

  // ─── Status Transitions ───────────────────────────────────────────────────
  const handleStartRoute = async (pickup: any) => {
    try {
      const riderDisplayName = riderUser?.name || 'Field Rider'
      const res = await fetch(`${API_BASE}/api/pickups/${pickup.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(riderToken ? { Authorization: `Bearer ${riderToken}` } : {}),
        },
        body: JSON.stringify({
          status: 'ASSIGNED_FOR_PICKUP',
          riderName: riderDisplayName,
          riderNotes: `Rider ${riderDisplayName} accepted pickup and is heading to customer location.`,
        }),
      }).then((r) => r.json())

      if (res?.pickup) {
        setPickups((prev) => prev.map((p) => (p.id === pickup.id ? res.pickup : p)))
        playSuccessChime()
        toast.success(`Route started for ${pickup.senderName}! Heading to pickup location.`)
        setActiveTab('assigned')
      }
    } catch (e) {
      toast.error('Failed to update route status')
    }
  }

  // ─── Open Weighing & Inspection Modal ──────────────────────────────────────
  const handleOpenWeighModal = (pickup: any) => {
    setSelectedPickup(pickup)
    setActualWeight(pickup.weight ? String(pickup.weight) : '')
    setRiderNotes(pickup.pickupNotes || '')
    setSelectedPhotos([])
    setPhotoPreviews([])

    if (pickup.boxes && pickup.boxes.length > 0) {
      setBoxes(
        pickup.boxes.map((b: any) => ({
          id: b.id,
          length: b.length || 30,
          breadth: b.breadth || 20,
          height: b.height || 20,
          weight: b.weight || '',
          quantity: b.quantity || 1,
        }))
      )
    } else {
      setBoxes([{ length: 30, breadth: 20, height: 20, weight: '', quantity: 1 }])
    }
    setIsWeighModalOpen(true)
  }

  // Handle camera photo selection
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setSelectedPhotos((prev) => [...prev, ...files])

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotoPreviews((prev) => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // Box rows management
  const handleAddBox = () => {
    setBoxes((prev) => [
      ...prev,
      { length: 30, breadth: 20, height: 20, weight: '', quantity: 1 },
    ])
  }

  const handleRemoveBox = (idx: number) => {
    if (boxes.length <= 1) return
    setBoxes((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateBox = (idx: number, field: keyof BoxItem, value: any) => {
    setBoxes((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  // Computed Volumetric Weight for modal
  const computedVolumetricWeight = useMemo(() => {
    return boxes.reduce((sum, b) => {
      const l = parseFloat(String(b.length)) || 0
      const w = parseFloat(String(b.breadth)) || 0
      const h = parseFloat(String(b.height)) || 0
      const qty = parseInt(String(b.quantity)) || 1
      return sum + ((l * w * h) / 5000.0) * qty
    }, 0)
  }, [boxes])

  // Submit Weigh & Pickup
  const handleSubmitWeigh = async () => {
    if (!selectedPickup) return
    const wt = parseFloat(actualWeight)
    if (isNaN(wt) || wt <= 0) {
      toast.error('Please enter a valid scale weight in kg.')
      return
    }

    setSubmittingWeigh(true)
    try {
      const formData = new FormData()
      formData.append('actualWeight', String(wt))
      formData.append('boxesJson', JSON.stringify(boxes))
      if (riderNotes.trim()) {
        formData.append('pickupNotes', riderNotes.trim())
      }
      if (riderUser?.name) {
        formData.append('pickedUpByName', riderUser.name)
      }
      if (riderUser?.id) {
        formData.append('pickedUpById', String(riderUser.id))
      }
      selectedPhotos.forEach((file) => {
        formData.append('scaleImages', file)
      })

      const res = await fetch(`${API_BASE}/api/pickups/${selectedPickup.id}/pickup-and-weigh`, {
        method: 'POST',
        headers: {
          ...(riderToken ? { Authorization: `Bearer ${riderToken}` } : {}),
        },
        body: formData,
      }).then((r) => r.json())

      if (res?.pickup) {
        playSuccessChime()
        toast.success(
          `Cargo verified at ${wt} kg! Marked as PICKED UP and logged in warehouse tracking.`
        )
        setPickups((prev) => prev.map((p) => (p.id === selectedPickup.id ? res.pickup : p)))
        setIsWeighModalOpen(false)
        setActiveTab('picked_up')
        fetchPickups(false)
      } else {
        toast.error(res?.detail || 'Failed to complete pickup verification')
      }
    } catch (err: any) {
      toast.error('Server error submitting pickup verification')
    } finally {
      setSubmittingWeigh(false)
    }
  }

  // ─── Filtered Pickups ───────────────────────────────────────────────────────
  const filteredPickups = useMemo(() => {
    return pickups.filter((p) => {
      const st = (p.status || '').toUpperCase()
      const isPickedUp =
        ['PICKED_UP', 'PACKED', 'SHIPMENT_CREATED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'CARRIER_SCANNED', 'DELIVERED'].includes(st) ||
        !!p.weightProofImageUrl ||
        !!p.shipmentId

      const isAssigned = st === 'ASSIGNED_FOR_PICKUP' && !isPickedUp
      const isPending = !isPickedUp && !isAssigned

      if (activeTab === 'pending' && !isPending) return false
      if (activeTab === 'assigned' && !isAssigned) return false
      if (activeTab === 'picked_up' && !isPickedUp) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTr = p.trackingNumber?.toLowerCase().includes(q)
        const matchSender = p.senderName?.toLowerCase().includes(q)
        const matchPhone = (p.pickupPhone || p.senderPhone)?.toLowerCase().includes(q)
        const matchAddr = (p.pickupAddress || p.senderAddress)?.toLowerCase().includes(q)
        const matchComm = p.commodity?.toLowerCase().includes(q)
        if (!matchTr && !matchSender && !matchPhone && !matchAddr && !matchComm) return false
      }
      return true
    })
  }, [pickups, activeTab, searchQuery])

  const pendingCount = useMemo(() => {
    return pickups.filter(
      (p) =>
        !['PICKED_UP', 'PACKED', 'SHIPMENT_CREATED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'CARRIER_SCANNED', 'DELIVERED'].includes(
          (p.status || '').toUpperCase()
        ) &&
        !p.weightProofImageUrl &&
        !p.shipmentId &&
        p.status !== 'ASSIGNED_FOR_PICKUP'
    ).length
  }, [pickups])

  const assignedCount = useMemo(() => {
    return pickups.filter((p) => p.status === 'ASSIGNED_FOR_PICKUP').length
  }, [pickups])

  // ─── Rider Login Screen (When unauthenticated) ─────────────────────────────
  if (!riderToken) {
    return (
      <div className='flex-1 flex flex-col min-h-screen overflow-y-auto no-scrollbar bg-[#0D1B2A] sm:bg-[#E2E8F0] dark:bg-[#0B131F] text-foreground font-sans'>
        <div className='w-full max-w-[430px] mx-auto min-h-screen flex flex-col relative bg-[#F1F4F8] dark:bg-[#0B131F] shadow-2xl'>
          {/* Brand panel matching netpackpwa ui */}
          <div
            className='bg-[#0D1B2A] px-6 pb-12 relative overflow-hidden shrink-0'
            style={{ paddingTop: 'max(36px, env(safe-area-inset-top, 36px))' }}
          >
          {/* Route motif SVG */}
          <svg className='absolute inset-0 w-full h-full' viewBox='0 0 430 280' fill='none' preserveAspectRatio='none'>
            <path
              d='M-30 230 C 70 150, 150 260, 240 170 S 400 50, 470 -10'
              stroke='#3B82F6'
              strokeOpacity='0.35'
              strokeWidth='1.5'
              strokeDasharray='1 9'
              strokeLinecap='round'
            />
            <circle cx='240' cy='170' r='3' fill='#60A5FA' fillOpacity='0.6' />
          </svg>
          <style>{`
            @keyframes floatBubbleA {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(-8px, 10px); }
            }
            @keyframes floatBubbleB {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(7px, -8px); }
            }
          `}</style>
          <div
            className='absolute top-8 right-6 w-24 h-24 rounded-full bg-blue-500/15 blur-[2px]'
            style={{ animation: 'floatBubbleA 6s ease-in-out infinite' }}
          />
          <div
            className='absolute top-16 left-24 w-14 h-14 rounded-full bg-blue-500/10 blur-[1px]'
            style={{ animation: 'floatBubbleB 5s ease-in-out infinite' }}
          />

          <div className='relative flex items-start justify-between'>
            <div>
              <h1
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.14em' }}
                className='text-white text-2xl font-bold mb-1 select-none'
              >
                NETPACK
              </h1>
              <div className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-semibold mb-3'>
                <Bike className='h-3 w-3' />
                <span>RIDER DISPATCH PORTAL</span>
              </div>
              <p className='text-white/80 text-[13px] leading-relaxed max-w-[280px]'>
                Sign in to manage assigned customer pickups, Kathmandu routes, and digital scale weights.
              </p>
            </div>
            <div className='pt-1'>
              <ThemeSwitch />
            </div>
          </div>
        </div>

        {/* Form sheet matching netpackpwa ui */}
        <div className='flex-1 bg-[#F1F4F8] dark:bg-[#0B131F] rounded-t-[28px] -mt-5 px-5 pt-6 pb-10 relative'>
          <div className='max-w-[430px] mx-auto space-y-4'>
            <div className='bg-white dark:bg-[#152238] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4'>
              <div className='flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800'>
                <div className='w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
                  <Bike className='h-4 w-4' />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Jost, sans-serif' }} className='text-base font-bold text-[#0D1B2A] dark:text-white leading-tight'>
                    Rider Authentication
                  </h2>
                  <p className='text-[11px] text-muted-foreground'>Enter your registered driver ID or email</p>
                </div>
              </div>

              <form onSubmit={handleRiderLogin} className='space-y-4 pt-1'>
                <div>
                  <label className='block text-[12px] font-semibold text-[#0D1B2A] dark:text-gray-200 mb-1.5'>
                    Rider ID / Email / Phone <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <User className='h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      type='text'
                      placeholder='e.g. driver@netpack.com or rider-01'
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className='pl-10 h-11 text-xs rounded-xl bg-background text-foreground'
                      autoComplete='username'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-[12px] font-semibold text-[#0D1B2A] dark:text-gray-200 mb-1.5'>
                    Password / Security PIN <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Lock className='h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder='Enter your security password'
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className='pl-10 pr-10 h-11 text-xs font-mono rounded-xl bg-background text-foreground'
                      autoComplete='current-password'
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className='absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer'
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>

                <button
                  type='submit'
                  disabled={loginLoading || !loginIdentifier || !loginPassword}
                  style={{ fontFamily: 'Jost, sans-serif' }}
                  className='w-full bg-[#2563EB] disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:shadow-none hover:bg-[#1D4ED8] text-white font-600 text-sm py-3.5 rounded-xl active:opacity-90 shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-2'
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Bike className='h-4 w-4' />
                      <span>Sign In to Rider Portal</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Install prompt when running in mobile browser */}
            {!isStandalone && (
              <div className='bg-white dark:bg-[#152336] rounded-2xl border border-blue-200/80 dark:border-blue-900/60 p-3.5 mt-4 shadow-sm flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 text-white'>
                    <Download className='w-5 h-5' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-[13px] font-bold text-[#0D1B2A] dark:text-white truncate'>Install Rider App</p>
                    <p className='text-[11px] text-muted-foreground truncate'>Add to home screen for 1-tap dispatch</p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={handleInstallClick}
                  className='px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-semibold shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer'
                >
                  Install
                </button>
              </div>
            )}

            <p className='text-center text-[11px] text-muted-foreground leading-relaxed px-4 pt-3'>
              NetPack Field Operations • Kathmandu Central Hub Teku
            </p>
          </div>
        </div>

        <InstallGuideModal
          open={showInstallGuideModal}
          onClose={() => setShowInstallGuideModal(false)}
          isIos={isIos}
        />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#0D1B2A] sm:bg-[#E2E8F0] flex justify-center text-foreground font-sans selection:bg-blue-100 selection:text-blue-900'>
      <div className='w-full max-w-[430px] min-h-screen flex flex-col relative bg-[#F1F4F8] dark:bg-[#0B131F] shadow-2xl pb-24 select-none'>
        {/* ─── Sticky Top App Bar (Curved Gradient Header) ────────────────── */}
        <header
          className='sticky top-0 z-40 bg-gradient-to-b from-[#0D1B2A] to-[#152A40] text-white px-4 pb-3 rounded-b-[20px] shadow-lg shadow-black/20'
          style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
        >
        <div className='max-w-[430px] mx-auto flex items-center justify-between gap-2'>
          {/* Logo & Online Status */}
          <div className='flex items-center gap-2.5 min-w-0'>
            <div className='relative shrink-0'>
              <img
                src='/images/netpack-rider-icon-192.png'
                alt='Netpack Rider'
                className='h-8 w-8 rounded-xl object-contain bg-white p-0.5 border border-white/20 shadow-xs'
              />
              {isOnline && (
                <span className='absolute -top-1 -right-1 flex h-2.5 w-2.5'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500'></span>
                </span>
              )}
            </div>
            <div className='min-w-0'>
              <div className='flex items-center gap-1.5'>
                <span style={{ fontFamily: 'Jost, sans-serif' }} className='text-sm font-700 tracking-tight text-white truncate max-w-[125px] sm:max-w-[170px] leading-tight block'>
                  {riderUser?.name || 'Netpack Rider'}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-white/50 border border-white/10'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className='text-[10px] text-white/60 flex items-center gap-1 leading-tight mt-0.5 font-mono truncate'>
                <span>ID: {riderUser?.username || riderUser?.phone || `R-${riderUser?.id}`}</span>
                <span>•</span>
                <span>Sync {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Controls (Install button completely removed from top header) */}
          <div className='flex items-center gap-1.5 shrink-0'>
            {/* Theme Switcher */}
            <ThemeSwitch />

            {/* Audio Toggle */}
            <button
              onClick={() => toggleSound(!soundEnabled)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
              title={soundEnabled ? 'Mute Alert Chime' : 'Enable Alert Chime'}
            >
              {soundEnabled ? <Volume2 className='h-4 w-4' /> : <VolumeX className='h-4 w-4' />}
            </button>

            {/* Notification Permission Toggle */}
            <button
              onClick={requestNotificationPermission}
              className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
              }`}
              title={
                notificationPermission === 'granted'
                  ? 'Push Alerts Active'
                  : 'Enable Push Notifications'
              }
            >
              <Bell className='h-4 w-4' />
              {notificationPermission === 'granted' && (
                <span className='w-1.5 h-1.5 bg-emerald-400 rounded-full absolute top-1.5 right-1.5' />
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchPickups(true)}
              disabled={refreshing}
              className='w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer'
              title='Refresh Assigned Pickups'
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-white' : ''}`} />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleRiderLogout}
              className='w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/30 active:scale-95 text-white/80 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer'
              title='Sign Out Rider'
            >
              <LogOut className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <main className='max-w-[430px] mx-auto w-full px-3.5 pt-3 space-y-3'>

        {/* Notification Permission Callout (if not yet granted) */}
        {notificationPermission !== 'granted' && (
          <div className='p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3'>
            <div className='flex items-start gap-2.5'>
              <AlertTriangle className='h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
              <div className='text-xs'>
                <div className='font-bold text-foreground'>Push Notifications Disabled</div>
                <div className='text-muted-foreground text-[11px]'>
                  Enable notifications so you hear new customer pickups while driving or screen locked.
                </div>
              </div>
            </div>
            <Button
              size='sm'
              className='bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-7 px-2.5 shrink-0'
              onClick={requestNotificationPermission}
            >
              Enable
            </Button>
          </div>
        )}

        {/* New Arrival Banner if active */}
        {newPickupAlert && (
          <div className='p-3 bg-card border-2 border-emerald-500 rounded-xl flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='p-2 bg-emerald-500 text-white rounded-lg shrink-0 animate-bounce'>
                <Truck className='h-4 w-4' />
              </div>
              <div className='min-w-0 text-xs'>
                <div className='font-bold text-emerald-600 dark:text-emerald-400 truncate'>
                  NEW PICKUP: {newPickupAlert.senderName}
                </div>
                <div className='text-muted-foreground truncate text-[11px]'>
                  {newPickupAlert.pickupAddress || newPickupAlert.senderAddress}
                </div>
              </div>
            </div>
            <div className='flex items-center gap-1.5 shrink-0'>
              <Button
                size='sm'
                className='bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-7 px-3'
                onClick={() => {
                  handleStartRoute(newPickupAlert)
                  setNewPickupAlert(null)
                }}
              >
                Accept
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-muted-foreground hover:text-foreground'
                onClick={() => setNewPickupAlert(null)}
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Metric Stats Chips (Customer PWA Style) ────────────────────── */}
        <div className='grid grid-cols-3 gap-2.5'>
          <div
            className={`p-3 rounded-2xl border text-center transition-all active:scale-98 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500/10 border-amber-500/80 shadow-xs'
                : 'bg-white dark:bg-[#152238] border-gray-100 dark:border-slate-800 shadow-2xs hover:border-gray-200'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <div className='text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1'>
              <span className='h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse'></span>
              Pending
            </div>
            <div style={{ fontFamily: 'Jost, sans-serif' }} className='text-2xl font-800 text-[#0D1B2A] dark:text-white mt-0.5 leading-none'>
              {stats.pendingCount || pendingCount}
            </div>
            <div className='text-[10px] text-gray-400 mt-1 font-medium'>Need Pickup</div>
          </div>

          <div
            className={`p-3 rounded-2xl border text-center transition-all active:scale-98 cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-blue-500/10 border-blue-500/80 shadow-xs'
                : 'bg-white dark:bg-[#152238] border-gray-100 dark:border-slate-800 shadow-2xs hover:border-gray-200'
            }`}
            onClick={() => setActiveTab('assigned')}
          >
            <div className='text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400'>In Route</div>
            <div style={{ fontFamily: 'Jost, sans-serif' }} className='text-2xl font-800 text-[#0D1B2A] dark:text-white mt-0.5 leading-none'>
              {assignedCount}
            </div>
            <div className='text-[10px] text-gray-400 mt-1 font-medium'>Assigned</div>
          </div>

          <div
            className={`p-3 rounded-2xl border text-center transition-all active:scale-98 cursor-pointer ${
              activeTab === 'picked_up'
                ? 'bg-emerald-500/10 border-emerald-500/80 shadow-xs'
                : 'bg-white dark:bg-[#152238] border-gray-100 dark:border-slate-800 shadow-2xs hover:border-gray-200'
            }`}
            onClick={() => setActiveTab('picked_up')}
          >
            <div className='text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400'>Collected</div>
            <div style={{ fontFamily: 'Jost, sans-serif' }} className='text-2xl font-800 text-emerald-600 dark:text-emerald-400 mt-0.5 leading-none'>
              {stats.pickedUpCount || 0}
            </div>
            <div className='text-[10px] text-gray-400 mt-1 font-medium'>
              {stats.totalWeightToday ? `${stats.totalWeightToday} kg` : 'Today'}
            </div>
          </div>
        </div>

        {/* ─── Search & Tab Filters ──────────────────────────────────────── */}
        <div className='space-y-2 pt-1'>
          <div className='relative bg-white dark:bg-[#152238] rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-2xs p-1 flex items-center'>
            <Search className='h-4 w-4 text-gray-400 ml-2.5 shrink-0' />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search sender, phone, area, tracking...'
              className='flex-1 pl-2 pr-2 bg-transparent text-xs text-[#0D1B2A] dark:text-white placeholder-gray-400 outline-none h-8 font-sans'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='text-gray-400 hover:text-gray-600 p-1.5 mr-1 cursor-pointer'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className='flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5'>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[#0D1B2A] text-white shadow-xs'
                  : 'bg-white dark:bg-[#152238] text-gray-500 hover:text-gray-800 dark:text-gray-400 border border-gray-200/70 dark:border-slate-800'
              }`}
            >
              <span>Pending Pickups</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'assigned'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#152238] text-gray-500 hover:text-gray-800 dark:text-gray-400 border border-gray-200/70 dark:border-slate-800'
              }`}
            >
              <span>In Route</span>
              {assignedCount > 0 && (
                <span className='px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold'>
                  {assignedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('picked_up')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'picked_up'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#152238] text-gray-500 hover:text-gray-800 dark:text-gray-400 border border-gray-200/70 dark:border-slate-800'
              }`}
            >
              <span>Completed</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0D1B2A] text-white shadow-xs'
                  : 'bg-white dark:bg-[#152238] text-gray-500 hover:text-gray-800 dark:text-gray-400 border border-gray-200/70 dark:border-slate-800'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* ─── Pickup Cards List ─────────────────────────────────────────── */}
        {loading ? (
          <div className='space-y-3 pt-4'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='h-36 rounded-2xl bg-card/60 border border-border animate-pulse'
              />
            ))}
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className='text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-card/40'>
            <div className='p-3.5 bg-muted text-muted-foreground rounded-full w-fit mx-auto mb-3'>
              <CheckCircle2 className='h-8 w-8 text-emerald-500' />
            </div>
            <h3 className='text-base font-bold text-foreground'>No Pickups in this Filter</h3>
            <p className='text-xs text-muted-foreground mt-1 max-w-sm mx-auto'>
              {activeTab === 'pending'
                ? 'All pending customer pickups have been accepted or completed! You will hear a chime when a new pickup arrives.'
                : 'No consignments match your current search or tab filter.'}
            </p>
            {activeTab !== 'pending' && (
              <Button
                size='sm'
                variant='outline'
                className='mt-3 text-xs border-border bg-card text-foreground'
                onClick={() => setActiveTab('pending')}
              >
                Go to Pending Pickups
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredPickups.map((p) => {
              const isDone =
                ['PICKED_UP', 'PACKED', 'SHIPMENT_CREATED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'CARRIER_SCANNED', 'DELIVERED'].includes(
                  (p.status || '').toUpperCase()
                ) ||
                !!p.weightProofImageUrl ||
                !!p.shipmentId

              const isInRoute = p.status === 'ASSIGNED_FOR_PICKUP' && !isDone
              const addressToNavigate = p.pickupAddress || p.senderAddress || 'Kathmandu'
              const phoneToCall = p.pickupPhone || p.senderPhone

              return (
                <Card
                  key={p.id}
                  className={`bg-card border transition-all rounded-2xl overflow-hidden shadow-xs ${
                    isDone
                      ? 'border-border/80 opacity-90'
                      : isInRoute
                      ? 'border-sky-500/80 shadow-sky-500/10'
                      : 'border-border hover:border-amber-500/60'
                  }`}
                >
                  <CardHeader className='p-3.5 pb-2'>
                    <div className='flex items-start justify-between gap-2'>
                      {/* Tracking & Time */}
                      <div className='space-y-1'>
                        <div className='flex items-center gap-1.5'>
                          <span
                            className='font-mono text-xs font-black tracking-wider text-primary cursor-pointer hover:underline flex items-center gap-1'
                            onClick={() => handleCopy(p.trackingNumber)}
                          >
                            {p.trackingNumber}
                            {copiedTracking === p.trackingNumber ? (
                              <Check className='h-3 w-3 text-emerald-500' />
                            ) : (
                              <Copy className='h-3 w-3 text-muted-foreground' />
                            )}
                          </span>
                          {p.hawbNumber && (
                            <Badge variant='outline' className='text-[9px] px-1 py-0 border-border text-muted-foreground'>
                              HAWB: {p.hawbNumber}
                            </Badge>
                          )}
                        </div>

                        {/* Customer / Sender Name */}
                        <div
                          className='text-base font-extrabold text-foreground leading-tight flex items-center gap-1.5'
                          style={{ fontFamily: 'Jost, sans-serif' }}
                        >
                          {p.senderName || 'Customer Sender'}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isDone ? (
                          <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5'>
                            <CheckCircle2 className='h-3 w-3 mr-1' />
                            Picked Up
                          </Badge>
                        ) : isInRoute ? (
                          <Badge className='bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 animate-pulse'>
                            <Truck className='h-3 w-3 mr-1' />
                            In Route
                          </Badge>
                        ) : (
                          <Badge className='bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5'>
                            <Clock className='h-3 w-3 mr-1' />
                            Pending Pickup
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className='p-3.5 pt-0 space-y-2.5 text-xs'>
                    {/* Location with Google Maps button */}
                    <div className='flex items-start justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/60'>
                      <div className='flex items-start gap-2 min-w-0'>
                        <MapPin className='h-4 w-4 text-rose-500 shrink-0 mt-0.5' />
                        <div className='min-w-0'>
                          <div className='text-foreground font-semibold leading-snug break-words'>
                            {addressToNavigate}
                          </div>
                          {p.preferredTime && (
                            <div className='text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5'>
                              ⏱ {p.preferredTime}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* One-Tap Navigation */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          addressToNavigate
                        )}`}
                        target='_blank'
                        rel='noreferrer'
                        className='shrink-0'
                      >
                        <Button
                          size='sm'
                          variant='secondary'
                          className='h-7 px-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 text-[11px] font-bold'
                        >
                          <Navigation className='h-3 w-3 mr-1 text-primary' />
                          Maps
                        </Button>
                      </a>
                    </div>

                    {/* Cargo Specs & Phone */}
                    <div className='grid grid-cols-2 gap-2 text-[11px]'>
                      <div className='p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between'>
                        <span className='text-muted-foreground'>Commodity:</span>
                        <span className='font-bold text-foreground truncate max-w-[110px]' title={p.commodity}>
                          {p.commodity || 'General Cargo'}
                        </span>
                      </div>

                      <div className='p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between'>
                        <span className='text-muted-foreground'>Est. Weight:</span>
                        <span className='font-bold text-amber-600 dark:text-amber-400'>
                          ~{p.weight || 1} kg ({p.noOfBox || 1} box)
                        </span>
                      </div>
                    </div>

                    {/* Destination & Notes */}
                    <div className='flex items-center justify-between text-[11px] text-muted-foreground px-1'>
                      <div>
                        Destination: <strong className='text-foreground'>{p.receiverCountry || 'Global'}</strong>
                        {p.receiverCity ? ` (${p.receiverCity})` : ''}
                      </div>
                      {p.pickedUpAt && (
                        <div className='text-emerald-600 dark:text-emerald-400 font-mono text-[10px]'>
                          Picked: {new Date(p.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    {p.pickupNotes && (
                      <div className='p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300'>
                        <span className='font-bold'>Note:</span> {p.pickupNotes}
                      </div>
                    )}

                    {/* Verified proof thumbnail if picked up */}
                    {p.weightProofImageUrl && (
                      <div className='flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30'>
                        <img
                          src={`${API_BASE}${p.weightProofImageUrl}`}
                          alt='Scale Proof'
                          className='h-10 w-10 object-cover rounded-md border border-emerald-500/40'
                        />
                        <div className='text-[10px] text-emerald-700 dark:text-emerald-300'>
                          <div className='font-bold'>Verified Weight Proof Photo</div>
                          <div>Actual Scale Weight: {p.weight} kg</div>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Card Actions Footer */}
                  <CardFooter className='p-3.5 pt-0 flex items-center gap-2'>
                    {/* Call Customer Button */}
                    {phoneToCall && (
                      <a href={`tel:${phoneToCall}`} className='flex-1'>
                        <Button
                          variant='outline'
                          className='w-full text-xs h-9 border-border bg-muted/40 hover:bg-muted text-foreground font-bold'
                        >
                          <Phone className='h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400' />
                          Call Sender
                        </Button>
                      </a>
                    )}

                    {/* Status Action Buttons */}
                    {!isDone ? (
                      isInRoute ? (
                        <Button
                          className='flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs'
                          onClick={() => handleOpenWeighModal(p)}
                        >
                          <Scale className='h-3.5 w-3.5 mr-1.5' />
                          Pickup & Weigh
                        </Button>
                      ) : (
                        <Button
                          className='flex-1 text-xs h-9 bg-sky-600 hover:bg-sky-500 text-white font-black shadow-xs'
                          onClick={() => handleStartRoute(p)}
                        >
                          <Truck className='h-3.5 w-3.5 mr-1.5' />
                          Start Route
                        </Button>
                      )
                    ) : (
                      <Button
                        variant='outline'
                        className='flex-1 text-xs h-9 border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                        onClick={() => handleOpenWeighModal(p)}
                      >
                        <Scale className='h-3.5 w-3.5 mr-1 text-muted-foreground' />
                        Re-inspect / Edit
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* ─── Mobile Bottom Navigation Bar ──────────────────────────────────── */}
      <nav className='fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-3 py-1.5'>
        <div className='max-w-2xl mx-auto grid grid-cols-4 gap-1 text-center'>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-1.5 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTab === 'pending'
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className='relative'>
              <Clock className='h-5 w-5' />
              {pendingCount > 0 && (
                <span className='absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black bg-amber-500 text-slate-950'>
                  {pendingCount}
                </span>
              )}
            </div>
            <span className='text-[10px] font-bold mt-1'>Pending</span>
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`py-1.5 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTab === 'assigned'
                ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className='relative'>
              <Truck className='h-5 w-5' />
              {assignedCount > 0 && (
                <span className='absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black bg-sky-600 text-white'>
                  {assignedCount}
                </span>
              )}
            </div>
            <span className='text-[10px] font-bold mt-1'>In Route</span>
          </button>

          <button
            onClick={() => setActiveTab('picked_up')}
            className={`py-1.5 flex flex-col items-center justify-center rounded-xl transition-all ${
              activeTab === 'picked_up'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className='h-5 w-5' />
            <span className='text-[10px] font-bold mt-1'>Collected</span>
          </button>

          <button
            onClick={() => {
              toggleOnline(!isOnline)
            }}
            className={`py-1.5 flex flex-col items-center justify-center rounded-xl transition-all ${
              isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            }`}
          >
            <Radio className={`h-5 w-5 ${isOnline ? 'animate-pulse' : ''}`} />
            <span className='text-[10px] font-bold mt-1'>{isOnline ? 'Active' : 'Paused'}</span>
          </button>
        </div>
      </nav>

      {/* ─── Mobile-First Weighing & Proof Inspection Modal ─────────────────── */}
      <Dialog open={isWeighModalOpen} onOpenChange={setIsWeighModalOpen}>
        <DialogContent className='bg-card border-border text-card-foreground max-w-lg w-[95vw] rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6'>
          <DialogHeader className='text-left pb-2'>
            <DialogTitle className='text-lg font-black text-foreground flex items-center gap-2'>
              <Scale className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
              Verify Weight & Dimensions
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Record verified scale weight and capture photo proof for {selectedPickup?.trackingNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-xs'>
            {/* Sender Summary Card */}
            <div className='p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between'>
              <div>
                <div className='font-bold text-foreground'>{selectedPickup?.senderName}</div>
                <div className='text-[11px] text-muted-foreground'>{selectedPickup?.commodity || 'Cargo'}</div>
              </div>
              <Badge variant='outline' className='font-mono text-primary border-border'>
                {selectedPickup?.trackingNumber}
              </Badge>
            </div>

            {/* 1. Camera Photo Capture */}
            <div className='space-y-2'>
              <label className='font-bold text-foreground flex items-center justify-between'>
                <span>Scale Proof & Box Photos</span>
                <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-normal'>Camera / Gallery</span>
              </label>

              <div className='flex items-center gap-2 overflow-x-auto pb-1'>
                {/* Camera Input Button */}
                <label className='flex flex-col items-center justify-center h-20 w-24 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer shrink-0 transition-all'>
                  <Camera className='h-6 w-6 text-primary mb-1' />
                  <span className='text-[10px] font-bold'>Take Photo</span>
                  <input
                    type='file'
                    accept='image/*'
                    capture='environment'
                    multiple
                    onChange={handlePhotoCapture}
                    className='hidden'
                  />
                </label>

                {/* Previews */}
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className='relative h-20 w-20 rounded-xl overflow-hidden border border-border shrink-0'>
                    <img src={src} alt='Proof' className='h-full w-full object-cover' />
                    <button
                      type='button'
                      onClick={() => handleRemovePhoto(idx)}
                      className='absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full'
                    >
                      <X className='h-2.5 w-2.5' />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Scale Weight Input with Quick Increments */}
            <div className='space-y-1.5'>
              <label className='font-bold text-foreground flex items-center justify-between'>
                <span>Actual Scale Weight (kg)</span>
                <span className='text-amber-600 dark:text-amber-400 font-mono'>Required</span>
              </label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  step='0.1'
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder='e.g. 14.5'
                  className='bg-background border-input text-base font-black text-foreground h-11 focus-visible:ring-emerald-500'
                />
                {/* Preset quick buttons */}
                <div className='flex items-center gap-1 shrink-0'>
                  {[5, 10, 20].map((inc) => (
                    <Button
                      key={inc}
                      type='button'
                      size='sm'
                      variant='outline'
                      className='h-11 px-2.5 text-xs font-bold border-border bg-card text-foreground hover:bg-muted'
                      onClick={() => {
                        const cur = parseFloat(actualWeight) || 0
                        setActualWeight(String((cur + inc).toFixed(1)))
                      }}
                    >
                      +{inc}kg
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Box Dimensions & Volumetric Calc */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-bold text-foreground flex items-center gap-1'>
                  <BoxIcon className='h-3.5 w-3.5 text-primary' />
                  Boxes & Dimensions ({boxes.length})
                </span>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className='h-6 text-primary hover:text-primary/80 text-xs px-2'
                  onClick={handleAddBox}
                >
                  <Plus className='h-3.5 w-3.5 mr-1' />
                  Add Box
                </Button>
              </div>

              <div className='space-y-2 max-h-40 overflow-y-auto pr-1'>
                {boxes.map((b, idx) => (
                  <div
                    key={idx}
                    className='p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2'
                  >
                    <span className='font-mono font-bold text-muted-foreground text-xs shrink-0'>
                      #{idx + 1}
                    </span>
                    <div className='grid grid-cols-3 gap-1.5 flex-1'>
                      <div>
                        <span className='text-[9px] text-muted-foreground uppercase'>L (cm)</span>
                        <Input
                          type='number'
                          value={b.length}
                          onChange={(e) => handleUpdateBox(idx, 'length', e.target.value)}
                          className='h-8 bg-background border-input text-xs text-foreground'
                        />
                      </div>
                      <div>
                        <span className='text-[9px] text-muted-foreground uppercase'>W (cm)</span>
                        <Input
                          type='number'
                          value={b.breadth}
                          onChange={(e) => handleUpdateBox(idx, 'breadth', e.target.value)}
                          className='h-8 bg-background border-input text-xs text-foreground'
                        />
                      </div>
                      <div>
                        <span className='text-[9px] text-muted-foreground uppercase'>H (cm)</span>
                        <Input
                          type='number'
                          value={b.height}
                          onChange={(e) => handleUpdateBox(idx, 'height', e.target.value)}
                          className='h-8 bg-background border-input text-xs text-foreground'
                        />
                      </div>
                    </div>
                    {boxes.length > 1 && (
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 text-rose-500 hover:text-rose-600 shrink-0'
                        onClick={() => handleRemoveBox(idx)}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Volumetric Summary */}
              <div className='flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/30 text-[11px] text-primary'>
                <span>Volumetric Weight ((L×W×H)/5000):</span>
                <span className='font-bold text-foreground'>{computedVolumetricWeight.toFixed(2)} kg</span>
              </div>
            </div>

            {/* 4. Notes */}
            <div className='space-y-1'>
              <label className='font-bold text-foreground'>Rider Notes / Warehouse Memo</label>
              <Input
                value={riderNotes}
                onChange={(e) => setRiderNotes(e.target.value)}
                placeholder='e.g. 2 boxes securely packed and sealed, received from sender'
                className='bg-background border-input text-xs h-9 text-foreground'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 pt-2 sm:pt-4'>
            <Button
              type='button'
              variant='outline'
              className='border-border bg-card text-foreground text-xs h-10'
              onClick={() => setIsWeighModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              disabled={submittingWeigh}
              className='bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 flex-1 shadow-xs'
              onClick={handleSubmitWeigh}
            >
              {submittingWeigh ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Saving Verification...
                </>
              ) : (
                <>
                  <CheckCircle2 className='h-4 w-4 mr-1.5' />
                  Complete Pickup & Weigh
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InstallGuideModal
        open={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        isIos={isIos}
      />
      </div>
    </div>
  )
}
