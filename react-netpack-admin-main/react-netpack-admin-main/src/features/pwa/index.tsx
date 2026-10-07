import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

// ─── API Base URL ─────────────────────────────────────────────────────────────

const API_BASE = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, '').replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8000`
    }
    return window.location.origin
  }
  return 'http://localhost:8000'
})()

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoStr
  }
}

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // Two-tone pleasant notification chime
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0.25, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.3)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.12) // A5
    gain2.gain.setValueAtTime(0.3, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.5)
  } catch (err) {
    console.warn('Notification audio chime error:', err)
  }
}

function triggerVibrationAlert() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300])
    }
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'shipments' | 'book' | 'notifications' | 'profile' | 'rateenquiry' | 'tracking'
type ShipmentTab = 'all' | 'inprogress' | 'delivered'
type BookStep = 1 | 2 | 3

interface Shipment {
  id: string
  tracking: string
  destination: string
  country: string
  commodity: string
  weight: string
  status:
    | 'in_progress'
    | 'delivered'
    | 'pending'
    | 'picked_up'
    | 'shipment_created'
    | 'arrived_at_hub'
    | 'out_for_delivery'
    | 'assigned_for_pickup'
  date: string
  eta?: string
  receiverName?: string
  receiverCity?: string
  weightProofImages?: string[]
  weightProofImageUrl?: string
  riderName?: string
  riderPhone?: string
  pickupLocations?: Array<{ id?: number; location: string; phoneNumber?: string; note?: string }>
}

interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  type: 'welcome' | 'update' | 'delivered' | 'alert'
  tracking?: string
}

interface CheckpointItem {
  activity: string
  location: string
  time: string
  source?: string
}

interface TrackingDetails {
  tracking: string
  receiverName: string
  carrier: string
  carrierTracking: string
  carrierUrl: string
  status:
    | 'in_progress'
    | 'delivered'
    | 'pending'
    | 'picked_up'
    | 'shipment_created'
    | 'arrived_at_hub'
    | 'out_for_delivery'
    | 'assigned_for_pickup'
  statusLabel: string
  heroTitle: string
  heroSubtitle: string
  stageIndex: number
  weight: string
  volumetricWeight: string
  chargeableWeight: string
  origin: string
  destination: string
  commodity: string
  boxes: Array<{
    boxNumber: number
    dimensions: string
    weight: string
    items: Array<{ item: string; pieces: number }>
  }>
  checkpoints: CheckpointItem[]
  riderName?: string
  riderPhone?: string
  weightProofImageUrl?: string
  weightProofImages?: string[]
}

// ─── Initial Mock Data & Fallbacks ─────────────────────────────────────────────

const mockTrackingMap: Record<string, TrackingDetails> = {
  'NP-20240922-001': {
    tracking: 'NP-20240922-001',
    receiverName: 'Sarah Jenkins',
    carrier: 'DHL Express',
    carrierTracking: '9400111899562849102834',
    carrierUrl: 'https://www.dhl.com/en/express/tracking.html',
    status: 'in_progress',
    statusLabel: 'In Transit (Air Cargo)',
    heroTitle: 'Departed KTM Airport',
    heroSubtitle: 'Air Cargo Departed Tribhuvan Int\'l Airport (KTM) • Flight RA-205',
    stageIndex: 3,
    weight: '4.2 kg',
    volumetricWeight: '3.8 kg',
    chargeableWeight: '4.2 kg',
    origin: 'Kathmandu (KTM)',
    destination: 'London (LHR), UK',
    commodity: 'Pashmina & Woolen Garments',
    boxes: [
      {
        boxNumber: 1,
        dimensions: '42 × 30 × 25 cm',
        weight: '4.2 kg',
        items: [
          { item: 'Cashmere Pashmina Shawls', pieces: 8 },
          { item: 'Woolen Mufflers (Handwoven)', pieces: 4 },
        ],
      },
    ],
    checkpoints: [
      {
        activity: 'Air Cargo Departed Tribhuvan Int\'l Airport',
        location: 'TIA Airport, Kathmandu',
        time: 'Today, 11:45 AM',
        source: 'Airline Scanned',
      },
      {
        activity: 'Export Customs Cleared & Transferred to Ramp',
        location: 'Customs Cargo Complex, Kathmandu',
        time: 'Sep 21, 04:30 PM',
        source: 'Operator Note',
      },
      {
        activity: 'Warehouse Security Inspection & Weighing Complete',
        location: 'NetPack Teku Hub, Kathmandu',
        time: 'Sep 20, 10:15 AM',
      },
      {
        activity: 'Cargo Picked Up From Shipper',
        location: 'Thamel, Kathmandu',
        time: 'Sep 18, 02:15 PM',
        source: 'Courier Pickup',
      },
    ],
    weightProofImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    weightProofImages: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'],
  },
  'NP-20240910-088': {
    tracking: 'NP-20240910-088',
    receiverName: 'Michael Chang',
    carrier: 'FedEx Express',
    carrierTracking: '789234019283',
    carrierUrl: 'https://www.fedex.com/fedextrack/',
    status: 'delivered',
    statusLabel: 'Delivered',
    heroTitle: 'Delivered to Consignee',
    heroSubtitle: 'Signed by: M. Chang • Manhattan, New York, USA',
    stageIndex: 6,
    weight: '2.8 kg',
    volumetricWeight: '2.5 kg',
    chargeableWeight: '2.8 kg',
    origin: 'Kathmandu (KTM)',
    destination: 'New York (JFK), USA',
    commodity: 'Handicrafts & Souvenirs',
    boxes: [
      {
        boxNumber: 1,
        dimensions: '35 × 25 × 20 cm',
        weight: '2.8 kg',
        items: [
          { item: 'Carved Wooden Buddha Statues', pieces: 2 },
          { item: 'Tibetan Prayer Flags', pieces: 5 },
        ],
      },
    ],
    checkpoints: [
      {
        activity: 'Package Delivered & Signed by Consignee',
        location: 'New York, USA',
        time: 'Sep 17, 11:00 AM',
        source: 'Courier Delivery',
      },
      {
        activity: 'Out for Final Delivery',
        location: 'FedEx JFK Sorting Facility, NY',
        time: 'Sep 17, 08:30 AM',
        source: 'FedEx Express',
      },
      {
        activity: 'Import Customs Cleared',
        location: 'JFK Airport, New York',
        time: 'Sep 16, 03:20 PM',
      },
      {
        activity: 'Arrived at Destination Airport',
        location: 'JFK Airport, New York',
        time: 'Sep 15, 06:45 PM',
        source: 'Airline Scanned',
      },
      {
        activity: 'Departed Kathmandu (TIA)',
        location: 'Kathmandu Airport',
        time: 'Sep 11, 10:30 PM',
      },
      {
        activity: 'Shipment Origin Intake & Verified',
        location: 'NetPack Teku Hub, Kathmandu',
        time: 'Sep 10, 01:15 PM',
      },
    ],
    weightProofImageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=80',
    weightProofImages: ['https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&auto=format&fit=crop&q=80'],
  },
  'NP-20240905-047': {
    tracking: 'NP-20240905-047',
    receiverName: 'Kenji Sato',
    carrier: 'DHL Express',
    carrierTracking: '88123901920',
    carrierUrl: 'https://www.dhl.com/en/express/tracking.html',
    status: 'delivered',
    statusLabel: 'Delivered',
    heroTitle: 'Delivered in Tokyo',
    heroSubtitle: 'Delivered to Reception • Shinjuku, Tokyo, Japan',
    stageIndex: 6,
    weight: '1.5 kg',
    volumetricWeight: '1.2 kg',
    chargeableWeight: '1.5 kg',
    origin: 'Kathmandu (KTM)',
    destination: 'Tokyo (NRT), Japan',
    commodity: 'Himalayan Tea & Spices',
    boxes: [
      {
        boxNumber: 1,
        dimensions: '28 × 20 × 15 cm',
        weight: '1.5 kg',
        items: [
          { item: 'Organic Ilam Orthodox Tea', pieces: 6 },
          { item: 'Himalayan Cardamom Packs', pieces: 2 },
        ],
      },
    ],
    checkpoints: [
      {
        activity: 'Delivered to Receptionist',
        location: 'Shinjuku, Tokyo, Japan',
        time: 'Sep 5, 02:40 PM',
        source: 'DHL Courier',
      },
      {
        activity: 'Arrived at DHL Tokyo Express Hub',
        location: 'Tokyo, Japan',
        time: 'Sep 4, 11:15 PM',
      },
      {
        activity: 'Dispatched from Kathmandu Gateway',
        location: 'TIA, Kathmandu',
        time: 'Sep 2, 09:00 PM',
        source: 'Airline Scanned',
      },
    ],
    weightProofImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    weightProofImages: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'],
  },
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBox = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

const IconBell = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const IconUser = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconPlus = ({ size = 22, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconArrowRight = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

const IconRefresh = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

const IconMapPin = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconTruck = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

const IconCheck = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconStar = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

const IconChevronDown = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const IconChevronUp = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)

const IconChevronLeft = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const IconChevronRight = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const IconPlane = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
  </svg>
)


const IconCopy = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
)

const IconExternalLink = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const IconScale = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/>
    <path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
)

const IconSearch = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconCamera = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconLogout = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconClose = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconReceiptDollar = ({ size = 22, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2L4 2z"/>
    <line x1="12" y1="6" x2="12" y2="8"/>
    <line x1="12" y1="16" x2="12" y2="18"/>
    <path d="M9 10h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"/>
  </svg>
)

const IconClock = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const IconHome = ({ size = 22, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <polyline points="9 21 9 12 15 12 15 21"/>
  </svg>
)

const IconWarehouse = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
    <path d="M6 18h12"/>
    <path d="M6 14h12"/>
    <rect width="12" height="12" x="6" y="10"/>
  </svg>
)

const IconDocument = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
)

const IconTag = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.59 13.41 13.42 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={2.6} />
  </svg>
)

const IconGoogle = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z"/>
    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z"/>
    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4.01 3.1C6.22 6.87 8.87 4.75 12 4.75Z"/>
  </svg>
)

const IconEye = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const IconEyeOff = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a13.16 13.16 0 0 1-3.17 4.34M6.61 6.61C3.63 8.36 1 12 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61M1 1l22 22"/>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
  </svg>
)

const IconPhone = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  userName,
  photoUrl,
  unreadCount,
  onBellClick,
  onProfileClick,
}: {
  userName?: string
  photoUrl?: string
  unreadCount: number
  onBellClick: () => void
  onProfileClick?: () => void
}) {
  const avatarSrc = photoUrl
    ? photoUrl.startsWith('http') || photoUrl.startsWith('data:')
      ? photoUrl
      : `${API_BASE}${photoUrl}`
    : null

  return (
    <header
      className="sticky top-0 z-30 bg-gradient-to-b from-[#0D1B2A] to-[#152A40] px-4 pb-3 flex items-center gap-3 rounded-b-[20px] shadow-lg shadow-black/20"
      style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
    >
      {/* Avatar or Initials Button */}
      <button
        type="button"
        onClick={onProfileClick}
        className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/20 flex items-center justify-center bg-white/10 shrink-0 shadow-xs active:scale-95 transition-transform cursor-pointer"
        title="View Profile"
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt={userName || 'User'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold text-sm">
            {(userName || 'C').charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onProfileClick} role="button">
        <p className="text-white/60 text-[11px] leading-tight">Welcome back</p>
        <span style={{ fontFamily: 'Jost, sans-serif' }} className="text-white font-700 text-base leading-tight tracking-tight truncate block">
          Hi, {userName || 'Customer'}!
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onBellClick}
          className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Notifications"
        >
          <IconBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full ring-2 ring-[#0D1B2A] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  )
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const homeActive = screen === 'home' || screen === 'shipments' || screen === 'rateenquiry' || screen === 'tracking'
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-[430px] mx-auto px-4 pb-2.5 pb-safe pointer-events-none">
      <div className="pointer-events-auto bg-[#0D1B2A] rounded-[22px] shadow-2xl shadow-black/40 border border-white/10 px-3 py-1.5 flex items-center justify-between">
        {/* Home */}
        <button
          onClick={() => setScreen('home')}
          className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all cursor-pointer ${
            homeActive ? 'text-white bg-white/10 font-bold' : 'text-white/35 hover:text-white/60'
          }`}
        >
          <IconHome size={20} />
          <span className="text-[9px] font-semibold tracking-wide">Home</span>
        </button>

        {/* Book FAB */}
        <button
          onClick={() => setScreen('book')}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-white active:scale-95 transition-transform cursor-pointer"
          title="Book Consignment"
        >
          <IconPlus size={24} className="text-white" />
        </button>

        {/* Profile */}
        <button
          onClick={() => setScreen('profile')}
          className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all cursor-pointer ${
            screen === 'profile' ? 'text-white bg-white/10 font-bold' : 'text-white/35 hover:text-white/60'
          }`}
        >
          <IconUser size={20} />
          <span className="text-[9px] font-semibold tracking-wide">Profile</span>
        </button>
      </div>
    </nav>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Shipment['status'] }) {
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <IconCheck size={10} />
        Delivered
      </span>
    )
  }
  if (status === 'out_for_delivery') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
        <IconTruck size={10} />
        Out for Delivery
      </span>
    )
  }
  if (status === 'arrived_at_hub') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
        <IconWarehouse size={10} />
        Arrived at Hub
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        In Transit
      </span>
    )
  }
  if (status === 'shipment_created') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
        <IconTag size={10} />
        Shipment Created
      </span>
    )
  }
  if (status === 'picked_up') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
        <IconBox size={10} />
        Picked Up
      </span>
    )
  }
  if (status === 'assigned_for_pickup') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
        <IconTruck size={10} />
        Rider Assigned
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
      Pending
    </span>
  )
}

// ─── Shipment Card ────────────────────────────────────────────────────────────

function ShipmentCard({
  s,
  onClick,
  onRequestPickup,
}: {
  s: Shipment
  onClick: () => void
  onRequestPickup?: (trackingNumber: string) => void
}) {
  const canRequestPickup =
    onRequestPickup &&
    s.status !== 'shipment_created' &&
    s.status !== 'delivered' &&
    s.status !== 'in_progress' &&
    s.status !== 'arrived_at_hub' &&
    s.status !== 'out_for_delivery'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex gap-3 active:scale-[0.99] hover:border-blue-200 transition-all cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        s.status === 'delivered'
          ? 'bg-emerald-50'
          : s.status === 'out_for_delivery'
          ? 'bg-sky-50'
          : s.status === 'arrived_at_hub'
          ? 'bg-purple-50'
          : s.status === 'in_progress'
          ? 'bg-amber-50'
          : s.status === 'shipment_created'
          ? 'bg-indigo-50'
          : s.status === 'picked_up'
          ? 'bg-teal-50'
          : s.status === 'assigned_for_pickup'
          ? 'bg-cyan-50'
          : 'bg-gray-50'
      }`}>
        {s.status === 'delivered' ? (
          <IconCheck size={16} className="text-emerald-500" />
        ) : s.status === 'out_for_delivery' ? (
          <IconTruck size={18} className="text-sky-600 animate-float" />
        ) : s.status === 'arrived_at_hub' ? (
          <IconWarehouse size={18} className="text-purple-600" />
        ) : s.status === 'in_progress' ? (
          <IconPlane size={18} className="text-amber-500 animate-float" />
        ) : s.status === 'shipment_created' ? (
          <IconTag size={18} className="text-indigo-600" />
        ) : s.status === 'picked_up' ? (
          <IconBox size={18} className="text-teal-600" />
        ) : s.status === 'assigned_for_pickup' ? (
          <IconTruck size={18} className="text-cyan-600" />
        ) : (
          <IconDocument size={18} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif' }} className="font-600 text-[#0D1B2A] text-sm leading-tight">
              {s.destination}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono tracking-wide">{s.tracking}</p>
          </div>
          <StatusBadge status={s.status} />
        </div>
        {s.receiverName && (
          <p className="text-[12px] text-gray-700 font-medium mt-1 truncate">
            <span className="text-gray-400 text-[11px]">Consignee:</span>{' '}
            <span className="font-semibold text-[#0D1B2A]">{s.receiverName}</span>
          </p>
        )}
        <p className="text-[12px] text-gray-500 mt-1 truncate">
          {s.commodity} · {s.weight}
        </p>
        {s.eta && <p className="text-[11px] text-blue-500 mt-1 font-medium">ETA {s.eta}</p>}

        {canRequestPickup && (
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium">Doorstep Collection</span>
            <span
              onClick={(e) => {
                e.stopPropagation()
                onRequestPickup(s.tracking)
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors cursor-pointer"
            >
              <IconTruck size={12} />
              <span>{s.status === 'assigned_for_pickup' ? 'Update Stops' : 'Book Pickup'}</span>
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function HomeScreen({
  shipments,
  onViewAll,
  onBook,
  onRateEnquiry,
  onTrack,
  onRequestPickup,
}: {
  shipments: Shipment[]
  onViewAll: () => void
  onBook: () => void
  onRateEnquiry: () => void
  onTrack: (trackingNumber: string) => void
  onRequestPickup?: (trackingNumber: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const pending = shipments.filter(s => s.status === 'pending' || s.status === 'assigned_for_pickup').length
  const inTransit = shipments.filter(s => s.status === 'in_progress' || s.status === 'arrived_at_hub' || s.status === 'out_for_delivery' || s.status === 'shipment_created' || s.status === 'picked_up').length
  const recent = shipments.slice(0, 3)

  const filteredShipments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return shipments.filter(s => {
      const matchName = s.receiverName?.toLowerCase().includes(q)
      const matchDest = s.destination?.toLowerCase().includes(q) || s.receiverCity?.toLowerCase().includes(q)
      const matchComm = s.commodity?.toLowerCase().includes(q)
      const matchTrack = s.tracking?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q)
      return matchName || matchDest || matchComm || matchTrack
    })
  }, [searchQuery, shipments])

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      {/* Stat Cards */}
      <div className="px-4 pt-5 pb-2 grid grid-cols-2 gap-3">
        {/* Total Pending */}
        <div
          onClick={onViewAll}
          className="relative overflow-hidden rounded-2xl p-4 min-h-[120px] flex flex-col justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 60%, #F97316 100%)' }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none">
            <svg width={80} height={80} viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="white" />
            </svg>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-xs flex items-center justify-center">
            <IconClock size={18} className="text-white" />
          </div>
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif' }} className="text-white font-800 text-4xl leading-none">
              {pending}
            </p>
            <p className="text-white/90 text-[13px] font-medium mt-1">Total Pending</p>
          </div>
        </div>

        {/* In Transit */}
        <div
          onClick={onViewAll}
          className="relative overflow-hidden rounded-2xl p-4 min-h-[120px] flex flex-col justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 60%, #A855F7 100%)' }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none">
            <IconTruck size={80} className="text-white animate-float" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-xs flex items-center justify-center">
            <IconTruck size={18} className="text-white" />
          </div>
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif' }} className="text-white font-800 text-4xl leading-none">
              {inTransit}
            </p>
            <p className="text-white/90 text-[13px] font-medium mt-1">In Transit</p>
          </div>
        </div>
      </div>

      {/* Multi-Attribute Consignment Search Bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-2 flex items-center gap-2">
          <IconSearch size={18} className="text-gray-400 shrink-0 ml-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search consignee, address, or commodity..."
            className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-[#0D1B2A] placeholder-gray-400 font-sans"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = searchQuery.trim()
                if (val) {
                  if (filteredShipments.length === 1) {
                    onTrack(filteredShipments[0].tracking)
                  } else if (val.toUpperCase().startsWith('NP-')) {
                    onTrack(val)
                  }
                }
              }
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Clear search"
            >
              <IconClose size={15} />
            </button>
          ) : null}
          <button
            onClick={() => {
              const val = searchQuery.trim()
              if (val) {
                if (filteredShipments.length === 1) {
                  onTrack(filteredShipments[0].tracking)
                } else if (val.toUpperCase().startsWith('NP-')) {
                  onTrack(val)
                }
              }
            }}
            style={{ fontFamily: 'Jost, sans-serif' }}
            className="bg-[#0D1B2A] text-white text-xs font-600 px-3.5 py-2 rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Dynamic Results: Search Results or Recent Consignments */}
      {searchQuery.trim() ? (
        <div className="px-4 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-base font-700 text-[#0D1B2A] tracking-tight">
                Matching Shipments
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {filteredShipments.length} found
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Clear
            </button>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center text-center gap-2">
              <IconSearch size={22} className="text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">No shipments found</p>
              <p className="text-xs text-gray-400 max-w-[240px]">
                No consignments match "{searchQuery}". Try searching by recipient name, city, or commodity item.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-[#2563EB] cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredShipments.map((s: Shipment) => (
                <ShipmentCard key={s.id} s={s} onClick={() => onTrack(s.tracking)} onRequestPickup={onRequestPickup} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-base font-700 text-[#0D1B2A] tracking-tight">
              Recent Consignments
            </h2>
            <button onClick={onViewAll} className="text-[13px] font-semibold text-[#2563EB] cursor-pointer">
              View All
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <IconBox size={22} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm text-center">No consignments yet.</p>
              <button
                onClick={onBook}
                style={{ fontFamily: 'Jost, sans-serif' }}
                className="bg-[#0D1B2A] text-white font-600 text-sm px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Book a Consignment
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recent.map(s => (
                <ShipmentCard key={s.id} s={s} onClick={() => onTrack(s.tracking)} onRequestPickup={onRequestPickup} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Services */}
      <div className="px-4 pt-5 pb-2">
        <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-base font-700 text-[#0D1B2A] tracking-tight mb-3">
          Services
        </h2>
        <button
          onClick={onRateEnquiry}
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex items-center gap-4 active:scale-[0.99] transition-transform text-left cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <IconReceiptDollar size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: 'Jost, sans-serif' }} className="font-700 text-[#0D1B2A] text-sm">
              Rate Enquiry
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5 truncate">
              Calculate estimated air cargo rates before placing an order.
            </p>
          </div>
          <IconArrowRight size={16} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
        </button>
      </div>
    </div>
  )
}

// ─── Shipments Screen (My Consignments View) ──────────────────────────────────

function ShipmentsScreen({
  shipments,
  onBook,
  onBack,
  onTrack,
  onRefresh,
  onRequestPickup,
}: {
  shipments: Shipment[]
  onBook: () => void
  onBack: () => void
  onTrack: (trackingNumber: string) => void
  onRefresh: () => void
  onRequestPickup?: (trackingNumber: string) => void
}) {
  const [tab, setTab] = useState<ShipmentTab>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = shipments.filter(s => {
    if (tab === 'all') return true
    if (tab === 'inprogress') return s.status !== 'delivered'
    if (tab === 'delivered') return s.status === 'delivered'
    return true
  })

  const handleRefreshClick = () => {
    setRefreshing(true)
    onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      {/* Page Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
                My Consignments
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">Review active bookings and cargo history.</p>
            </div>
          </div>
          <button
            onClick={handleRefreshClick}
            className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium bg-white border border-gray-200 rounded-xl px-3 py-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <IconRefresh size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Total', value: shipments.length, color: 'text-[#0D1B2A]', bg: 'bg-white' },
            { label: 'In Transit', value: shipments.filter(s => s.status === 'in_progress' || s.status === 'arrived_at_hub' || s.status === 'out_for_delivery' || s.status === 'shipment_created' || s.status === 'picked_up').length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Delivered', value: shipments.filter(s => s.status === 'delivered').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl border border-gray-100 px-3 py-2 text-center`}>
              <p style={{ fontFamily: 'Jost, sans-serif' }} className={`${stat.color} text-2xl font-700 leading-none`}>
                {stat.value}
              </p>
              <p className="text-gray-400 text-[11px] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5 shadow-2xs">
          {([['all', 'All'], ['inprogress', 'In Progress'], ['delivered', 'Delivered']] as [ShipmentTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 text-[12px] font-semibold py-2 rounded-lg transition-all cursor-pointer ${
                tab === key ? 'bg-[#0D1B2A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <IconBox size={28} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">No consignments found under this view.</p>
            </div>
            <button
              onClick={onBook}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="bg-[#0D1B2A] text-white font-600 text-sm px-6 py-2.5 rounded-xl active:opacity-90 transition-opacity cursor-pointer"
            >
              Book a Consignment
            </button>
          </div>
        ) : (
          filtered.map(s => (
            <ShipmentCard
              key={s.id}
              s={s}
              onClick={() => onTrack(s.tracking)}
              onRequestPickup={onRequestPickup}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Rate Enquiry Screen ──────────────────────────────────────────────────────

// ─── Country Options & Dial Codes (All 230+ World Countries) ──────────────────
import { COUNTRY_OPTIONS, COUNTRIES } from './countries'
import type { CountryOption } from './countries'
export { COUNTRY_OPTIONS, COUNTRIES }
export type { CountryOption }

function RateEnquiryScreen({ onBack }: { onBack: () => void }) {
  const [destCountry, setDestCountry] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState<null | { rate: string; transit: string; service: string }>(null)

  const handleCalc = () => {
    const w = parseFloat(weight) || 1
    const base = 15 + w * 8.5
    setResult({
      rate: `NPR ${(base * 135).toFixed(0)} – NPR ${(base * 145).toFixed(0)}`,
      transit: '7–12 business days',
      service: 'International Air Cargo Express',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
            Rate Enquiry
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Instant estimated shipping calculator.</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-xs">
          {/* Destination */}
          <div>
            <FieldLabel required>Destination Country</FieldLabel>
            <div className="relative">
              <select
                value={destCountry}
                onChange={e => {
                  setDestCountry(e.target.value)
                  setResult(null)
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <IconChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Weight */}
          <div>
            <FieldLabel required>Approximate Weight (kg)</FieldLabel>
            <TextInput
              placeholder="e.g., 3.5"
              value={weight}
              onChange={v => {
                setWeight(v)
                setResult(null)
              }}
              type="number"
            />
          </div>
        </div>

        <button
          onClick={handleCalc}
          disabled={!destCountry || !weight}
          style={{ fontFamily: 'Jost, sans-serif' }}
          className="w-full bg-[#2563EB] disabled:bg-gray-300 disabled:shadow-none text-white font-600 text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 shadow-md shadow-blue-200 transition-all cursor-pointer"
        >
          <IconReceiptDollar size={18} />
          Calculate Rate
        </button>

        {result && (
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs animate-in fade-in-50 duration-200">
            <div className="bg-emerald-500 px-4 py-3 flex items-center gap-2">
              <IconCheck size={16} className="text-white" />
              <p style={{ fontFamily: 'Jost, sans-serif' }} className="text-white font-600 text-sm">
                Estimated Quotation
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[12px] text-gray-500">Destination</span>
                <span className="text-[13px] font-semibold text-[#0D1B2A]">{destCountry}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[12px] text-gray-500">Weight</span>
                <span className="text-[13px] font-semibold text-[#0D1B2A]">{weight} kg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[12px] text-gray-500">Service</span>
                <span className="text-[13px] font-semibold text-[#0D1B2A]">{result.service}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-[12px] text-gray-500">Transit Time</span>
                <span className="text-[13px] font-semibold text-amber-600">{result.transit}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[13px] font-semibold text-gray-700">Estimated Cost</span>
                <span style={{ fontFamily: 'Jost, sans-serif' }} className="text-base font-700 text-emerald-600">
                  {result.rate}
                </span>
              </div>
            </div>
            <div className="px-4 pb-4">
              <p className="text-[11px] text-gray-400 leading-relaxed italic">
                * Estimate only. Final rate confirmed after warehouse electronic scale weighing and volumetric inspection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tracking Screen (Dedicated Live Tracking) ────────────────────────────────

function ScalePhotoModal({
  photoUrls,
  photoUrl,
  initialIndex = 0,
  weight,
  trackingNumber,
  onClose,
}: {
  photoUrls?: string[]
  photoUrl?: string
  initialIndex?: number
  weight?: string
  trackingNumber?: string
  onClose: () => void
}) {
  const images = useMemo(() => {
    if (photoUrls && photoUrls.length > 0) return photoUrls
    if (photoUrl) return [photoUrl]
    return []
  }, [photoUrls, photoUrl])

  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (images.length > 1) {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
        }
        if (e.key === 'ArrowRight') {
          setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, onClose])

  if (images.length === 0) return null

  const currentPhoto = images[currentIndex] || images[0] || ''
  const displayUrl = currentPhoto.startsWith('http') ? currentPhoto : `${API_BASE}${currentPhoto}`
  const hasMultiple = images.length > 1

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <IconScale size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p style={{ fontFamily: 'Jost, sans-serif' }} className="text-sm font-700 text-[#0D1B2A] leading-tight">
                  Verified Weight & Proof
                </p>
                {hasMultiple && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Photo {currentIndex + 1} of {images.length}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{trackingNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <IconClose size={15} />
          </button>
        </div>

        {/* Photo Container with Carousel Controls */}
        <div className="relative bg-[#0A0E14] flex items-center justify-center overflow-hidden min-h-[280px] max-h-[440px] select-none">
          <img
            key={displayUrl}
            src={displayUrl}
            alt={`Weight Proof ${currentIndex + 1}`}
            className="w-full h-full object-contain max-h-[440px]"
          />

          {/* Navigation Arrows for Multiple Photos */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Previous photo"
              >
                <IconChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 active:scale-95 transition-all cursor-pointer"
                title="Next photo"
              >
                <IconChevronRight size={18} />
              </button>
            </>
          )}

          {/* Scale Weight Pill */}
          {weight && (
            <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-xl border border-white/20 shadow-md flex items-center gap-1.5">
              <span>Verified Weight:</span>
              <span className="text-emerald-400 font-bold">{weight}</span>
            </div>
          )}

          {/* Direct Link to open full-res */}
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white/80 hover:text-white text-[10px] font-medium px-2.5 py-1 rounded-xl border border-white/20 shadow-md flex items-center gap-1 transition-colors"
          >
            <span>Full Size</span>
            <IconExternalLink size={11} />
          </a>
        </div>

        {/* Thumbnail Selector Strip (when 2+ photos) */}
        {hasMultiple && (
          <div className="px-4 py-2.5 bg-gray-900 border-t border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {images.map((url, idx) => {
              const thumbUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
              const isSelected = idx === currentIndex
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-emerald-500 scale-105 shadow-md' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={thumbUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 bg-black/70 text-[9px] font-mono text-white px-1 rounded-tl">
                    {idx + 1}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Details Footer */}
        <div className="p-4 bg-gray-50/90 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Certification:</span>
            <span className="font-semibold text-emerald-600">NetPack Intake Digital Scale #01</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>Inspection Hub:</span>
            <span className="font-semibold text-[#0D1B2A]">Teku Central Operations, Kathmandu</span>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'Jost, sans-serif' }}
            className="w-full mt-2 py-2.5 bg-[#0D1B2A] hover:bg-[#1a2f47] text-white rounded-xl font-600 text-xs active:scale-98 transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}


function TrackingScreen({
  initialTrackingId,
  onBack,
  onRequestPickup,
}: {
  initialTrackingId: string
  onBack: () => void
  onRequestPickup?: (trackingNumber: string) => void
}) {
  const [trackingId, setTrackingId] = useState(initialTrackingId)
  const [searchInput, setSearchInput] = useState(initialTrackingId)
  const [isFolded, setIsFolded] = useState(true)
  const [isBoxesOpen, setIsBoxesOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null)
  const stepperScrollRef = useRef<HTMLDivElement>(null)
  const activeStepRef = useRef<HTMLDivElement>(null)

  // Tracking details from live API or mock fallback
  const [data, setData] = useState<TrackingDetails>(() => {
    if (mockTrackingMap[initialTrackingId]) {
      return mockTrackingMap[initialTrackingId]
    }
    return {
      tracking: initialTrackingId,
      receiverName: '—',
      carrier: 'Pending Assignment',
      carrierTracking: '',
      carrierUrl: '',
      status: 'pending',
      statusLabel: 'Connecting...',
      heroTitle: 'Tracking Consignment',
      heroSubtitle: 'Retrieving live consignment data...',
      stageIndex: 0,
      weight: '—',
      volumetricWeight: '—',
      chargeableWeight: '—',
      origin: 'Kathmandu (KTM)',
      destination: 'International',
      commodity: 'General Cargo',
      boxes: [],
      checkpoints: [],
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingId(initialTrackingId)
      setSearchInput(initialTrackingId)
    }
  }, [initialTrackingId])

  useEffect(() => {
    if (!trackingId) return
    setLoading(true)

    // Try fetching live backend tracking
    fetch(`${API_BASE}/api/tracking/${encodeURIComponent(trackingId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(liveRes => {
        if (liveRes && liveRes.trackingNumber) {
          // Map backend tracking response
          const statusStr = (liveRes.currentStatus || liveRes.status || '').toUpperCase()
          const isActualPickedUp = statusStr === 'PICKED_UP' || (statusStr.includes('PICK') && !statusStr.includes('ASSIGNED'))
          const riderName = liveRes.riderName || liveRes.pickupStaffName || ''
          const riderPhone = liveRes.riderPhone || liveRes.pickupStaffPhone || ''
          const isRiderAssigned = Boolean(statusStr.includes('ASSIGNED') || riderName)

          let stageIdx = 0
          if (statusStr.includes('DELIVERED')) stageIdx = 6
          else if (statusStr.includes('CARRIER') || statusStr.includes('OUT_FOR_DELIVERY')) stageIdx = 5
          else if (statusStr.includes('HUB') || statusStr.includes('CUSTOMS')) stageIdx = 4
          else if (statusStr.includes('TRANSIT')) stageIdx = 3
          else if (statusStr.includes('PACK') || statusStr.includes('CREATED')) stageIdx = 2
          else if (isActualPickedUp) stageIdx = 1
          else stageIdx = 0

          let proofImgs: string[] = []
          if (Array.isArray(liveRes.weightProofImages) && liveRes.weightProofImages.length > 0) {
            proofImgs = liveRes.weightProofImages
          } else if (typeof liveRes.weightProofImageUrl === 'string' && liveRes.weightProofImageUrl.trim()) {
            proofImgs = liveRes.weightProofImageUrl.split(',').map((u: string) => u.trim()).filter(Boolean)
          }
          const proofImg = proofImgs[0] || liveRes.weightProofImageUrl || undefined

          let statusLabel = 'In Transit (Air Cargo)'
          let heroTitle = 'Air Cargo in Flight'
          let heroSubtitle = `En route to ${liveRes.destination || 'Destination'} • Verified Weight: ${liveRes.weight || liveRes.approximateWeight || '3.5'} kg`

          if (statusStr.includes('DELIVERED')) {
            statusLabel = 'Delivered'
            heroTitle = 'Delivered to Consignee'
            heroSubtitle = `Delivered to ${liveRes.receiverName || 'Consignee'} • ${liveRes.destination || 'Destination'}`
          } else if (statusStr.includes('CARRIER') || statusStr.includes('OUT_FOR_DELIVERY')) {
            statusLabel = 'Out for Delivery'
            heroTitle = 'Carrier Out for Delivery'
            heroSubtitle = `Handed over to ${liveRes.forwardingCompany || 'Courier'} for final delivery`
          } else if (statusStr.includes('HUB') || statusStr.includes('CUSTOMS')) {
            statusLabel = 'Arrived at Hub'
            heroTitle = 'Customs & Hub Processing'
            heroSubtitle = `Processing at ${liveRes.destination || 'Destination'} cargo terminal`
          } else if (statusStr.includes('TRANSIT')) {
            statusLabel = 'In Transit (Air Cargo)'
            heroTitle = 'Air Cargo in Flight'
            heroSubtitle = `En route to ${liveRes.destination || 'Destination'} • KTM Departure`
          } else if (statusStr.includes('PACK') || statusStr.includes('CREATED')) {
            statusLabel = 'Shipment Created'
            heroTitle = 'Airway Bill Generated'
            heroSubtitle = `Export clearance prepared at Kathmandu Hub • Weight: ${liveRes.weight || liveRes.approximateWeight || '3.5'} kg`
          } else if (isActualPickedUp) {
            statusLabel = 'Cargo Picked Up'
            heroTitle = 'Cargo Picked Up'
            heroSubtitle = `Picked up by NetPack courier • Verified Weight: ${liveRes.weight || liveRes.approximateWeight || '3.5'} kg`
          } else if (isRiderAssigned) {
            statusLabel = 'Rider Assigned'
            heroTitle = 'Pickup Rider Assigned'
            const contactText = riderPhone ? ` • Contact: ${riderPhone}` : ''
            heroSubtitle = riderName
              ? `Rider: ${riderName}${contactText} • Heading to pickup address`
              : 'Pickup rider has been assigned and is heading to your address'
          } else {
            statusLabel = 'Enquiry Registered'
            heroTitle = 'Booking Confirmed'
            heroSubtitle = liveRes.pickupRequired === false
              ? 'Awaiting drop-off at NetPack intake counter • Kathmandu'
              : 'Awaiting pickup rider assignment • Kathmandu'
          }

          const fwdNo = (liveRes.forwardingNumber || '').trim()
          const fwdCo = (liveRes.forwardingCompany || liveRes.carrier || '').trim()

          let carrierUrl = liveRes.carrierTrackingUrl || ''
          if (!carrierUrl && fwdNo) {
            if (fwdCo.toUpperCase().includes('FEDEX')) {
              carrierUrl = `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(fwdNo)}`
            } else if (fwdCo.toUpperCase().includes('UPS')) {
              carrierUrl = `https://www.ups.com/track?tracknum=${encodeURIComponent(fwdNo)}`
            } else if (fwdCo.toUpperCase().includes('ARAMEX')) {
              carrierUrl = `https://www.aramex.com/track/results?mode=0&ShipmentNumber=${encodeURIComponent(fwdNo)}`
            } else {
              carrierUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(fwdNo)}`
            }
          }

          setData({
            tracking: liveRes.trackingNumber,
            receiverName: liveRes.receiverName || 'Consignee',
            carrier: fwdCo || (fwdNo ? 'International Carrier' : 'Assigned at Airport Hub'),
            carrierTracking: fwdNo,
            carrierUrl,
            status: statusStr.includes('DELIVERED')
              ? 'delivered'
              : statusStr.includes('CARRIER') || statusStr.includes('OUT_FOR_DELIVERY')
              ? 'out_for_delivery'
              : statusStr.includes('HUB') || statusStr.includes('CUSTOMS')
              ? 'arrived_at_hub'
              : statusStr.includes('TRANSIT')
              ? 'in_progress'
              : statusStr.includes('PACK') || statusStr.includes('CREATED')
              ? 'shipment_created'
              : isActualPickedUp
              ? 'picked_up'
              : isRiderAssigned
              ? 'assigned_for_pickup'
              : 'pending',
            statusLabel,
            heroTitle,
            heroSubtitle,
            stageIndex: stageIdx,
            weight: `${liveRes.weight || liveRes.approximateWeight || '3.5'} kg`,
            volumetricWeight: `${liveRes.volumetricWeight || '3.0'} kg`,
            chargeableWeight: `${liveRes.chargeableWeight || liveRes.weight || '3.5'} kg`,
            origin: liveRes.origin || 'Kathmandu (KTM)',
            destination: liveRes.destination || 'International Destination',
            commodity: liveRes.commodity || 'Express Air Cargo',
            riderName: riderName || undefined,
            riderPhone: riderPhone || undefined,
            boxes: liveRes.boxes && liveRes.boxes.length > 0
              ? liveRes.boxes.map((b: any, i: number) => ({
                  boxNumber: b.boxNumber || i + 1,
                  dimensions: b.dimensions || (b.length && b.breadth && b.height ? `${b.length} × ${b.breadth} × ${b.height} cm` : 'Standard Box'),
                  weight: `${b.weight || liveRes.weight || '3.5'} kg`,
                  items: b.items && b.items.length > 0 ? b.items : [{ item: liveRes.commodity || 'Cargo Consignment', pieces: 1 }],
                }))
              : [
                  {
                    boxNumber: 1,
                    dimensions: '40 × 30 × 20 cm',
                    weight: `${liveRes.weight || '3.5'} kg`,
                    items: [{ item: liveRes.commodity || 'Cargo Consignment', pieces: 1 }],
                  },
                ],
            checkpoints: liveRes.checkpoints && liveRes.checkpoints.length > 0
              ? liveRes.checkpoints.map((cp: any) => ({
                  activity: cp.activity || cp.status?.replace(/_/g, ' ') || 'Checkpoint Scanned',
                  location: cp.location || 'Kathmandu Hub',
                  time: formatDateTime(cp.timestamp || cp.created_at) || 'Recently',
                  source: cp.source || 'NetPack Operations',
                }))
              : [
                  {
                    activity: heroTitle,
                    location: liveRes.origin || 'Kathmandu Hub',
                    time: formatDateTime(liveRes.createdAt || liveRes.bookingDate) || 'Recently',
                    source: 'NetPack Operations',
                  },
                ],
            weightProofImageUrl: proofImg,
            weightProofImages: proofImgs,
          })
        } else if (mockTrackingMap[trackingId]) {
          setData(mockTrackingMap[trackingId])
        }
      })
      .catch(() => {
        if (mockTrackingMap[trackingId]) {
          setData(mockTrackingMap[trackingId])
        }
      })
      .finally(() => setLoading(false))
  }, [trackingId])

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt)
    setCopied(true)
    toast.success('Copied tracking number!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSearch = () => {
    if (searchInput.trim()) {
      setTrackingId(searchInput.trim())
    }
  }

  const isAssignedRider = Boolean(data.riderName || data.statusLabel === 'Rider Assigned')
  const milestones = [
    {
      label: 'Enquiry',
      title: isAssignedRider ? 'Rider Assigned for Pickup' : 'Enquiry Generated',
      desc: data.riderName
        ? `Rider: ${data.riderName}${data.riderPhone ? ` (${data.riderPhone})` : ''} assigned for doorstep pickup`
        : 'Consignment booking registered with NetPack',
      Icon: isAssignedRider ? IconTruck : IconDocument,
    },
    { label: 'Picked Up', title: 'Cargo Picked Up', desc: 'Verified & weighed at Central Teku warehouse', Icon: IconBox },
    { label: 'Created', title: 'Shipment Created', desc: 'HAWB allocated & export clearance prepared', Icon: IconTag },
    { label: 'In Transit', title: 'In Transit (Air Cargo)', desc: `Departed KTM on flight to ${data.destination}`, Icon: IconPlane },
    { label: 'At Hub', title: 'Arrived at Destination Hub', desc: 'Customs clearance at destination terminal', Icon: IconWarehouse },
    { label: 'Carrier', title: 'Carrier Out for Delivery', desc: `Handed over to ${data.carrier} for final delivery`, Icon: IconTruck },
    { label: 'Delivered', title: 'Delivered', desc: `Delivered to ${data.receiverName}`, Icon: IconCheck },
  ]

  const currentStatusLabel = (milestones[data.stageIndex]?.title || data.statusLabel).replace(/\s*\([^)]*\)\s*$/, '')

  useEffect(() => {
    if (isFolded && activeStepRef.current && stepperScrollRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [isFolded, data.stageIndex])

  const progressPercent = Math.min(100, Math.round(((data.stageIndex + 1) / milestones.length) * 100))

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      {/* Top Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
                Consignment Tracking
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">Live airway checkpoints and status.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Sync
          </span>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Search Bar with Chips */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter Consignment or HAWB number..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50/50 font-mono text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={handleSearch}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="bg-[#0D1B2A] text-white text-xs font-600 px-3.5 py-2.5 rounded-xl active:scale-95 transition-transform cursor-pointer"
            >
              Track
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] text-gray-400 scrollbar-none">
            <span className="font-semibold text-gray-600 shrink-0">Sample:</span>
            {['NP-20240922-001', 'NP-20240910-088', 'NP-20240905-047'].map(chip => (
              <button
                key={chip}
                onClick={() => {
                  setSearchInput(chip)
                  setTrackingId(chip)
                }}
                className="px-2.5 py-0.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 font-mono text-[10px] shrink-0 border border-gray-200 transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
            <IconRefresh size={22} className="mx-auto text-blue-600 animate-spin mb-2" />
            <p className="text-xs text-gray-500 font-medium">Connecting to live airway logs...</p>
          </div>
        )}

        {!loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in-50 duration-200">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'Jost, sans-serif' }} className="font-700 text-sm text-[#0D1B2A]">
                  {data.receiverName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                  {data.carrier}
                </span>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="p-4 space-y-5">
              {/* Hero Status & Shimmer Progress Bar */}
              <div className="space-y-3">
                <div>
                  <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-800 text-[#0D1B2A] tracking-tight">
                    {data.heroTitle}
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{data.heroSubtitle}</p>
                </div>

                {/* Animated Flight Route Banner */}
                <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div className="flex items-center gap-1 font-bold text-[#0D1B2A] shrink-0">
                    <IconMapPin size={14} className="text-blue-600" />
                    <span>{data.origin}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative px-2">
                    <div className="w-full border-t border-dashed border-blue-400" />
                    <span className="absolute bg-white p-1 rounded-full border border-blue-200 shadow-2xs animate-plane-glide">
                      <IconPlane size={14} className="text-blue-600 rotate-45" />
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-[#0D1B2A] shrink-0">
                    <span>{data.destination}</span>
                    <IconMapPin size={14} className="text-emerald-600" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="relative w-full h-2 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 rounded-full transition-all duration-700 ease-out animate-shimmer"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                    <span>Kathmandu (Origin)</span>
                    <span className="font-bold text-blue-600">{progressPercent}% Completed</span>
                    <span>Consignee Delivery</span>
                  </div>
                </div>
              </div>

              {/* Milestones Stepper — "Flight Path" (Folded / Expanded) */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#16293D] p-4 space-y-4 relative overflow-hidden">
                {/* faint route texture */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" viewBox="0 0 300 160" preserveAspectRatio="none">
                  <path d="M-10 140 C 60 90, 100 160, 160 100 S 280 20, 320 -10" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 8" />
                </svg>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ fontFamily: 'Jost, sans-serif' }} className="text-[12px] font-700 text-white tracking-tight truncate">
                      {currentStatusLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsFolded(!isFolded)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    <span>{isFolded ? 'Expand' : 'Fold'}</span>
                    {isFolded ? <IconChevronDown size={13} /> : <IconChevronUp size={13} />}
                  </button>
                </div>

                {isFolded ? (
                  /* Folded View: Horizontal Scrollable Nodes */
                  <div ref={stepperScrollRef} className="overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
                    <div className="flex items-center gap-6 min-w-max px-2">
                      {milestones.map((stg, sIdx) => {
                        const isCompleted = sIdx < data.stageIndex || (sIdx === 6 && data.stageIndex === 6)
                        const isActive = sIdx === data.stageIndex && data.stageIndex < 6
                        const Icon = stg.Icon

                        return (
                          <div
                            key={stg.label}
                            ref={isActive ? activeStepRef : null}
                            className="flex flex-col items-center shrink-0 text-center"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-emerald-400 text-[#0D1B2A]'
                                  : isActive
                                  ? 'bg-gradient-to-br from-sky-400 to-[#2563EB] text-white shadow-lg ring-4 ring-sky-400/25'
                                  : 'bg-white/5 border border-white/10 text-white/30'
                              }`}
                            >
                              <Icon size={16} />
                            </div>
                            <span
                              className={`text-[9px] mt-2 font-semibold whitespace-nowrap leading-none ${
                                isActive ? 'text-sky-300' : isCompleted ? 'text-emerald-300' : 'text-white/30'
                              }`}
                            >
                              {stg.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* Expanded View: Itinerary-style Vertical Stepper */
                  <div className="relative pl-9 pt-1 space-y-4 before:absolute before:left-[15px] before:top-1 before:bottom-1 before:w-[2px] before:bg-white/10">
                    {milestones.map((stg, sIdx) => {
                      const isCompleted = sIdx < data.stageIndex || (sIdx === 6 && data.stageIndex === 6)
                      const isActive = sIdx === data.stageIndex && data.stageIndex < 6
                      const Icon = stg.Icon

                      return (
                        <div key={stg.label} className="relative text-left">
                          <div
                            className={`absolute -left-9 top-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                              isCompleted
                                ? 'bg-emerald-400 text-[#0D1B2A]'
                                : isActive
                                ? 'bg-gradient-to-br from-sky-400 to-[#2563EB] text-white ring-4 ring-sky-400/25'
                                : 'bg-white/5 border border-white/10 text-white/30'
                            }`}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="pt-1">
                            <p
                              style={{ fontFamily: 'Jost, sans-serif' }}
                              className={`text-[13px] font-700 leading-tight ${
                                isActive ? 'text-sky-300' : isCompleted ? 'text-white' : 'text-white/35'
                              }`}
                            >
                              {stg.title}
                            </p>
                            <p className={`text-[11px] leading-snug mt-0.5 ${isActive || isCompleted ? 'text-white/55' : 'text-white/20'}`}>
                              {stg.desc}
                            </p>
                            {(sIdx === 1 || sIdx === 2) && ((data.weightProofImages && data.weightProofImages.length > 0) || data.weightProofImageUrl) && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhotoIndex(0)}
                                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/30 text-[10px] font-semibold transition-all cursor-pointer"
                              >
                                <IconScale size={12} />
                                <span>
                                  View Verified Proof ({data.weightProofImages && data.weightProofImages.length > 1 ? `${data.weightProofImages.length} Photos` : data.weight})
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Assigned Rider for Pickup Milestone Banner Card */}
              {data.stageIndex === 0 && Boolean(data.riderName || data.statusLabel === 'Rider Assigned') && (
                <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/60 p-4 shadow-sm animate-in fade-in-50 duration-200 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <IconTruck size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                            Rider Assigned for Pickup
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <h3 style={{ fontFamily: 'Jost, sans-serif' }} className="font-700 text-sm text-[#0D1B2A] mt-1">
                          {data.riderName || 'NetPack Dedicated Courier'}
                        </h3>
                        {data.riderPhone && (
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                            {data.riderPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    {data.riderPhone && (
                      <a
                        href={`tel:${data.riderPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
                      >
                        <IconPhone size={14} />
                        <span>Call Rider</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-[11px] text-blue-900/80">
                    <span>Assigned for doorstep pickup & scale weighing</span>
                    <span className="font-semibold text-blue-700">En Route</span>
                  </div>
                </div>
              )}

              {/* Doorstep Cargo Pickup Banner / Re-booking / Multi-Stop Request */}
              {data.stageIndex < 2 && !['shipment_created', 'delivered', 'carrier_scanned', 'in_transit'].includes((data.status || '').toLowerCase()) && (
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm flex items-center justify-between gap-3 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <IconTruck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0D1B2A]">Need Doorstep Pickup or Route Change?</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Book or add multi-location pickup stops before shipment creation.</p>
                    </div>
                  </div>
                  {onRequestPickup && (
                    <button
                      onClick={() => onRequestPickup(data.tracking || trackingId)}
                      className="px-3 py-2 rounded-xl bg-[#0D1B2A] hover:bg-black text-white text-xs font-semibold shrink-0 cursor-pointer transition-all active:scale-95 whitespace-nowrap shadow-xs"
                    >
                      Book / Update
                    </button>
                  )}
                </div>
              )}

              {/* Warehouse Verified Weight Scale Photo Card */}
              {((data.weightProofImages && data.weightProofImages.length > 0) || data.weightProofImageUrl) && (() => {
                const photos = (data.weightProofImages && data.weightProofImages.length > 0)
                  ? data.weightProofImages
                  : (data.weightProofImageUrl ? [data.weightProofImageUrl] : [])

                return (
                  <div className="rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <IconScale size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0D1B2A] leading-tight">Warehouse Verified Weight</p>
                          <p className="text-[10px] text-gray-400">Electronic Scale Calibration Proof</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {photos.length > 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {photos.length} Photos
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {data.weight} Certified
                        </span>
                      </div>
                    </div>

                    {/* Photo Thumbnails Gallery */}
                    <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/60 space-y-2.5">
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {photos.map((imgUrl, pIdx) => {
                          const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setPreviewPhotoIndex(pIdx)}
                              className="relative group overflow-hidden rounded-xl border border-emerald-200 shadow-2xs shrink-0 cursor-pointer h-20 w-24 bg-black/10"
                            >
                              <img
                                src={fullUrl}
                                alt={`Proof ${pIdx + 1}`}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                                View #{pIdx + 1}
                              </div>
                              {photos.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/75 text-[9px] font-mono text-white px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                  #{pIdx + 1}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      <div className="pt-1 border-t border-emerald-100/80 space-y-1">
                        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                            <span className="text-gray-400 block text-[10px]">Gross Weight:</span>
                            <span className="font-bold text-[#0D1B2A]">{data.weight}</span>
                          </div>
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                            <span className="text-gray-400 block text-[10px]">Volumetric:</span>
                            <span className="font-medium text-gray-700">{data.volumetricWeight}</span>
                          </div>
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                            <span className="text-gray-400 block text-[10px]">Chargeable:</span>
                            <span className="font-bold text-emerald-700">{data.chargeableWeight}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoIndex(0)}
                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect {photos.length > 1 ? `All ${photos.length} Verified Photos` : 'Scale Proof Photo'}</span>
                            <IconArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Overseas Courier Leg Card */}
              <div className="rounded-xl border border-gray-100 p-3.5 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Overseas Forwarding Courier</span>
                  <span className="font-bold text-[#0D1B2A]">{data.carrier}</span>
                </div>
                {data.carrierTracking ? (
                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Carrier AWB / Tracking</p>
                      <p className="font-mono font-bold text-xs text-[#0D1B2A] mt-0.5">{data.carrierTracking}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(data.carrierTracking)}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-blue-600 active:scale-95 transition-all cursor-pointer"
                        title="Copy Tracking Number"
                      >
                        {copied ? <IconCheck size={14} className="text-emerald-600" /> : <IconCopy size={14} />}
                      </button>
                      {data.carrierUrl && (
                        <a
                          href={data.carrierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-blue-600 active:scale-95 transition-all inline-flex items-center justify-center"
                          title="Track on Carrier Website"
                        >
                          <IconExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Carrier AWB / Tracking</p>
                      <p className="text-xs text-slate-600 mt-0.5">Assigned upon flight departure & customs handover</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Pending Handover
                    </span>
                  </div>
                )}
              </div>

              {/* Transit Checkpoints & Scans */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Activity Checkpoints</span>
                  <span className="text-[11px] text-gray-400">{data.checkpoints.length} scans</span>
                </div>
                <div className="space-y-2">
                  {data.checkpoints.map((cp, idx) => (
                    <div key={idx} className="bg-gray-50/70 rounded-xl p-3 border border-gray-100 flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {idx === 0 ? (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-[#0D1B2A] leading-tight">{cp.activity}</p>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{cp.location}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{cp.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Specifications Drawer */}
              <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => setIsBoxesOpen(!isBoxesOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-2">
                    <IconScale size={16} className="text-blue-600" />
                    <span style={{ fontFamily: 'Jost, sans-serif' }} className="font-700 text-xs text-[#0D1B2A]">
                      Package Specifications & Item Breakdown
                    </span>
                  </div>
                  {isBoxesOpen ? <IconChevronUp size={16} className="text-gray-400" /> : <IconChevronDown size={16} className="text-gray-400" />}
                </button>

                {isBoxesOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                        <p className="text-[10px] text-gray-400">Actual Wt</p>
                        <p className="font-bold text-xs text-[#0D1B2A] mt-0.5">{data.weight}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                        <p className="text-[10px] text-gray-400">Volumetric</p>
                        <p className="font-bold text-xs text-[#0D1B2A] mt-0.5">{data.volumetricWeight}</p>
                      </div>
                      <div className="bg-blue-50/60 rounded-xl p-2 border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-medium">Chargeable</p>
                        <p className="font-bold text-xs text-blue-700 mt-0.5">{data.chargeableWeight}</p>
                      </div>
                    </div>

                    {data.boxes.map(box => (
                      <div key={box.boxNumber} className="bg-gray-50/70 rounded-xl p-3 border border-gray-100 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#0D1B2A]">Box #{box.boxNumber}</span>
                          <span className="text-[11px] text-gray-500 font-mono">{box.dimensions}</span>
                        </div>
                        <div className="pt-1 border-t border-gray-100 space-y-1">
                          {box.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] text-gray-600">
                              <span>• {item.item}</span>
                              <span className="font-semibold text-gray-800">{item.pieces} pcs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consignment Metadata Card */}
              <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/60 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Consignment Number</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-[#0D1B2A]">
                    <span>{data.tracking}</span>
                    <button onClick={() => handleCopy(data.tracking)} className="text-gray-400 hover:text-blue-600 cursor-pointer">
                      <IconCopy size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Route</span>
                  <span className="font-semibold text-[#0D1B2A]">
                    {data.origin} ➔ {data.destination}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Commodity</span>
                  <span className="font-semibold text-[#0D1B2A]">{data.commodity}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scale Proof Photo Lightbox Modal */}
      {previewPhotoIndex !== null && (
        <ScalePhotoModal
          photoUrls={
            data.weightProofImages && data.weightProofImages.length > 0
              ? data.weightProofImages
              : data.weightProofImageUrl
              ? [data.weightProofImageUrl]
              : []
          }
          initialIndex={previewPhotoIndex}
          weight={data.weight}
          trackingNumber={data.tracking}
          onClose={() => setPreviewPhotoIndex(null)}
        />
      )}
    </div>
  )
}

// ─── Book Screen (Progressive 3-Step Flow) ─────────────────────────────────────

const COMMODITY_CHIPS = [
  'Handicrafts & Souvenirs',
  'Pashmina & Woolen Garments',
  'Documents / Business Papers',
  'Himalayan Tea & Spices',
  'Personal Effects & Gifts',
  'Organic Herbal Products',
]

const TIME_SLOTS = [
  'Morning (10:00 AM – 01:00 PM)',
  'Afternoon (01:00 PM – 05:00 PM)',
  'Evening (05:00 PM – 08:00 PM)',
]

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-semibold text-[#0D1B2A] mb-1.5 block">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0D1B2A] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
    />
  )
}

function CustomerPickupRequestModal({
  isOpen,
  trackingNumber,
  customerUser,
  shipments,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  trackingNumber: string
  customerUser?: any
  shipments?: Shipment[]
  onClose: () => void
  onSuccess?: () => void
}) {
  const [selectedTracking, setSelectedTracking] = useState(trackingNumber === 'SELECT' ? '' : trackingNumber || '')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0])
  const [notes, setNotes] = useState('')
  const [extraStops, setExtraStops] = useState<
    Array<{ id: string; address: string; phone: string; timeSlot: string; notes: string }>
  >([])
  const [loading, setLoading] = useState(false)

  // Initialize from user profile
  useEffect(() => {
    if (isOpen) {
      setSelectedTracking(trackingNumber === 'SELECT' ? '' : trackingNumber || '')
      const userSavedAddress = customerUser?.address1
        ? `${customerUser.address1}${
            customerUser.city && !customerUser.address1.toLowerCase().includes(customerUser.city.toLowerCase())
              ? `, ${customerUser.city}`
              : ''
          }`
        : ''
      const userSavedPhone =
        customerUser?.phone && customerUser.phone !== '+977-9800000000' && customerUser.phone !== '9869233939'
          ? customerUser.phone
          : ''
      setAddress(userSavedAddress)
      setPhone(userSavedPhone)
      setTimeSlot(TIME_SLOTS[0])
      setNotes('')
      setExtraStops([])
    }
  }, [isOpen, trackingNumber, customerUser])

  if (!isOpen) return null

  const handleAddStop = () => {
    setExtraStops(prev => [
      ...prev,
      {
        id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        address: '',
        phone: phone || '',
        timeSlot: TIME_SLOTS[0],
        notes: '',
      },
    ])
  }

  const handleRemoveStop = (id: string) => {
    setExtraStops(prev => prev.filter(s => s.id !== id))
  }

  const handleUpdateStop = (id: string, field: string, val: string) => {
    setExtraStops(prev => prev.map(s => (s.id === id ? { ...s, [field]: val } : s)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetTracking = (selectedTracking || trackingNumber || '').trim()
    if (!targetTracking || targetTracking === 'SELECT') {
      toast.error('Please specify a consignment / booking reference number')
      return
    }
    if (!address.trim()) {
      toast.error('Please enter the primary pickup address')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter the contact phone number')
      return
    }

    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('netpack_customer_token') : null
      const allPickupLocations = [
        {
          location: address.trim(),
          phone: phone.trim(),
          timeSlot,
          note: notes.trim(),
        },
        ...extraStops.map(s => ({
          location: s.address.trim(),
          phone: s.phone.trim(),
          timeSlot: s.timeSlot,
          note: s.notes.trim(),
        })),
      ].filter(p => p.location.length > 0)

      const payload = {
        trackingNumber: targetTracking,
        pickupAddress: address.trim(),
        pickupPhone: phone.trim(),
        pickupPreferredTime: timeSlot,
        pickupNote: notes.trim(),
        pickupLocations: allPickupLocations,
      }

      const res = await fetch(`${API_BASE}/api/customer/pickup-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to schedule pickup request')
      }

      toast.success(data.message || 'Doorstep pickup scheduled successfully!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit pickup request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <IconTruck size={18} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-base font-700 text-[#0D1B2A] leading-tight">
                Schedule Doorstep Pickup
              </h2>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                {selectedTracking ? `Booking #: ${selectedTracking}` : 'Existing Consignment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <IconClose size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-[11px] text-blue-900 leading-snug">
            💡 Doorstep pickup can be requested or updated anytime <strong>before official shipment dispatch</strong>. Our courier rider will arrive with calibrated digital weighing scales.
          </div>

          {(!trackingNumber || trackingNumber === 'SELECT') && (
            <div>
              <FieldLabel required>Consignment / Booking Number</FieldLabel>
              {shipments && shipments.filter(s => s.status !== 'shipment_created' && s.status !== 'delivered').length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedTracking}
                    onChange={e => setSelectedTracking(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">-- Choose from your pending bookings --</option>
                    {shipments
                      .filter(s => s.status !== 'shipment_created' && s.status !== 'delivered')
                      .map(s => (
                        <option key={s.id} value={s.tracking}>
                          {s.tracking} — {s.destination} ({s.commodity})
                        </option>
                      ))}
                  </select>
                  <TextInput
                    placeholder="Or type another consignment number (e.g. NP-20240922-001)"
                    value={selectedTracking}
                    onChange={setSelectedTracking}
                  />
                </div>
              ) : (
                <TextInput
                  placeholder="e.g. NP-20240922-001"
                  value={selectedTracking}
                  onChange={setSelectedTracking}
                />
              )}
            </div>
          )}

          <div>
            <FieldLabel required>Primary Pickup Address (Kathmandu)</FieldLabel>
            <TextInput
              placeholder="e.g. House #14, Thamel Marg, Kathmandu"
              value={address}
              onChange={setAddress}
            />
          </div>

          <div>
            <FieldLabel required>Contact Phone Number</FieldLabel>
            <TextInput
              placeholder="e.g. 9841234567"
              value={phone}
              onChange={setPhone}
              type="tel"
            />
          </div>

          <div>
            <FieldLabel required>Preferred Pickup Time Slot</FieldLabel>
            <select
              value={timeSlot}
              onChange={e => setTimeSlot(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Special Instructions / Notes</FieldLabel>
            <textarea
              placeholder="e.g. Ring the bell at gate #2, cargo is wrapped and ready on 1st floor."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-[#0D1B2A] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {/* Multi-Location Pickup Stops */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#0D1B2A]">Multi-Location Pickup Stops</p>
                <p className="text-[10px] text-gray-400">Need rider to collect from multiple addresses?</p>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 active:scale-95 transition-all cursor-pointer"
              >
                + Add Stop
              </button>
            </div>

            {extraStops.map((stop, idx) => (
              <div key={stop.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Additional Stop #{idx + 2}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(stop.id)}
                    className="text-red-500 hover:text-red-700 font-normal text-[11px] cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <TextInput
                  placeholder="Stop address, e.g. Warehouse 2, Patan"
                  value={stop.address}
                  onChange={v => handleUpdateStop(stop.id, 'address', v)}
                />
                <TextInput
                  placeholder="Contact phone at this stop"
                  value={stop.phone}
                  onChange={v => handleUpdateStop(stop.id, 'phone', v)}
                  type="tel"
                />
                <TextInput
                  placeholder="Stop notes (e.g. 2 boxes here)"
                  value={stop.notes}
                  onChange={v => handleUpdateStop(stop.id, 'notes', v)}
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="w-full py-3 bg-[#0D1B2A] hover:bg-[#1a2f47] disabled:opacity-50 text-white rounded-xl font-700 text-sm shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <IconRefresh size={16} className="animate-spin text-white" />
                  <span>Submitting Pickup Request...</span>
                </>
              ) : (
                <>
                  <IconCheck size={16} />
                  <span>Confirm & Dispatch Pickup Rider</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookScreen({
  onComplete,
  customerUser,
  onRequestExistingPickup,
}: {
  onComplete: (newShipment: Shipment) => void
  customerUser?: any
  onRequestExistingPickup?: () => void
}) {
  const [step, setStep] = useState<BookStep>(1)
  const [commodity, setCommodity] = useState('')
  const [weight, setWeight] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [destCountry, setDestCountry] = useState('')
  const [destCity, setDestCity] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [doorstepPickup, setDoorstepPickup] = useState(true)

  const userSavedAddress = customerUser?.address1
    ? `${customerUser.address1}${
        customerUser.city && !customerUser.address1.toLowerCase().includes(customerUser.city.toLowerCase())
          ? `, ${customerUser.city}`
          : ''
      }`
    : ''
  const userSavedPhone =
    customerUser?.phone && customerUser.phone !== '+977-9800000000' && customerUser.phone !== '9869233939'
      ? customerUser.phone
      : ''

  const [pickupAddress, setPickupAddress] = useState(userSavedAddress)
  const [pickupPhone, setPickupPhone] = useState(userSavedPhone)
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0])
  const [pickupNotes, setPickupNotes] = useState('')
  const [extraStops, setExtraStops] = useState<
    Array<{ id: string; address: string; phone: string; timeSlot: string; notes: string }>
  >([])
  const [submitted, setSubmitted] = useState(false)
  const [bookingTracking, setBookingTracking] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAddPickupStop = () => {
    setExtraStops(prev => [
      ...prev,
      {
        id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        address: '',
        phone: userSavedPhone || '',
        timeSlot: TIME_SLOTS[0],
        notes: '',
      },
    ])
  }

  const handleRemovePickupStop = (id: string) => {
    setExtraStops(prev => prev.filter(s => s.id !== id))
  }

  const handleUpdatePickupStop = (id: string, field: string, val: string) => {
    setExtraStops(prev => prev.map(s => (s.id === id ? { ...s, [field]: val } : s)))
  }

  const handleUseMyAddressForPickup = () => {
    if (userSavedAddress) {
      setPickupAddress(userSavedAddress)
      if (userSavedPhone) setPickupPhone(userSavedPhone)
      toast.success('Pickup address filled from your profile!')
    } else {
      toast.error('No saved address in your profile. Please enter your address.')
    }
  }

  const handleUseMyAddressForDelivery = () => {
    if (customerUser?.address1) {
      setStreetAddress(customerUser.address1)
      if (customerUser?.city) setDestCity(customerUser.city)
      if (customerUser?.name) setRecipientName(customerUser.name)
      if (userSavedPhone) setRecipientPhone(userSavedPhone)
      toast.success('Address filled from your profile!')
    } else {
      toast.error('No saved address in your profile.')
    }
  }

  const handleConfirmBooking = async () => {
    setSubmitting(true)
    let finalTracking = `NP-${Date.now().toString().slice(-6)}`
    let finalEnquiryId = String(Date.now())

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('netpack_customer_token') : null

      const allPickupLocations = doorstepPickup
        ? [
            {
              location: pickupAddress,
              phone: pickupPhone,
              timeSlot: timeSlot,
              note: pickupNotes,
            },
            ...extraStops.map(s => ({
              location: s.address,
              phone: s.phone,
              timeSlot: s.timeSlot,
              note: s.notes,
            })),
          ].filter(p => p.location && p.location.trim().length > 0)
        : []

      const payloadData = {
        commodity: commodity || 'General Cargo',
        approximateWeight: parseFloat(weight) || 1,
        receiverName: recipientName,
        receiverPhone: recipientPhone,
        receiverCountry: destCountry,
        receiverCity: destCity,
        receiverAddress: streetAddress,
        receiverPostcode: postalCode,
        isPickupRequired: doorstepPickup,
        pickupAddress: doorstepPickup ? pickupAddress : 'Drop-off at NetPack Teku Hub',
        pickupPhone,
        pickupPreferredTime: timeSlot,
        pickupNote: pickupNotes,
        pickupLocations: allPickupLocations,
      }

      let res = await fetch(`${API_BASE}/api/customer/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payloadData),
      })
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payloadData),
        })
      }

      if (res.ok) {
        const data = await res.json()
        if (data.trackingNumber) finalTracking = data.trackingNumber
        if (data.enquiryId) finalEnquiryId = String(data.enquiryId)
      }
    } catch (err) {
      console.warn('Booking network issue:', err)
    }

    setBookingTracking(finalTracking)

    const created: Shipment = {
      id: finalEnquiryId,
      tracking: finalTracking,
      destination: `${destCity || 'Destination'}, ${destCountry || 'Country'}`,
      country: destCountry,
      commodity: commodity || 'General Cargo',
      weight: `${weight || '1.0'} kg`,
      status: 'pending',
      date: 'Today',
      receiverName: recipientName,
      receiverCity: destCity,
    }
    onComplete(created)
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28 flex flex-col items-center justify-center px-6 text-center animate-in fade-in-50 duration-200">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
          <IconCheck size={36} className="text-white" />
        </div>
        <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-2xl font-700 text-[#0D1B2A]">
          Booking Confirmed!
        </h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">
          Your consignment has been recorded. A NetPack rider will collect your cargo during the chosen time slot.
        </p>
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4 w-full max-w-xs text-left shadow-xs">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Booking Summary</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tracking</span>
              <span className="font-mono font-semibold text-[#0D1B2A] text-xs">{bookingTracking}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Destination</span>
              <span className="font-semibold text-[#0D1B2A] text-xs truncate max-w-[140px]">
                {destCity || 'N/A'}, {destCountry || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Commodity</span>
              <span className="font-semibold text-[#0D1B2A] text-xs truncate max-w-[140px]">{commodity || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Weight</span>
              <span className="font-semibold text-[#0D1B2A]">{weight ? `${weight} kg` : 'N/A'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitted(false)
            setStep(1)
          }}
          style={{ fontFamily: 'Jost, sans-serif' }}
          className="mt-5 bg-[#0D1B2A] text-white font-600 text-sm px-8 py-3 rounded-xl active:opacity-90 cursor-pointer"
        >
          Book Another Consignment
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      {/* Progress Indicator */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
            Create Booking
          </h1>
          <span className="text-[12px] text-gray-400 font-medium">Step {step} of 3</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          {([1, 2, 3] as BookStep[]).map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-[#2563EB]' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {/* Existing Booking Pickup Prompt */}
      {onRequestExistingPickup && step === 1 && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IconTruck size={17} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0D1B2A]">Already have a Consignment Number?</p>
              <p className="text-[11px] text-gray-500">Book or add multi-stop pickup for your existing booking.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequestExistingPickup}
            className="px-3 py-1.5 rounded-xl bg-[#0D1B2A] text-white text-xs font-semibold shrink-0 cursor-pointer hover:bg-black transition-all active:scale-95 whitespace-nowrap shadow-xs"
          >
            Book Pickup
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <IconBox size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-blue-900">Professional Packaging by NetPack Logistics</p>
          <p className="text-[12px] text-blue-700/80 mt-0.5 leading-relaxed">
            Specify your <strong>commodity</strong> and <strong>approximate weight</strong> — our hub handles packaging to airline specs.
          </p>
        </div>
      </div>

      {/* Step 1: Cargo Details */}
      {step === 1 && (
        <div className="px-4 space-y-5 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">1</span>
              </div>
              <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="font-700 text-[#0D1B2A] uppercase text-[11px] tracking-widest">
                Cargo Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel required>Commodity Description</FieldLabel>
                <TextInput placeholder="e.g., Handicrafts, Woolen Garments, Docs" value={commodity} onChange={setCommodity} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {COMMODITY_CHIPS.map(chip => (
                    <button
                      key={chip}
                      onClick={() => setCommodity(chip)}
                      className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        commodity === chip ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]' : 'text-gray-600 border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel required>Approximate Weight (kg)</FieldLabel>
                <TextInput placeholder="e.g., 2.5" value={weight} onChange={setWeight} type="number" />
                <p className="text-[11px] text-gray-400 mt-1.5">Gross weight estimate. Exact weight verified at warehouse scale.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!commodity || !weight}
            style={{ fontFamily: 'Jost, sans-serif' }}
            className="w-full bg-[#2563EB] disabled:bg-gray-300 disabled:shadow-none text-white font-600 text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 transition-opacity shadow-md shadow-blue-200 cursor-pointer"
          >
            Next: Destination Details <IconArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Destination */}
      {step === 2 && (
        <div className="px-4 space-y-5 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">2</span>
              </div>
              <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="font-700 text-[#0D1B2A] uppercase text-[11px] tracking-widest">
                Destination & Recipient
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel required>Recipient Full Name</FieldLabel>
                <TextInput placeholder="Full name of receiver" value={recipientName} onChange={setRecipientName} />
              </div>
              <div>
                <FieldLabel required>Recipient Phone</FieldLabel>
                <TextInput placeholder="+1 234 567 8900" value={recipientPhone} onChange={setRecipientPhone} type="tel" />
              </div>
              <div>
                <FieldLabel required>Destination Country</FieldLabel>
                <TextInput placeholder="Select or type destination country" value={destCountry} onChange={setDestCountry} />
              </div>
              <div>
                <FieldLabel required>Destination City</FieldLabel>
                <TextInput placeholder="e.g., London, New York, Tokyo" value={destCity} onChange={setDestCity} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel required>Delivery Street Address</FieldLabel>
                  {customerUser?.address1 && (
                    <button
                      type="button"
                      onClick={handleUseMyAddressForDelivery}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <IconMapPin size={11} /> Use my address
                    </button>
                  )}
                </div>
                <TextInput placeholder="Street, Building, Apartment / Suite number" value={streetAddress} onChange={setStreetAddress} />
              </div>
              <div>
                <FieldLabel>Postal / Zip Code</FieldLabel>
                <TextInput placeholder="e.g., SW1A 1AA / 10001" value={postalCode} onChange={setPostalCode} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white text-gray-600 font-medium text-sm py-3.5 rounded-xl border border-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!recipientName || !destCountry || !destCity || !streetAddress}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="flex-[2] bg-[#2563EB] disabled:bg-gray-300 disabled:shadow-none text-white font-600 text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 shadow-md shadow-blue-200 cursor-pointer"
            >
              Next: Pickup Details <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Pickup Details */}
      {step === 3 && (
        <div className="px-4 space-y-5 animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <IconTruck size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0D1B2A]">Doorstep Pickup by Rider</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">A NetPack rider will collect cargo at your location.</p>
                </div>
              </div>
              <button
                onClick={() => setDoorstepPickup(!doorstepPickup)}
                className={`w-11 h-6 rounded-full transition-all cursor-pointer ${doorstepPickup ? 'bg-[#2563EB]' : 'bg-gray-300'} relative`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${doorstepPickup ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {doorstepPickup && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel required>Pickup Address in Kathmandu</FieldLabel>
                  {customerUser?.address1 && (
                    <button
                      type="button"
                      onClick={handleUseMyAddressForPickup}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <IconMapPin size={12} />
                      Use my address
                    </button>
                  )}
                </div>
                <TextInput placeholder="e.g., Thamel, Teku, New Road, Lazimpat" value={pickupAddress} onChange={setPickupAddress} />
              </div>
              <div>
                <FieldLabel required>Contact Phone for Driver</FieldLabel>
                <TextInput placeholder="e.g., 9841XXXXXX" value={pickupPhone} onChange={setPickupPhone} type="tel" />
              </div>
              <div>
                <FieldLabel>Preferred Time Slot</FieldLabel>
                <div className="relative">
                  <select
                    value={timeSlot}
                    onChange={e => setTimeSlot(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <IconChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <FieldLabel>Pickup Notes for Driver</FieldLabel>
                <TextInput placeholder="e.g., Near landmark, call before arriving" value={pickupNotes} onChange={setPickupNotes} />
              </div>

              {/* Extra Pickup Stops */}
              {extraStops.map((stop, sIdx) => (
                <div key={stop.id} className="bg-blue-50/40 rounded-xl border border-blue-200/80 p-3.5 space-y-3 relative">
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {sIdx + 2}
                      </span>
                      <span className="text-xs font-bold text-[#0D1B2A]">
                        Additional Pickup Location #{sIdx + 2}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePickupStop(stop.id)}
                      className="text-red-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <IconClose size={12} /> Remove
                    </button>
                  </div>

                  <div>
                    <FieldLabel required>Stop #{sIdx + 2} Address in Kathmandu</FieldLabel>
                    <TextInput
                      placeholder="e.g., Patan, Baneshwor, Baluwatar"
                      value={stop.address}
                      onChange={v => handleUpdatePickupStop(stop.id, 'address', v)}
                    />
                  </div>

                  <div>
                    <FieldLabel required>Contact Phone for Stop #{sIdx + 2}</FieldLabel>
                    <TextInput
                      placeholder="e.g., 98XXXXXXXX"
                      value={stop.phone}
                      onChange={v => handleUpdatePickupStop(stop.id, 'phone', v)}
                      type="tel"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Time Slot</FieldLabel>
                      <div className="relative">
                        <select
                          value={stop.timeSlot}
                          onChange={e => handleUpdatePickupStop(stop.id, 'timeSlot', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none font-medium"
                        >
                          {TIME_SLOTS.map(t => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <IconChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Notes / Landmark</FieldLabel>
                      <TextInput
                        placeholder="e.g., Near landmark"
                        value={stop.notes}
                        onChange={v => handleUpdatePickupStop(stop.id, 'notes', v)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Another Pickup Location Button */}
              <button
                type="button"
                onClick={handleAddPickupStop}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
              >
                <span>+ Add Another Pickup Location (Multi-Stop)</span>
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white text-gray-600 font-medium text-sm py-3.5 rounded-xl border border-gray-200 active:bg-gray-50 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={submitting || (doorstepPickup && (!pickupAddress.trim() || !pickupPhone.trim()))}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="flex-[2] bg-[#0D1B2A] disabled:bg-gray-300 text-white font-600 text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 shadow-md shadow-slate-300 cursor-pointer"
            >
              {submitting ? 'Confirming...' : 'Confirm & Request Pickup'}
              <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notifications Screen ─────────────────────────────────────────────────────

const notifIconMap = {
  welcome: { bg: 'bg-blue-50', icon: <IconStar size={14} className="text-blue-500" /> },
  update: { bg: 'bg-amber-50', icon: <IconTruck size={14} className="text-amber-500" /> },
  delivered: { bg: 'bg-emerald-50', icon: <IconCheck size={14} className="text-emerald-500" /> },
  alert: { bg: 'bg-red-50', icon: <IconBell size={14} className="text-red-500" /> },
}

function NotificationsScreen({
  onBack,
  items = [],
  onMarkAllRead,
  onMarkRead,
  onSelectNotification,
}: {
  onBack: () => void
  items?: NotificationItem[]
  onMarkAllRead?: () => void
  onMarkRead?: (id: string) => void
  onSelectNotification?: (item: NotificationItem) => void
}) {
  const unread = items.filter(n => !n.read).length

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
                Notifications
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">Live cargo milestone alerts.</p>
            </div>
          </div>
          {unread > 0 && onMarkAllRead && (
            <button onClick={onMarkAllRead} className="text-[12px] text-blue-600 font-semibold mt-1 cursor-pointer">
              Mark all read
            </button>
          )}
        </div>

        {unread > 0 && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[12px] text-blue-700 font-medium">
              {unread} unread notification{unread > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 flex flex-col gap-2.5">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <IconBell size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">No notifications yet.</p>
          </div>
        ) : (
          items.map(n => {
            const { bg, icon } = notifIconMap[n.type] || notifIconMap.alert
            return (
              <button
                key={n.id}
                onClick={() => {
                  onMarkRead?.(n.id)
                  if (n.tracking) {
                    onSelectNotification?.(n)
                  }
                }}
                className={`w-full text-left rounded-2xl border p-4 flex flex-col gap-2 transition-all active:scale-[0.99] cursor-pointer ${
                  n.read ? 'bg-white border-gray-100' : 'bg-white border-blue-100 shadow-xs'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${n.read ? 'font-medium text-[#0D1B2A]' : 'font-semibold text-[#0D1B2A]'}`}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">{n.time}</p>
                  </div>
                </div>
                {n.tracking && (
                  <div className="mt-1 pt-2 border-t border-gray-100/90 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      AWB: {n.tracking}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 inline-flex items-center gap-1">
                      Track Shipment &rarr;
                    </span>
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

function ProfileScreen({
  userName,
  userEmail,
  userPhone,
  userAddress,
  userAddress2,
  userCity,
  userPostcode,
  userCountry,
  photoUrl,
  customerToken,
  shipmentCount,
  deliveredCount,
  onSignOut,
  onOpenEditProfile,
  onProfileUpdated,
}: {
  userName?: string
  userEmail?: string
  userPhone?: string
  userAddress?: string
  userAddress2?: string
  userCity?: string
  userPostcode?: string
  userCountry?: string
  photoUrl?: string
  customerToken?: string | null
  shipmentCount: number
  deliveredCount: number
  onSignOut: () => void
  onOpenEditProfile?: () => void
  onProfileUpdated?: (updated: any) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !customerToken) return

    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch(`${API_BASE}/api/customer/profile/upload-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      if (data.customer) {
        onProfileUpdated?.(data.customer)
        toast.success('Profile picture updated!')
      }
    } catch (err: any) {
      toast.error('Failed uploading picture: ' + err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const avatarSrc = photoUrl
    ? photoUrl.startsWith('http') || photoUrl.startsWith('data:')
      ? photoUrl
      : `${API_BASE}${photoUrl}`
    : null

  const countryDisplay =
    typeof userCountry === 'string'
      ? userCountry
      : (userCountry as any)?.name || 'Nepal'

  const profileFields = [
    { label: 'Country', value: countryDisplay },
    { label: 'Full Name', value: userName || 'Customer' },
    { label: 'Email Address', value: userEmail || 'customer@example.com' },
    {
      label: 'Phone Number',
      value: userPhone && userPhone !== '+977-9800000000' ? userPhone : 'Not provided',
    },
    {
      label: 'Address Line 1',
      value: userAddress || 'Not provided',
    },
    {
      label: 'Address Line 2',
      value: userAddress2 || '—',
    },
    { label: 'City', value: userCity || 'Kathmandu' },
    { label: 'Postcode', value: userPostcode || '—' },
  ]

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
            Profile
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage your account and preferences.</p>
        </div>
        <button
          onClick={onOpenEditProfile}
          className="bg-[#0D1B2A] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition-transform cursor-pointer"
        >
          Edit Profile
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFile}
          />
          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            {avatarSrc ? (
              <img src={avatarSrc} alt={userName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-3xl">
                {(userName || 'C').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0D1B2A] rounded-xl flex items-center justify-center border-2 border-[#F1F4F8] shadow-xs cursor-pointer active:scale-90 transition-transform"
            title="Upload photo"
          >
            {uploadingPhoto ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconCamera size={14} className="text-white" />
            )}
          </button>
        </div>
        <p style={{ fontFamily: 'Jost, sans-serif' }} className="mt-3 text-base font-700 text-[#0D1B2A]">
          {userName || 'Customer'}
        </p>
        <p className="text-[12px] text-gray-400">{userEmail || 'customer@example.com'}</p>
        <button
          onClick={onOpenEditProfile}
          className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
        >
          <IconUser size={13} /> Edit Contact & Address
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Info Card - Picture 3 specifications */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          {profileFields.map((f, i) => (
            <div
              key={f.label}
              className={`flex items-center justify-between px-4 py-3 ${i < profileFields.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className="text-[12px] text-gray-400 font-medium">{f.label}</span>
              <span className="text-[13px] font-semibold text-[#0D1B2A] text-right max-w-[55%] truncate">{f.value}</span>
            </div>
          ))}
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Activity</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F1F4F8] rounded-xl p-3">
              <p style={{ fontFamily: 'Jost, sans-serif' }} className="text-2xl font-700 text-[#0D1B2A]">
                {shipmentCount}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Total Consignments</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p style={{ fontFamily: 'Jost, sans-serif' }} className="text-2xl font-700 text-emerald-600">
                {deliveredCount}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Delivered</p>
            </div>
          </div>
        </div>

        {/* Sign Out with generous bottom padding for bottom navigation bar */}
        <div className="pt-2 pb-28">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-semibold text-sm py-3.5 rounded-2xl active:opacity-90 transition-opacity shadow-md shadow-red-100 cursor-pointer"
          >
            <IconLogout size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}


function PasswordInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl pl-4 pr-11 py-3 text-sm text-[#0D1B2A] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all font-sans"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
        tabIndex={-1}
      >
        {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  )
}

// ─── Branded Auth Screen (netpackpwa ui) ──────────────────────────────────────

type AuthMode = 'login' | 'signup' | 'code'

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: any, token: string) => void }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Email Code fields
  const [codeEmail, setCodeEmail] = useState('')
  const [codeOtp, setCodeOtp] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  // Signup fields
  const [country, setCountry] = useState('Nepal')
  const [signupDialCode, setSignupDialCode] = useState('+977')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('Kathmandu')
  const [stateProvince, setStateProvince] = useState('')
  const [postcode, setPostcode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleCountryChange = (cName: string) => {
    setCountry(cName)
    const opt = COUNTRY_OPTIONS.find(c => c.name === cName)
    if (opt) setSignupDialCode(opt.dialCode)
  }

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const signupValid = Boolean(
    fullName && email && phone && address1 && city && stateProvince.trim() && postcode.trim() && country && password && confirmPassword && password === confirmPassword
  )
  const loginValid = Boolean(loginEmail && loginPassword)

  const handleLogin = async () => {
    setLoading(true)
    try {
      let res = await fetch(`${API_BASE}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      })
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}/api/auth/customer-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
        })
      }

      const data = await res.json()
      if (res.ok && data.token) {
        const user = data.customer || data.user || { name: data.name || loginEmail.split('@')[0], email: loginEmail }
        const token = data.token
        localStorage.setItem('netpack_customer_token', token)
        localStorage.setItem('netpack_customer_user', JSON.stringify(user))
        toast.success(`Welcome back, ${user.name}!`)
        onAuthenticated(user, token)
        return
      } else {
        toast.error(data.detail || 'Invalid email or password')
      }
    } catch (err) {
      console.warn('Network error logging in:', err)
      toast.error('Network connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!postcode.trim()) {
      toast.error('Please enter Postcode')
      return
    }
    setLoading(true)
    try {
      const selectedOpt = COUNTRY_OPTIONS.find(c => c.name === country) || COUNTRY_OPTIONS[0]
      const cleanPhone = phone.trim().startsWith('+')
        ? phone.trim()
        : `${selectedOpt.dialCode}-${phone.trim().replace(/^0+/, '')}`

      const res = await fetch(`${API_BASE}/api/customer/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          password,
          address1: address1.trim(),
          address2: address2 ? address2.trim() : null,
          city: city.trim(),
          state: stateProvince.trim(),
          postcode: postcode ? postcode.trim() : null,
          countryId: selectedOpt.id,
        }),
      })

      const data = await res.json()
      if (res.ok && data.token) {
        const user = data.customer || { name: fullName, email, country, phone: cleanPhone }
        const token = data.token
        localStorage.setItem('netpack_customer_token', token)
        localStorage.setItem('netpack_customer_user', JSON.stringify(user))
        toast.success(`Welcome to NetPack, ${fullName}!`)
        onAuthenticated(user, token)
        return
      } else {
        toast.error(data.detail || 'Registration failed. Please check your details.')
      }
    } catch (err) {
      console.warn('Signup network error:', err)
      toast.error('Network connection error during registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async () => {
    const targetEmail = (codeEmail || loginEmail || email || '').trim().toLowerCase()
    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setCodeSent(true)
        setCodeEmail(targetEmail)
        toast.success(`Verification code sent to ${targetEmail}!`)
      } else {
        toast.error(data.detail || 'Failed to send verification code.')
      }
    } catch {
      toast.error('Network error sending verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!codeOtp || codeOtp.trim().length < 6) {
      toast.error('Please enter the 6-digit confirmation code.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: codeEmail.trim().toLowerCase(),
          code: codeOtp.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        const user = data.customer || { name: codeEmail.split('@')[0], email: codeEmail }
        const token = data.token
        localStorage.setItem('netpack_customer_token', token)
        localStorage.setItem('netpack_customer_user', JSON.stringify(user))
        toast.success(`Welcome, ${user.name}!`)
        onAuthenticated(user, token)
        return
      } else {
        toast.error(data.detail || 'Invalid or expired confirmation code.')
      }
    } catch {
      toast.error('Network error verifying confirmation code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto no-scrollbar">
      {/* Brand panel */}
      <div
        className="bg-[#0D1B2A] px-6 pb-12 relative overflow-hidden shrink-0"
        style={{ paddingTop: 'max(40px, env(safe-area-inset-top, 40px))' }}
      >
        {/* Route motif */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 430 280" fill="none" preserveAspectRatio="none">
          <path
            d="M-30 230 C 70 150, 150 260, 240 170 S 400 50, 470 -10"
            stroke="#3B82F6"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="1 9"
            strokeLinecap="round"
          />
          <circle cx="240" cy="170" r="3" fill="#60A5FA" fillOpacity="0.6" />
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
          className="absolute top-8 right-6 w-24 h-24 rounded-full bg-blue-500/15 blur-[2px]"
          style={{ animation: 'floatBubbleA 6s ease-in-out infinite' }}
        />
        <div
          className="absolute top-16 left-24 w-14 h-14 rounded-full bg-blue-500/10 blur-[1px]"
          style={{ animation: 'floatBubbleB 5s ease-in-out infinite' }}
        />

        <div className="relative">
          <h1
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.14em' }}
            className="text-white text-2xl font-bold mb-5 select-none"
          >
            NETPACK
          </h1>
          <p className="text-white/80 text-[13px] leading-relaxed max-w-[280px]">
            {mode === 'login'
              ? 'Log in to track consignments, request pickups, and book cargo.'
              : mode === 'code'
              ? 'Enter the 6-digit confirmation code sent to your email.'
              : 'Create an account to start shipping worldwide.'}
          </p>
        </div>
      </div>

      {/* Form sheet */}
      <div className="flex-1 bg-[#F1F4F8] rounded-t-[28px] -mt-5 px-5 pt-6 pb-10 relative">
        {/* Mode: Default Login Screen (No tabs!) */}
        {mode === 'login' && (
          <div>
            {/* Primary Google Login Button */}
            <button
              type="button"
              onClick={() => {
                setMode('code')
                if (!codeEmail && loginEmail) setCodeEmail(loginEmail)
              }}
              className="w-full bg-white border border-gray-200 rounded-xl py-3.5 flex items-center justify-center gap-2.5 font-bold text-[13px] text-[#0D1B2A] active:scale-[0.99] transition-transform shadow-xs cursor-pointer hover:bg-gray-50 mb-4"
            >
              <IconGoogle size={18} />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email & Password Form */}
            <div className="space-y-4">
              <div>
                <FieldLabel required>Email Address</FieldLabel>
                <TextInput placeholder="you@example.com" value={loginEmail} onChange={setLoginEmail} type="email" />
              </div>
              <div>
                <FieldLabel required>Password</FieldLabel>
                <PasswordInput placeholder="Enter your password" value={loginPassword} onChange={setLoginPassword} />
                <div className="flex justify-between items-center mt-2 px-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('code')
                      setCodeEmail(loginEmail || '')
                    }}
                    className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('code')
                      setCodeEmail(loginEmail || '')
                    }}
                    className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline"
                  >
                    Sign in with OTP
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={!loginValid || loading}
                style={{ fontFamily: 'Jost, sans-serif' }}
                className="w-full bg-[#2563EB] disabled:bg-gray-300 disabled:shadow-none text-white font-600 text-sm py-3.5 rounded-xl active:opacity-90 shadow-md shadow-blue-200 transition-all mt-1 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <p className="text-center text-xs text-gray-600 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Mode: Email / Google OTP Verification (No Brevo banner!) */}
        {mode === 'code' && (
          <div className="space-y-4">
            {!codeSent ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Google / Registered Email</FieldLabel>
                  <TextInput
                    placeholder="you@example.com"
                    value={codeEmail}
                    onChange={setCodeEmail}
                    type="email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={!codeEmail.includes('@') || loading}
                  className="w-full bg-[#2563EB] disabled:bg-gray-300 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-gray-500">
                    Code sent to: <strong className="text-gray-800">{codeEmail}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false)
                      setCodeOtp('')
                    }}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div>
                  <FieldLabel required>6-Digit Confirmation Code</FieldLabel>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={codeOtp}
                    onChange={e => setCodeOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-gray-200 rounded-xl py-3 px-4 text-center font-mono text-2xl tracking-[0.4em] text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={codeOtp.length < 6 || loading}
                  className="w-full bg-[#2563EB] disabled:bg-gray-300 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setCodeSent(false)
                }}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                ← Back to Log In
              </button>
            </div>
          </div>
        )}

        {/* Mode: Sign Up Registration */}
        {mode === 'signup' && (
          <div className="space-y-4">
            {/* Country First */}
            <div>
              <FieldLabel required>Country</FieldLabel>
              <div className="relative">
                <select
                  value={country}
                  onChange={e => handleCountryChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-4 pr-9 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none font-medium"
                >
                  {COUNTRY_OPTIONS.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
                <IconChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <TextInput placeholder="Your full name" value={fullName} onChange={setFullName} />
            </div>

            <div>
              <FieldLabel required>Email Address</FieldLabel>
              <TextInput placeholder="you@example.com" value={email} onChange={setEmail} type="email" />
            </div>

            <div>
              <FieldLabel required>Phone Number</FieldLabel>
              <div className="flex gap-2">
                <span className="bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-3 flex items-center shrink-0">
                  {signupDialCode}
                </span>
                <input
                  type="tel"
                  placeholder="Mobile / Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Address Line 1</FieldLabel>
              <TextInput placeholder="House no., street" value={address1} onChange={setAddress1} />
            </div>

            <div>
              <FieldLabel>Address Line 2 (Optional)</FieldLabel>
              <TextInput placeholder="Apartment, area (optional)" value={address2} onChange={setAddress2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>City</FieldLabel>
                <TextInput placeholder="City" value={city} onChange={setCity} />
              </div>
              <div>
                <FieldLabel required>State / Province</FieldLabel>
                <TextInput placeholder="State / Province" value={stateProvince} onChange={setStateProvince} />
              </div>
            </div>

            <div>
              <FieldLabel required>Postcode</FieldLabel>
              <TextInput placeholder="Postcode" value={postcode} onChange={setPostcode} />
            </div>
            <div>
              <FieldLabel required>Password</FieldLabel>
              <PasswordInput placeholder="Create a password" value={password} onChange={setPassword} />
            </div>
            <div>
              <FieldLabel required>Confirm Password</FieldLabel>
              <PasswordInput placeholder="Re-enter your password" value={confirmPassword} onChange={setConfirmPassword} />
              {passwordsMismatch && <p className="text-[11px] text-red-500 mt-1.5">Passwords don't match.</p>}
            </div>
            <button
              onClick={handleSignup}
              disabled={!signupValid || loading}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="w-full bg-[#2563EB] disabled:bg-gray-300 disabled:shadow-none text-white font-600 text-sm py-3.5 rounded-xl active:opacity-90 shadow-md shadow-blue-200 transition-all mt-1 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-gray-600 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed px-4">
          By continuing, you agree to NetPack's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

// ─── Onboarding & Profile Details Modal ───────────────────────────────────────

function OnboardingModal({
  customerUser,
  customerToken,
  isOpen,
  mode = 'first_time',
  onClose,
  onProfileUpdated,
}: {
  customerUser: any
  customerToken: string | null
  isOpen: boolean
  mode?: 'first_time' | 'edit_only'
  onClose: () => void
  onProfileUpdated: (updatedUser: any) => void
}) {
  const [step, setStep] = useState<'details' | 'tutorial'>('details')
  const [selectedCountry, setSelectedCountry] = useState('Nepal')
  const [dialCode, setDialCode] = useState('+977')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('Kathmandu')
  const [stateProvince, setStateProvince] = useState('')
  const [postcode, setPostcode] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tutorialIndex, setTutorialIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep('details')
      setTutorialIndex(0)
      if (customerUser) {
        setName(customerUser.name || '')

        // Detect country and dial code safely
        const rawCountry = customerUser.country || customerUser.countryName || 'Nepal'
        const userCountryName = typeof rawCountry === 'string' ? rawCountry : rawCountry?.name || 'Nepal'
        const matched = COUNTRY_OPTIONS.find(
          c => c.name.toLowerCase() === String(userCountryName).toLowerCase()
        ) || COUNTRY_OPTIONS[0]

        setSelectedCountry(matched.name)
        setDialCode(matched.dialCode)

        // Parse phone
        const rawPhone = customerUser.phone || ''
        let cleanDigits = rawPhone
        if (cleanDigits.startsWith(matched.dialCode)) {
          cleanDigits = cleanDigits.slice(matched.dialCode.length).replace(/^[-\s]+/, '')
        } else if (cleanDigits.startsWith('+977')) {
          cleanDigits = cleanDigits.replace(/^\+977[-\s]?/, '')
        }
        if (cleanDigits === '+977-9800000000' || cleanDigits === '9800000000') cleanDigits = ''
        setPhone(cleanDigits)

        setAddress1(customerUser.address1 || '')
        setAddress2(customerUser.address2 || '')
        setCity(customerUser.city || 'Kathmandu')
        setStateProvince(customerUser.state || '')
        setPostcode(customerUser.postcode || '')
        setPhotoUrl(customerUser.photoUrl || null)
      }
    }
  }, [customerUser, isOpen])

  if (!isOpen) return null

  const handleCountrySelect = (cName: string) => {
    setSelectedCountry(cName)
    const opt = COUNTRY_OPTIONS.find(c => c.name === cName)
    if (opt) {
      setDialCode(opt.dialCode)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !customerToken) return
    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const res = await fetch(`${API_BASE}/api/customer/profile/upload-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Failed uploading photo')
      const data = await res.json()
      if (data.photoUrl) {
        setPhotoUrl(data.photoUrl)
        if (data.customer) onProfileUpdated(data.customer)
        toast.success('Photo uploaded successfully!')
      }
    } catch (err: any) {
      toast.error('Photo upload failed: ' + err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter your full name')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    if (!address1.trim()) {
      toast.error('Please enter Address Line 1')
      return
    }
    if (!stateProvince.trim()) {
      toast.error('Please enter State / Province')
      return
    }
    if (!postcode.trim()) {
      toast.error('Please enter Postcode')
      return
    }
    if (!customerToken) return

    setSaving(true)
    const cleanDigits = phone.trim().replace(/^0+/, '')
    const fullPhone = phone.trim().startsWith('+') ? phone.trim() : `${dialCode}-${cleanDigits}`
    const matchedOpt = COUNTRY_OPTIONS.find(c => c.name === selectedCountry) || COUNTRY_OPTIONS[0]

    const payload = {
      name: name.trim(),
      phone: fullPhone,
      address1: address1.trim(),
      address2: address2 ? address2.trim() : null,
      city: city.trim() || 'Kathmandu',
      state: stateProvince.trim(),
      postcode: postcode ? postcode.trim() : null,
      countryId: matchedOpt?.id || 1,
      country: selectedCountry,
      photoUrl: photoUrl || undefined,
    }

    try {
      const res = await fetch(`${API_BASE}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Failed updating profile')
      }
      const data = await res.json()
      const updated = data.customer || { ...customerUser, ...payload }
      onProfileUpdated(updated)

      if (mode === 'edit_only') {
        toast.success('Profile updated successfully!')
        onClose()
      } else {
        setStep('tutorial')
      }
    } catch (err: any) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFinishTutorial = () => {
    const userKey = customerUser?.id || customerUser?.email || 'customer'
    localStorage.setItem(`netpack_onboarded_${userKey}`, 'completed')
    localStorage.setItem('netpack_tutorial_completed', 'true')
    toast.success('Welcome to NetPack Logistics!')
    onClose()
  }

  const tutorialSlides = [
    {
      badge: 'Step 1 • Start a Consignment',
      title: 'Tap "+ Book a Consignment"',
      desc: 'Tap "+" or "Book a Consignment" on your dashboard anytime to begin shipping documents, garments, handicrafts, or cargo worldwide.',
      icon: <IconBox size={34} className="text-blue-500" />,
      highlight: 'Express global delivery with instant tracking code generation',
    },
    {
      badge: 'Step 2 • Goods & Approximate Weight',
      title: 'Describe Goods & Approximate kg',
      desc: 'No box dimensions required from you! NetPack packs and measures box sizes at our warehouse hub. Just describe what you are shipping and approximate kg.',
      icon: <IconScale size={34} className="text-amber-500" />,
      highlight: 'Verified scale weighing photos visible right on your tracking screen',
    },
    {
      badge: 'Step 3 • One-Tap Address',
      title: 'Instant "(Use My Address)" Auto-Fill',
      desc: 'Never re-type your sender address! Tap the "(Use my address)" button on the booking form to instantly load your saved pickup address and phone number.',
      icon: <IconMapPin size={34} className="text-indigo-500" />,
      highlight: 'Saves your pickup location for fast 1-tap bookings',
    },
    {
      badge: 'Step 4 • Doorstep Pickup & Tracking',
      title: 'Doorstep Rider Pickup & Live Sync',
      desc: 'Our courier rider collects packages right at your doorstep in Kathmandu Valley. Follow customs ramp clearance and air cargo flight departure in real time.',
      icon: <IconTruck size={34} className="text-emerald-500" />,
      highlight: 'Same-day Kathmandu Valley rider pickup & live milestone tracking',
    },
  ]

  const avatarSrc = photoUrl
    ? photoUrl.startsWith('http') || photoUrl.startsWith('data:')
      ? photoUrl
      : `${API_BASE}${photoUrl}`
    : null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {step === 'details' ? (
          <>
            {/* Header */}
            <div className="bg-[#0D1B2A] text-white p-5 relative shrink-0">
              {mode === 'edit_only' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer"
                  title="Close"
                >
                  <IconClose size={16} />
                </button>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/20">
                  {mode === 'edit_only' ? 'Profile Management' : 'Step 1 of 2 • Account Details'}
                </span>
              </div>
              <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-lg font-700">
                {mode === 'edit_only' ? 'Edit Profile Details' : 'Complete Your Profile'}
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                {mode === 'edit_only'
                  ? 'Update your contact and pickup address below.'
                  : 'Add your details to book express shipments and request doorstep pickups.'}
              </p>
            </div>

            {/* Form Content - Picture 3 specifications */}
            <form onSubmit={handleSaveDetails} className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1">
              {/* Photo Avatar Upload */}
              <div className="flex flex-col items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {(name || 'C').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0D1B2A] rounded-xl flex items-center justify-center border-2 border-white text-white shadow-xs cursor-pointer active:scale-95"
                    title="Upload Avatar"
                  >
                    {uploadingPhoto ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <IconCamera size={14} />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 font-medium">Tap camera to upload profile photo</p>
              </div>

              {/* 1. Country Selection First with Dial Code Auto-Assign */}
              <div>
                <FieldLabel required>Country</FieldLabel>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={e => handleCountrySelect(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-3 pr-9 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none font-medium"
                  >
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                  <IconChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Customer Name */}
              <div>
                <FieldLabel required>Customer Name</FieldLabel>
                <TextInput placeholder="Your full name" value={name} onChange={setName} />
              </div>

              {/* 3. Address Line 1 */}
              <div>
                <FieldLabel required>Address Line 1</FieldLabel>
                <TextInput
                  placeholder="House / Building No., Street, Ward"
                  value={address1}
                  onChange={setAddress1}
                />
              </div>

              {/* 4. Address Line 2 */}
              <div>
                <FieldLabel>Address Line 2 (Optional)</FieldLabel>
                <TextInput
                  placeholder="Apartment, suite, unit (optional)"
                  value={address2}
                  onChange={setAddress2}
                />
              </div>

              {/* 5. City & State / Province in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <TextInput placeholder="City" value={city} onChange={setCity} />
                </div>
                <div>
                  <FieldLabel required>State / Province</FieldLabel>
                  <TextInput placeholder="State / Province" value={stateProvince} onChange={setStateProvince} />
                </div>
              </div>

              {/* 6. Postcode */}
              <div>
                <FieldLabel required>Postcode</FieldLabel>
                <TextInput placeholder="Postcode" value={postcode} onChange={setPostcode} />
              </div>

              {/* 7. Telephone with Dynamic Dial Code Badge */}
              <div>
                <FieldLabel required>Telephone</FieldLabel>
                <div className="flex gap-2">
                  <span className="bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-3 flex items-center shrink-0">
                    {dialCode}
                  </span>
                  <input
                    type="tel"
                    placeholder="Mobile / Phone Number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !phone.trim() || !address1.trim() || !stateProvince.trim() || !postcode.trim()}
                  style={{ fontFamily: 'Jost, sans-serif' }}
                  className="w-full bg-[#2563EB] disabled:bg-gray-300 text-white font-600 text-sm py-3.5 rounded-xl active:opacity-90 shadow-md shadow-blue-200 transition-all cursor-pointer"
                >
                  {saving
                    ? 'Saving Profile...'
                    : mode === 'edit_only'
                    ? 'Save Profile Changes'
                    : 'Save & Continue →'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Step 2: Interactive App Walkthrough Tutorial */}
            <div className="bg-[#0D1B2A] text-white p-5 flex items-center justify-between shrink-0">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/20">
                Step 2 of 2 • How to Create Shipments
              </span>
              <button
                type="button"
                onClick={handleFinishTutorial}
                className="text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Skip ✕
              </button>
            </div>

            {/* Slide Body */}
            <div className="p-6 flex flex-col items-center text-center space-y-4 flex-1 overflow-y-auto no-scrollbar">
              <div className="w-18 h-18 rounded-3xl bg-blue-50 flex items-center justify-center shadow-inner mt-2">
                {tutorialSlides[tutorialIndex].icon}
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                {tutorialSlides[tutorialIndex].badge}
              </span>

              <h2 style={{ fontFamily: 'Jost, sans-serif' }} className="text-lg font-800 text-[#0D1B2A] leading-snug">
                {tutorialSlides[tutorialIndex].title}
              </h2>

              <p className="text-xs text-gray-500 leading-relaxed max-w-[290px]">
                {tutorialSlides[tutorialIndex].desc}
              </p>

              <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2 text-left text-xs font-semibold text-emerald-800">
                <IconCheck size={16} className="text-emerald-600 shrink-0" />
                <span>{tutorialSlides[tutorialIndex].highlight}</span>
              </div>

              {/* Dots */}
              <div className="flex items-center gap-1.5 pt-2">
                {tutorialSlides.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === tutorialIndex ? 'w-6 bg-[#2563EB]' : 'w-2 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="w-full pt-3 flex gap-2">
                {tutorialIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setTutorialIndex(i => i - 1)}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs active:bg-gray-50 cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {tutorialIndex < tutorialSlides.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTutorialIndex(i => i + 1)}
                    style={{ fontFamily: 'Jost, sans-serif' }}
                    className="flex-1 bg-[#2563EB] text-white font-600 text-sm py-3.5 rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishTutorial}
                    style={{ fontFamily: 'Jost, sans-serif' }}
                    className="flex-1 bg-[#0D1B2A] text-white font-700 text-sm py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Explore Dashboard ✨
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Customer PWA Component ──────────────────────────────────────────────

export default function CustomerPWA() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeTrackingId, setActiveTrackingId] = useState('NP-20240922-001')
  const [trackingReturnScreen, setTrackingReturnScreen] = useState<Screen>('home')

  // Real backend state: clean empty default so new accounts have 0 consignments
  const [shipments, setShipments] = useState<Shipment[]>([])
  const prevStatusesRef = useRef<Record<string, string>>({})
  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('netpack_customer_token') : null
  })
  const [customerUser, setCustomerUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('netpack_customer_user')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return null
        }
      }
    }
    return null
  })

  // Onboarding & Profile Edit modal state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingMode, setOnboardingMode] = useState<'first_time' | 'edit_only'>('first_time')

  // Customer pickup request modal state
  const [pickupModalTracking, setPickupModalTracking] = useState<string | null>(null)

  const handleProfileUpdated = (updatedUser: any) => {
    setCustomerUser(updatedUser)
    localStorage.setItem('netpack_customer_user', JSON.stringify(updatedUser))
  }

  // Dynamic notifications derived from user consignments + welcome alert
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = []

    shipments.forEach(s => {
      if (s.status === 'delivered') {
        list.push({
          id: `notif-${s.id}-delivered`,
          title: `Shipment ${s.tracking} Delivered`,
          body: `Consignment to ${s.destination} has been successfully delivered. Thank you for choosing NetPack!`,
          time: s.date || 'Recent',
          read: false,
          type: 'delivered',
          tracking: s.tracking,
        })
      } else if (s.status === 'in_progress' || s.status === 'arrived_at_hub' || s.status === 'out_for_delivery') {
        list.push({
          id: `notif-${s.id}-progress`,
          title: `Shipment ${s.tracking} In Transit`,
          body: `Air cargo en route to ${s.destination}. Verified electronic scale weight: ${s.weight}.`,
          time: s.date || 'In Transit',
          read: false,
          type: 'update',
          tracking: s.tracking,
        })
      } else {
        list.push({
          id: `notif-${s.id}-pending`,
          title: `Consignment ${s.tracking} Created`,
          body: `Doorstep rider pickup scheduled in Kathmandu. Destination: ${s.destination}.`,
          time: s.date || 'Recent',
          read: false,
          type: 'update',
          tracking: s.tracking,
        })
      }
    })

    // Clean initial welcome notification
    list.push({
      id: 'notif-welcome',
      title: 'Welcome to NetPack Logistics!',
      body: 'Book international express consignments and request doorstep rider pickup across Kathmandu.',
      time: 'Account Active',
      read: false,
      type: 'welcome',
    })

    return list
  }, [shipments])

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('netpack_read_notif_ids')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadNotifIds(allIds)
    localStorage.setItem('netpack_read_notif_ids', JSON.stringify(allIds))
  }

  const handleMarkRead = (id: string) => {
    setReadNotifIds(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      localStorage.setItem('netpack_read_notif_ids', JSON.stringify(next))
      return next
    })
  }

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readNotifIds.includes(n.id)).length
  }, [notifications, readNotifIds])

  // Check if onboarding is needed on first login
  useEffect(() => {
    if (!customerUser) return
    const userKey = customerUser.id || customerUser.email || 'customer'
    const onboardedKey = `netpack_onboarded_${userKey}`
    const hasCompletedOnboard =
      localStorage.getItem(onboardedKey) === 'completed' ||
      localStorage.getItem('netpack_tutorial_completed') === 'true'

    const isPlaceholder =
      !customerUser.phone ||
      customerUser.phone === '+977-9800000000' ||
      !customerUser.address1 ||
      Boolean(customerUser.isNewAccount) ||
      Boolean(customerUser.isIncomplete)

    if (!hasCompletedOnboard && isPlaceholder) {
      setOnboardingMode('first_time')
      setShowOnboarding(true)
    }
  }, [customerUser?.id, customerUser?.email])

  // Fetch live customer shipments
  const fetchShipments = () => {
    if (!customerToken) return
    fetch(`${API_BASE}/api/customer/my-shipments`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then(async res => {
        if (!res.ok && res.status === 404) {
          return fetch(`${API_BASE}/api/bookings/my`, {
            headers: { Authorization: `Bearer ${customerToken}` },
          }).then(r => (r.ok ? r.json() : []))
        }
        return res.ok ? res.json() : []
      })
      .then(data => {
        if (Array.isArray(data)) {
          const mapped: Shipment[] = data.map(b => ({
            id: String(b.id),
            tracking: b.trackingNumber || `NP-${b.id}`,
            destination: b.receiverCity ? `${b.receiverCity}, ${b.receiverCountry || ''}` : b.receiverCountry || 'International',
            country: b.receiverCountry || '',
            commodity: b.commodity || 'General Cargo',
            weight: `${b.weight || b.approximateWeight || '1.0'} kg`,
            status: (() => {
              const rawSt = (b.status || '').toUpperCase()
              if (rawSt === 'DELIVERED') return 'delivered'
              if (rawSt === 'OUT_FOR_DELIVERY' || rawSt === 'CARRIER_SCANNED') return 'out_for_delivery'
              if (rawSt === 'ARRIVED_AT_HUB') return 'arrived_at_hub'
              if (rawSt === 'IN_TRANSIT') return 'in_progress'
              if (rawSt === 'SHIPMENT_CREATED' || rawSt === 'PACKED') return 'shipment_created'
              if (rawSt === 'PICKED_UP') return 'picked_up'
              if (rawSt === 'ASSIGNED_FOR_PICKUP') return 'assigned_for_pickup'
              return 'pending'
            })(),
            date: b.createdAt
              ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent',
            receiverName: b.receiverName,
            receiverCity: b.receiverCity,
            riderName: b.riderName,
            riderPhone: b.riderPhone,
            pickupLocations: b.pickupLocations || [],
            weightProofImages: Array.isArray(b.weightProofImages) && b.weightProofImages.length > 0
              ? b.weightProofImages
              : b.weightProofImageUrl
              ? b.weightProofImageUrl.split(',').map((u: string) => u.trim()).filter(Boolean)
              : [],
            weightProofImageUrl: b.weightProofImageUrl,
          }))

          // Check for status changes to trigger sound/vibration chime
          let hasStatusChange = false
          const prevMap = prevStatusesRef.current
          const isInitialLoad = Object.keys(prevMap).length === 0
          const currentMap: Record<string, string> = {}

          mapped.forEach(s => {
            currentMap[s.id] = s.status
            if (!isInitialLoad && prevMap[s.id] && prevMap[s.id] !== s.status) {
              hasStatusChange = true
              toast.info(`Shipment ${s.tracking} updated: ${s.status.replace(/_/g, ' ').toUpperCase()}`, {
                description: `Destination: ${s.destination}. Tap Track to open live tracking details.`,
                action: {
                  label: 'Track Cargo',
                  onClick: () => handleTrackNav(s.tracking, 'home'),
                },
              })

              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  const n = new Notification(`Shipment ${s.tracking} Updated`, {
                    body: `Status: ${s.status.replace(/_/g, ' ').toUpperCase()} • Destination: ${s.destination}`,
                    icon: '/images/netpack-icon-192.png',
                    data: { tracking: s.tracking },
                  })
                  n.onclick = () => {
                    window.focus()
                    handleTrackNav(s.tracking, 'home')
                  }
                } catch {}
              }
            }
          })
          prevStatusesRef.current = currentMap

          if (hasStatusChange) {
            playNotificationChime()
            triggerVibrationAlert()
          }

          setShipments(mapped)
          if (mapped.length > 0) {
            setActiveTrackingId(prev => (prev === 'NP-20240922-001' ? mapped[0].tracking : prev))
          }
        } else {
          setShipments([])
        }
      })
      .catch(() => {
        setShipments([])
      })
  }

  // Check URL parameters for direct tracking navigation (e.g. from notification clicks or shared links)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const trackParam = params.get('track') || params.get('tracking')
      if (trackParam) {
        handleTrackNav(trackParam, 'home')
      }
    }
  }, [])

  useEffect(() => {
    fetchShipments()
    if (!customerToken) return

    // Auto poll shipments every 20 seconds for real-time tracking updates
    const pollInterval = setInterval(fetchShipments, 20000)

    fetch(`${API_BASE}/api/customer/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.id) {
          setCustomerUser(data)
          localStorage.setItem('netpack_customer_user', JSON.stringify(data))
        }
      })
      .catch(() => {})

    return () => clearInterval(pollInterval)
  }, [customerToken])

  const handleSignOut = () => {
    localStorage.removeItem('netpack_customer_token')
    localStorage.removeItem('netpack_customer_user')
    setCustomerToken(null)
    setCustomerUser(null)
    toast.success('Signed out successfully')
    setScreen('home')
  }

  const handleTrackNav = (id: string, fromScreen: Screen = screen) => {
    setActiveTrackingId(id)
    setTrackingReturnScreen(fromScreen)
    setScreen('tracking')
  }

  const handleBookComplete = (newShipment: Shipment) => {
    setShipments(prev => [newShipment, ...prev])
  }

  const deliveredCount = shipments.filter(s => s.status === 'delivered').length

  return (
    <div className="min-h-screen bg-[#0D1B2A] sm:bg-[#E2E8F0] flex justify-center selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative bg-[#F1F4F8] shadow-2xl">
        {!customerUser ? (
          <AuthScreen
            onAuthenticated={(user, token) => {
              setCustomerUser(user)
              setCustomerToken(token)
              const userKey = user.id || user.email || 'customer'
              const onboardedKey = `netpack_onboarded_${userKey}`
              const hasCompletedOnboard =
                localStorage.getItem(onboardedKey) === 'completed' ||
                localStorage.getItem('netpack_tutorial_completed') === 'true'

              const isPlaceholder =
                !user.phone ||
                user.phone === '+977-9800000000' ||
                !user.address1 ||
                Boolean(user.isNewAccount) ||
                Boolean(user.isIncomplete)

              if (!hasCompletedOnboard && isPlaceholder) {
                setOnboardingMode('first_time')
                setShowOnboarding(true)
              }
            }}
          />
        ) : (
          <>
            {/* Top Header matching Figma */}
            <Header
              userName={customerUser?.name || 'Customer'}
              photoUrl={customerUser?.photoUrl}
              unreadCount={unreadCount}
              onBellClick={() => setScreen('notifications')}
              onProfileClick={() => setScreen('profile')}
            />

            {/* Screen Routing */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {screen === 'home' && (
                <HomeScreen
                  shipments={shipments}
                  onViewAll={() => setScreen('shipments')}
                  onBook={() => setScreen('book')}
                  onRateEnquiry={() => setScreen('rateenquiry')}
                  onTrack={id => handleTrackNav(id, 'home')}
                  onRequestPickup={id => setPickupModalTracking(id)}
                />
              )}

              {screen === 'shipments' && (
                <ShipmentsScreen
                  shipments={shipments}
                  onBook={() => setScreen('book')}
                  onBack={() => setScreen('home')}
                  onTrack={id => handleTrackNav(id, 'shipments')}
                  onRefresh={fetchShipments}
                  onRequestPickup={id => setPickupModalTracking(id)}
                />
              )}

              {screen === 'tracking' && (
                <TrackingScreen
                  initialTrackingId={activeTrackingId}
                  onBack={() => setScreen(trackingReturnScreen)}
                  onRequestPickup={id => setPickupModalTracking(id)}
                />
              )}

              {screen === 'rateenquiry' && (
                <RateEnquiryScreen onBack={() => setScreen('home')} />
              )}

              {screen === 'book' && (
                <BookScreen
                  onComplete={handleBookComplete}
                  customerUser={customerUser}
                  onRequestExistingPickup={() => setPickupModalTracking('SELECT')}
                />
              )}

              {screen === 'notifications' && (
                <NotificationsScreen
                  onBack={() => setScreen('home')}
                  items={notifications.map(n => ({ ...n, read: readNotifIds.includes(n.id) }))}
                  onMarkAllRead={handleMarkAllRead}
                  onMarkRead={handleMarkRead}
                  onSelectNotification={item => {
                    if (item.tracking) {
                      handleTrackNav(item.tracking, 'notifications')
                    }
                  }}
                />
              )}

              {screen === 'profile' && (
                <ProfileScreen
                  userName={customerUser?.name}
                  userEmail={customerUser?.email}
                  userPhone={customerUser?.phone}
                  userAddress={customerUser?.address1}
                  userAddress2={customerUser?.address2}
                  userCity={customerUser?.city}
                  userPostcode={customerUser?.postcode}
                  userCountry={
                    typeof customerUser?.country === 'string'
                      ? customerUser.country
                      : customerUser?.country?.name || customerUser?.countryName || 'Nepal'
                  }
                  photoUrl={customerUser?.photoUrl}
                  customerToken={customerToken}
                  shipmentCount={shipments.length}
                  deliveredCount={deliveredCount}
                  onSignOut={handleSignOut}
                  onOpenEditProfile={() => {
                    setOnboardingMode('edit_only')
                    setShowOnboarding(true)
                  }}
                  onProfileUpdated={handleProfileUpdated}
                />
              )}
            </main>

            {/* Bottom Floating Navigation matching Figma */}
            <BottomNav screen={screen} setScreen={setScreen} />

            {/* Customer Pickup Request Modal */}
            <CustomerPickupRequestModal
              isOpen={Boolean(pickupModalTracking)}
              onClose={() => setPickupModalTracking(null)}
              trackingNumber={pickupModalTracking === 'SELECT' ? '' : pickupModalTracking || ''}
              customerUser={customerUser}
              shipments={shipments}
              onSuccess={() => {
                fetchShipments()
              }}
            />

            {/* First-time Onboarding & Profile Details Modal */}
            <OnboardingModal
              isOpen={showOnboarding}
              mode={onboardingMode}
              customerUser={customerUser}
              customerToken={customerToken}
              onClose={() => setShowOnboarding(false)}
              onProfileUpdated={handleProfileUpdated}
            />
          </>
        )}
      </div>
    </div>
  )
}

