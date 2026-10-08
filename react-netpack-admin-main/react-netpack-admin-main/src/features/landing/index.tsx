'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Phone,
  Mail,
  Search,
  ArrowRight,
  Plane,
  Package,
  Truck,
  Warehouse,
  PackageOpen,
  PackageSearch,
  Clock,
  Shield,
  MapPin,
  Globe,
  Menu,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Check,
  ExternalLink,
  Copy,
  Boxes,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { isAuthenticated } from '@/lib/auth'
import { SERVER_URL } from '@/constants/endpoint'
import {
  getEffectiveFestiveTheme,
  getFestivalTheme,
  FestiveAtmosphereBackground,
  FestiveLogoAdornment,
} from './festive-atmosphere'

const API_BASE = SERVER_URL

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'Date & time pending'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return isoStr
  }
}

function getProgressPercent(status?: string): number {
  const s = (status || '').toUpperCase()
  if (s.includes('DELIVERED')) return 100
  if (s.includes('OUT_FOR_DELIVERY')) return 90
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) return 78
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB') || s.includes('CUSTOMS')) return 60
  if (s.includes('TRANSIT')) return 45
  if (s.includes('SHIPMENT_CREATED')) return 30
  if (s.includes('PICKED_UP') || s.includes('PICKUP')) return 18
  return 8
}

function getShortMilestoneLabel(label: string) {
  if (label.includes('Enquiry')) return 'Enquiry'
  if (label.includes('Picked Up') || label.includes('Pickup')) return 'Picked Up'
  if (label.includes('Created')) return 'Created'
  if (label.includes('In Transit') || label.includes('Transit')) return 'In Transit'
  if (label.includes('Hub')) return 'At Hub'
  if (label.includes('Carrier') || label.includes('Delivery')) return 'Carrier'
  if (label.includes('Delivered')) return 'Delivered'
  return label.split(' ')[0]
}

function InstallGuideModal({
  open,
  onClose,
  isIos,
  isInAppBrowser = false,
}: {
  open: boolean
  onClose: () => void
  isIos: boolean
  isInAppBrowser?: boolean
}) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200'>
      <div className='bg-white dark:bg-[#0A1128] rounded-3xl w-full max-w-sm border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6'>
        <div className='flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20'>
              <Smartphone className='w-5 h-5' />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Jost, sans-serif' }} className='font-bold text-base text-[#0D1B2A] dark:text-white'>
                Install Netpack App
              </h3>
              <p className='text-xs text-muted-foreground'>Home screen app installation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        <div className='py-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300'>
          {isInAppBrowser && (
            <div className='p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 mb-2'>
              <div className='flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300'>
                <span>⚠️</span>
                <span>You are browsing inside an in-app browser</span>
              </div>
              <p className='text-[11px] text-amber-800/90 dark:text-amber-200/90 mt-1 leading-snug'>
                Apple and WhatsApp prevent installing home screen apps directly.
              </p>
              <div className='mt-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-500/20 text-[11px] font-semibold text-slate-800 dark:text-white flex items-center gap-2'>
                <span className='text-amber-600 font-bold'>👉</span>
                <span>Tap <strong>⋯</strong> in corner and select <strong>"Open in Safari"</strong></span>
              </div>
            </div>
          )}

          {isIos ? (
            <>
              <p className='font-semibold text-slate-900 dark:text-white text-xs'>
                Follow these 3 steps on iPhone / iPad:
              </p>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold'>1</div>
                <div className='leading-relaxed text-xs'>
                  In Safari, tap the <strong>Share</strong> button <span className='inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border text-[11px] font-mono'>[↑]</span> at the bottom bar.
                  <p className='text-[10px] text-muted-foreground mt-0.5'>(In Chrome for iOS: tap 3 dots <strong>⋯</strong> in corner)</p>
                </div>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold'>2</div>
                <p className='leading-relaxed text-xs'>
                  Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> <span className='inline-block px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px] font-mono'>➕</span>.
                </p>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold'>3</div>
                <p className='leading-relaxed text-xs'>
                  Tap <strong>Add</strong> in the top right. Launch the <strong>Netpack</strong> icon directly from your home screen!
                </p>
              </div>
            </>
          ) : (
            <>
              <p className='font-semibold text-slate-900 dark:text-white text-xs'>
                Follow these steps on Android / Chrome:
              </p>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold'>1</div>
                <p className='leading-relaxed text-xs'>
                  Tap the browser <strong>Three Dots (⋮)</strong> menu in the upper corner.
                </p>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold'>2</div>
                <p className='leading-relaxed text-xs'>
                  Choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
              <div className='flex items-start gap-3 bg-blue-50/80 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40'>
                <div className='w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold'>3</div>
                <p className='leading-relaxed text-xs'>
                  Confirm installation. Launch from home screen for full-screen offline experience!
                </p>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          style={{ fontFamily: 'Jost, sans-serif' }}
          className='w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.98]'
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuth, setIsAuth] = useState(false)

  // PWA Install Prompt & Device Detection
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false)
  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    )
  }, [])
  const isInAppBrowser = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /WhatsApp|FBAN|FBAV|Instagram|Line|Messenger/i.test(navigator.userAgent)
  }, [])

  // Live Tracking state
  const [trackingId, setTrackingId] = useState('')
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [isMilestonesFolded, setIsMilestonesFolded] = useState<boolean>(true)
  const [isPackageDetailsOpen, setIsPackageDetailsOpen] = useState<boolean>(false)
  const [isCheckpointsExpanded, setIsCheckpointsExpanded] = useState<boolean>(false)
  const [copied, setCopied] = useState(false)

  // Contact form state
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactService, setContactService] = useState('Door-to-Door Delivery')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSubmitting, setContactSubmitting] = useState(false)

  // Dynamic CMS Website Content (Customizable from Admin -> Website Content)
  const [siteContent, setSiteContent] = useState({
    heroTitle: 'Fast & Reliable Courier Services in Teku, Kathmandu',
    heroSubtitle:
      'Your trusted partner for secure package delivery across Nepal. Professional logistics solutions with real-time tracking and guaranteed delivery.',
    heroBadge: 'Teku, Kathmandu Headquarters',
    contactPhone: '015339942',
    contactEmail: 'admin@netpacklogistic.com',
    contactAddress: 'Teku Road, Ward No. 15, Kathmandu, Nepal',
    businessHours: '10:00 am - 5:00 pm (Sun - Fri)',
    tickerItems: [
      'Air Cargo Route: KTM ➔ DXB (Daily Direct)',
      'Kathmandu Valley Pickup: Active (20-30 min dispatch)',
      'TIA Customs Clearance: Operational',
      'Coverage: 75+ Hubs Across Nepal & Worldwide',
    ],
    festiveTheme: 'auto',
    festiveGreeting: '',
  })

  const effectiveFestiveTheme = useMemo(
    () => getEffectiveFestiveTheme(siteContent.festiveTheme),
    [siteContent.festiveTheme]
  )

  const activeTheme = useMemo(
    () => getFestivalTheme(effectiveFestiveTheme),
    [effectiveFestiveTheme]
  )

  useEffect(() => {
    fetch(`${API_BASE}/api/website-content`)
      .then((res) => {
        if (!res.ok) throw new Error('CMS content fetch failed')
        return res.json()
      })
      .then((data) => {
        if (data && data.heroTitle) {
          setSiteContent((prev) => ({
            ...prev,
            heroTitle: data.heroTitle || prev.heroTitle,
            heroSubtitle: data.heroSubtitle || prev.heroSubtitle,
            heroBadge: data.heroBadge || prev.heroBadge,
            contactPhone: data.contactPhone || prev.contactPhone,
            contactEmail: data.contactEmail || prev.contactEmail,
            contactAddress: data.contactAddress || prev.contactAddress,
            businessHours: data.businessHours || prev.businessHours,
            tickerItems:
              Array.isArray(data.tickerItems) && data.tickerItems.length > 0
                ? data.tickerItems
                : prev.tickerItems,
            festiveTheme: data.festiveTheme || prev.festiveTheme,
            festiveGreeting: data.festiveGreeting || prev.festiveGreeting,
          }))
        }
      })
      .catch((err) => {
        console.debug('Using default landing page CMS content:', err)
      })
  }, [])

  const trackingBoxRef = useRef<HTMLDivElement>(null)

  // Auth check & PWA install listener
  useEffect(() => {
    setIsAuth(isAuthenticated())

    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  const handleInstallClick = async (target: 'customer' | 'rider' = 'customer') => {
    if (target === 'rider') {
      window.location.href = '/pickup-pwa?install=1'
      return
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          toast.success('Netpack App installed to your phone!')
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.warn('Install prompt error:', err)
        setShowInstallGuideModal(true)
      }
    } else {
      setShowInstallGuideModal(true)
    }
  }

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const query = trackingId.trim()
    if (!query) {
      toast.error('Please enter a tracking or consignment ID.')
      return
    }

    setTrackingLoading(true)
    setTrackingError(null)
    setTrackingData(null)

    try {
      const res = await fetch(`${API_BASE}/api/tracking/${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok && data && data.found) {
        setTrackingData(data)
        setIsMilestonesFolded(true)
        setIsPackageDetailsOpen(false)
        setIsCheckpointsExpanded(false)
        setTimeout(() => {
          trackingBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 120)
      } else {
        setTrackingError(data?.message || `No shipment found for tracking number "${query}".`)
        toast.error(`Shipment "${query}" not found`)
      }
    } catch {
      setTrackingError('Failed to query tracking server. Please verify network connection or try again.')
      toast.error('Network error checking tracking')
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Tracking number copied!')
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Please fill in your name, email, and message.')
      return
    }

    setContactSubmitting(true)
    setTimeout(() => {
      setContactSubmitting(false)
      toast.success('Thank you! Your message has been received. Our team will contact you shortly.')
      setContactName('')
      setContactEmail('')
      setContactPhone('')
      setContactMessage('')
    }, 800)
  }

  // Tracking Milestones Resolver
  const trackingMilestones = useMemo(() => {
    if (!trackingData) return []
    const checkpoints = trackingData.checkpoints || []

    const enquiryCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'ENQUIRY_GENERATED')
    const pickupCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'PICKED_UP')
    const createdCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'SHIPMENT_CREATED')
    const transitCp = checkpoints.find(
      (cp: any) =>
        (cp.status || '').toUpperCase() === 'IN_TRANSIT' &&
        (!cp.source || cp.source.includes('AIRLINE') || cp.source.includes('INTERNAL') || cp.source.includes('MAWB'))
    )
    const hubCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'ARRIVED_AT_HUB')
    const carrierCp = checkpoints.find(
      (cp: any) =>
        (cp.status || '').toUpperCase() === 'CARRIER_SCANNED' ||
        (cp.status || '').toUpperCase() === 'OUT_FOR_DELIVERY' ||
        (cp.source || '').includes('CARRIER') ||
        (cp.source || '').includes('TRACKINGMORE')
    )
    const deliveredCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'DELIVERED')

    const dest = trackingData.destination || 'Overseas'
    const displayHawb = trackingData.hawbNumber || trackingData.trackingNumber || 'Consignment'
    const isSelfDrop = trackingData.isSelfDrop || trackingData.pickupRequired === false

    return [
      {
        id: 'ENQUIRY_GENERATED',
        label: 'Enquiry Generated',
        description: 'Shipment enquiry registered with NetPack Logistics',
        timestamp: enquiryCp?.timestamp || trackingData.enquiryCreatedAt,
        icon: <PackageSearch className='h-3.5 w-3.5' />,
      },
      {
        id: 'PICKED_UP',
        label: isSelfDrop ? 'Counter Drop-off (Self Drop)' : 'Cargo Picked Up',
        description: isSelfDrop
          ? 'Consignment dropped off at counter by customer'
          : (pickupCp?.activity || 'Cargo picked up by NetPack courier & received at warehouse'),
        timestamp: pickupCp?.timestamp || trackingData.pickedUpAt,
        icon: <Truck className='h-3.5 w-3.5' />,
      },
      {
        id: 'SHIPMENT_CREATED',
        label: 'Shipment Created',
        description: `HAWB allocated (${displayHawb}) & prepared for overseas routing`,
        timestamp: createdCp?.timestamp || enquiryCp?.timestamp,
        icon: <PackageOpen className='h-3.5 w-3.5' />,
      },
      {
        id: 'IN_TRANSIT',
        label: 'In Transit',
        description: transitCp?.activity || `Air cargo departed Kathmandu (KTM) on scheduled route to ${dest}`,
        timestamp: transitCp?.timestamp || trackingData.departureDate,
        icon: <Plane className='h-3.5 w-3.5' />,
      },
      {
        id: 'ARRIVED_AT_HUB',
        label: 'Arrived at Hub',
        description: hubCp?.activity || `Landed & cleared destination cargo hub terminal`,
        timestamp: hubCp?.timestamp || trackingData.arrivalDate,
        icon: <Warehouse className='h-3.5 w-3.5' />,
      },
      {
        id: 'CARRIER_SCANNED',
        label: 'Carrier Scanned',
        description: carrierCp?.activity || `Scanned by ${trackingData.forwardingCompany || 'express courier'} for final delivery`,
        timestamp: carrierCp?.timestamp,
        icon: <Truck className='h-3.5 w-3.5' />,
      },
      {
        id: 'DELIVERED',
        label: 'Delivered',
        description: deliveredCp?.activity || `Successfully delivered to ${trackingData.receiverName || 'Consignee'}`,
        timestamp: deliveredCp?.timestamp,
        icon: <CheckCircle2 className='h-3.5 w-3.5' />,
      },
    ]
  }, [trackingData])

  const trackingStageIndex = useMemo(() => {
    if (!trackingData || !trackingMilestones.length) return 0
    const s = (trackingData.currentStatus || '').toUpperCase()
    let highest = 0
    trackingMilestones.forEach((stg, i) => {
      if (stg.id === 'CARRIER_SCANNED' && (s.includes('CARRIER') || s.includes('OUT_FOR_DELIVERY'))) highest = i
      else if (stg.id === 'ARRIVED_AT_HUB' && (s.includes('ARRIVED_AT_HUB') || s.includes('HUB'))) highest = i
      else if (stg.id === 'IN_TRANSIT' && s.includes('TRANSIT')) highest = i
      else if (stg.id === 'SHIPMENT_CREATED' && s.includes('SHIPMENT_CREATED')) highest = i
      else if (stg.id === 'PICKED_UP' && (s.includes('PICKED_UP') || s.includes('PICKUP'))) highest = i
      else if (stg.id === 'ENQUIRY_GENERATED' && (s.includes('PENDING') || s.includes('ENQUIRY'))) highest = i
    })
    return highest
  }, [trackingData, trackingMilestones])

  const checkpointsList = trackingData?.checkpoints || []
  const visibleCheckpoints = isCheckpointsExpanded ? checkpointsList : checkpointsList.slice(0, 3)

  return (
    <div className={`min-h-screen ${activeTheme.rootBg} text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased transition-colors duration-500 relative`}>
      {/* ── AMBIENT FESTIVE SEASON PARTICLES & OVERLAY ─────────────────────── */}
      <FestiveAtmosphereBackground theme={effectiveFestiveTheme} />

      {/* ── HEADER NAVIGATION (APPLE FROSTED STYLE) ───────────────────────── */}
      <header className={`${activeTheme.headerBg} sticky top-0 z-50 transition-all duration-300`}>
        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
          <div className='flex items-center justify-between h-16 sm:h-18'>
            {/* Logo with Cultural Festive Adornment */}
            <a href='/' className='flex items-center gap-2 group active:scale-95 transition-transform'>
              <img
                src='/alzlogo.png'
                alt='Netpack Logo'
                className='h-9 sm:h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-xs'
              />
              <FestiveLogoAdornment theme={effectiveFestiveTheme} />
            </a>

            {/* Desktop Navigation Links */}
            <nav className='hidden md:flex items-center gap-7 text-sm font-medium'>
              <a
                href='#services'
                className='text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors relative group py-1'
              >
                Services
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full rounded-full' />
              </a>
              <a
                href='#tracking'
                className='text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors relative group py-1'
              >
                Track Package
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full rounded-full' />
              </a>
              <a
                href='#about'
                className='text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors relative group py-1'
              >
                About
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full rounded-full' />
              </a>
              <a
                href='#contact'
                className='text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors relative group py-1'
              >
                Contact
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full rounded-full' />
              </a>
            </nav>

            {/* Contact Info & Action Buttons */}
            <div className='flex items-center gap-3'>
              <div className='hidden xl:flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400'>
                <a
                  href={`tel:${siteContent.contactPhone}`}
                  className='flex items-center gap-1.5 hover:text-blue-600 transition-colors'
                >
                  <Phone className='h-3.5 w-3.5 text-blue-600' />
                  <span className='font-semibold text-slate-800 dark:text-slate-200 font-mono'>{siteContent.contactPhone}</span>
                </a>
                <a
                  href={`mailto:${siteContent.contactEmail}`}
                  className='flex items-center gap-1.5 hover:text-blue-600 transition-colors'
                >
                  <Mail className='h-3.5 w-3.5 text-blue-600' />
                  <span>{siteContent.contactEmail}</span>
                </a>
              </div>

              {/* Install App Button */}
              <button
                type='button'
                onClick={() => handleInstallClick('customer')}
                className='inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95'
                title='Install Netpack App on Phone / Desktop'
              >
                <Download className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                <span>Install App</span>
              </button>

              {/* Login / Portal Button */}
              {isAuth ? (
                <a
                  href='/dashboard'
                  className='inline-flex items-center gap-1.5 bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all active:scale-95'
                >
                  <span>Portal</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </a>
              ) : (
                <a
                  href='/sign-in'
                  className='inline-flex items-center justify-center bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 sm:px-5 py-1.5 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all active:scale-95'
                >
                  Login
                </a>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type='button'
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors'
              >
                {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A1128] px-4 py-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150'>
            <a
              href='#services'
              onClick={() => setMobileMenuOpen(false)}
              className='block py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600'
            >
              Services
            </a>
            <a
              href='#tracking'
              onClick={() => setMobileMenuOpen(false)}
              className='block py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600'
            >
              Track Package
            </a>
            <a
              href='#about'
              onClick={() => setMobileMenuOpen(false)}
              className='block py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600'
            >
              About Us
            </a>
            <a
              href='#contact'
              onClick={() => setMobileMenuOpen(false)}
              className='block py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600'
            >
              Contact
            </a>
            <div className='pt-2 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2'>
              <button
                type='button'
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleInstallClick('customer')
                }}
                className='inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-sky-400 py-1'
              >
                <Download className='h-4 w-4' />
                <span>Install Mobile App</span>
              </button>
              <a
                href={isAuth ? '/dashboard' : '/sign-in'}
                className='text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600'
              >
                {isAuth ? 'Go to Dashboard' : 'Staff Login'}
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── AUTOMATED LIVE LOGISTICS STATUS TICKER (LINEAR OBSIDIAN STYLE) ─── */}
      <div className='bg-[#050A14] text-slate-300 border-b border-white/[0.08] text-xs py-2 px-3 sm:px-6 overflow-hidden relative shadow-inner'>
        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto flex items-center gap-3'>
          <div className='flex items-center gap-2 shrink-0 font-bold text-sky-400 text-[11px] uppercase tracking-wider bg-[#050A14] pr-2 z-10'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
            </span>
            <span className='hidden sm:inline'>Live Dispatch:</span>
            <span className='sm:hidden'>Live:</span>
          </div>

          <div className='overflow-hidden flex-1 relative'>
            <div className='animate-marquee flex items-center gap-8 whitespace-nowrap text-xs text-slate-300 font-medium'>
              <div className='flex items-center gap-8 shrink-0'>
                {siteContent.tickerItems.map((item, idx) => (
                  <React.Fragment key={`loop1-${idx}`}>
                    <div className='flex items-center gap-2'>
                      {idx % 4 === 0 && <Plane className='h-3.5 w-3.5 text-sky-400 shrink-0' />}
                      {idx % 4 === 1 && <Truck className='h-3.5 w-3.5 text-emerald-400 shrink-0' />}
                      {idx % 4 === 2 && <Shield className='h-3.5 w-3.5 text-amber-400 shrink-0' />}
                      {idx % 4 === 3 && <Globe className='h-3.5 w-3.5 text-blue-400 shrink-0' />}
                      <span>{item}</span>
                    </div>
                    <span className='text-slate-700 font-mono'>&bull;</span>
                  </React.Fragment>
                ))}
              </div>

              <div className='flex items-center gap-8 shrink-0' aria-hidden='true'>
                {siteContent.tickerItems.map((item, idx) => (
                  <React.Fragment key={`loop2-${idx}`}>
                    <div className='flex items-center gap-2'>
                      {idx % 4 === 0 && <Plane className='h-3.5 w-3.5 text-sky-400 shrink-0' />}
                      {idx % 4 === 1 && <Truck className='h-3.5 w-3.5 text-emerald-400 shrink-0' />}
                      {idx % 4 === 2 && <Shield className='h-3.5 w-3.5 text-amber-400 shrink-0' />}
                      {idx % 4 === 3 && <Globe className='h-3.5 w-3.5 text-blue-400 shrink-0' />}
                      <span>{item}</span>
                    </div>
                    <span className='text-slate-700 font-mono'>&bull;</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION: CLEAN APPLE TYPOGRAPHY & REFINE UI ──────────────── */}
      <section className='relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 dark:border-white/[0.08] overflow-hidden'>
        {/* Ambient Thematic Radial Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[480px] ${activeTheme.heroGlow} pointer-events-none -z-10 transition-all duration-500`} />

        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10'>
          <div className='grid lg:grid-cols-2 gap-12 lg:gap-14 items-center'>
            {/* Left Column Copy */}
            <div className='space-y-7 text-left'>
              <div className='space-y-4'>
                {effectiveFestiveTheme && effectiveFestiveTheme !== 'none' ? (
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${activeTheme.badgeBg} border ${activeTheme.badgeBorder} ${activeTheme.badgeText} text-xs font-semibold tracking-wide shadow-xs`}>
                    <span className='text-sm'>{activeTheme.emoji}</span>
                    <span>{siteContent.festiveGreeting?.trim() || activeTheme.defaultGreeting}</span>
                  </div>
                ) : (
                  <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/[0.05] border border-blue-200/80 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold uppercase tracking-wider shadow-xs'>
                    <Sparkles className='h-3.5 w-3.5 text-blue-600 dark:text-sky-400' />
                    <span>{siteContent.heroBadge}</span>
                  </div>
                )}
                <h1
                  style={{ fontFamily: 'Jost, sans-serif' }}
                  className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.12] tracking-tight'
                >
                  {siteContent.heroTitle}
                </h1>
                <p className='text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl'>
                  {siteContent.heroSubtitle}
                </p>
              </div>

              {/* Call-to-action buttons */}
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5'>
                <a
                  href='#tracking'
                  className='inline-flex items-center justify-center gap-2 bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-7 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]'
                >
                  <span>Track Your Package</span>
                  <ArrowRight className='h-4 w-4' />
                </a>
                <a
                  href='#contact'
                  className='inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-white/15 bg-white/70 dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 font-semibold text-sm px-7 py-3.5 rounded-2xl transition-all active:scale-[0.98]'
                >
                  Get Quote
                </a>
              </div>

              {/* Netpack Mobile App Card */}
              <div className={`rounded-3xl ${activeTheme.cardGlassBg} p-4 sm:p-5 transition-all duration-300`}>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                  <div className='flex items-center gap-3.5'>
                    <img
                      src='/images/netpack-icon-192.png'
                      alt='Netpack'
                      className='h-12 w-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-0.5 shadow-sm shrink-0 object-contain'
                    />
                    <div className='space-y-0.5 text-left'>
                      <div className='flex items-center gap-2'>
                        <span className='text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400'>
                          Mobile App
                        </span>
                        <span className='inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium'>
                          <span className='h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse' />
                          Direct Phone Install
                        </span>
                      </div>
                      <h3 className='text-sm sm:text-base font-bold text-slate-900 dark:text-white'>
                        Download Netpack App
                      </h3>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>
                        Track shipments, request pickups, and view scale weights on the go.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 sm:shrink-0'>
                    <button
                      type='button'
                      onClick={() => handleInstallClick('customer')}
                      className='w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 font-semibold text-xs shadow-xs transition-all cursor-pointer'
                    >
                      <Download className='h-4 w-4' />
                      <span>Install App</span>
                    </button>
                    <a
                      href='/pwa'
                      className='hidden sm:inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 px-3.5 py-2.5 font-medium text-xs transition-all'
                    >
                      <span>Open</span>
                      <ArrowRight className='h-3.5 w-3.5' />
                    </a>
                  </div>
                </div>
              </div>

              {/* 6 Grid Feature Highlights */}
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 pt-1'>
                {[
                  { icon: <Clock className='h-4 w-4 text-blue-600 dark:text-sky-400' />, title: 'Same Day', sub: 'Delivery' },
                  { icon: <Shield className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />, title: 'Secure', sub: 'Handling' },
                  { icon: <ArrowRight className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />, title: 'Express', sub: 'Delivery' },
                  { icon: <MapPin className='h-4 w-4 text-rose-600 dark:text-rose-400' />, title: 'Free Pickup', sub: 'Inside Ring Road' },
                  { icon: <Package className='h-4 w-4 text-amber-600 dark:text-amber-400' />, title: '75+ Delivery', sub: 'Locations' },
                  { icon: <Globe className='h-4 w-4 text-sky-600 dark:text-sky-400' />, title: 'Worldwide', sub: 'Delivery' },
                ].map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl ${activeTheme.cardGlassBg} hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}
                  >
                    <div className='p-2 rounded-xl bg-slate-50 dark:bg-white/[0.06] shrink-0'>
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className='font-bold text-xs text-slate-900 dark:text-white leading-tight'>{feat.title}</h4>
                      <p className='text-[11px] text-slate-500 leading-tight'>{feat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Truck Image with Floating Live Pulse Card */}
            <div className='relative group'>
              <img
                src='/professional-courier-delivery-truck-in-kathmandu-n.jpg'
                alt='Netpack Logistic delivery truck in Kathmandu'
                className='w-full h-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 object-cover transition-transform duration-500 group-hover:scale-[1.01]'
              />
              <div className={`absolute -bottom-5 -left-5 ${activeTheme.cardGlassBg} p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float`}>
                <div className='relative flex h-3.5 w-3.5'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                  <span className='relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500' />
                </div>
                <div className='text-left'>
                  <p className='font-bold text-xs text-slate-900 dark:text-white'>Live Tracking</p>
                  <p className='text-[11px] text-slate-500'>Real-time updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TRACKING BOX SECTION (#tracking) ─────────────────────────── */}
      <section
        id='tracking'
        ref={trackingBoxRef}
        className='py-20 sm:py-24 px-4 border-b border-slate-200/80 dark:border-white/[0.08] relative'
      >
        <div className='max-w-5xl xl:max-w-6xl mx-auto space-y-8 text-center'>
          <div className='space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/[0.06] border border-blue-200 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase'>
              <Plane className='h-3.5 w-3.5 text-blue-600 dark:text-sky-400' />
              Live Tracking System
            </span>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              Where is my package?
            </h2>
            <p className='text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed'>
              Enter your tracking ID or HAWB number for real-time shipment updates anywhere in the world.
            </p>
          </div>

          {/* Clean Frosted Tracking Command Box */}
          <div className={`rounded-3xl ${activeTheme.cardGlassBg} p-5 sm:p-7 space-y-4`}>
            <form onSubmit={handleTrack} className='flex flex-col sm:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none' />
                <Input
                  type='text'
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder='Enter tracking ID — e.g. NET-12345 or HAWB number'
                  className='pl-11 h-12 text-sm bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 rounded-2xl focus-visible:ring-blue-500'
                />
              </div>
              <Button
                type='submit'
                disabled={trackingLoading}
                className='h-12 px-8 rounded-2xl font-semibold bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-2 shrink-0 cursor-pointer active:scale-[0.98] transition-all'
              >
                {trackingLoading ? 'Searching...' : 'Track'}
                {!trackingLoading && <ArrowRight className='h-4 w-4' />}
              </Button>
            </form>

            {/* Error feedback */}
            {trackingError && (
              <div className='rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 text-left text-xs text-amber-800 dark:text-amber-200 space-y-1 animate-in fade-in'>
                <p className='font-bold'>{trackingError}</p>
                <p className='text-[11px] text-muted-foreground'>
                  Please double check your consignment number or call our Teku office at{' '}
                  <a href={`tel:${siteContent.contactPhone}`} className='font-semibold underline'>
                    {siteContent.contactPhone}
                  </a>{' '}
                  for assistance.
                </p>
              </div>
            )}

            {/* ── LIVE TRACKING DETAILS RESULT ── */}
            {trackingData && (
              <div className='pt-5 text-left space-y-5 border-t border-slate-100 dark:border-white/[0.08] animate-in fade-in-50 duration-300'>
                {/* Status Hero Card */}
                <div className={`rounded-2xl ${activeTheme.cardGlassBg} p-5 space-y-4`}>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                          Consignment / HAWB:
                        </span>
                        <span className='font-mono font-bold text-sm text-foreground'>
                          {trackingData.hawbNumber || trackingData.trackingNumber}
                        </span>
                        <button
                          type='button'
                          onClick={() => handleCopy(trackingData.hawbNumber || trackingData.trackingNumber)}
                          className='text-slate-400 hover:text-blue-600 transition-colors p-0.5'
                          title='Copy tracking number'
                        >
                          {copied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5' />}
                        </button>
                      </div>
                      <div className='text-xs text-slate-500'>
                        {trackingData.origin || 'Kathmandu, Nepal'} →{' '}
                        <span className='font-semibold text-foreground'>{trackingData.destination || 'Destination'}</span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          (trackingData.currentStatus || '').toUpperCase().includes('DELIVERED')
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {trackingData.currentStatus?.replace(/_/g, ' ') || 'In Transit'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='space-y-1.5'>
                    <div className='relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden'>
                      <div
                        className='h-full bg-blue-600 rounded-full transition-all duration-500 ease-out'
                        style={{ width: `${getProgressPercent(trackingData.currentStatus)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── MILESTONES & LIFECYCLE ── */}
                <div className={`rounded-2xl ${activeTheme.cardGlassBg} p-5 space-y-3`}>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        Milestones &amp; Lifecycle
                      </span>
                      <Badge variant='outline' className='text-[10px] font-bold py-0 h-5'>
                        Stage {trackingStageIndex + 1} of {trackingMilestones.length}:{' '}
                        {trackingMilestones[trackingStageIndex]?.label}
                      </Badge>
                    </div>
                    <button
                      type='button'
                      onClick={() => setIsMilestonesFolded(!isMilestonesFolded)}
                      className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer'
                    >
                      <span>{isMilestonesFolded ? 'Expand Milestones' : 'Fold Milestones'}</span>
                      {isMilestonesFolded ? <ChevronDown className='h-3.5 w-3.5' /> : <ChevronUp className='h-3.5 w-3.5' />}
                    </button>
                  </div>

                  {/* Folded Horizontal Stepper */}
                  {isMilestonesFolded ? (
                    <div className='w-full overflow-x-auto py-3 px-1 scrollbar-none'>
                      <div className='flex items-center justify-between min-w-[560px] sm:min-w-full relative px-2'>
                        <div className='absolute left-6 right-6 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0' />
                        <div
                          className='absolute left-6 top-4 h-0.5 bg-emerald-500 -z-0 transition-all duration-300'
                          style={{
                            width:
                              trackingMilestones.length > 1
                                ? `${Math.min(100, Math.max(0, (trackingStageIndex / (trackingMilestones.length - 1)) * 100))}%`
                                : '0%',
                          }}
                        />

                        {trackingMilestones.map((stg, sIdx) => {
                          const isCompleted =
                            sIdx < trackingStageIndex ||
                            (sIdx === trackingStageIndex && trackingStageIndex === trackingMilestones.length - 1)
                          const isActive = sIdx === trackingStageIndex && trackingStageIndex < trackingMilestones.length - 1

                          return (
                            <div key={stg.id} className='flex flex-col items-center relative z-10 min-w-[62px] text-center'>
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : isActive
                                    ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-200 dark:ring-blue-900 animate-pulse'
                                    : 'bg-muted border border-slate-300 dark:border-slate-700 text-muted-foreground'
                                }`}
                              >
                                {isCompleted ? <Check className='h-4 w-4 stroke-[2.5]' /> : <span className='scale-85'>{stg.icon}</span>}
                              </div>
                              <span
                                className={`text-[10px] mt-1.5 font-semibold text-center whitespace-nowrap leading-none ${
                                  isActive
                                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                                    : isCompleted
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {getShortMilestoneLabel(stg.label)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Expanded Vertical Stepper */
                    <div className='relative pl-6 pt-2 before:absolute before:left-[11px] before:top-3.5 before:bottom-3.5 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800'>
                      {trackingMilestones.map((stg, sIdx) => {
                        const isCompleted =
                          sIdx < trackingStageIndex ||
                          (sIdx === trackingStageIndex && trackingStageIndex === trackingMilestones.length - 1)
                        const isActive = sIdx === trackingStageIndex && trackingStageIndex < trackingMilestones.length - 1

                        return (
                          <div key={stg.id} className='relative pb-4 last:pb-1 group'>
                            <div
                              className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                isCompleted
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : isActive
                                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-950 text-blue-600 ring-2 ring-blue-200 dark:ring-blue-900'
                                  : 'border-slate-300 dark:border-slate-700 bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? <Check className='h-3.5 w-3.5 stroke-[3]' /> : stg.icon}
                            </div>
                            <div className='space-y-0.5 text-left ml-2'>
                              <span
                                className={`text-xs font-bold leading-tight ${
                                  isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isCompleted
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {stg.label}
                              </span>
                              <p className='text-[11px] text-muted-foreground leading-snug'>{stg.description}</p>
                              {stg.timestamp && (
                                <p className='text-[10px] text-slate-400 font-mono'>{formatDateTime(stg.timestamp)}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── CHECKPOINTS TIMELINE ── */}
                {checkpointsList.length > 0 && (
                  <div className={`rounded-2xl ${activeTheme.cardGlassBg} p-5 space-y-3`}>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        Transit Checkpoints &amp; Scans ({checkpointsList.length})
                      </span>
                    </div>

                    <div className='relative pl-6 pt-1 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800 space-y-3.5'>
                      {visibleCheckpoints.map((cp: any, idx: number) => {
                        const isLatest = idx === 0
                        return (
                          <div key={idx} className='relative pl-2 text-left space-y-0.5'>
                            <div
                              className={`absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border-2 bg-background ${
                                isLatest ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-slate-300 dark:border-slate-600'
                              }`}
                            />
                            <p className='text-xs font-bold text-foreground leading-snug'>{cp.activity}</p>
                            <p className='text-[11px] text-muted-foreground font-mono'>
                              {cp.location || 'Kathmandu, Nepal'} • {formatDateTime(cp.timestamp)}
                            </p>
                          </div>
                        )
                      })}
                    </div>

                    {checkpointsList.length > 3 && (
                      <button
                        type='button'
                        onClick={() => setIsCheckpointsExpanded(!isCheckpointsExpanded)}
                        className='text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors pt-1 cursor-pointer'
                      >
                        {isCheckpointsExpanded ? 'Show less' : `See all ${checkpointsList.length} updates`}
                      </button>
                    )}
                  </div>
                )}

                {/* ── PACKAGE DETAILS ACCORDION ── */}
                {trackingData.packages && trackingData.packages.length > 0 && (
                  <div className={`rounded-2xl ${activeTheme.cardGlassBg} p-5 space-y-3`}>
                    <button
                      type='button'
                      onClick={() => setIsPackageDetailsOpen(!isPackageDetailsOpen)}
                      className='w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer'
                    >
                      <div className='flex items-center gap-1.5'>
                        <Boxes className='h-4 w-4 text-blue-600' />
                        <span>Box Weights, Dimensions &amp; Packing List ({trackingData.packages.length} Boxes)</span>
                      </div>
                      {isPackageDetailsOpen ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                    </button>

                    {isPackageDetailsOpen && (
                      <div className='space-y-3 pt-3 text-xs border-t border-slate-100 dark:border-white/10'>
                        {trackingData.packages.map((pkg: any, pIdx: number) => (
                          <div key={pIdx} className='p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-1.5'>
                            <div className='flex items-center justify-between font-bold'>
                              <span>Box #{pkg.boxNumber || pIdx + 1}</span>
                              <span className='font-mono'>
                                {pkg.actualWeight ? `${pkg.actualWeight} kg` : 'Weight pending'}
                              </span>
                            </div>
                            <p className='text-muted-foreground text-[11px] font-mono'>
                              Dimensions: {pkg.length || '-'} × {pkg.width || '-'} × {pkg.height || '-'} cm (Vol: {pkg.volumetricWeight || '-'} kg)
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SPECIALIZED SERVICES SECTION (#services) ───────────────────────── */}
      <section id='services' className='py-20 sm:py-24 border-b border-gray-200 dark:border-slate-800 relative'>
        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
          <div className='text-center mb-16 space-y-3'>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              Our <span className='text-blue-600'>Specialized Services</span>
            </h2>
            <p className='text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed'>
              NETPACK LOGISTIC connects Nepal with the world through trusted, specialized logistics solutions for international delivery and imports from China and India.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Card 1: Door-to-Door to Canada, UK, Europe & USA */}
            <div className={`flex flex-col justify-between rounded-3xl ${activeTheme.cardGlassBg} p-8 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-blue-500/40 group text-left`}>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200'>
                    <Plane className='h-6 w-6' />
                  </div>
                  <span className='text-xs font-semibold text-blue-600'>Contact for quote</span>
                </div>
                <h3 className='font-bold text-xl text-slate-900 dark:text-white'>
                  Door-to-Door Delivery to Canada, UK, Europe &amp; USA
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  Specialized, secure, and reliable delivery from Nepal directly to the recipient’s door in Canada, the United Kingdom, Europe, and the United States. Ideal for personal, business, and gift shipments.
                </p>
                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Hassle-free pickup &amp; delivery</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Fast &amp; reliable transit</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Complete real-time tracking</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Affordable &amp; transparent pricing</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Trusted by Nepalese worldwide</span>
                  </li>
                </ul>
              </div>
              <div className='pt-6'>
                <a
                  href='#contact'
                  className='block text-center py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-[0.98]'
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Card 2: Import from China */}
            <div className={`flex flex-col justify-between rounded-3xl ${activeTheme.cardGlassBg} p-8 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-blue-500/40 group text-left`}>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200'>
                    <Package className='h-6 w-6' />
                  </div>
                  <span className='text-xs font-semibold text-blue-600'>Contact for quote</span>
                </div>
                <h3 className='font-bold text-xl text-slate-900 dark:text-white'>
                  Import from China – Cargo, Courier &amp; Container Solutions
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  Comprehensive import solutions from China to Nepal, including container shipping (FCL &amp; LCL), air cargo, and courier services for all shipment sizes.
                </p>
                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Container shipping (FCL &amp; LCL)</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Air cargo services</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Courier import services</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>End-to-end service &amp; customs support</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Transparent pricing</span>
                  </li>
                </ul>
              </div>
              <div className='pt-6'>
                <a
                  href='#contact'
                  className='block text-center py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-[0.98]'
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Card 3: Import from India */}
            <div className={`flex flex-col justify-between rounded-3xl ${activeTheme.cardGlassBg} p-8 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-blue-500/40 group text-left`}>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200'>
                    <Truck className='h-6 w-6' />
                  </div>
                  <span className='text-xs font-semibold text-blue-600'>Contact for quote</span>
                </div>
                <h3 className='font-bold text-xl text-slate-900 dark:text-white'>
                  Import from India – Air, Train &amp; Truck Solutions
                </h3>
                <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  Specialized import services from India to Nepal via air, train, or truck. Flexible, fast, and cost-effective for all types of commercial and personal goods.
                </p>
                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Air, train &amp; truck import options</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Seamless cross-border handling</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>End-to-end delivery</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Reliable partner network</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Transparent &amp; competitive pricing</span>
                  </li>
                </ul>
              </div>
              <div className='pt-6'>
                <a
                  href='#contact'
                  className='block text-center py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-[0.98]'
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          <div className={`mt-16 rounded-3xl p-8 lg:p-12 ${activeTheme.cardGlassBg}`}>
            <div className='grid md:grid-cols-3 gap-8 items-center text-center'>
              <div className='space-y-1'>
                <div className='text-4xl lg:text-5xl font-extrabold text-blue-600 dark:text-sky-400 font-mono'>5000+</div>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider'>
                  Packages Delivered
                </p>
              </div>
              <div className='space-y-1'>
                <div className='text-4xl lg:text-5xl font-extrabold text-blue-600 dark:text-sky-400 font-mono'>99.8%</div>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider'>
                  On-Time Delivery
                </p>
              </div>
              <div className='space-y-1'>
                <div className='text-4xl lg:text-5xl font-extrabold text-blue-600 dark:text-sky-400 font-mono'>24/7</div>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider'>
                  Customer Support
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION (#about) ─────────────────────────────────────────── */}
      <section id='about' className='py-20 sm:py-24 border-b border-gray-200 dark:border-slate-800 relative'>
        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
          <div className='text-center mb-16 space-y-3'>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              About <span className='text-blue-600'>Netpack Logistic</span>
            </h2>
            <p className='text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed'>
              Founded in 2009, Netpack Logistic has been the trusted logistics partner for businesses and individuals across Nepal, delivering excellence with every package from our Teku headquarters.
            </p>
          </div>

          <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 text-left'>
            <div className='space-y-6'>
              <div>
                <span className='inline-flex items-center px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4'>
                  Our Story
                </span>
                <h3 className='text-2xl font-bold text-slate-900 dark:text-white mb-3'>
                  Building Trust Through Reliable Service
                </h3>
                <p className='text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-sm'>
                  What started as a small courier service in Teku, Kathmandu has grown into Nepal&apos;s most trusted logistics company. We understand the importance of every package, whether it&apos;s a business document or a precious gift for your loved ones.
                </p>
                <p className='text-slate-600 dark:text-slate-300 leading-relaxed text-sm'>
                  Our commitment to punctuality, security, and customer satisfaction has made us the preferred choice for thousands of customers across the Kathmandu Valley and beyond.
                </p>
              </div>

              <div className='space-y-4 pt-2'>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0' />
                  <div>
                    <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Mission</h4>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      To provide fast, reliable, and secure courier services that connect people and businesses across Nepal.
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0' />
                  <div>
                    <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Vision</h4>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      To be Nepal&apos;s leading logistics company, setting the standard for excellence in delivery services.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Office photo with floating 15+ years badge */}
            <div className='relative'>
              <img
                src='/modern-courier-office-in-kathmandu-with-nepali-sta.jpg'
                alt='Netpack Logistic office'
                className='w-full h-auto rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 object-cover'
              />
              <div className={`absolute -bottom-5 -right-5 ${activeTheme.cardGlassBg} p-5 rounded-2xl shadow-xl animate-float`}>
                <div className='text-center'>
                  <div className='text-3xl font-extrabold text-blue-600 dark:text-sky-400'>15+</div>
                  <div className='text-xs font-semibold text-slate-500'>Years Serving Nepal</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className='grid md:grid-cols-3 gap-6 text-center'>
            <div className={`p-6 rounded-2xl ${activeTheme.cardGlassBg} hover:-translate-y-1 transition-transform duration-200`}>
              <div className='text-3xl font-extrabold text-blue-600 dark:text-sky-400 mb-1 font-mono'>15+</div>
              <div className='text-xs font-semibold text-slate-500'>Years of Service</div>
            </div>
            <div className={`p-6 rounded-2xl ${activeTheme.cardGlassBg} hover:-translate-y-1 transition-transform duration-200`}>
              <div className='text-3xl font-extrabold text-blue-600 dark:text-sky-400 mb-1 font-mono'>75+</div>
              <div className='text-xs font-semibold text-slate-500'>Delivery Locations</div>
            </div>
            <div className={`p-6 rounded-2xl ${activeTheme.cardGlassBg} hover:-translate-y-1 transition-transform duration-200`}>
              <div className='text-3xl font-extrabold text-blue-600 dark:text-sky-400 mb-1 font-mono'>99.8%</div>
              <div className='text-xs font-semibold text-slate-500'>On-Time Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION (#contact) ─────────────────────────────────────── */}
      <section id='contact' className='py-20 sm:py-24 border-b border-gray-200 dark:border-slate-800 relative'>
        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
          <div className='text-center mb-16 space-y-3'>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              Get In <span className='text-blue-600'>Touch</span>
            </h2>
            <p className='text-base lg:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed'>
              Ready to ship with us? Contact our team for quotes, support, or any questions about our services.
            </p>
          </div>

          <div className='grid lg:grid-cols-3 gap-10 text-left'>
            {/* Contact details */}
            <div className={`space-y-6 rounded-3xl ${activeTheme.cardGlassBg} p-6 sm:p-8`}>
              <h3 className='text-xl font-bold text-slate-900 dark:text-white'>Contact Information</h3>
              <div className='space-y-5'>
                <div className='flex items-start gap-4'>
                  <div className='p-2.5 rounded-xl bg-blue-50 dark:bg-white/[0.06] text-blue-600 dark:text-sky-400 shrink-0'>
                    <MapPin className='h-5 w-5' />
                  </div>
                  <div>
                    <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Main Office</h4>
                    <p className='text-xs text-slate-500 leading-relaxed whitespace-pre-line'>
                      {siteContent.contactAddress}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='p-2.5 rounded-xl bg-blue-50 dark:bg-white/[0.06] text-blue-600 dark:text-sky-400 shrink-0'>
                    <Phone className='h-5 w-5' />
                  </div>
                  <div>
                    <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Phone</h4>
                    <a href={`tel:${siteContent.contactPhone}`} className='text-xs text-slate-500 hover:text-blue-600 transition-colors font-mono'>
                      {siteContent.contactPhone}
                    </a>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='p-2.5 rounded-xl bg-blue-50 dark:bg-white/[0.06] text-blue-600 dark:text-sky-400 shrink-0'>
                    <Mail className='h-5 w-5' />
                  </div>
                  <div>
                    <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Email</h4>
                    <a href={`mailto:${siteContent.contactEmail}`} className='text-xs text-slate-500 hover:text-blue-600 transition-colors'>
                      {siteContent.contactEmail}
                    </a>
                  </div>
                </div>

                <div className='flex items-start gap-4'>
                  <div className='p-2.5 rounded-xl bg-blue-50 dark:bg-white/[0.06] text-blue-600 dark:text-sky-400 shrink-0'>
                    <Clock className='h-5 w-5' />
                  </div>
                  <div>
                    <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Business Hours</h4>
                    <p className='text-xs text-slate-500'>{siteContent.businessHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message form */}
            <div className='lg:col-span-2'>
              <div className={`rounded-3xl ${activeTheme.cardGlassBg} p-6 sm:p-8 shadow-xs`}>
                <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-1'>Send us a Message</h3>
                <p className='text-xs text-slate-500 mb-6'>Fill out the form below and we&apos;ll get back to you within 24 hours.</p>

                <form onSubmit={handleContactSubmit} className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Full Name *</label>
                      <Input
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder='Your full name'
                        className='text-xs h-10 rounded-xl'
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Email Address *</label>
                      <Input
                        type='email'
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder='your.email@example.com'
                        className='text-xs h-10 rounded-xl'
                      />
                    </div>
                  </div>

                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Phone Number</label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder='+977-9841234567'
                        className='text-xs h-10 rounded-xl'
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Service Interest</label>
                      <select
                        value={contactService}
                        onChange={(e) => setContactService(e.target.value)}
                        className='w-full h-10 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 outline-none'
                      >
                        <option value='Door-to-Door Delivery'>Door-to-Door Delivery to Canada/UK/USA</option>
                        <option value='Import from China'>Import from China (Cargo / Courier / Container)</option>
                        <option value='Import from India'>Import from India (Air / Train / Truck)</option>
                        <option value='General Courier / Air Freight'>General Courier / Air Freight</option>
                      </select>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Message *</label>
                    <textarea
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                      placeholder='Tell us about your shipping needs or ask any questions...'
                      className='w-full rounded-xl border border-input bg-background p-3 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 outline-none'
                    />
                  </div>

                  <Button
                    type='submit'
                    disabled={contactSubmitting}
                    className='w-full h-11 font-semibold bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 cursor-pointer active:scale-[0.98] transition-all'
                  >
                    {contactSubmitting ? 'Sending...' : 'Send Message'}
                    <Send className='h-4 w-4' />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className={`mt-16 rounded-3xl overflow-hidden ${activeTheme.cardGlassBg}`}>
            <div className='p-4 border-b border-border/70 flex items-center justify-between'>
              <div>
                <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Find Us on the Map</h4>
                <p className='text-xs text-slate-500'>Visit our main office in Teku, Kathmandu</p>
              </div>
              <a
                href='https://maps.google.com/?q=Netpack+Logistic+Teku+Kathmandu'
                target='_blank'
                rel='noreferrer'
                className='text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1'
              >
                Open in Maps
                <ExternalLink className='h-3 w-3' />
              </a>
            </div>
            <div className='h-72 w-full'>
              <iframe
                title='Netpack Logistic Office Map'
                src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.6140887497454!2d85.3014569758853!3d27.698319976187626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1850b0717661%3A0x64d66ee62c5edb4!2sNetpack%20Logistic!5e0!3m2!1sen!2sus!4v1774932442612!5m2!1sen!2sus'
                width='100%'
                height='100%'
                style={{ border: 0 }}
                allowFullScreen
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── NETPACK RIDER DISPATCH & APP SECTION ───────────────────────────── */}
      <section id='rider-dispatch' className='py-16 bg-[#050A14] text-white relative overflow-hidden border-t border-slate-800'>
        <div className='absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none' />
        <div className='absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none' />

        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10'>
          <div className='max-w-6xl xl:max-w-[1360px] mx-auto rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#0A1128] p-6 md:p-10 shadow-2xl'>
            <div className='grid lg:grid-cols-12 gap-8 items-center'>
              <div className='lg:col-span-8 space-y-4 text-left'>
                <div className='flex items-center gap-3.5'>
                  <img
                    src='/images/netpack-rider-icon-192.png'
                    alt='Netpack Rider App'
                    className='h-16 w-16 rounded-2xl border border-slate-700 bg-white p-1 shadow-lg shrink-0 object-contain'
                  />
                  <div>
                    <div className='inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider mb-1'>
                      <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
                      Field Operations Only
                    </div>
                    <h3 className='text-2xl md:text-3xl font-extrabold text-white tracking-tight'>
                      Netpack Rider App
                    </h3>
                  </div>
                </div>

                <p className='text-slate-300 text-sm md:text-base leading-relaxed'>
                  Are you a Netpack delivery executive or field pickup rider? Launch the dedicated Rider App for instant audio pickup alerts, live route navigation, digital Bluetooth scale sync, and instant customer signature capture.
                </p>

                <div className='grid sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300'>
                  <div className='flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-white/5'>
                    <Truck className='h-4 w-4 text-sky-400 shrink-0' />
                    <span>Instant Audio Dispatch</span>
                  </div>
                  <div className='flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-white/5'>
                    <MapPin className='h-4 w-4 text-emerald-400 shrink-0' />
                    <span>Turn-by-Turn GPS</span>
                  </div>
                  <div className='flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-white/5'>
                    <Smartphone className='h-4 w-4 text-blue-400 shrink-0' />
                    <span>Scale Weight Sync</span>
                  </div>
                </div>
              </div>

              <div className='lg:col-span-4 flex flex-col gap-3.5'>
                <button
                  type='button'
                  onClick={() => handleInstallClick('rider')}
                  className='inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer'
                >
                  <Download className='h-4 w-4' />
                  <span>Install Rider App</span>
                </button>

                <p className='text-[11px] text-slate-400 text-center'>
                  Works offline &bull; Dedicated phone app for field executives
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className='bg-[#050A14] text-slate-400 text-xs py-14 mt-auto border-t border-white/[0.08]'>
        <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12'>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <img src='/alzlogo.png' alt='Netpack Logo' className='h-9 w-auto brightness-110' />
                <FestiveLogoAdornment theme={effectiveFestiveTheme} />
              </div>
              <p className='leading-relaxed text-slate-400'>
                Your trusted logistics partner in Nepal, delivering excellence with every package since 2009.
              </p>
              <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold w-fit'>
                <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                <span>All Cargo Systems Operational</span>
              </div>
              <div className='flex gap-4 pt-1 text-slate-400'>
                <a href='#' className='hover:text-blue-400 transition-colors' aria-label='Facebook'>
                  <Facebook className='h-4 w-4' />
                </a>
                <a href='#' className='hover:text-blue-400 transition-colors' aria-label='Twitter'>
                  <Twitter className='h-4 w-4' />
                </a>
                <a href='#' className='hover:text-blue-400 transition-colors' aria-label='Instagram'>
                  <Instagram className='h-4 w-4' />
                </a>
                <a href='#' className='hover:text-blue-400 transition-colors' aria-label='LinkedIn'>
                  <Linkedin className='h-4 w-4' />
                </a>
              </div>
            </div>

            <div>
              <h4 className='font-bold text-white mb-3 text-sm'>Services</h4>
              <ul className='space-y-2.5'>
                <li><a href='#services' className='hover:text-white transition-colors'>Express Delivery</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Door-to-Door Canada / UK / USA</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Import from China (Cargo / FCL)</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Import from India</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Air Cargo &amp; Customs Clearance</a></li>
              </ul>
            </div>

            <div>
              <h4 className='font-bold text-white mb-3 text-sm'>Quick Links</h4>
              <ul className='space-y-2.5'>
                <li><a href='#tracking' className='hover:text-white transition-colors'>Track Package</a></li>
                <li><a href='#about' className='hover:text-white transition-colors'>About Us</a></li>
                <li><a href='#contact' className='hover:text-white transition-colors'>Contact</a></li>
                <li><a href='/pwa' className='hover:text-white transition-colors'>Customer App</a></li>
                <li>
                  <button
                    type='button'
                    onClick={() => handleInstallClick('rider')}
                    className='hover:text-white transition-colors text-left text-xs cursor-pointer'
                  >
                    Install Rider App
                  </button>
                </li>
                <li><a href='/sign-in' className='hover:text-white transition-colors'>Staff Portal Login</a></li>
              </ul>
            </div>

            <div>
              <h4 className='font-bold text-white mb-3 text-sm'>Contact Info</h4>
              <div className='space-y-3'>
                <p className='flex items-start gap-2.5'>
                  <MapPin className='h-4 w-4 text-blue-400 shrink-0 mt-0.5' />
                  <span>{siteContent.contactAddress}</span>
                </p>
                <p className='flex items-center gap-2.5'>
                  <Phone className='h-4 w-4 text-blue-400 shrink-0' />
                  <a href={`tel:${siteContent.contactPhone}`} className='hover:text-white transition-colors font-mono'>
                    {siteContent.contactPhone}
                  </a>
                </p>
                <p className='flex items-center gap-2.5'>
                  <Mail className='h-4 w-4 text-blue-400 shrink-0' />
                  <a href={`mailto:${siteContent.contactEmail}`} className='hover:text-white transition-colors'>
                    {siteContent.contactEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className='border-t border-white/[0.08] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500'>
            <p>© {new Date().getFullYear()} Netpack Logistic. All rights reserved. Teku, Kathmandu, Nepal.</p>
            <div className='flex gap-6'>
              <a href='/terms-and-policies' className='hover:text-slate-300 transition-colors'>Privacy Policy</a>
              <a href='/terms-and-policies' className='hover:text-slate-300 transition-colors'>Terms of Service</a>
              <a href='/terms-and-policies' className='hover:text-slate-300 transition-colors'>Policies</a>
            </div>
          </div>
        </div>
      </footer>

      <InstallGuideModal
        open={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        isIos={isIos}
        isInAppBrowser={isInAppBrowser}
      />
    </div>
  )
}
