import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTheme } from '@/context/theme-context'

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'shipments' | 'book' | 'notifications' | 'profile' | 'rateenquiry' | 'tracking'
type ShipmentTab = 'all' | 'inprogress' | 'delivered'
type BookStep = 1 | 2 | 3
type ThemeMode = 'light' | 'dark' | 'system'

interface Shipment {
  id: string
  tracking: string
  destination: string
  country: string
  commodity: string
  weight: string
  status: 'in_progress' | 'delivered' | 'pending'
  date: string
  eta?: string
  receiverName?: string
  receiverCity?: string
  weightProofImages?: string[]
  weightProofImageUrl?: string
}

interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  type: 'welcome' | 'update' | 'delivered' | 'alert'
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
  status: 'in_progress' | 'delivered' | 'pending'
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
}

// ─── Initial Mock Data & Fallbacks ─────────────────────────────────────────────

const initialShipments: Shipment[] = [
  {
    id: '1',
    tracking: 'NP-20240922-001',
    destination: 'London, UK',
    country: 'GB',
    commodity: 'Pashmina & Woolen Garments',
    weight: '4.2 kg',
    status: 'in_progress',
    date: 'Sep 18, 2024',
    eta: 'Sep 26, 2024',
    receiverName: 'Sarah Jenkins',
    receiverCity: 'London',
  },
  {
    id: '2',
    tracking: 'NP-20240910-088',
    destination: 'New York, USA',
    country: 'US',
    commodity: 'Handicrafts & Souvenirs',
    weight: '2.8 kg',
    status: 'delivered',
    date: 'Sep 10, 2024',
    receiverName: 'Michael Chang',
    receiverCity: 'New York',
  },
  {
    id: '3',
    tracking: 'NP-20240905-047',
    destination: 'Tokyo, Japan',
    country: 'JP',
    commodity: 'Himalayan Tea & Spices',
    weight: '1.5 kg',
    status: 'delivered',
    date: 'Sep 5, 2024',
    receiverName: 'Kenji Sato',
    receiverCity: 'Tokyo',
  },
]

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Shipment Out for Delivery',
    body: 'NP-20240922-001 is out for final delivery in London. Expected today between 2–6 PM.',
    time: 'Today, 09:14 AM',
    read: false,
    type: 'update',
  },
  {
    id: '2',
    title: 'Cleared UK Customs',
    body: 'Your shipment NP-20240922-001 has cleared UK customs and is heading to the delivery hub.',
    time: 'Sep 21, 04:30 PM',
    read: false,
    type: 'update',
  },
  {
    id: '3',
    title: 'Shipment NP-20240910-088 Delivered',
    body: 'Your consignment has been successfully delivered in New York. Thank you for choosing NetPack!',
    time: 'Sep 17, 11:00 AM',
    read: true,
    type: 'delivered',
  },
  {
    id: '4',
    title: 'Welcome to NetPack Logistics!',
    body: 'Book international express consignments and request doorstep rider pickup across Kathmandu.',
    time: 'Sep 22, 08:35 AM',
    read: true,
    type: 'welcome',
  },
]

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

const IconDownload = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const IconSun = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const IconLogout = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
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

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  userName,
  unreadCount,
  onBellClick,
  onSignOut,
  onInstall,
  onToggleTheme,
}: {
  userName?: string
  unreadCount: number
  onBellClick: () => void
  onSignOut: () => void
  onInstall?: () => void
  onToggleTheme?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#0D1B2A] px-4 pt-3 pb-3 flex items-center gap-3 shadow-md">
      {/* Wave greeting */}
      <div className="text-2xl leading-none select-none">👋</div>

      <div className="flex-1 min-w-0">
        <p className="text-white/60 text-[11px] leading-tight">Welcome back</p>
        <span style={{ fontFamily: 'Jost, sans-serif' }} className="text-white font-700 text-base leading-tight tracking-tight truncate block">
          Hi, {userName || 'Customer'}!
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {onInstall && (
          <button
            onClick={onInstall}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
            title="Install App on Phone"
          >
            <IconDownload size={17} />
          </button>
        )}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all"
          title="Toggle Theme"
        >
          <IconSun size={17} />
        </button>
        <button
          onClick={onBellClick}
          className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all"
          title="Notifications"
        >
          <IconBell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-400 rounded-full ring-2 ring-[#0D1B2A] animate-pulse" />
          )}
        </button>
        <button
          onClick={onSignOut}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/20 active:scale-95 text-white/80 hover:text-red-400 flex items-center justify-center transition-all"
          title="Sign Out"
        >
          <IconLogout size={17} />
        </button>
      </div>
    </header>
  )
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const homeActive = screen === 'home' || screen === 'shipments' || screen === 'rateenquiry' || screen === 'tracking'
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#0D1B2A] border-t border-gray-200 dark:border-gray-800 max-w-[430px] mx-auto shadow-lg">
      <div className="flex items-center px-6 py-2">
        {/* Home */}
        <button
          onClick={() => setScreen('home')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${homeActive ? 'text-[#2563EB] font-bold' : 'text-gray-400'}`}
        >
          <IconHome size={22} />
          <span className="text-[10px] tracking-wide">Home</span>
        </button>

        {/* Book FAB */}
        <div className="flex-1 flex flex-col items-center py-0.5 -mt-5">
          <button
            onClick={() => setScreen('book')}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              screen === 'book' ? 'bg-[#2563EB] shadow-blue-500/40 ring-4 ring-blue-200' : 'bg-[#0D1B2A] shadow-slate-900/30'
            }`}
          >
            <IconPlus size={26} className="text-white" />
          </button>
          <span className={`text-[10px] font-semibold mt-1 tracking-wide ${screen === 'book' ? 'text-[#2563EB]' : 'text-gray-400'}`}>
            Book
          </span>
        </div>

        {/* Profile */}
        <button
          onClick={() => setScreen('profile')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${screen === 'profile' ? 'text-[#2563EB] font-bold' : 'text-gray-400'}`}
        >
          <IconUser size={22} />
          <span className="text-[10px] tracking-wide">Profile</span>
        </button>
      </div>
    </nav>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Shipment['status'] }) {
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        In Transit
      </span>
    )
  }
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <IconCheck size={10} />
        Delivered
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

function ShipmentCard({ s, onClick }: { s: Shipment; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex gap-3 active:scale-[0.99] hover:border-blue-200 transition-all cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.status === 'in_progress' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
        {s.status === 'in_progress' ? <IconTruck size={18} className="text-blue-500 animate-float" /> : <IconCheck size={16} className="text-emerald-500" />}
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
        <p className="text-[12px] text-gray-500 mt-1.5 truncate">
          {s.commodity} · {s.weight}
        </p>
        {s.eta && <p className="text-[11px] text-blue-500 mt-1 font-medium">ETA {s.eta}</p>}
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
}: {
  shipments: Shipment[]
  onViewAll: () => void
  onBook: () => void
  onRateEnquiry: () => void
  onTrack: (trackingNumber: string) => void
}) {
  const pending = shipments.filter(s => s.status === 'pending').length
  const inTransit = shipments.filter(s => s.status === 'in_progress').length
  const recent = shipments.slice(0, 3)

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
              {pending || (shipments.length > 0 ? 1 : 0)}
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
              {inTransit || (shipments.length > 0 ? 1 : 0)}
            </p>
            <p className="text-white/90 text-[13px] font-medium mt-1">In Transit</p>
          </div>
        </div>
      </div>

      {/* Quick Tracking Search Bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-2.5 flex items-center gap-2">
          <IconSearch size={18} className="text-gray-400 shrink-0 ml-1.5" />
          <input
            type="text"
            id="home-quick-track-input"
            placeholder="Track consignment (e.g., NP-20240922-001)..."
            className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-[#0D1B2A] placeholder-gray-400 font-mono"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim()
                if (val) onTrack(val)
              }
            }}
          />
          <button
            onClick={() => {
              const el = document.getElementById('home-quick-track-input') as HTMLInputElement
              if (el && el.value.trim()) onTrack(el.value.trim())
            }}
            style={{ fontFamily: 'Jost, sans-serif' }}
            className="bg-[#0D1B2A] text-white text-xs font-600 px-3.5 py-2 rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            Track
          </button>
        </div>
      </div>

      {/* Recent Consignments */}
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
              <ShipmentCard key={s.id} s={s} onClick={() => onTrack(s.tracking)} />
            ))}
          </div>
        )}
      </div>

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
}: {
  shipments: Shipment[]
  onBook: () => void
  onBack: () => void
  onTrack: (trackingNumber: string) => void
  onRefresh: () => void
}) {
  const [tab, setTab] = useState<ShipmentTab>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = shipments.filter(s => {
    if (tab === 'all') return true
    if (tab === 'inprogress') return s.status === 'in_progress'
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
            { label: 'In Transit', value: shipments.filter(s => s.status === 'in_progress').length, color: 'text-amber-600', bg: 'bg-amber-50' },
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
          filtered.map(s => <ShipmentCard key={s.id} s={s} onClick={() => onTrack(s.tracking)} />)
        )}
      </div>
    </div>
  )
}

// ─── Rate Enquiry Screen ──────────────────────────────────────────────────────

const COUNTRIES = ['United Kingdom', 'United States', 'Australia', 'Canada', 'Germany', 'Japan', 'Singapore', 'UAE']

function RateEnquiryScreen({ onBack }: { onBack: () => void }) {
  const [destCountry, setDestCountry] = useState('')
  const [weight, setWeight] = useState('')
  const [commodity, setCommodity] = useState('')
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

          {/* Commodity */}
          <div>
            <FieldLabel required>Commodity Type</FieldLabel>
            <div className="relative">
              <select
                value={commodity}
                onChange={e => {
                  setCommodity(e.target.value)
                  setResult(null)
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0D1B2A] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
              >
                <option value="">Select commodity</option>
                {COMMODITY_CHIPS.map(c => (
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
          disabled={!destCountry || !weight || !commodity}
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
                <span className="text-[12px] text-gray-500">Commodity</span>
                <span className="text-[13px] font-semibold text-[#0D1B2A] text-right max-w-[55%] truncate">{commodity}</span>
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

const LIFECYCLE_STAGES = [
  { id: 'enquiry', label: 'Booking Registered', short: 'Booking' },
  { id: 'pickup', label: 'Picked Up by Rider', short: 'Picked Up' },
  { id: 'warehouse', label: 'Warehouse Weighed & Packed', short: 'Packed' },
  { id: 'transit', label: 'Air Cargo in Flight', short: 'Air Cargo' },
  { id: 'hub', label: 'Arrived at Destination Hub', short: 'Hub Intake' },
  { id: 'carrier', label: 'Overseas Courier Dispatch', short: 'Courier' },
  { id: 'delivered', label: 'Delivered to Consignee', short: 'Delivered' },
]

function TrackingScreen({
  initialTrackingId,
  onBack,
}: {
  initialTrackingId: string
  onBack: () => void
}) {
  const [trackingId, setTrackingId] = useState(initialTrackingId)
  const [searchInput, setSearchInput] = useState(initialTrackingId)
  const [isFolded, setIsFolded] = useState(true)
  const [isBoxesOpen, setIsBoxesOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Tracking details from live API or mock fallback
  const [data, setData] = useState<TrackingDetails>(() => {
    return mockTrackingMap[initialTrackingId] || mockTrackingMap['NP-20240922-001']
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!trackingId) return
    setLoading(true)

    // Try fetching live backend tracking
    fetch(`${API_BASE}/api/tracking/${encodeURIComponent(trackingId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(liveRes => {
        if (liveRes && liveRes.trackingNumber) {
          // Map backend tracking response
          const statusStr = (liveRes.status || '').toUpperCase()
          let stageIdx = 3
          if (statusStr.includes('DELIVERED')) stageIdx = 6
          else if (statusStr.includes('CARRIER') || statusStr.includes('OUT_FOR_DELIVERY')) stageIdx = 5
          else if (statusStr.includes('HUB') || statusStr.includes('CUSTOMS')) stageIdx = 4
          else if (statusStr.includes('TRANSIT')) stageIdx = 3
          else if (statusStr.includes('PACK') || statusStr.includes('CREATED')) stageIdx = 2
          else if (statusStr.includes('PICK')) stageIdx = 1

          setData({
            tracking: liveRes.trackingNumber,
            receiverName: liveRes.receiverName || 'Consignee',
            carrier: liveRes.forwardingCompany || 'DHL Express',
            carrierTracking: liveRes.forwardingNumber || '9400111899562849102834',
            carrierUrl: liveRes.forwardingCompany?.toUpperCase().includes('FEDEX')
              ? 'https://www.fedex.com/fedextrack/'
              : 'https://www.dhl.com/en/express/tracking.html',
            status: statusStr.includes('DELIVERED') ? 'delivered' : 'in_progress',
            statusLabel: statusStr.includes('DELIVERED') ? 'Delivered' : 'In Transit (Air Cargo)',
            heroTitle: statusStr.includes('DELIVERED') ? 'Delivered to Consignee' : 'Air Cargo in Flight',
            heroSubtitle: `En route to ${liveRes.destination || 'Destination'} • Verified Weight: ${liveRes.weight || liveRes.approximateWeight || '3.5'} kg`,
            stageIndex: stageIdx,
            weight: `${liveRes.weight || liveRes.approximateWeight || '3.5'} kg`,
            volumetricWeight: `${liveRes.volumetricWeight || '3.0'} kg`,
            chargeableWeight: `${liveRes.chargeableWeight || liveRes.weight || '3.5'} kg`,
            origin: liveRes.origin || 'Kathmandu (KTM)',
            destination: liveRes.destination || 'International Destination',
            commodity: liveRes.commodity || 'Express Air Cargo',
            boxes: [
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
              : mockTrackingMap['NP-20240922-001'].checkpoints,
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

  const progressPercent = Math.min(100, Math.round(((data.stageIndex + 1) / LIFECYCLE_STAGES.length) * 100))

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

              {/* 7-Stage Milestones Stepper */}
              <div className="rounded-xl border border-gray-100 p-3.5 space-y-3 bg-gray-50/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Milestones</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      Stage {data.stageIndex + 1} of {LIFECYCLE_STAGES.length}: {LIFECYCLE_STAGES[data.stageIndex]?.short}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsFolded(!isFolded)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isFolded ? 'Expand' : 'Fold'}</span>
                    {isFolded ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
                  </button>
                </div>

                {/* Folded Horizontal Stepper */}
                {isFolded ? (
                  <div className="w-full overflow-x-auto py-2 px-1 scrollbar-none">
                    <div className="flex items-center justify-between min-w-[500px] relative px-2">
                      <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-gray-200 -z-0" />
                      <div
                        className="absolute left-6 top-3.5 h-0.5 bg-emerald-500 -z-0 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (data.stageIndex / (LIFECYCLE_STAGES.length - 1)) * 100))}%`,
                        }}
                      />
                      {LIFECYCLE_STAGES.map((stg, idx) => {
                        const isCompleted = idx < data.stageIndex || (idx === data.stageIndex && data.stageIndex === LIFECYCLE_STAGES.length - 1)
                        const isActive = idx === data.stageIndex && data.stageIndex < LIFECYCLE_STAGES.length - 1
                        return (
                          <div key={stg.id} className="flex flex-col items-center relative z-10 min-w-[58px] text-center">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : isActive
                                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse-ring'
                                  : 'bg-white border border-gray-300 text-gray-400'
                              }`}
                            >
                              {isCompleted ? <IconCheck size={13} /> : idx + 1}
                            </div>
                            <span
                              className={`text-[9px] mt-1.5 font-semibold text-center whitespace-nowrap leading-none ${
                                isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-emerald-700' : 'text-gray-400'
                              }`}
                            >
                              {stg.short}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* Expanded Vertical Stepper */
                  <div className="relative pl-5 pt-1 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {LIFECYCLE_STAGES.map((stg, idx) => {
                      const isCompleted = idx < data.stageIndex || (idx === data.stageIndex && data.stageIndex === LIFECYCLE_STAGES.length - 1)
                      const isActive = idx === data.stageIndex && data.stageIndex < LIFECYCLE_STAGES.length - 1
                      return (
                        <div key={stg.id} className="relative group">
                          <div
                            className={`absolute -left-5 top-0 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] transition-all ${
                              isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-600 text-white ring-2 ring-blue-200' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isCompleted ? <IconCheck size={10} /> : idx + 1}
                          </div>
                          <div className="ml-2">
                            <p className={`text-xs font-semibold ${isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-[#0D1B2A]' : 'text-gray-400'}`}>
                              {stg.label}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Overseas Courier Leg Card */}
              <div className="rounded-xl border border-gray-100 p-3.5 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Overseas Forwarding Courier</span>
                  <span className="font-bold text-[#0D1B2A]">{data.carrier}</span>
                </div>
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
                    <a
                      href={data.carrierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-blue-600 active:scale-95 transition-all inline-flex items-center justify-center"
                      title="Track on Carrier Website"
                    >
                      <IconExternalLink size={14} />
                    </a>
                  </div>
                </div>
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
                          {cp.source && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                              {cp.source}
                            </span>
                          )}
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

function BookScreen({ onComplete }: { onComplete: (newShipment: Shipment) => void }) {
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
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupPhone, setPickupPhone] = useState('')
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0])
  const [pickupNotes, setPickupNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [bookingTracking, setBookingTracking] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirmBooking = async () => {
    setSubmitting(true)
    const genTracking = `NP-${Date.now().toString().slice(-6)}`
    setBookingTracking(genTracking)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('netpack_customer_token') : null
      await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          commodity,
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
          pickupTimeSlot: timeSlot,
          pickupNotes,
        }),
      })
    } catch {
      // Non-blocking for offline / demo
    }

    const created: Shipment = {
      id: String(Date.now()),
      tracking: genTracking,
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
                <FieldLabel required>Delivery Street Address</FieldLabel>
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
                <FieldLabel required>Pickup Address in Kathmandu</FieldLabel>
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
              disabled={submitting}
              style={{ fontFamily: 'Jost, sans-serif' }}
              className="flex-[2] bg-[#0D1B2A] text-white font-600 text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 shadow-md shadow-slate-300 cursor-pointer"
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

function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications)

  const markAllRead = () => setItems(items.map(n => ({ ...n, read: true })))
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
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[12px] text-blue-600 font-semibold mt-1 cursor-pointer">
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
            const { bg, icon } = notifIconMap[n.type]
            return (
              <button
                key={n.id}
                onClick={() => setItems(items.map(i => (i.id === n.id ? { ...i, read: true } : i)))}
                className={`w-full text-left rounded-2xl border p-4 flex gap-3 transition-all active:scale-[0.99] cursor-pointer ${
                  n.read ? 'bg-white border-gray-100' : 'bg-white border-blue-100 shadow-xs'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-tight ${n.read ? 'font-medium text-[#0D1B2A]' : 'font-semibold text-[#0D1B2A]'}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                  </div>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{n.time}</p>
                </div>
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
  shipmentCount,
  deliveredCount,
  onSignOut,
}: {
  userName?: string
  userEmail?: string
  userPhone?: string
  userAddress?: string
  shipmentCount: number
  deliveredCount: number
  onSignOut: () => void
}) {
  const { theme, setTheme } = useTheme()
  const currentMode = (theme as ThemeMode) || 'light'

  const profileFields = [
    { label: 'Full Name', value: userName || 'Customer' },
    { label: 'Email Address', value: userEmail || 'customer@example.com' },
    { label: 'Phone', value: userPhone || '9869233939' },
    { label: 'Address Line', value: userAddress || 'Teku-12' },
    { label: 'City', value: 'Kathmandu' },
    { label: 'State / Province', value: 'Bagmati Province' },
    { label: 'Country', value: 'Nepal' },
  ]

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
      <div className="px-4 pt-5 pb-4">
        <h1 style={{ fontFamily: 'Jost, sans-serif' }} className="text-xl font-700 text-[#0D1B2A] tracking-tight">
          Profile
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <IconUser size={36} className="text-white" />
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0D1B2A] rounded-xl flex items-center justify-center border-2 border-[#F1F4F8] shadow-xs cursor-pointer">
            <IconCamera size={14} className="text-white" />
          </button>
        </div>
        <p style={{ fontFamily: 'Jost, sans-serif' }} className="mt-3 text-base font-700 text-[#0D1B2A]">
          {userName || 'Customer'}
        </p>
        <p className="text-[12px] text-gray-400">{userEmail || 'customer@example.com'}</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Info Card */}
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

        {/* Theme Toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">App Theme</p>
            <p className="text-[12px] text-blue-600 font-semibold capitalize">{currentMode} Mode</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setTheme(mode as any)}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[12px] font-medium capitalize transition-all cursor-pointer ${
                  currentMode === mode ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]' : 'text-gray-500 border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {mode === 'light' && <IconSun size={16} />}
                {mode === 'dark' && (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                {mode === 'system' && (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                )}
                {mode}
              </button>
            ))}
          </div>
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

        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-semibold text-sm py-3.5 rounded-2xl active:opacity-90 transition-opacity shadow-md shadow-red-100 cursor-pointer"
        >
          <IconLogout size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

// ─── Main Customer PWA Component ──────────────────────────────────────────────

export default function CustomerPWA() {
  const { theme, setTheme } = useTheme()
  const [screen, setScreen] = useState<Screen>('home')
  const [activeTrackingId, setActiveTrackingId] = useState('NP-20240922-001')
  const [trackingReturnScreen, setTrackingReturnScreen] = useState<Screen>('home')

  // Real backend state
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments)
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

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          toast.success('Netpack app successfully installed to your home screen!')
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.warn('Install error:', err)
      }
    } else {
      toast.info('To install: tap your browser menu (⋮) and choose "Install app"')
    }
  }

  // Fetch live customer shipments
  const fetchShipments = () => {
    if (!customerToken) return
    fetch(`${API_BASE}/api/bookings/my`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Shipment[] = data.map(b => ({
            id: String(b.id),
            tracking: b.trackingNumber || `NP-${b.id}`,
            destination: b.receiverCity ? `${b.receiverCity}, ${b.receiverCountry || ''}` : b.receiverCountry || 'International',
            country: b.receiverCountry || '',
            commodity: b.commodity || 'General Cargo',
            weight: `${b.weight || b.approximateWeight || '1.0'} kg`,
            status:
              (b.status || '').toUpperCase() === 'DELIVERED'
                ? 'delivered'
                : (b.status || '').toUpperCase() === 'PENDING' || (b.status || '').toUpperCase() === 'ENQUIRY_GENERATED'
                ? 'pending'
                : 'in_progress',
            date: b.createdAt
              ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent',
            receiverName: b.receiverName,
            receiverCity: b.receiverCity,
          }))
          setShipments(mapped)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchShipments()
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const deliveredCount = shipments.filter(s => s.status === 'delivered').length

  return (
    <div className="min-h-screen bg-[#F1F4F8] flex justify-center selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative bg-[#F1F4F8] shadow-2xl">
        {/* Top Header matching Figma */}
        <Header
          userName={customerUser?.name || 'Customer'}
          unreadCount={2}
          onBellClick={() => setScreen('notifications')}
          onSignOut={handleSignOut}
          onInstall={handleInstallClick}
          onToggleTheme={toggleTheme}
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
            />
          )}

          {screen === 'shipments' && (
            <ShipmentsScreen
              shipments={shipments}
              onBook={() => setScreen('book')}
              onBack={() => setScreen('home')}
              onTrack={id => handleTrackNav(id, 'shipments')}
              onRefresh={fetchShipments}
            />
          )}

          {screen === 'tracking' && (
            <TrackingScreen
              initialTrackingId={activeTrackingId}
              onBack={() => setScreen(trackingReturnScreen)}
            />
          )}

          {screen === 'rateenquiry' && (
            <RateEnquiryScreen onBack={() => setScreen('home')} />
          )}

          {screen === 'book' && (
            <BookScreen onComplete={handleBookComplete} />
          )}

          {screen === 'notifications' && (
            <NotificationsScreen onBack={() => setScreen('home')} />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              userName={customerUser?.name}
              userEmail={customerUser?.email}
              userPhone={customerUser?.phone}
              userAddress={customerUser?.address1}
              shipmentCount={shipments.length}
              deliveredCount={deliveredCount}
              onSignOut={handleSignOut}
            />
          )}
        </main>

        {/* Bottom Floating Navigation matching Figma */}
        <BottomNav screen={screen} setScreen={setScreen} />
      </div>
    </div>
  )
}
