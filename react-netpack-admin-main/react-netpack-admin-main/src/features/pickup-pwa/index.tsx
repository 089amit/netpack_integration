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
  Download,
  AlertTriangle,
  Radio,
  X,
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  Bike,
  LogOut,
  KeyRound,
  ShieldCheck,
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
  const [installModalOpen, setInstallModalOpen] = useState(false)

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
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        if (outcome === 'accepted') {
          setInstallPrompt(null)
          toast.success('Netpack Rider App installed to your home screen!')
        }
        return
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
    }
    setInstallModalOpen(true)
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

  // ─── Test Alert Simulation ────────────────────────────────────────────────
  const handleTestAlert = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pickups/test-alert`, { method: 'POST' }).then((r) =>
        r.json()
      )
      if (res?.pickup) {
        setPickups((prev) => [res.pickup, ...prev])
        notifyNewPickup(res.pickup)
      }
    } catch (e) {
      toast.error('Failed to simulate test alert')
    }
  }

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
      <div className='min-h-screen bg-background text-foreground flex flex-col font-sans'>
        {/* Top Sticky Header with Theme Switcher & Install */}
        <header className='border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 sticky top-0 z-40'>
          <div className='max-w-md mx-auto flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <img
                src='/images/netpack-rider-icon-192.png'
                alt='Netpack Rider'
                className='h-9 w-9 rounded-xl object-contain bg-white p-0.5 border border-border shadow-xs'
              />
              <div>
                <span className='text-sm font-black tracking-tight'>Netpack Rider</span>
                <span className='text-[10px] block text-muted-foreground'>Field Rider Dispatch Portal</span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handleInstallClick}
                className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all cursor-pointer'
                title='Install Netpack Rider on Phone'
              >
                <Download className='h-3.5 w-3.5' />
                <span>Install App</span>
              </button>
              <ThemeSwitch />
            </div>
          </div>
        </header>

        {/* Main Login Card */}
        <main className='flex-1 flex items-center justify-center p-4 sm:p-6'>
          <div className='max-w-md w-full space-y-4 animate-in fade-in-50 duration-200'>
            <Card className='border shadow-xl bg-card'>
              <CardHeader className='text-center pb-4 pt-6'>
                <div className='h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3 shadow-inner border border-primary/20'>
                  <Bike className='h-7 w-7' />
                </div>
                <h2 className='text-xl font-black tracking-tight text-foreground'>
                  Rider Dispatch Login
                </h2>
                <p className='text-xs text-muted-foreground mt-1'>
                  Sign in to access assigned pickups, live Kathmandu dispatch alerts, and camera weighing.
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <form onSubmit={handleRiderLogin} className='space-y-4'>
                  {/* Rider ID / Email / Phone */}
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                      <span>Rider ID / Email / Phone</span>
                      <span className='text-[10px] text-muted-foreground font-normal'>Registered Account</span>
                    </label>
                    <div className='relative'>
                      <User className='h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        type='text'
                        placeholder='e.g. driver@netpack.com or rider-01'
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className='pl-9 h-10 text-xs'
                        autoComplete='username'
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                      <span>Password</span>
                      <span className='text-[10px] text-muted-foreground font-normal'>Security Code</span>
                    </label>
                    <div className='relative'>
                      <Lock className='h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder='Enter your rider password'
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className='pl-9 pr-9 h-10 text-xs font-mono'
                        autoComplete='current-password'
                        required
                      />
                      <button
                        type='button'
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type='submit'
                    disabled={loginLoading}
                    className='w-full h-10 text-xs font-bold gap-2 shadow-md'
                  >
                    {loginLoading ? (
                      <>
                        <RefreshCw className='h-4 w-4 animate-spin' />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Bike className='h-4 w-4' />
                        Sign In to Rider Portal
                      </>
                    )}
                  </Button>
                </form>

                {/* Demo Helper Pill */}
                <div className='pt-2 border-t text-center'>
                  <p className='text-[11px] text-muted-foreground mb-2'>Quick Testing Credentials:</p>
                  <button
                    type='button'
                    onClick={() => {
                      setLoginIdentifier('driver@netpack.com')
                      setLoginPassword('Driver@123')
                      toast.info('Demo rider credentials filled!')
                    }}
                    className='w-full py-2 px-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-primary text-[11px] font-mono hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5'
                  >
                    <KeyRound className='h-3.5 w-3.5' />
                    <span>Fill Demo Rider: driver@netpack.com / Driver@123</span>
                  </button>
                </div>
              </CardContent>
              <CardFooter className='pt-0 pb-4 text-center justify-center'>
                <p className='text-[10px] text-muted-foreground flex items-center gap-1'>
                  <ShieldCheck className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                  <span>Rider IDs & passwords are managed in <strong>Admin → Users</strong>.</span>
                </p>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background text-foreground flex flex-col font-sans pb-24 select-none'>
      {/* ─── Sticky Top App Bar ─────────────────────────────────────────────── */}
      <header className='sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-xs px-3.5 py-2.5'>
        <div className='max-w-2xl mx-auto flex items-center justify-between gap-2'>
          {/* Logo & Online Status */}
          <div className='flex items-center gap-2.5'>
            <div className='relative'>
              <img
                src='/images/netpack-rider-icon-192.png'
                alt='Netpack Rider'
                className='h-8 w-8 rounded-lg object-contain bg-white p-0.5 border border-border shadow-xs'
              />
              {isOnline && (
                <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-emerald-500'></span>
                </span>
              )}
            </div>
            <div>
              <div className='flex items-center gap-1.5'>
                <span className='text-sm font-black tracking-tight text-foreground truncate max-w-[130px] sm:max-w-[190px]'>
                  {riderUser?.name || 'Netpack Rider'}
                </span>
                <Badge
                  variant='outline'
                  className={`text-[9px] px-1.5 py-0 h-4 border-0 font-bold ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>
              <p className='text-[10px] text-muted-foreground flex items-center gap-1 leading-tight'>
                <span className='text-primary font-mono font-medium'>
                  ID: {riderUser?.username || riderUser?.phone || `R-${riderUser?.id}`}
                </span> •{' '}
                <span>
                  Sync {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className='flex items-center gap-1.5'>
            {/* Install App on Phone */}
            <button
              type='button'
              onClick={handleInstallClick}
              className='inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all cursor-pointer'
              title='Install Netpack Rider on Phone'
            >
              <Download className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Install</span>
            </button>
            {/* Theme Switcher */}
            <ThemeSwitch />

            {/* Audio Toggle */}
            <Button
              variant='ghost'
              size='icon'
              className={`h-8 w-8 rounded-lg ${
                soundEnabled
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => toggleSound(!soundEnabled)}
              title={soundEnabled ? 'Mute Alert Chime' : 'Enable Alert Chime'}
            >
              {soundEnabled ? <Volume2 className='h-4 w-4' /> : <VolumeX className='h-4 w-4' />}
            </Button>

            {/* Notification Permission Toggle */}
            <Button
              variant='ghost'
              size='icon'
              className={`h-8 w-8 rounded-lg ${
                notificationPermission === 'granted'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 animate-pulse'
              }`}
              onClick={requestNotificationPermission}
              title={
                notificationPermission === 'granted'
                  ? 'Push Alerts Active'
                  : 'Enable Push Notifications'
              }
            >
              <Bell className='h-4 w-4' />
            </Button>

            {/* Refresh */}
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground hover:text-foreground'
              onClick={() => fetchPickups(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>

            {/* Sign Out Button */}
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors'
              onClick={handleRiderLogout}
              title='Sign Out Rider'
            >
              <LogOut className='h-4 w-4' />
            </Button>

            {/* Test Simulation Alert */}
            <Button
              size='sm'
              variant='outline'
              className='text-[11px] h-8 px-2 border-border bg-card text-foreground hover:bg-muted'
              onClick={handleTestAlert}
            >
              <Sparkles className='h-3.5 w-3.5 mr-1 text-amber-500' />
              Test Alert
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <main className='max-w-2xl mx-auto w-full px-3 pt-3 space-y-3'>
        {/* PWA Install Banner (shown if browser prompted) */}
        {installPrompt && (
          <div className='p-3 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-primary/30 rounded-xl flex items-center justify-between gap-3 shadow-xs'>
            <div className='flex items-center gap-2.5'>
              <div className='p-2 rounded-lg bg-primary text-primary-foreground shrink-0'>
                <Download className='h-4 w-4' />
              </div>
              <div className='text-xs'>
                <div className='font-bold text-foreground'>Install NetPack Rider App</div>
                <div className='text-muted-foreground text-[11px]'>Instant alerts on your home screen</div>
              </div>
            </div>
            <Button
              size='sm'
              className='bg-primary text-primary-foreground font-bold text-xs h-7 px-3'
              onClick={handleInstallClick}
            >
              Install
            </Button>
          </div>
        )}

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

        {/* ─── Metric Stats Chips ────────────────────────────────────────── */}
        <div className='grid grid-cols-3 gap-2'>
          <div
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500/10 border-amber-500 shadow-xs'
                : 'bg-card border-border hover:bg-muted/40'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <div className='text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1'>
              <span className='h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse'></span>
              Pending
            </div>
            <div className='text-xl font-black text-foreground mt-0.5'>
              {stats.pendingCount || pendingCount}
            </div>
            <div className='text-[10px] text-muted-foreground'>Need Pickup</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-sky-500/10 border-sky-500 shadow-xs'
                : 'bg-card border-border hover:bg-muted/40'
            }`}
            onClick={() => setActiveTab('assigned')}
          >
            <div className='text-[11px] font-semibold text-sky-600 dark:text-sky-400'>In Route</div>
            <div className='text-xl font-black text-foreground mt-0.5'>{assignedCount}</div>
            <div className='text-[10px] text-muted-foreground'>Assigned</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              activeTab === 'picked_up'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-xs'
                : 'bg-card border-border hover:bg-muted/40'
            }`}
            onClick={() => setActiveTab('picked_up')}
          >
            <div className='text-[11px] font-semibold text-emerald-600 dark:text-emerald-400'>Collected</div>
            <div className='text-xl font-black text-foreground mt-0.5'>{stats.pickedUpCount || 0}</div>
            <div className='text-[10px] text-muted-foreground'>
              {stats.totalWeightToday ? `${stats.totalWeightToday} kg` : 'Today'}
            </div>
          </div>
        </div>

        {/* ─── Search & Tab Filters ──────────────────────────────────────── */}
        <div className='space-y-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search sender, phone, area, tracking...'
              className='pl-9 bg-card border-border text-xs h-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary'
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className='flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5'>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
              }`}
            >
              <span>Pending Pickups</span>
              <span className='px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-black/30'>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'assigned'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
              }`}
            >
              <span>In Route</span>
              {assignedCount > 0 && (
                <span className='px-1.5 py-0.2 rounded-full text-[10px] bg-white/20'>
                  {assignedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('picked_up')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'picked_up'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
              }`}
            >
              <span>Completed</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border/50'
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
                        <div className='text-base font-extrabold text-foreground leading-tight flex items-center gap-1.5'>
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

      {/* ── INSTALL APP GUIDANCE DIALOG ────────────────────────────────────────── */}
      <Dialog open={installModalOpen} onOpenChange={setInstallModalOpen}>
        <DialogContent className='sm:max-w-md bg-card text-card-foreground border-border'>
          <DialogHeader className='text-center sm:text-left'>
            <div className='flex items-center gap-3 mb-2'>
              <img
                src='/images/netpack-rider-icon-192.png'
                alt='Netpack Rider'
                className='h-12 w-12 rounded-2xl border border-border bg-white p-0.5 shadow-sm object-contain'
              />
              <div>
                <DialogTitle className='text-base font-bold'>
                  Install Netpack Rider on Your Phone
                </DialogTitle>
                <DialogDescription className='text-xs text-muted-foreground'>
                  Direct rider dispatch app installation with turn-by-turn navigation &amp; audio alerts.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-3 py-1 text-xs'>
            {/* Android Instructions */}
            <div className='p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1.5'>
              <div className='flex items-center gap-2 font-bold text-foreground'>
                <Smartphone className='h-4 w-4 text-emerald-500' />
                <span>On Android (Chrome / Brave / Samsung)</span>
              </div>
              <ol className='list-decimal list-inside space-y-1 text-muted-foreground pl-1'>
                <li>Tap the <strong>three dots menu (⋮)</strong> at top-right of your browser.</li>
                <li>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                <li>Confirm by tapping <strong>Install</strong>.</li>
              </ol>
            </div>

            {/* iOS Instructions */}
            <div className='p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1.5'>
              <div className='flex items-center gap-2 font-bold text-foreground'>
                <Smartphone className='h-4 w-4 text-blue-500' />
                <span>On iPhone / iPad (Safari)</span>
              </div>
              <ol className='list-decimal list-inside space-y-1 text-muted-foreground pl-1'>
                <li>Tap the <strong>Share button (⎋)</strong> at the bottom of the screen.</li>
                <li>Scroll down and select <strong>&quot;Add to Home Screen&quot; (+)</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
            </div>
          </div>

          <div className='flex justify-end pt-3 border-t border-border/60'>
            <Button
              type='button'
              onClick={() => setInstallModalOpen(false)}
              className='h-9 px-4 rounded-xl text-xs font-semibold'
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
