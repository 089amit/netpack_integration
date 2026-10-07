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
  Calculator,
  Radio,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { isAuthenticated } from '@/lib/auth'
import { SERVER_URL } from '@/constants/endpoint'

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

// ─── PWA Installation Guide Modal (Apple & Android) ──────────────────────────

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
              <p className='text-xs text-muted-foreground'>Direct home screen installation</p>
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
                <span>You are browsing inside an In-App Browser</span>
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
          className='w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/20'
        >
          Got it
        </button>
      </div>
    </div>
  )
}

// ─── Destination Rate Estimator Data ─────────────────────────────────────────

const RATE_DESTINATIONS = [
  { country: 'United Arab Emirates (Dubai)', code: 'AE', flag: '🇦🇪', days: '2–3 Days', basePerKg: 1250, minCharge: 2200, freq: 'Daily Direct Flight' },
  { country: 'United Kingdom (London)', code: 'GB', flag: '🇬🇧', days: '3–5 Days', basePerKg: 1650, minCharge: 3100, freq: 'Daily Connection' },
  { country: 'United States (USA)', code: 'US', flag: '🇺🇸', days: '4–6 Days', basePerKg: 1950, minCharge: 3800, freq: 'Scheduled Departures' },
  { country: 'Canada (Toronto/Vancouver)', code: 'CA', flag: '🇨🇦', days: '4–6 Days', basePerKg: 2100, minCharge: 4100, freq: 'Scheduled Departures' },
  { country: 'Australia (Sydney/Melbourne)', code: 'AU', flag: '🇦🇺', days: '4–6 Days', basePerKg: 2250, minCharge: 4400, freq: 'Direct Air Freight' },
  { country: 'Japan (Tokyo/Osaka)', code: 'JP', flag: '🇯🇵', days: '3–5 Days', basePerKg: 1850, minCharge: 3500, freq: 'Air Cargo Express' },
  { country: 'India (Delhi/Mumbai)', code: 'IN', flag: '🇮🇳', days: '2–4 Days', basePerKg: 850, minCharge: 1500, freq: 'Daily Air & Cross-Border' },
  { country: 'European Union (Germany/France)', code: 'EU', flag: '🇪🇺', days: '3–5 Days', basePerKg: 1750, minCharge: 3300, freq: 'Daily Air Route' },
]

const CARGO_CATEGORIES = [
  { id: 'express', label: 'Express Document', mult: 1.0, desc: 'Passports, legal papers, certified certificates' },
  { id: 'parcel', label: 'Parcel / Personal Gift', mult: 1.15, desc: 'Clothing, gifts, handmade items & foodstuffs' },
  { id: 'commercial', label: 'Commercial Cargo', mult: 0.95, desc: 'Export garments, handicrafts, sample shipments' },
]

// ─── MAIN LANDING PAGE COMPONENT ──────────────────────────────────────────────

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

  // Rate Estimator State
  const [selectedDestIndex, setSelectedDestIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('parcel')
  const [calcWeight, setCalcWeight] = useState(2.5)

  // Operations Cockpit Active Tab
  const [cockpitTab, setCockpitTab] = useState<'radar' | 'dispatch' | 'customs'>('radar')

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
      'Your trusted partner for secure package delivery across Nepal and worldwide air cargo. Precision logistics with real-time tracking, bonded customs handling, and door-to-door dispatch.',
    heroBadge: 'Teku, Kathmandu Headquarters & Air Cargo Terminal',
    contactPhone: '015339942',
    contactEmail: 'admin@netpacklogistic.com',
    contactAddress: 'Teku Road, Ward No. 15, Kathmandu, Nepal',
    businessHours: '10:00 am - 5:00 pm (Sun - Fri)',
    tickerItems: [
      'Air Cargo Route: KTM ➔ DXB (Daily Direct Scheduled Flights)',
      'Kathmandu Valley Pickup: Active (20-30 min rider dispatch)',
      'TIA Cargo Terminal: Customs Green Channel Clearance Active',
      'Door-to-Door Delivery: Canada, UK, USA & Europe Operational',
      'Cross-Border Logistics: China & India Trade Corridors Open',
    ],
  })

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
          }))
        }
      })
      .catch((err) => {
        console.debug('Using default landing page CMS content:', err)
      })
  }, [])

  const trackingBoxRef = useRef<HTMLDivElement>(null)
  const rateBoxRef = useRef<HTMLDivElement>(null)

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

  const handleTrack = async (e?: React.FormEvent, overrideTrackingId?: string) => {
    if (e) e.preventDefault()
    const query = (overrideTrackingId || trackingId).trim()
    if (!query) {
      toast.error('Please enter a tracking or consignment ID.')
      return
    }

    if (overrideTrackingId) {
      setTrackingId(overrideTrackingId)
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

  // Rate Calculation Formula
  const activeDest = RATE_DESTINATIONS[selectedDestIndex] || RATE_DESTINATIONS[0]
  const activeCategoryObj = CARGO_CATEGORIES.find((c) => c.id === selectedCategory) || CARGO_CATEGORIES[0]
  const estimatedCostNPR = useMemo(() => {
    const raw = calcWeight * activeDest.basePerKg * activeCategoryObj.mult
    return Math.round(Math.max(activeDest.minCharge, raw))
  }, [calcWeight, activeDest, activeCategoryObj])

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
        description: 'Shipment registered in Netpack Kathmandu systems',
        timestamp: enquiryCp?.timestamp || trackingData.enquiryCreatedAt,
        icon: <PackageSearch className='h-3.5 w-3.5' />,
      },
      {
        id: 'PICKED_UP',
        label: isSelfDrop ? 'Counter Drop-off' : 'Cargo Picked Up',
        description: isSelfDrop
          ? 'Consignment received at Teku, Kathmandu counter'
          : (pickupCp?.activity || 'Rider picked up package inside Kathmandu Valley'),
        timestamp: pickupCp?.timestamp || trackingData.pickedUpAt,
        icon: <Truck className='h-3.5 w-3.5' />,
      },
      {
        id: 'SHIPMENT_CREATED',
        label: 'Shipment Created',
        description: `HAWB allocated (${displayHawb}) & scheduled for overseas flight`,
        timestamp: createdCp?.timestamp || enquiryCp?.timestamp,
        icon: <PackageOpen className='h-3.5 w-3.5' />,
      },
      {
        id: 'IN_TRANSIT',
        label: 'In Transit',
        description: transitCp?.activity || `Air cargo departed Tribhuvan Intl Airport (KTM) to ${dest}`,
        timestamp: transitCp?.timestamp || trackingData.departureDate,
        icon: <Plane className='h-3.5 w-3.5' />,
      },
      {
        id: 'ARRIVED_AT_HUB',
        label: 'Arrived at Hub',
        description: hubCp?.activity || `Landed & cleared destination international hub`,
        timestamp: hubCp?.timestamp || trackingData.arrivalDate,
        icon: <Warehouse className='h-3.5 w-3.5' />,
      },
      {
        id: 'CARRIER_SCANNED',
        label: 'Carrier Scanned',
        description: carrierCp?.activity || `Handed over to ${trackingData.forwardingCompany || 'express courier'} for final delivery`,
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
    <div className='min-h-screen bg-[#FBFBFD] dark:bg-[#070D18] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden'>
      {/* ── TOP FROSTED FLOATING HEADER (APPLE & LINEAR STYLE) ─────────────── */}
      <header className='sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0A1128]/85 border-b border-slate-200/70 dark:border-white/[0.08] transition-all'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16 sm:h-18'>
            {/* Netpack Logo with Authentic Brand Touch */}
            <a href='/' className='flex items-center gap-3 group transition-transform active:scale-95'>
              <img
                src='/alzlogo.png'
                alt='Netpack Logistics Logo'
                className='h-9 sm:h-10 w-auto object-contain transition-all duration-300 group-hover:brightness-110 drop-shadow-xs'
              />
            </a>

            {/* Desktop Navigation Links */}
            <nav className='hidden md:flex items-center gap-1 lg:gap-2'>
              {[
                { label: 'Tracking', href: '#tracking' },
                { label: 'Rate Calculator', href: '#rate-calculator' },
                { label: 'Services', href: '#services' },
                { label: 'Operations', href: '#operations' },
                { label: 'About', href: '#about' },
                { label: 'Contact', href: '#contact' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className='px-3.5 py-1.5 rounded-full text-xs lg:text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-all'
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Header Right Actions */}
            <div className='flex items-center gap-2.5 sm:gap-3'>
              {/* Hotline Quick Pill (Desktop) */}
              <a
                href={`tel:${siteContent.contactPhone}`}
                className='hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-500/40 transition-colors'
              >
                <Phone className='h-3 w-3 text-blue-600 dark:text-sky-400' />
                <span className='font-mono font-semibold'>{siteContent.contactPhone}</span>
              </a>

              {/* Install PWA Button */}
              <button
                type='button'
                onClick={() => handleInstallClick('customer')}
                className='inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 hover:bg-blue-100/80 dark:border-blue-900/60 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95'
                title='Install Netpack App on Phone or Desktop'
              >
                <Download className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                <span className='hidden sm:inline'>Install</span> App
              </button>

              {/* Login / Portal Button (Apple Specular Pill) */}
              {isAuth ? (
                <a
                  href='/dashboard'
                  className='inline-flex items-center gap-1.5 bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 sm:py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all active:scale-95'
                >
                  <span>Portal</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </a>
              ) : (
                <a
                  href='/sign-in'
                  className='inline-flex items-center justify-center bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-all active:scale-95'
                >
                  Login
                </a>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type='button'
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='md:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors'
                aria-label='Toggle navigation menu'
              >
                {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Animated Drawer Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0A1128]/95 backdrop-blur-xl px-4 py-4 space-y-2.5 animate-in slide-in-from-top-3 duration-200'>
            {[
              { label: 'Consignment Tracking', href: '#tracking' },
              { label: 'Instant Rate Calculator', href: '#rate-calculator' },
              { label: 'Specialized Services', href: '#services' },
              { label: 'Operations & Air Cargo', href: '#operations' },
              { label: 'About Netpack Logistics', href: '#about' },
              { label: 'Contact Teku Office', href: '#contact' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className='block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/[0.06] hover:text-blue-600 transition-all'
              >
                {item.label}
              </a>
            ))}

            <div className='pt-3 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2'>
              <button
                type='button'
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleInstallClick('customer')
                }}
                className='flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/80 dark:border-blue-900/60'
              >
                <Download className='h-4 w-4' />
                <span>Install Mobile PWA App</span>
              </button>
              <a
                href={isAuth ? '/dashboard' : '/sign-in'}
                className='flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0D1B2A] text-white font-semibold text-xs shadow-md'
              >
                <span>{isAuth ? 'Go to Operations Dashboard' : 'Staff / Customer Login'}</span>
                <ArrowRight className='h-3.5 w-3.5' />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── LIVE LOGISTICS DISPATCH MARQUEE (LINEAR OBSIDIAN STYLE) ─────────── */}
      <div className='bg-[#050A14] text-slate-300 border-b border-white/[0.08] text-xs py-2 px-3 sm:px-6 overflow-hidden relative shadow-inner'>
        <div className='max-w-7xl mx-auto flex items-center gap-3'>
          <div className='flex items-center gap-2 shrink-0 font-bold text-sky-400 text-[11px] uppercase tracking-wider bg-[#050A14] pr-3 z-10'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
            </span>
            <span>Live Dispatch</span>
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

      {/* ── HERO SECTION: APPLE HEADLINE & LINEAR COCKPIT ──────────────────── */}
      <section className='relative pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 overflow-hidden border-b border-slate-200/80 dark:border-white/[0.08]'>
        {/* Subtle Ambient Radial Glow */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.14),transparent_70%)] pointer-events-none -z-10' />

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          {/* Hero Top Copy */}
          <div className='text-center max-w-4xl mx-auto space-y-6'>
            {/* Shimmering Badge Pill */}
            <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/80 dark:bg-white/[0.05] border border-blue-200/80 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase shadow-xs'>
              <Sparkles className='h-3.5 w-3.5 text-blue-600 dark:text-sky-400' />
              <span>{siteContent.heroBadge}</span>
            </div>

            {/* Apple Grade Display Headline */}
            <h1
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]'
            >
              Global Logistics.
              <br />
              <span className='bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent'>
                Engineered for Precision.
              </span>
            </h1>

            {/* Subtitle */}
            <p className='text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal'>
              {siteContent.heroSubtitle}
            </p>

            {/* Action Buttons & Quick Triggers */}
            <div className='pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5'>
              <a
                href='#tracking'
                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all'
              >
                <span>Track Consignment</span>
                <ArrowRight className='h-4 w-4' />
              </a>

              <a
                href='#rate-calculator'
                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-white/[0.07] hover:bg-slate-50 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-100 font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-xs transition-all'
              >
                <Calculator className='h-4 w-4 text-blue-600 dark:text-sky-400' />
                <span>Instant Rate Estimator</span>
              </a>

              <button
                type='button'
                onClick={() => handleInstallClick('customer')}
                className='w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium text-xs px-4 py-3.5 rounded-2xl transition-all'
              >
                <Download className='h-3.5 w-3.5' />
                <span>Get Mobile App</span>
              </button>
            </div>
          </div>

          {/* ── INTERACTIVE OPERATIONS COCKPIT (LINEAR & APPLE SIGNATURE) ──── */}
          <div id='operations' className='mt-14 sm:mt-18 max-w-5xl mx-auto'>
            <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0B132B]/85 backdrop-blur-2xl shadow-2xl p-4 sm:p-7 overflow-hidden transition-all'>
              {/* Window Header with macOS Dots & Tabs */}
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.08]'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-3 h-3 rounded-full bg-rose-500/80' />
                    <div className='w-3 h-3 rounded-full bg-amber-500/80' />
                    <div className='w-3 h-3 rounded-full bg-emerald-500/80' />
                  </div>
                  <span className='text-xs font-mono font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider pl-2'>
                    Netpack Control Center &bull; Live Telemetry
                  </span>
                </div>

                {/* Tab Switcher Pills */}
                <div className='flex items-center bg-slate-100 dark:bg-white/[0.06] p-1 rounded-2xl'>
                  <button
                    type='button'
                    onClick={() => setCockpitTab('radar')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      cockpitTab === 'radar'
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Air Cargo Radar
                  </button>
                  <button
                    type='button'
                    onClick={() => setCockpitTab('dispatch')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      cockpitTab === 'dispatch'
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Kathmandu Valley SLA
                  </button>
                  <button
                    type='button'
                    onClick={() => setCockpitTab('customs')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      cockpitTab === 'customs'
                        ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    TIA Customs Bond
                  </button>
                </div>
              </div>

              {/* Tab 1: Global Air Cargo Radar */}
              {cockpitTab === 'radar' && (
                <div className='pt-6 space-y-6 animate-in fade-in duration-300'>
                  <div className='grid lg:grid-cols-12 gap-6 items-center'>
                    <div className='lg:col-span-7 space-y-4 text-left'>
                      <div className='inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold'>
                        <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                        Active International Air Routes
                      </div>
                      <h3 className='text-2xl font-bold text-slate-900 dark:text-white tracking-tight'>
                        Direct Air Cargo Departures from Tribhuvan Airport (KTM)
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
                        Consolidated master airway bills (MAWB) dispatched on daily commercial and freighter flights connecting Kathmandu directly to major global hubs.
                      </p>

                      {/* Route Path Indicator */}
                      <div className='p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/5 space-y-3 font-mono text-xs'>
                        <div className='flex items-center justify-between font-bold text-slate-900 dark:text-white'>
                          <span className='flex items-center gap-1.5'>
                            <MapPin className='h-3.5 w-3.5 text-blue-600' />
                            KTM (Kathmandu)
                          </span>
                          <span className='text-slate-400'>➔</span>
                          <span>DXB (Dubai)</span>
                          <span className='text-slate-400'>➔</span>
                          <span>LHR (London)</span>
                          <span className='text-slate-400'>➔</span>
                          <span>JFK (New York)</span>
                        </div>
                        <div className='w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden'>
                          <div className='bg-blue-600 h-full w-3/4 rounded-full animate-pulse' />
                        </div>
                        <div className='flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400'>
                          <span>Daily Direct Departures</span>
                          <span className='text-emerald-600 dark:text-emerald-400 font-semibold'>Flight Status: On Schedule 🟢</span>
                        </div>
                      </div>
                    </div>

                    <div className='lg:col-span-5 grid grid-cols-2 gap-3.5 text-left'>
                      <div className='p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10'>
                        <Plane className='h-5 w-5 text-blue-600 dark:text-sky-400 mb-2' />
                        <div className='text-xl font-extrabold text-slate-900 dark:text-white'>99.8%</div>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>On-Time Flight Handover</p>
                      </div>
                      <div className='p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10'>
                        <ShieldCheck className='h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2' />
                        <div className='text-xl font-extrabold text-slate-900 dark:text-white'>100%</div>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>IATA Cargo Compliant</p>
                      </div>
                      <div className='p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10'>
                        <Globe className='h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2' />
                        <div className='text-xl font-extrabold text-slate-900 dark:text-white'>150+</div>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>Destination Hubs</p>
                      </div>
                      <div className='p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10'>
                        <Clock className='h-5 w-5 text-amber-600 dark:text-amber-400 mb-2' />
                        <div className='text-xl font-extrabold text-slate-900 dark:text-white'>24/7</div>
                        <p className='text-xs text-slate-500 dark:text-slate-400'>Live Cargo Telemetry</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Kathmandu Valley SLA & Dispatch */}
              {cockpitTab === 'dispatch' && (
                <div className='pt-6 space-y-6 animate-in fade-in duration-300'>
                  <div className='grid lg:grid-cols-12 gap-6 items-center'>
                    <div className='lg:col-span-7 space-y-4 text-left'>
                      <div className='inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold'>
                        <span className='h-2 w-2 rounded-full bg-blue-500 animate-pulse' />
                        Kathmandu, Lalitpur &amp; Bhaktapur Fleet
                      </div>
                      <h3 className='text-2xl font-bold text-slate-900 dark:text-white tracking-tight'>
                        Doorstep Courier Pickup with Digital Bluetooth Scale Sync
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
                        Our certified riders arrive directly at your home, factory, or office with precision scales. Real-time audio alerts dispatch couriers within 20 to 30 minutes inside Ring Road.
                      </p>

                      <div className='grid sm:grid-cols-3 gap-3 pt-1 text-xs'>
                        <div className='p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5'>
                          <span className='font-bold text-slate-900 dark:text-white block'>20–30 Mins</span>
                          <span className='text-slate-500 text-[11px]'>Pickup Dispatch SLA</span>
                        </div>
                        <div className='p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5'>
                          <span className='font-bold text-emerald-600 dark:text-emerald-400 block'>Free Collection</span>
                          <span className='text-slate-500 text-[11px]'>Inside Ring Road</span>
                        </div>
                        <div className='p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5'>
                          <span className='font-bold text-blue-600 dark:text-blue-400 block'>Instant Receipt</span>
                          <span className='text-slate-500 text-[11px]'>Digital Scale Sync</span>
                        </div>
                      </div>
                    </div>

                    <div className='lg:col-span-5 relative'>
                      <img
                        src='/professional-courier-delivery-truck-in-kathmandu-n.jpg'
                        alt='Netpack Logistics delivery vehicle in Kathmandu'
                        className='w-full h-48 sm:h-56 object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg'
                      />
                      <div className='absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center gap-2'>
                        <span className='h-2 w-2 rounded-full bg-emerald-400 animate-ping' />
                        <span>Teku Logistics Hub &bull; Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: TIA Customs & Bonded Freight */}
              {cockpitTab === 'customs' && (
                <div className='pt-6 space-y-6 animate-in fade-in duration-300'>
                  <div className='grid lg:grid-cols-12 gap-6 items-center'>
                    <div className='lg:col-span-7 space-y-4 text-left'>
                      <div className='inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold'>
                        <span className='h-2 w-2 rounded-full bg-amber-500 animate-pulse' />
                        Tribhuvan International Airport Cargo Complex
                      </div>
                      <h3 className='text-2xl font-bold text-slate-900 dark:text-white tracking-tight'>
                        Paperless Airway Bill &amp; Customs Bond Clearance
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
                        Certified customs clearance team stationed directly at the TIA cargo facility. We expedite export inspection, chamber certificates, and HS-code verification for hassle-free overseas transit.
                      </p>

                      <div className='space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300'>
                        <div className='flex items-center gap-2.5'>
                          <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                          <span>Electronic Customs Manifest &amp; Packing List indexing</span>
                        </div>
                        <div className='flex items-center gap-2.5'>
                          <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                          <span>Chamber of Commerce &amp; Handicraft export documentation</span>
                        </div>
                        <div className='flex items-center gap-2.5'>
                          <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                          <span>Tamper-evident security sealing &amp; x-ray scanning clearance</span>
                        </div>
                      </div>
                    </div>

                    <div className='lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 space-y-3 text-left font-mono text-xs'>
                      <div className='flex items-center justify-between text-slate-400'>
                        <span>TIA CARGO GATEWAY</span>
                        <span className='text-emerald-500 font-bold'>VERIFIED</span>
                      </div>
                      <div className='space-y-1.5 pt-1 text-slate-700 dark:text-slate-200'>
                        <div className='flex justify-between'>
                          <span className='text-slate-400'>Clearance Type:</span>
                          <span className='font-bold'>Air Export &amp; Bonded Cargo</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-400'>Inspection Channel:</span>
                          <span className='font-bold text-blue-600 dark:text-sky-400'>Green Priority Fast-Track</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-400'>Handling Depot:</span>
                          <span>Teku Central Consolidation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT TRACKING COMMAND CENTER (#tracking) ───────────────────── */}
      <section
        id='tracking'
        ref={trackingBoxRef}
        className='py-20 sm:py-28 px-4 bg-white dark:bg-[#070D18] border-b border-slate-200/80 dark:border-white/[0.08] relative'
      >
        <div className='max-w-4xl mx-auto space-y-8 text-center'>
          {/* Section Header */}
          <div className='space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/[0.06] border border-blue-200 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase'>
              <Radio className='h-3 w-3 text-blue-600 dark:text-sky-400 animate-pulse' />
              Real-Time Consignment Telemetry
            </span>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              Where is your package?
            </h2>
            <p className='text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed'>
              Enter your Netpack Consignment or HAWB number to monitor live flight progression, customs milestones, and final delivery scans.
            </p>
          </div>

          {/* Linear Spotlight Glowing Command Bar */}
          <div className='p-[1.5px] rounded-3xl bg-gradient-to-r from-blue-500/40 via-sky-400/30 to-indigo-500/40 shadow-xl shadow-blue-500/5'>
            <div className='rounded-[23px] bg-white dark:bg-[#0A1128] p-4 sm:p-6 space-y-4 text-left'>
              <form onSubmit={(e) => handleTrack(e)} className='flex flex-col sm:flex-row gap-3'>
                <div className='relative flex-1'>
                  <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none' />
                  <Input
                    type='text'
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder='Enter Consignment ID (e.g. NET-12345 or HAWB number)...'
                    className='pl-11 h-13 text-sm sm:text-base bg-slate-50/80 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 rounded-2xl focus-visible:ring-blue-500 shadow-inner'
                  />
                  {trackingId && (
                    <button
                      type='button'
                      onClick={() => setTrackingId('')}
                      className='absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1'
                      title='Clear input'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  )}
                </div>

                <Button
                  type='submit'
                  disabled={trackingLoading}
                  className='h-13 px-8 rounded-2xl font-semibold bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 shrink-0 cursor-pointer active:scale-95 transition-all text-sm'
                >
                  {trackingLoading ? 'Scanning...' : 'Track'}
                  {!trackingLoading && <ArrowRight className='h-4 w-4' />}
                </Button>
              </form>

              {/* Sample Quick-Test Tags */}
              <div className='flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500'>
                <span className='font-semibold text-slate-400'>Try samples:</span>
                {['NP-2026-KTM', 'NP-88219', 'HAWB-9042'].map((tag) => (
                  <button
                    key={tag}
                    type='button'
                    onClick={() => handleTrack(undefined, tag)}
                    className='px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer font-mono text-[11px]'
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Error feedback */}
              {trackingError && (
                <div className='rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 text-xs text-amber-800 dark:text-amber-200 space-y-1 animate-in fade-in'>
                  <p className='font-bold'>{trackingError}</p>
                  <p className='text-[11px] text-muted-foreground'>
                    Please double-check your consignment code or call our Teku headquarters at{' '}
                    <a href={`tel:${siteContent.contactPhone}`} className='font-semibold underline'>
                      {siteContent.contactPhone}
                    </a>{' '}
                    for manual rider dispatch verification.
                  </p>
                </div>
              )}

              {/* ── LIVE TRACKING DETAILS RESULT (APPLE-GRADE BOARD) ── */}
              {trackingData && (
                <div className='pt-6 space-y-6 border-t border-slate-100 dark:border-white/[0.08] animate-in fade-in-50 duration-300'>
                  {/* Status Hero Card */}
                  <div className='rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-5 sm:p-6 space-y-4'>
                    <div className='flex flex-wrap items-center justify-between gap-4'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                            Consignment / HAWB:
                          </span>
                          <span className='font-mono font-bold text-base text-slate-900 dark:text-white'>
                            {trackingData.hawbNumber || trackingData.trackingNumber}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleCopy(trackingData.hawbNumber || trackingData.trackingNumber)}
                            className='p-1 text-slate-400 hover:text-blue-600 transition-colors'
                            title='Copy tracking number'
                          >
                            {copied ? <Check className='h-4 w-4 text-emerald-600' /> : <Copy className='h-4 w-4' />}
                          </button>
                        </div>
                        <div className='text-xs text-slate-500'>
                          {trackingData.origin || 'Kathmandu, Nepal'} ➔{' '}
                          <span className='font-semibold text-slate-800 dark:text-slate-200'>
                            {trackingData.destination || 'Destination'}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-full ${
                            (trackingData.currentStatus || '').toUpperCase().includes('DELIVERED')
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {trackingData.currentStatus?.replace(/_/g, ' ') || 'In Transit'}
                        </Badge>
                      </div>
                    </div>

                    {/* Radiant Progress Bar */}
                    <div className='space-y-1.5 pt-1'>
                      <div className='relative w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500 ease-out shadow-sm'
                          style={{ width: `${getProgressPercent(trackingData.currentStatus)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── MILESTONES & LIFECYCLE ── */}
                  <div className='rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0A1128] p-5 space-y-4 shadow-xs'>
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
                        className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-sky-400 transition-colors cursor-pointer'
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
                                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-muted-foreground'
                                  }`}
                                >
                                  {isCompleted ? <Check className='h-4 w-4 stroke-[2.5]' /> : <span className='scale-85'>{stg.icon}</span>}
                                </div>
                                <span
                                  className={`text-[10px] mt-2 font-semibold text-center whitespace-nowrap leading-none ${
                                    isActive
                                      ? 'text-blue-600 dark:text-sky-400 font-bold'
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
                            <div key={stg.id} className='relative pb-4 last:pb-1 group text-left'>
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
                              <div className='space-y-0.5 ml-2'>
                                <span
                                  className={`text-xs font-bold leading-tight ${
                                    isActive
                                      ? 'text-blue-600 dark:text-sky-400'
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
                    <div className='rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0A1128] p-5 space-y-3 shadow-xs text-left'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                          Transit Checkpoints &amp; Telemetry Scans ({checkpointsList.length})
                        </span>
                      </div>

                      <div className='relative pl-6 pt-1 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800 space-y-3.5'>
                        {visibleCheckpoints.map((cp: any, idx: number) => {
                          const isLatest = idx === 0
                          return (
                            <div key={idx} className='relative pl-2 text-left space-y-0.5'>
                              <div
                                className={`absolute -left-[19px] top-1.5 h-3 w-3 rounded-full border-2 bg-background ${
                                  isLatest
                                    ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-900'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              />
                              <p className='text-xs font-bold text-foreground leading-snug'>{cp.activity}</p>
                              <p className='text-[11px] text-muted-foreground font-mono'>
                                {cp.location || 'Kathmandu, Nepal'} &bull; {formatDateTime(cp.timestamp)}
                              </p>
                            </div>
                          )
                        })}
                      </div>

                      {checkpointsList.length > 3 && (
                        <button
                          type='button'
                          onClick={() => setIsCheckpointsExpanded(!isCheckpointsExpanded)}
                          className='text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-sky-400 transition-colors pt-1 cursor-pointer'
                        >
                          {isCheckpointsExpanded ? 'Show less' : `See all ${checkpointsList.length} updates`}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── PACKAGE DETAILS ACCORDION ── */}
                  {trackingData.packages && trackingData.packages.length > 0 && (
                    <div className='rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0A1128] p-5 space-y-3 shadow-xs text-left'>
                      <button
                        type='button'
                        onClick={() => setIsPackageDetailsOpen(!isPackageDetailsOpen)}
                        className='w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer'
                      >
                        <div className='flex items-center gap-2'>
                          <Boxes className='h-4 w-4 text-blue-600' />
                          <span>Box Weights, Dimensions &amp; Packing List ({trackingData.packages.length} Boxes)</span>
                        </div>
                        {isPackageDetailsOpen ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                      </button>

                      {isPackageDetailsOpen && (
                        <div className='space-y-3 pt-3 text-xs border-t border-slate-100 dark:border-white/10'>
                          {trackingData.packages.map((pkg: any, pIdx: number) => (
                            <div key={pIdx} className='p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-border/70 space-y-1.5'>
                              <div className='flex items-center justify-between font-bold'>
                                <span>Box #{pkg.boxNumber || pIdx + 1}</span>
                                <span className='font-mono'>
                                  {pkg.actualWeight ? `${pkg.actualWeight} kg` : 'Weight pending'}
                                </span>
                              </div>
                              <p className='text-muted-foreground text-[11px] font-mono'>
                                Dimensions: {pkg.length || '-'} × {pkg.width || '-'} × {pkg.height || '-'} cm (Volumetric: {pkg.volumetricWeight || '-'} kg)
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
        </div>
      </section>

      {/* ── INTERACTIVE RATE & TRANSIT ESTIMATOR (#rate-calculator) ─────────── */}
      <section
        id='rate-calculator'
        ref={rateBoxRef}
        className='py-20 sm:py-28 px-4 bg-[#FBFBFD] dark:bg-[#070D18] border-b border-slate-200/80 dark:border-white/[0.08]'
      >
        <div className='max-w-5xl mx-auto space-y-10'>
          <div className='text-center space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-white/[0.06] border border-blue-200 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase'>
              <Calculator className='h-3.5 w-3.5 text-blue-600 dark:text-sky-400' />
              Instant Air Freight Estimator
            </span>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              Calculate your shipping rate in seconds.
            </h2>
            <p className='text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed'>
              Choose your destination and shipment weight for an instant estimate based on current Kathmandu air cargo tariffs and daily flight schedules.
            </p>
          </div>

          <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A1128] p-6 sm:p-10 shadow-xl'>
            <div className='grid lg:grid-cols-12 gap-8 lg:gap-12'>
              {/* Left Column Configurator */}
              <div className='lg:col-span-7 space-y-6 text-left'>
                {/* 1. Destination Selector */}
                <div className='space-y-2.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    1. Select Destination Country
                  </label>
                  <select
                    value={selectedDestIndex}
                    onChange={(e) => setSelectedDestIndex(Number(e.target.value))}
                    className='w-full h-12 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.05] px-4 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    {RATE_DESTINATIONS.map((d, i) => (
                      <option key={d.code} value={i} className='text-slate-900 dark:bg-slate-900'>
                        {d.flag} {d.country} &bull; {d.days}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Cargo Category */}
                <div className='space-y-2.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                    2. Shipment Category
                  </label>
                  <div className='grid sm:grid-cols-3 gap-2.5'>
                    {CARGO_CATEGORIES.map((cat) => {
                      const isSel = selectedCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type='button'
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className='font-bold text-xs'>{cat.label}</div>
                          <p className='text-[10px] text-muted-foreground mt-1 line-clamp-2'>{cat.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Weight Slider & Input */}
                <div className='space-y-3 pt-2'>
                  <div className='flex items-center justify-between'>
                    <label className='text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400'>
                      3. Chargeable Weight (Actual or Volumetric)
                    </label>
                    <div className='flex items-center gap-1.5 font-mono text-base font-bold text-blue-600 dark:text-sky-400'>
                      <span>{calcWeight.toFixed(1)}</span>
                      <span className='text-xs'>kg</span>
                    </div>
                  </div>

                  <input
                    type='range'
                    min={0.5}
                    max={50}
                    step={0.5}
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value))}
                    className='w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600'
                  />

                  <div className='flex justify-between text-[11px] text-slate-400 font-mono'>
                    <span>0.5 kg (Doc)</span>
                    <span>10 kg (Box)</span>
                    <span>25 kg (Carton)</span>
                    <span>50 kg (Freight)</span>
                  </div>
                </div>
              </div>

              {/* Right Column Calculated Price Board */}
              <div className='lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-left space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3'>
                    <span className='text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
                      Estimated Air Cargo Rate
                    </span>
                    <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold'>
                      Live Tariff
                    </Badge>
                  </div>

                  <div className='space-y-1'>
                    <div className='text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono'>
                      NPR {estimatedCostNPR.toLocaleString('en-IN')}
                    </div>
                    <p className='text-xs text-slate-500'>
                      Approx. USD ${(estimatedCostNPR / 134).toFixed(1)} &bull; Excludes destination duties if applicable
                    </p>
                  </div>

                  <div className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300 font-medium'>
                    <div className='flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5'>
                      <span className='text-slate-400'>Transit Time:</span>
                      <span className='font-bold text-slate-800 dark:text-white'>{activeDest.days}</span>
                    </div>
                    <div className='flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5'>
                      <span className='text-slate-400'>Flight Frequency:</span>
                      <span>{activeDest.freq}</span>
                    </div>
                    <div className='flex justify-between py-1'>
                      <span className='text-slate-400'>Valley Pickup:</span>
                      <span className='text-emerald-600 dark:text-emerald-400 font-bold'>Free inside Ring Road</span>
                    </div>
                  </div>
                </div>

                <div className='space-y-2.5 pt-2'>
                  <a
                    href='/pwa'
                    className='w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all active:scale-95'
                  >
                    <span>Book Consignment Now</span>
                    <ArrowRight className='h-4 w-4' />
                  </a>
                  <a
                    href='#contact'
                    className='w-full inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold text-xs py-2.5 rounded-2xl transition-all'
                  >
                    Request Custom Commercial Quote
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: SPECIALIZED LOGISTICS ARCHITECTURE (#services) ─────── */}
      <section
        id='services'
        className='py-20 sm:py-28 px-4 bg-white dark:bg-[#070D18] border-b border-slate-200/80 dark:border-white/[0.08]'
      >
        <div className='max-w-7xl mx-auto space-y-12'>
          <div className='text-center space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-white/[0.06] border border-blue-200 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase'>
              Core Logistics Capabilities
            </span>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              Comprehensive Air &amp; Cross-Border Solutions.
            </h2>
            <p className='text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed'>
              Connecting Nepal with the world through specialized courier, container cargo, and bonded air freight corridors.
            </p>
          </div>

          {/* Asymmetrical Bento Grid */}
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Bento Card 1 (Span 2): Worldwide Door-to-Door to Canada, UK, Europe & USA */}
            <div className='lg:col-span-2 rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 dark:from-white/[0.04] dark:via-white/[0.02] dark:to-blue-950/20 p-7 sm:p-9 shadow-xs hover:shadow-xl transition-all duration-300 hover:border-blue-500/40 text-left flex flex-col justify-between'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20'>
                    <Plane className='h-6 w-6' />
                  </div>
                  <Badge variant='outline' className='bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-xs font-bold'>
                    Most Popular
                  </Badge>
                </div>
                <h3 className='text-2xl font-bold text-slate-900 dark:text-white'>
                  Door-to-Door Delivery to Canada, UK, Europe &amp; USA
                </h3>
                <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl'>
                  Specialized, secure delivery from anywhere in Nepal directly to the recipient’s doorstep in Toronto, London, New York, Sydney, and throughout mainland Europe. Handled with end-to-end customs support and transparent tracking.
                </p>

                <div className='grid sm:grid-cols-2 gap-3 pt-3 text-xs text-slate-600 dark:text-slate-300'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                    <span>Free pickup across Kathmandu Valley</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                    <span>Fast &amp; reliable 3 to 6-day air transit</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                    <span>Complete real-time telemetry updates</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                    <span>Special packaging for gifts &amp; textiles</span>
                  </div>
                </div>
              </div>

              <div className='pt-6 flex items-center justify-between border-t border-slate-100 dark:border-white/10 mt-6'>
                <span className='text-xs text-slate-500'>Daily scheduled outbound flights</span>
                <a
                  href='#contact'
                  className='inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-sky-400 hover:gap-2 transition-all'
                >
                  <span>Book Door-to-Door</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </a>
              </div>
            </div>

            {/* Bento Card 2: Import from China */}
            <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-7 shadow-xs hover:shadow-xl transition-all duration-300 hover:border-blue-500/40 text-left flex flex-col justify-between'>
              <div className='space-y-4'>
                <div className='p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit'>
                  <Package className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
                  Import from China &bull; Cargo &amp; Container
                </h3>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  Comprehensive commercial imports from Guangzhou, Yiwu, and Shenzhen into Kathmandu. Container shipping (FCL &amp; LCL), express air cargo, and complete customs clearance at Rasuwa / Tatopani borders.
                </p>

                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>FCL &amp; LCL Sea/Land Containers</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Fast Express Air Cargo</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Full Customs Documentation</span>
                  </li>
                </ul>
              </div>

              <div className='pt-6 border-t border-slate-100 dark:border-white/10 mt-4'>
                <a
                  href='#contact'
                  className='block text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all'
                >
                  Inquire China Import
                </a>
              </div>
            </div>

            {/* Bento Card 3: Import from India */}
            <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-7 shadow-xs hover:shadow-xl transition-all duration-300 hover:border-blue-500/40 text-left flex flex-col justify-between'>
              <div className='space-y-4'>
                <div className='p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit'>
                  <Truck className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
                  Import from India &bull; Air, Train &amp; Truck
                </h3>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  Reliable multi-modal transport from Delhi, Mumbai, Kolkata, and Surat to Nepal. Seamless border clearance at Birgunj, Biratnagar, and Bhairahawa with warehouse delivery.
                </p>

                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Air Freight, Railway &amp; Dedicated Truck</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Cross-Border Transit Insurance</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Competitive Commercial Tariff</span>
                  </li>
                </ul>
              </div>

              <div className='pt-6 border-t border-slate-100 dark:border-white/10 mt-4'>
                <a
                  href='#contact'
                  className='block text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all'
                >
                  Inquire India Transit
                </a>
              </div>
            </div>

            {/* Bento Card 4: Kathmandu Valley Precision Pickup */}
            <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-7 shadow-xs hover:shadow-xl transition-all duration-300 hover:border-blue-500/40 text-left flex flex-col justify-between'>
              <div className='space-y-4'>
                <div className='p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 w-fit'>
                  <MapPin className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
                  Kathmandu Valley Doorstep Courier
                </h3>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  Rider collection dispatched directly to your doorstep in Kathmandu, Lalitpur, and Bhaktapur within 20 to 30 minutes. Digital weighing done right at your doorstep.
                </p>

                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Free collection inside Ring Road</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Multi-stop collection for shops &amp; exporters</span>
                  </li>
                </ul>
              </div>

              <div className='pt-6 border-t border-slate-100 dark:border-white/10 mt-4'>
                <a
                  href='/pwa'
                  className='block text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all'
                >
                  Request Courier Pickup
                </a>
              </div>
            </div>

            {/* Bento Card 5: Certified Weighing & Laser Dimensioning */}
            <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-7 shadow-xs hover:shadow-xl transition-all duration-300 hover:border-blue-500/40 text-left flex flex-col justify-between'>
              <div className='space-y-4'>
                <div className='p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit'>
                  <Scale className='h-6 w-6' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
                  Certified Scales &amp; Laser Volumetric Audit
                </h3>
                <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>
                  100% transparent billing. We cross-verify actual kilogram weight against IATA volumetric standard (L × W × H / 5000) with calibrated electronic digital scales at our Teku facility.
                </p>

                <ul className='space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300'>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Zero hidden tare charges</span>
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-600' />
                    <span>Box-by-box breakdown on your packing list</span>
                  </li>
                </ul>
              </div>

              <div className='pt-6 border-t border-slate-100 dark:border-white/10 mt-4'>
                <a
                  href='#contact'
                  className='block text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-all'
                >
                  Learn About Volumetric Rules
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEYNOTE NUMBERS THAT DEFINE NETPACK (APPLE STYLE) ───────────────── */}
      <section className='py-20 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center'>
            <div className='space-y-2'>
              <div
                style={{ fontFamily: 'Jost, sans-serif' }}
                className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-400 tracking-tight'
              >
                15+
              </div>
              <p className='text-xs sm:text-sm text-slate-300 font-semibold uppercase tracking-wider'>
                Years of Dedication
              </p>
              <p className='text-[11px] text-slate-500'>Established 2009 in Teku, Kathmandu</p>
            </div>

            <div className='space-y-2'>
              <div
                style={{ fontFamily: 'Jost, sans-serif' }}
                className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-sky-400 tracking-tight'
              >
                75+
              </div>
              <p className='text-xs sm:text-sm text-slate-300 font-semibold uppercase tracking-wider'>
                District Hubs
              </p>
              <p className='text-[11px] text-slate-500'>Unrivaled domestic logistics reach</p>
            </div>

            <div className='space-y-2'>
              <div
                style={{ fontFamily: 'Jost, sans-serif' }}
                className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-400 tracking-tight'
              >
                99.8%
              </div>
              <p className='text-xs sm:text-sm text-slate-300 font-semibold uppercase tracking-wider'>
                On-Time Flight Handover
              </p>
              <p className='text-[11px] text-slate-500'>Direct daily airline connections</p>
            </div>

            <div className='space-y-2'>
              <div
                style={{ fontFamily: 'Jost, sans-serif' }}
                className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-purple-400 tracking-tight'
              >
                150+
              </div>
              <p className='text-xs sm:text-sm text-slate-300 font-semibold uppercase tracking-wider'>
                Global Gateways
              </p>
              <p className='text-[11px] text-slate-500'>Direct air corridors worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT NETPACK LOGISTICS & KATHMANDU HERITAGE (#about) ───────────── */}
      <section id='about' className='py-20 sm:py-28 px-4 bg-white dark:bg-[#070D18] border-b border-slate-200/80 dark:border-white/[0.08]'>
        <div className='max-w-7xl mx-auto space-y-16'>
          <div className='text-center space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-white/[0.06] border border-blue-200 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase'>
              About Netpack Logistics
            </span>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              15 Years of Trust, Grounded in Kathmandu.
            </h2>
            <p className='text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed'>
              Founded in 2009 in Teku, Kathmandu, Netpack Logistics has built the backbone connecting Nepalese families, craftspeople, and global commerce to the world.
            </p>
          </div>

          <div className='grid lg:grid-cols-2 gap-12 lg:gap-16 items-center text-left'>
            <div className='space-y-6'>
              <div className='space-y-3'>
                <h3 className='text-2xl font-bold text-slate-900 dark:text-white'>
                  From Local Courier to Global Freight Authority
                </h3>
                <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
                  What began as a localized courier station in Teku has evolved into an accredited international air cargo consolidator. We treat every single consignment—whether it is an urgent university transcript or heavy container freight—with uncompromising vigilance and care.
                </p>
                <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
                  Our centrally located warehouse on Teku Road provides immediate road connectivity to both Tribhuvan International Airport and major ring road arterial routes.
                </p>
              </div>

              <div className='grid sm:grid-cols-2 gap-4 pt-2'>
                <div className='p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1.5'>
                  <div className='flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white'>
                    <div className='w-2 h-2 rounded-full bg-blue-600' />
                    <span>Our Mission</span>
                  </div>
                  <p className='text-xs text-slate-500 leading-relaxed'>
                    Empower Nepalese businesses and families with reliable, transparent, world-class shipping solutions.
                  </p>
                </div>

                <div className='p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1.5'>
                  <div className='flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white'>
                    <div className='w-2 h-2 rounded-full bg-emerald-600' />
                    <span>Our Vision</span>
                  </div>
                  <p className='text-xs text-slate-500 leading-relaxed'>
                    To remain the benchmark of logistics precision, technological innovation, and trust across South Asia.
                  </p>
                </div>
              </div>
            </div>

            {/* Authentic Photo of Kathmandu Office with Floating 15+ Years Badge */}
            <div className='relative'>
              <img
                src='/modern-courier-office-in-kathmandu-with-nepali-sta.jpg'
                alt='Netpack Logistics main courier office in Teku, Kathmandu with staff'
                className='w-full h-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 object-cover'
              />
              <div className='absolute -bottom-5 -right-5 bg-white dark:bg-[#0A1128] p-5 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 flex items-center gap-3'>
                <div className='text-center'>
                  <div className='text-3xl font-extrabold text-blue-600 dark:text-sky-400'>15+</div>
                  <div className='text-xs font-semibold text-slate-500'>Years Serving Nepal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT & HEADQUARTERS MAP (#contact) ───────────────────────────── */}
      <section
        id='contact'
        className='py-20 sm:py-28 px-4 bg-[#FBFBFD] dark:bg-[#070D18] border-b border-slate-200/80 dark:border-white/[0.08]'
      >
        <div className='max-w-7xl mx-auto space-y-12'>
          <div className='text-center space-y-3'>
            <span className='inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-white/[0.06] border border-blue-200 dark:border-white/10 text-blue-700 dark:text-sky-300 text-xs font-semibold tracking-wide uppercase'>
              Get In Touch
            </span>
            <h2
              style={{ fontFamily: 'Jost, sans-serif' }}
              className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight'
            >
              We're ready to dispatch your shipment.
            </h2>
            <p className='text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed'>
              Contact our Teku operations desk for quotes, cargo pickups, customs consulting, or tracking support.
            </p>
          </div>

          <div className='grid lg:grid-cols-12 gap-8 items-start text-left'>
            {/* Contact Information Cards */}
            <div className='lg:col-span-5 space-y-4'>
              <div className='p-6 rounded-3xl bg-white dark:bg-[#0A1128] border border-slate-200 dark:border-white/10 space-y-5 shadow-xs'>
                <h3 className='text-lg font-bold text-slate-900 dark:text-white'>Teku Headquarters</h3>

                <div className='space-y-4 text-xs'>
                  <div className='flex items-start gap-3.5'>
                    <div className='p-2.5 rounded-xl bg-blue-50 dark:bg-white/[0.06] text-blue-600 dark:text-sky-400 shrink-0'>
                      <MapPin className='h-5 w-5' />
                    </div>
                    <div>
                      <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Main Address</h4>
                      <p className='text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed'>
                        {siteContent.contactAddress}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3.5'>
                    <div className='p-2.5 rounded-xl bg-emerald-50 dark:bg-white/[0.06] text-emerald-600 dark:text-emerald-400 shrink-0'>
                      <Phone className='h-5 w-5' />
                    </div>
                    <div>
                      <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Hotline Telephone</h4>
                      <a
                        href={`tel:${siteContent.contactPhone}`}
                        className='text-slate-600 dark:text-slate-300 hover:text-blue-600 font-mono font-bold mt-0.5 block'
                      >
                        {siteContent.contactPhone}
                      </a>
                    </div>
                  </div>

                  <div className='flex items-start gap-3.5'>
                    <div className='p-2.5 rounded-xl bg-indigo-50 dark:bg-white/[0.06] text-indigo-600 dark:text-indigo-400 shrink-0'>
                      <Mail className='h-5 w-5' />
                    </div>
                    <div>
                      <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Direct Email</h4>
                      <a
                        href={`mailto:${siteContent.contactEmail}`}
                        className='text-slate-600 dark:text-slate-300 hover:text-blue-600 mt-0.5 block'
                      >
                        {siteContent.contactEmail}
                      </a>
                    </div>
                  </div>

                  <div className='flex items-start gap-3.5'>
                    <div className='p-2.5 rounded-xl bg-amber-50 dark:bg-white/[0.06] text-amber-600 dark:text-amber-400 shrink-0'>
                      <Clock className='h-5 w-5' />
                    </div>
                    <div>
                      <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Working Hours</h4>
                      <p className='text-slate-500 dark:text-slate-400 mt-0.5'>{siteContent.businessHours}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct PWA App Shortcut Card */}
              <div className='p-5 rounded-3xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <img
                    src='/images/netpack-icon-192.png'
                    alt='Netpack Customer App'
                    className='h-11 w-11 rounded-xl bg-white p-0.5 border shadow-xs'
                  />
                  <div>
                    <h4 className='font-bold text-xs text-slate-900 dark:text-white'>Need Courier Pickup?</h4>
                    <p className='text-[11px] text-slate-500'>Book a rider directly via Customer App</p>
                  </div>
                </div>
                <a
                  href='/pwa'
                  className='bg-[#0D1B2A] dark:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0'
                >
                  Book Now
                </a>
              </div>
            </div>

            {/* Message Form */}
            <div className='lg:col-span-7'>
              <div className='rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A1128] p-6 sm:p-8 shadow-xs'>
                <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-1'>Send an Inquiry</h3>
                <p className='text-xs text-slate-500 mb-6'>
                  Our logistics coordinators will review your specifications and reply promptly.
                </p>

                <form onSubmit={handleContactSubmit} className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Full Name *</label>
                      <Input
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder='Your full name'
                        className='text-xs h-11 rounded-xl bg-slate-50 dark:bg-white/[0.04]'
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
                        className='text-xs h-11 rounded-xl bg-slate-50 dark:bg-white/[0.04]'
                      />
                    </div>
                  </div>

                  <div className='grid md:grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Phone Number</label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder='+977-98XXXXXXXX'
                        className='text-xs h-11 rounded-xl bg-slate-50 dark:bg-white/[0.04]'
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Service Interest</label>
                      <select
                        value={contactService}
                        onChange={(e) => setContactService(e.target.value)}
                        className='w-full h-11 rounded-xl border border-input bg-slate-50 dark:bg-white/[0.04] px-3 py-1 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 outline-none'
                      >
                        <option value='Door-to-Door Delivery'>Door-to-Door (Canada / UK / USA / Europe)</option>
                        <option value='Import from China'>Import from China (Cargo / FCL / Courier)</option>
                        <option value='Import from India'>Import from India (Air / Train / Truck)</option>
                        <option value='General Air Freight'>General Air Freight / Export</option>
                      </select>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-slate-700 dark:text-slate-300'>Shipment Details &amp; Message *</label>
                    <textarea
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                      placeholder='Tell us about package weight, destination country, or commodity type...'
                      className='w-full rounded-xl border border-input bg-slate-50 dark:bg-white/[0.04] p-3 text-xs shadow-xs focus:ring-2 focus:ring-blue-500 outline-none'
                    />
                  </div>

                  <Button
                    type='submit'
                    disabled={contactSubmitting}
                    className='w-full h-11 font-semibold bg-[#0D1B2A] dark:bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 cursor-pointer shadow-md'
                  >
                    {contactSubmitting ? 'Transmitting...' : 'Send Message'}
                    <Send className='h-4 w-4' />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Embedded Google Map of Teku Office */}
          <div className='rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm'>
            <div className='bg-white dark:bg-[#0A1128] p-4 border-b border-border/70 flex items-center justify-between'>
              <div>
                <h4 className='font-bold text-sm text-slate-900 dark:text-white'>Teku Office Location</h4>
                <p className='text-xs text-slate-500'>Teku Road, Ward No. 15, Kathmandu, Nepal</p>
              </div>
              <a
                href='https://maps.google.com/?q=Netpack+Logistic+Teku+Kathmandu'
                target='_blank'
                rel='noreferrer'
                className='text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1'
              >
                Open in Google Maps
                <ExternalLink className='h-3.5 w-3.5' />
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

      {/* ── NETPACK RIDER APP (OBSIDIAN DARK COCKPIT CALLOUT) ───────────────── */}
      <section id='rider-dispatch' className='py-16 bg-[#050A14] text-white relative overflow-hidden border-t border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='max-w-5xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0B132B] p-6 sm:p-10 shadow-2xl'>
            <div className='grid lg:grid-cols-12 gap-8 items-center'>
              <div className='lg:col-span-8 space-y-4 text-left'>
                <div className='flex items-center gap-4'>
                  <img
                    src='/images/netpack-rider-icon-192.png'
                    alt='Netpack Rider App'
                    className='h-16 w-16 rounded-2xl border border-slate-700 bg-white p-1 shadow-lg shrink-0 object-contain'
                  />
                  <div>
                    <div className='inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold uppercase tracking-wider mb-1'>
                      <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
                      Field Delivery Executives
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-white tracking-tight'>
                      Netpack Rider App
                    </h3>
                  </div>
                </div>

                <p className='text-slate-300 text-sm leading-relaxed'>
                  Are you a Netpack delivery executive or field pickup rider? Launch the dedicated Rider App for instant audio dispatch notifications, turn-by-turn route navigation, digital Bluetooth scale sync, and digital customer signatures.
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

              <div className='lg:col-span-4 flex flex-col gap-3'>
                <button
                  type='button'
                  onClick={() => handleInstallClick('rider')}
                  className='inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer'
                >
                  <Download className='h-4 w-4' />
                  <span>Install Rider App</span>
                </button>
                <p className='text-[11px] text-slate-400 text-center font-mono'>
                  PWA &bull; Dedicated mobile executive terminal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER: APPLE & LINEAR MINIMALIST MULTI-COLUMN ─────────────────── */}
      <footer className='bg-[#050A14] text-slate-400 text-xs py-14 mt-auto border-t border-white/[0.08]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-left'>
            {/* Column 1: Brand & Status */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <img src='/alzlogo.png' alt='Netpack Logo' className='h-9 w-auto brightness-110' />
              </div>
              <p className='leading-relaxed text-slate-400 text-xs'>
                Your trusted international air cargo &amp; domestic courier authority in Nepal. Headquartered in Teku, Kathmandu since 2009.
              </p>
              <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold w-fit'>
                <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                <span>All Cargo Systems Operational</span>
              </div>
              <div className='flex gap-4 pt-2 text-slate-400'>
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

            {/* Column 2: Specialized Services */}
            <div>
              <h4 className='font-bold text-white mb-3 text-sm'>Specialized Services</h4>
              <ul className='space-y-2.5'>
                <li><a href='#services' className='hover:text-white transition-colors'>Door-to-Door (Canada / UK / USA)</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Import from China (Cargo / FCL)</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Import from India (Air / Truck)</a></li>
                <li><a href='#services' className='hover:text-white transition-colors'>Kathmandu Valley Doorstep Courier</a></li>
                <li><a href='#rate-calculator' className='hover:text-white transition-colors'>Air Cargo Rate Estimator</a></li>
              </ul>
            </div>

            {/* Column 3: Quick Portals & Tools */}
            <div>
              <h4 className='font-bold text-white mb-3 text-sm'>Quick Portals</h4>
              <ul className='space-y-2.5'>
                <li><a href='#tracking' className='hover:text-white transition-colors'>Consignment Live Tracking</a></li>
                <li><a href='/pwa' className='hover:text-white transition-colors'>Customer Booking App</a></li>
                <li><a href='/pickup-pwa' className='hover:text-white transition-colors'>Rider Dispatch Portal</a></li>
                <li><a href='/sign-in' className='hover:text-white transition-colors'>Staff Portal Login</a></li>
                <li><a href='#about' className='hover:text-white transition-colors'>Teku Headquarters Story</a></li>
              </ul>
            </div>

            {/* Column 4: Contact Information */}
            <div>
              <h4 className='font-bold text-white mb-3 text-sm'>Teku Office Contact</h4>
              <div className='space-y-3'>
                <p className='flex items-start gap-2.5'>
                  <MapPin className='h-4 w-4 text-blue-400 shrink-0 mt-0.5' />
                  <span>{siteContent.contactAddress}</span>
                </p>
                <p className='flex items-center gap-2.5'>
                  <Phone className='h-4 w-4 text-blue-400 shrink-0' />
                  <a href={`tel:${siteContent.contactPhone}`} className='hover:text-white transition-colors font-mono font-bold'>
                    {siteContent.contactPhone}
                  </a>
                </p>
                <p className='flex items-center gap-2.5'>
                  <Mail className='h-4 w-4 text-blue-400 shrink-0' />
                  <a href={`mailto:${siteContent.contactEmail}`} className='hover:text-white transition-colors'>
                    {siteContent.contactEmail}
                  </a>
                </p>
                <p className='flex items-center gap-2.5'>
                  <Clock className='h-4 w-4 text-blue-400 shrink-0' />
                  <span>{siteContent.businessHours}</span>
                </p>
              </div>
            </div>
          </div>

          <div className='border-t border-white/[0.08] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500'>
            <p>© {new Date().getFullYear()} Netpack Logistic. All rights reserved. Teku, Kathmandu, Nepal.</p>
            <div className='flex gap-6'>
              <a href='/terms-and-policies' className='hover:text-slate-300 transition-colors'>Privacy Policy</a>
              <a href='/terms-and-policies' className='hover:text-slate-300 transition-colors'>Terms of Service</a>
              <a href='/terms-and-policies' className='hover:text-slate-300 transition-colors'>IATA Cargo Standards</a>
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
