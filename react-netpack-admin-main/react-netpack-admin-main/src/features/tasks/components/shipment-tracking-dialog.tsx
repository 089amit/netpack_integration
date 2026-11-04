import {
  CheckCircle2,
  PackageSearch,
  Truck,
  Warehouse,
  PackageOpen,
  AlertTriangle,
  ExternalLink,
  Plane,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Scale,
  Boxes,
  MapPin,
  X,
  RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SERVER_URL } from '@/constants/endpoint'

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface ShipmentTrackingDialogProps {
  open: boolean

  onOpenChange: (open: boolean) => void
  currentStatus: string
  additionalNote?: string | null
  shipmentId?: number
  enquiryId?: number
  trackingNumber?: string | null
  hawbNumber?: string | null
  forwardingNumber?: string | null
  forwardingCompanyName?: string | null
}

interface CheckpointItem {
  timestamp?: string | null
  location: string
  status: string
  activity: string
  country?: string
  source?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function parseCheckpointActivity(activity: string) {
  const match = activity.match(/\s*\(Note:\s*([^)]+)\)\s*$/i)
  if (match) {
    const cleanTitle = activity.replace(/\s*\(Note:\s*([^)]+)\)\s*$/i, '').trim()
    const noteText = match[1].trim()
    return { title: cleanTitle, noteText }
  }
  return { title: activity, noteText: null }
}

function getProgressPercent(status: string): number {
  const s = (status || '').toUpperCase()
  if (s.includes('DELIVERED')) return 100
  if (s.includes('OUT_FOR_DELIVERY')) return 90
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) return 78
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB') || s.includes('CUSTOMS')) return 60
  if (s.includes('TRANSIT')) return 45
  if (s.includes('SHIPMENT_CREATED')) return 32
  if (s.includes('WT_DIMENSION_VERIFIED') || s.includes('DIMENSION_VERIFIED') || s.includes('WEIGHT_VERIFIED')) return 26
  if (s.includes('PACKED')) return 20
  if (s === 'PICKED_UP' || s.includes('PICKED_UP')) return 14
  if (s.includes('ASSIGNED_FOR_PICKUP') || s.includes('ASSIGNED_PICKUP')) return 10
  return 8
}

function getStatusConfig(status: string) {
  const s = (status || '').toUpperCase()

  if (s.includes('DELIVERED')) {
    return {
      label: 'Delivered',
      heroTitle: 'Delivered',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      iconClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500',
      dotClass: 'bg-emerald-500 border-emerald-500',
      icon: <CheckCircle2 className='h-4 w-4' />,
    }
  }
  if (s.includes('OUT_FOR_DELIVERY')) {
    return {
      label: 'Out for Delivery',
      heroTitle: 'Out for delivery',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border-amber-500',
      dotClass: 'bg-amber-500 border-amber-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) {
    return {
      label: 'Carrier Scanned',
      heroTitle: 'Carrier Scanned',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      iconClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 border-indigo-500',
      dotClass: 'bg-indigo-500 border-indigo-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB') || s.includes('CUSTOMS')) {
    return {
      label: 'Arrived at Hub',
      heroTitle: 'Arrived at hub',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 border-blue-500',
      dotClass: 'bg-blue-500 border-blue-500',
      icon: <Warehouse className='h-4 w-4' />,
    }
  }
  if (s.includes('TRANSIT')) {
    return {
      label: 'In Transit',
      heroTitle: 'In transit',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      iconClass: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 border-sky-500',
      dotClass: 'bg-sky-500 border-sky-500',
      icon: <Plane className='h-4 w-4' />,
    }
  }
  if (s.includes('SHIPMENT_CREATED')) {
    return {
      label: 'Shipment Created',
      heroTitle: 'Shipment Created',
      badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-300 dark:border-violet-800',
      iconClass: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/80 border-violet-500',
      dotClass: 'bg-violet-500 border-violet-500',
      icon: <PackageOpen className='h-4 w-4' />,
    }
  }
  if (s.includes('WT_DIMENSION_VERIFIED') || s.includes('DIMENSION_VERIFIED') || s.includes('WEIGHT_VERIFIED')) {
    return {
      label: 'Weight & Dim Verified',
      heroTitle: 'Weight & Dimensions Verified',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      iconClass: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/80 border-teal-500',
      dotClass: 'bg-teal-500 border-teal-500',
      icon: <Scale className='h-4 w-4' />,
    }
  }
  if (s.includes('PACKED')) {
    return {
      label: 'Cargo Packed',
      heroTitle: 'Cargo Packed & Boxed',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      iconClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500',
      dotClass: 'bg-emerald-500 border-emerald-500',
      icon: <Boxes className='h-4 w-4' />,
    }
  }
  if (s.includes('ASSIGNED_FOR_PICKUP') || s.includes('ASSIGNED_PICKUP')) {
    return {
      label: 'Assigned for Pickup',
      heroTitle: 'Rider Assigned for Doorstep Collection',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border-amber-500',
      dotClass: 'bg-amber-500 border-amber-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s === 'PICKED_UP' || s.includes('PICKED_UP')) {
    return {
      label: 'Picked Up',
      heroTitle: 'Picked Up by NetPack Courier',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      iconClass: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/80 border-teal-500',
      dotClass: 'bg-teal-500 border-teal-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s.includes('ENQUIRY_GENERATED') || s.includes('PENDING')) {
    return {
      label: 'Enquiry Generated',
      heroTitle: 'Enquiry Registered',
      badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      iconClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-400',
      dotClass: 'bg-slate-400 border-slate-400',
      icon: <PackageSearch className='h-4 w-4' />,
    }
  }
  if (s.includes('EXCEPTION') || s.includes('CANCELLED')) {
    return {
      label: 'Exception',
      heroTitle: 'Exception',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      iconClass: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 border-rose-500',
      dotClass: 'bg-rose-500 border-rose-500',
      icon: <AlertTriangle className='h-4 w-4' />,
    }
  }
  return {
    label: s.replace(/_/g, ' '),
    heroTitle: s.replace(/_/g, ' '),
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    iconClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-400',
    dotClass: 'bg-slate-400 border-slate-400',
    icon: <Clock className='h-4 w-4' />,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ShipmentTrackingDialog({
  open,
  onOpenChange,
  currentStatus,
  additionalNote,
  shipmentId: _shipmentId,
  enquiryId,
  trackingNumber,
  hawbNumber,
  forwardingNumber,
  forwardingCompanyName,
}: ShipmentTrackingDialogProps) {
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [activeTarget, setActiveTarget] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isPackageDetailsOpen, setIsPackageDetailsOpen] = useState<boolean>(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  const initialTarget = hawbNumber || trackingNumber || (enquiryId !== undefined ? String(enquiryId) : null)

  const fetchTracking = (targetOverride?: string) => {
    const idToUse = targetOverride || activeTarget || initialTarget
    if (!idToUse) return
    setLoading(true)
    fetch(`${API_BASE}/api/tracking/${encodeURIComponent(idToUse)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.found) {
          setLiveData(data)
          if (data.hawbNumber) {
            setActiveTarget(data.hawbNumber)
          }
        } else {
          setLiveData(data)
        }
      })
      .catch(() => setLiveData(null))
      .finally(() => setLoading(false))
  }

  const handleLiveSync = async () => {
    const idToSync = liveData?.hawbNumber || liveData?.forwardingNumber || liveData?.shipmentId || activeTarget || initialTarget
    if (!idToSync) return
    setIsSyncing(true)
    try {
      const res = await fetch(`${API_BASE}/api/tracking/sync/${encodeURIComponent(String(idToSync))}`, {
        method: 'POST',
      })
      if (res.ok) {
        const syncData = await res.json()
        if (syncData.tracking) {
          setLiveData(syncData.tracking)
        } else {
          fetchTracking(idToSync)
        }
      } else {
        fetchTracking(idToSync)
      }
    } catch {
      fetchTracking(idToSync)
    } finally {
      setIsSyncing(false)
    }
  }

  const proofImages: string[] = useMemo(() => {
    if (Array.isArray(liveData?.weightProofImages) && liveData.weightProofImages.length > 0) {
      return liveData.weightProofImages
    }
    if (typeof liveData?.weightProofImageUrl === 'string' && liveData.weightProofImageUrl.trim()) {
      return liveData.weightProofImageUrl.split(',').map((u: string) => u.trim()).filter(Boolean)
    }
    return []
  }, [liveData?.weightProofImages, liveData?.weightProofImageUrl])

  const displayBoxes: any[] = useMemo(() => {
    if (Array.isArray(liveData?.boxes) && liveData.boxes.length > 0) return liveData.boxes
    if (Array.isArray(liveData?.packages) && liveData.packages.length > 0) return liveData.packages
    return []
  }, [liveData?.boxes, liveData?.packages])

  useEffect(() => {
    if (open) {
      const initId = hawbNumber || trackingNumber || (enquiryId !== undefined ? String(enquiryId) : null)
      setActiveTarget(initId)
      if (initId) {
        fetchTracking(initId)
      }
      setIsExpanded(false)
      setIsPackageDetailsOpen(false)
      setSelectedPhotoIndex(null)
    } else {
      setLiveData(null)
      setActiveTarget(null)
      setIsExpanded(false)
      setIsPackageDetailsOpen(false)
      setSelectedPhotoIndex(null)
    }
  }, [open, trackingNumber, hawbNumber, enquiryId])

  useEffect(() => {
    if (selectedPhotoIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhotoIndex(null)
      if (proofImages.length > 1) {
        if (e.key === 'ArrowLeft') {
          setSelectedPhotoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : proofImages.length - 1))
        }
        if (e.key === 'ArrowRight') {
          setSelectedPhotoIndex(prev => (prev !== null && prev < proofImages.length - 1 ? prev + 1 : 0))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhotoIndex, proofImages.length])

  const handleCopy = (text?: string | null) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const effectiveStatus = liveData?.currentStatus || currentStatus
  const statusCfg = getStatusConfig(effectiveStatus)
  const checkpoints: CheckpointItem[] = useMemo(() => {
    return (liveData?.checkpoints || []).filter(
      (cp: any) =>
        cp.status !== 'HAWB_SPLIT' &&
        !String(cp.activity || '').toLowerCase().includes('partition')
    )
  }, [liveData?.checkpoints])
  const progressPercent = getProgressPercent(effectiveStatus)

  const displayForwardingCompany = liveData?.forwardingCompany || forwardingCompanyName || 'UPS'
  const displayForwardingNumber = liveData?.forwardingNumber || forwardingNumber
  const carrierUrl =
    liveData?.carrierTrackingUrl ||
    (displayForwardingNumber ? `https://www.ups.com/track?tracknum=${displayForwardingNumber}` : null)

  // Subtitle / arrival info
  const latestCheckpoint = checkpoints[0]
  const arrivalSubtitle = useMemo(() => {
    if (latestCheckpoint?.timestamp) {
      return `Updated ${formatDateTime(latestCheckpoint.timestamp)}`
    }
    return 'Status active'
  }, [latestCheckpoint])

  // Display items based on packed collapsible logic
  const canCollapse = checkpoints.length > 5
  const displayedItems = useMemo(() => {
    if (!canCollapse || isExpanded) {
      return checkpoints.map((cp, i) => ({ cp, originalIdx: i, isBottomSummary: false }))
    }
    // Collapsed: Top 3, and bottom 1
    const topThree = checkpoints.slice(0, 3).map((cp, i) => ({ cp, originalIdx: i, isBottomSummary: false }))
    const bottomOne = { cp: checkpoints[checkpoints.length - 1], originalIdx: checkpoints.length - 1, isBottomSummary: true }
    return [...topThree, bottomOne]
  }, [checkpoints, canCollapse, isExpanded])

  const isDelivered = (effectiveStatus || '').toUpperCase().includes('DELIVERED')
  const isOutOfDelivery = (effectiveStatus || '').toUpperCase().includes('OUT_FOR_DELIVERY') || (effectiveStatus || '').toUpperCase().includes('CARRIER')
  const isHub = (effectiveStatus || '').toUpperCase().includes('HUB') || (effectiveStatus || '').toUpperCase().includes('ARRIVED')
  const isInTransit = (effectiveStatus || '').toUpperCase().includes('TRANSIT')
  const isCreated = (effectiveStatus || '').toUpperCase().includes('SHIPMENT_CREATED')
  const isPickedUp = (effectiveStatus || '').toUpperCase().includes('PICKED_UP') || (effectiveStatus || '').toUpperCase().includes('PACKED')

  const routeStatusBadge = useMemo(() => {
    if (isDelivered) {
      return {
        Icon: CheckCircle2,
        badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-800',
        animateClass: '',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-emerald-300 dark:border-emerald-700',
      }
    }
    if (isOutOfDelivery) {
      return {
        Icon: Truck,
        badgeClass: 'border-orange-300 bg-orange-50 text-orange-600 dark:bg-orange-950 dark:border-orange-800',
        animateClass: 'animate-pulse',
        iconClass: 'text-orange-600 dark:text-orange-400',
        borderClass: 'border-orange-300 dark:border-orange-700',
      }
    }
    if (isHub) {
      return {
        Icon: Warehouse,
        badgeClass: 'border-purple-300 bg-purple-50 text-purple-600 dark:bg-purple-950 dark:border-purple-800',
        animateClass: '',
        iconClass: 'text-purple-600 dark:text-purple-400',
        borderClass: 'border-purple-300 dark:border-purple-700',
      }
    }
    if (isInTransit) {
      return {
        Icon: Plane,
        badgeClass: 'border-sky-300 bg-sky-50 text-sky-600 dark:bg-sky-950 dark:border-sky-800',
        animateClass: '',
        iconClass: 'text-sky-600 dark:text-sky-400 rotate-45',
        borderClass: 'border-sky-400 dark:border-sky-700',
      }
    }
    if (isCreated) {
      return {
        Icon: PackageOpen,
        badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-800',
        animateClass: '',
        iconClass: 'text-indigo-600 dark:text-indigo-400',
        borderClass: 'border-indigo-300 dark:border-indigo-700',
      }
    }
    if (isPickedUp) {
      return {
        Icon: Boxes,
        badgeClass: 'border-teal-200 bg-teal-50 text-teal-600 dark:bg-teal-950 dark:border-teal-800',
        animateClass: '',
        iconClass: 'text-teal-600 dark:text-teal-400',
        borderClass: 'border-teal-300 dark:border-teal-700',
      }
    }
    return {
      Icon: Clock,
      badgeClass: 'border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:border-blue-800',
      animateClass: '',
      iconClass: 'text-blue-600 dark:text-blue-400',
      borderClass: 'border-blue-300 dark:border-blue-700',
    }
  }, [isDelivered, isOutOfDelivery, isHub, isInTransit, isCreated, isPickedUp])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ── Dialog Content: flex-col with overflow-hidden ensures inner body scrolls cleanly ── */}
      <DialogContent className='max-h-[90vh] flex flex-col sm:max-w-xl p-0 gap-0 border-border/80 shadow-2xl overflow-hidden'>
        {/* ── Dialog Header Action Bar (Clean Netpack Layout, No API/Sync Buttons) ── */}
        <div className='flex items-center justify-between px-6 pt-5 pb-3 border-b bg-background shrink-0'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-bold text-foreground'>
              {liveData?.receiverName || 'Consignment Tracking'}
            </span>
            <span className='text-xs font-bold text-foreground uppercase tracking-wide px-2 py-0.5 rounded bg-muted'>
              {displayForwardingCompany}
            </span>
            {loading && (
              <span className='text-[10px] text-muted-foreground animate-pulse'>Updating...</span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className={`text-xs font-semibold px-2.5 py-0.5 border ${statusCfg.badgeClass}`}>
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        {/* ── Scrollable Dialog Body (Smooth scrolling, no locking) ── */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {/* ── Additional Note Warning ────────────────────────────── */}
          {additionalNote && (
            <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
              <div className='text-xs'>
                <span className='font-semibold'>Note: </span>
                {additionalNote}
              </div>
            </div>
          )}

          {/* ── HERO STATUS & DYNAMIC ROUTE INDICATOR ───────────────── */}
          <div className='space-y-3'>
            <div>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
                  {statusCfg.heroTitle}
                </h2>
              </div>
              <p className='text-xs text-muted-foreground font-medium mt-1'>
                {latestCheckpoint?.activity ? (
                  <span className='text-foreground font-semibold'>
                    {parseCheckpointActivity(latestCheckpoint.activity).title}
                    {latestCheckpoint.location ? ` • ${latestCheckpoint.location}` : ''}
                    {latestCheckpoint.timestamp ? ` • ${formatDateTime(latestCheckpoint.timestamp)}` : ''}
                  </span>
                ) : (
                  arrivalSubtitle
                )}
              </p>
            </div>

            {/* Dynamic Route Status Banner */}
            <div className='flex items-center justify-between gap-3 py-2 px-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs'>
              <div className='flex items-center gap-1.5 font-bold text-foreground shrink-0'>
                <MapPin className='h-4 w-4 text-primary shrink-0' />
                <span>{liveData?.origin || 'Kathmandu, Nepal'}</span>
              </div>
              <div className='flex-1 flex items-center justify-center relative px-2'>
                <div className={`w-full border-t border-dashed ${routeStatusBadge.borderClass}`} />
                <span className={`absolute bg-background p-1 rounded-full border shadow-xs ${routeStatusBadge.badgeClass} ${routeStatusBadge.animateClass}`}>
                  <routeStatusBadge.Icon className={`h-3.5 w-3.5 ${routeStatusBadge.iconClass}`} />
                </span>
              </div>
              <div className='flex items-center gap-1.5 font-bold text-foreground shrink-0'>
                <span>{liveData?.destination || 'Destination'}</span>
                <MapPin className={`h-4 w-4 shrink-0 ${isDelivered ? 'text-emerald-600' : 'text-primary'}`} />
              </div>
            </div>

            {/* Progress bar */}
            <div className='space-y-1'>
              <div className='relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 rounded-full transition-all duration-500 ease-out'
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className='flex justify-between items-center text-[10px] text-muted-foreground font-medium'>
                <span>Kathmandu (Origin)</span>
                <span className='font-bold text-primary'>{progressPercent}% Completed</span>
                <span>Consignee Delivery</span>
              </div>
            </div>
          </div>

          {/* ── COMPACT INFO CHIPS ROW (Forwarding & Scale Photo) ─────── */}
          <div className='grid grid-cols-2 gap-2.5'>
            {/* Forwarding Courier Chip */}
            <div className='p-2.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between'>
              <div className='min-w-0'>
                <span className='text-[10px] uppercase font-bold text-muted-foreground block tracking-wider'>
                  Courier Forwarding
                </span>
                <span className='text-xs font-mono font-bold text-foreground truncate block mt-0.5'>
                  {displayForwardingCompany}: {displayForwardingNumber || 'Assigned'}
                </span>
              </div>
              <div className='flex items-center gap-1 shrink-0 ml-1.5'>
                {displayForwardingNumber && (
                  <button
                    type='button'
                    onClick={() => handleCopy(displayForwardingNumber)}
                    className='p-1 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground transition'
                    title='Copy Forwarding Number'
                  >
                    <Copy className='h-3 w-3' />
                  </button>
                )}
                {carrierUrl && (
                  <a
                    href={carrierUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='p-1 rounded-lg border border-border bg-background text-primary hover:bg-primary/5 transition'
                    title='Track on Courier Website'
                  >
                    <ExternalLink className='h-3 w-3' />
                  </a>
                )}
              </div>
            </div>

            {/* Verified Cargo Chip */}
            <div className='p-2.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between'>
              <div className='min-w-0'>
                <span className='text-[10px] uppercase font-bold text-muted-foreground block tracking-wider'>
                  Verified Cargo
                </span>
                <span className='text-xs font-bold text-foreground truncate block mt-0.5'>
                  {liveData?.chargeableWeight || liveData?.weight || '25.0'} kg{' '}
                  <span className='text-muted-foreground font-normal'>
                    / {liveData?.pieces ? `${liveData.pieces} Box` : '1 Box'}
                  </span>
                </span>
              </div>
              {proofImages.length > 0 && (
                <button
                  type='button'
                  onClick={() => setSelectedPhotoIndex(0)}
                  className='px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shrink-0'
                  title='View Scale Calibration Proof'
                >
                  {proofImages.length} {proofImages.length > 1 ? 'Photos' : 'Photo'}
                </button>
              )}
            </div>
          </div>

          {/* ── CONSIGNMENT HAWBS OVERVIEW (For Partitioned Shipments) ── */}
          {liveData?.hawbs && liveData.hawbs.length > 1 && (
            <div className='rounded-xl border bg-card p-4 space-y-3 shadow-xs'>
              <div className='flex items-center justify-between border-b pb-2.5'>
                <div className='flex items-center gap-2'>
                  <Boxes className='h-4 w-4 text-primary' />
                  <span className='text-xs font-bold uppercase tracking-wider text-foreground'>
                    Consignment HAWBs & Carrier Tracking ({liveData.hawbs.length} HAWBs)
                  </span>
                </div>
                <Badge variant='outline' className='bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs'>
                  Multi-HAWB Consignment
                </Badge>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                {liveData.hawbs.map((h: any, hIdx: number) => {
                  const isCurrent = h.hawbno === (liveData.hawbNumber || activeTarget || hawbNumber)
                  const isDelivered = h.status === 'DELIVERED'

                  return (
                    <div
                      key={h.id || hIdx}
                      onClick={() => {
                        if (!isCurrent && h.hawbno) {
                          setActiveTarget(h.hawbno)
                          fetchTracking(h.hawbno)
                        }
                      }}
                      className={`rounded-xl border p-3.5 space-y-2.5 transition-all duration-200 cursor-pointer select-none ${
                        isCurrent
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/25 shadow-xs'
                          : 'bg-card border-border/80 hover:border-blue-400 hover:bg-muted/40'
                      }`}
                      title={isCurrent ? 'Currently viewing tracking for this HAWB' : `Tap to view live tracking for ${h.hawbno}`}
                    >
                      {/* Top Row: HAWB number + Active Badge + Status */}
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <span className='font-mono font-bold text-sm tracking-tight text-foreground whitespace-nowrap'>
                            {h.hawbno}
                          </span>
                          {isCurrent && (
                            <Badge className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white tracking-wide shrink-0 border-0'>
                              Active
                            </Badge>
                          )}
                        </div>

                        {h.status && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase shrink-0 border ${
                              isDelivered
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : h.status === 'CARRIER_SCANNED' || h.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDelivered
                                  ? 'bg-emerald-500'
                                  : h.status === 'CARRIER_SCANNED' || h.status === 'OUT_FOR_DELIVERY'
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {h.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Cargo info (boxes + weight + box range) */}
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <span className='font-medium text-foreground'>
                          {h.boxCount} {h.boxCount === 1 ? 'Box' : 'Boxes'} • {h.totalWeight} KG
                        </span>
                        <span className='font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-muted/80 text-foreground border border-border/60'>
                          {h.boxNumbersDisplay || (h.assignedBoxNumbers?.length ? `Box ${h.assignedBoxNumbers.join(', ')}` : `Box 1-${h.boxCount}`)}
                        </span>
                      </div>

                      {/* Bottom Row: Carrier info & link */}
                      <div className='flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px]'>
                        <div className='min-w-0 truncate'>
                          <span className='text-muted-foreground text-[10px] block'>Carrier Forwarding:</span>
                          <span className='font-mono font-bold text-foreground truncate block'>
                            {h.forwardingNumber || 'Pending Assignment'}
                          </span>
                        </div>

                        {h.carrierTrackingUrl && (
                          <a
                            href={h.carrierTrackingUrl}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline shrink-0 px-2 py-1 rounded bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 transition'
                          >
                            <span>Carrier Link</span>
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── UNIFIED CHRONOLOGICAL TIMELINE (Merged Milestones + Scans, Newest First) ── */}
          <div className='space-y-3 pt-1'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full bg-primary'></span>
                <span className='text-xs font-bold uppercase tracking-wider text-foreground'>
                  Consignment Journey & Scans ({checkpoints.length})
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={handleLiveSync}
                  disabled={isSyncing}
                  className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-primary/30 text-[11px] font-mono font-bold text-primary hover:bg-primary/5 transition disabled:opacity-50'
                  title='Fetch newest carrier scans from TrackingMore API'
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
                </button>
                <span className='text-[11px] font-mono text-muted-foreground font-semibold'>Newest First</span>
              </div>
            </div>

            {checkpoints.length > 0 ? (
              <div className='relative pl-6 before:absolute before:left-[9px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800'>
                {displayedItems.map(({ cp, originalIdx }, loopIdx) => {
                  const isTopItem = originalIdx === 0
                  const isSelfDropEvent = cp.source === 'COUNTER_DROPOFF'
                  const { title, noteText } = parseCheckpointActivity(cp.activity || '')
                  const isPickupOrPacked = (cp.status === 'PICKED_UP' || cp.status === 'PACKED' || title.toLowerCase().includes('picked') || title.toLowerCase().includes('packed'))

                  return (
                    <div key={originalIdx} className='relative group pb-4 last:pb-1'>
                      {/* Top Node Dot or Regular Node */}
                      <div
                        className={`absolute -left-6 top-0.5 flex items-center justify-center rounded-full transition-all ${
                          isTopItem
                            ? isDelivered
                              ? 'w-5 h-5 bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/80 shadow-xs'
                              : 'w-5 h-5 bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950/80 shadow-xs animate-pulse'
                            : 'w-5 h-5 bg-background border-2 border-slate-300 dark:border-slate-600 text-muted-foreground'
                        }`}
                      >
                        {isTopItem ? (
                          isDelivered ? (
                            <Check className='h-3 w-3 stroke-[3]' />
                          ) : (
                            <div className='h-1.5 w-1.5 rounded-full bg-white' />
                          )
                        ) : (
                          <div className='h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500' />
                        )}
                      </div>

                      {/* Checkpoint Detail Block */}
                      <div className='space-y-0.5 text-left'>
                        <div className='flex items-center justify-between'>
                          <div className='flex flex-wrap items-center gap-1.5'>
                            <span className={`text-xs font-bold leading-snug ${isTopItem ? 'text-foreground' : 'text-foreground/90'}`}>
                              {title}
                            </span>
                            {cp.source === 'OPERATIONS_NOTE' && (
                              <Badge variant='outline' className='text-[9px] font-bold px-1.5 py-0 h-4 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-300'>
                                Operations Note
                              </Badge>
                            )}
                            {isSelfDropEvent && (
                              <Badge variant='outline' className='text-[9px] font-bold px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                                Self Drop
                              </Badge>
                            )}
                          </div>
                          <span className='text-[10px] text-muted-foreground font-mono shrink-0 ml-2'>
                            {formatDateTime(cp.timestamp)}
                          </span>
                        </div>

                        {cp.location ? (
                          <div className='text-[11px] text-muted-foreground font-medium'>
                            {cp.location}
                          </div>
                        ) : null}

                        {/* Dedicated Amber Rider Note Pill */}
                        {noteText && isPickupOrPacked && (
                          <div className='p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-1.5 mt-1 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'>
                            <span className='font-bold uppercase tracking-wider text-[10px] bg-amber-200/70 dark:bg-amber-800/60 px-1.5 py-0.5 rounded shrink-0'>
                              Rider Note
                            </span>
                            <span className='leading-snug'>{noteText}</span>
                          </div>
                        )}
                      </div>

                      {/* "SEE ALL UPDATES (N)" Button inserted between Top 3 and Bottom 1 when collapsed */}
                      {!isExpanded && canCollapse && loopIdx === 2 && (
                        <div className='my-3 -ml-1'>
                          <button
                            type='button'
                            onClick={() => setIsExpanded(true)}
                            className='inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer py-1'
                          >
                            <span>SEE ALL UPDATES ({checkpoints.length})</span>
                            <ChevronDown className='h-3.5 w-3.5' />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* "COLLAPSE UPDATES" Button at bottom when expanded */}
                {isExpanded && canCollapse && (
                  <div className='pt-1 pb-2 -ml-1'>
                    <button
                      type='button'
                      onClick={() => setIsExpanded(false)}
                      className='inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer py-1'
                    >
                      <span>COLLAPSE UPDATES</span>
                      <ChevronUp className='h-3.5 w-3.5' />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground space-y-2'>
                <PackageSearch className='h-8 w-8 mx-auto text-muted-foreground/50' />
                <p className='font-medium text-foreground'>No transit checkpoints logged yet</p>
                <p>Live checkpoints will record automatically upon carrier or airline dispatch.</p>
              </div>
            )}
          </div>

          {/* ── PACKAGE SPECIFICATIONS & PACKING LIST (Expandable Button & Details) ── */}
          <div className='rounded-xl border bg-card overflow-hidden shadow-xs'>
            <div className='p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20'>
              <div className='flex items-center gap-3'>
                <div className='h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                  <Boxes className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs font-bold text-foreground flex items-center gap-2'>
                    <span>Package Specifications & Packing List</span>
                    {displayBoxes.length > 0 && (
                      <Badge variant='outline' className='text-[10px] font-semibold py-0 h-4 px-1.5 bg-background'>
                        {displayBoxes.length} {displayBoxes.length === 1 ? 'Box' : 'Boxes'}
                      </Badge>
                    )}
                    {liveData?.weight && (
                      <Badge variant='outline' className='text-[10px] font-semibold py-0 h-4 px-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                        {liveData.weight} kg
                      </Badge>
                    )}
                  </div>
                  <div className='text-[11px] text-muted-foreground mt-0.5'>
                    View box dimensions, verified weights, scale photo & itemized packing list
                  </div>
                </div>
              </div>

              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsPackageDetailsOpen(!isPackageDetailsOpen)}
                className='h-8 text-xs font-semibold gap-1.5 shrink-0 bg-background hover:bg-muted'
              >
                <Scale className='h-3.5 w-3.5 text-primary' />
                <span>{isPackageDetailsOpen ? 'Hide Package Details' : 'View Package & Items'}</span>
                {isPackageDetailsOpen ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
              </Button>
            </div>

            {/* Expandable Content Body */}
            {isPackageDetailsOpen && (
              <div className='border-t p-4 sm:p-5 space-y-5 animate-in fade-in-50 duration-150'>
                {/* 1. Warehouse Verified Scale & Intake Details */}
                {(liveData?.weightProofImageUrl || liveData?.weight || liveData?.pickedUpAt) && (
                  <div className='rounded-lg border bg-muted/20 p-3.5 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                        <Scale className='h-3.5 w-3.5 text-primary' />
                        Warehouse Verified Weight & Scale Photo
                      </span>
                      <Badge variant='outline' className='text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                        Verified at Intake
                      </Badge>
                    </div>

                    <div className='flex flex-col sm:flex-row items-start gap-4 pt-1'>
                      {proofImages.length > 0 && (
                        <div className='flex flex-wrap items-center gap-2 shrink-0'>
                          {proofImages.map((imgUrl, pIdx) => {
                            const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`
                            return (
                              <button
                                key={pIdx}
                                type='button'
                                onClick={() => setSelectedPhotoIndex(pIdx)}
                                className='relative group overflow-hidden rounded-lg border border-border shadow-xs hover:border-primary shrink-0 cursor-pointer text-left h-20 w-24 sm:h-24 sm:w-28 bg-black/10'
                              >
                                <img
                                  src={fullUrl}
                                  alt={`Weighing Scale Proof ${pIdx + 1}`}
                                  className='h-full w-full object-cover transition-transform group-hover:scale-105'
                                />
                                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium'>
                                  View #{pIdx + 1}
                                </div>
                                {proofImages.length > 1 && (
                                  <span className='absolute bottom-1 right-1 bg-black/75 text-[9px] font-mono text-white px-1.5 py-0.5 rounded'>
                                    #{pIdx + 1}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <div className='space-y-1.5 text-xs flex-1'>
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                          <div>
                            <span className='text-muted-foreground block text-[11px]'>Actual Gross Weight:</span>
                            <span className='font-bold text-foreground text-sm'>{liveData?.weight || 'N/A'} kg</span>
                          </div>
                          {liveData?.volumetricWeight && (
                            <div>
                              <span className='text-muted-foreground block text-[11px]'>Volumetric Weight:</span>
                              <span className='font-medium text-foreground text-sm'>{liveData.volumetricWeight} kg</span>
                            </div>
                          )}
                          {liveData?.chargeableWeight && (
                            <div>
                              <span className='text-muted-foreground block text-[11px]'>Chargeable Weight:</span>
                              <span className='font-bold text-primary text-sm'>{liveData.chargeableWeight} kg</span>
                            </div>
                          )}
                        </div>
                        {liveData?.pickedUpAt && (
                          <div className='text-[11px] text-muted-foreground pt-1.5 border-t'>
                            Intake Time: {formatDateTime(liveData.pickedUpAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Station-Wise Pickup Itinerary (If multi-stop or recorded stops) */}
                {liveData?.pickupLocations && liveData.pickupLocations.length > 0 && (
                  <div className='rounded-lg border p-3.5 space-y-2.5 bg-muted/20'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                        <MapPin className='h-3.5 w-3.5 text-emerald-600' />
                        Station-Wise Pickup Progress
                      </span>
                      <Badge variant='outline' className='text-[10px] font-bold'>
                        {liveData.pickupLocations.filter((s: any) => s.isPickedUp).length} of {liveData.pickupLocations.length} Collected
                      </Badge>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                      {liveData.pickupLocations.map((stop: any, sIdx: number) => (
                        <div
                          key={sIdx}
                          className={`p-2 rounded-md border text-xs flex items-start justify-between gap-2 ${
                            stop.isPickedUp ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-background border-border'
                          }`}
                        >
                          <div className='min-w-0'>
                            <div className='flex items-center gap-1'>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                stop.isPickedUp ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                              }`}>
                                Stop #{sIdx + 1}
                              </span>
                              <span className='font-medium text-foreground truncate'>{stop.location}</span>
                            </div>
                            {stop.note && (
                              <div className='text-[10px] text-muted-foreground mt-0.5 truncate'>
                                {stop.note}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={stop.isPickedUp ? 'default' : 'secondary'}
                            className={`text-[9px] font-bold shrink-0 ${
                              stop.isPickedUp ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                            }`}
                          >
                            {stop.isPickedUp ? '✓ Collected' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Box Specifications & Items in Boxes (Packing List without values) */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                      <Boxes className='h-3.5 w-3.5 text-primary' />
                      Box Weights, Dimensions & Item Packing List
                    </span>
                    <span className='text-[11px] text-muted-foreground'>
                      {displayBoxes.length || 1} {(displayBoxes.length || 1) === 1 ? 'Box' : 'Boxes'} Total
                    </span>
                  </div>

                  <div className='space-y-3'>
                    {(displayBoxes.length > 0 ? displayBoxes : [
                      {
                        boxNumber: 1,
                        trackingNumber: 'BOX-1',
                        weight: liveData?.weight || 10.0,
                        dimensions: 'Standard Cargo Box',
                        items: [{ item: 'General Goods', pieces: 1 }]
                      }
                    ]).map((box: any, bIdx: number) => (
                      <div
                        key={bIdx}
                        className={`rounded-lg border p-3.5 space-y-2.5 shadow-2xs transition-all ${
                          box.isTargeted || box.trackingNumber === liveData?.targetedBoxTrackingNumber
                            ? 'bg-primary/5 border-primary/40 ring-2 ring-primary/30'
                            : 'bg-muted/10 border-border'
                        }`}
                      >
                        {/* Box Header: Weight, Piece #, HAWB, Carrier Fwd, Piece Barcode */}
                        <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='font-bold text-foreground'>
                              {box.pieceNumber || `Box #${box.boxNumber || bIdx + 1}`}
                            </span>
                            {box.trackingNumber && (
                              <div className='inline-flex items-center gap-1 font-mono text-[11px] text-foreground bg-background border px-2 py-0.5 rounded shadow-2xs'>
                                <span>{box.trackingNumber}</span>
                                <button
                                  type='button'
                                  onClick={() => handleCopy(box.trackingNumber)}
                                  className='text-muted-foreground hover:text-primary cursor-pointer'
                                  title='Copy box barcode tracking number'
                                >
                                  <Copy className='h-3 w-3' />
                                </button>
                              </div>
                            )}
                            {box.hawbNumber && (
                              <Badge variant='outline' className='text-[10px] px-1.5 py-0 h-4.5 bg-background font-mono'>
                                HAWB: {box.hawbNumber}
                              </Badge>
                            )}
                            {box.forwardingNumber && (
                              <Badge variant='outline' className='text-[10px] px-1.5 py-0 h-4.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono'>
                                Carrier: {box.forwardingNumber}
                              </Badge>
                            )}
                            {(box.isTargeted || box.trackingNumber === liveData?.targetedBoxTrackingNumber) && (
                              <Badge variant='outline' className='text-[10px] px-1.5 py-0 h-4.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-bold'>
                                🎯 Current Tracked Piece
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center gap-3 text-[11px]'>
                            <span>
                              <strong className='text-foreground'>Weight:</strong>{' '}
                              {box.chargeableWeight && box.actualWeight && Number(box.chargeableWeight) !== Number(box.actualWeight) ? (
                                <span>
                                  <span className='font-bold text-foreground'>{box.chargeableWeight} kg</span>
                                  <span className='text-muted-foreground ml-1'>(Act: {box.actualWeight} kg)</span>
                                </span>
                              ) : (
                                <span>{box.chargeableWeight || box.weight || '-'} kg</span>
                              )}
                            </span>
                            <span>
                              <strong className='text-foreground'>Dims:</strong> {box.dimensions || (box.length && box.breadth && box.height ? `${box.length} x ${box.breadth} x ${box.height} cm` : 'Standard Box')}
                            </span>
                            {box.volumetricWeight && (
                              <span className='text-muted-foreground'>
                                (Vol: {box.volumetricWeight} kg)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items in this Box (Packing List - Items & Pcs only) */}
                        <div className='pt-0.5'>
                          <div className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
                            Items in this Box (Packing List):
                          </div>
                          {box.items && box.items.length > 0 ? (
                            <div className='divide-y rounded-md border bg-background'>
                              {box.items.map((itm: any, itmIdx: number) => (
                                <div key={itmIdx} className='flex items-center justify-between px-3 py-1.5 text-xs'>
                                  <span className='font-medium text-foreground'>{itm.item || 'Item'}</span>
                                  <span className='font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]'>
                                    {itm.pieces || 1} {(itm.pieces || 1) === 1 ? 'pc' : 'pcs'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className='text-xs text-muted-foreground italic px-2 py-1 bg-background rounded border'>
                              General Goods — 1 pc
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER METADATA CARD (Keeping Netpack Layout & Details) ── */}
          <div className='rounded-xl border bg-muted/30 p-4 space-y-3.5 text-xs'>
            {/* Tracking Number Row with Copy Button */}
            <div className='flex items-center justify-between pb-3 border-b border-border/60'>
              <span className='font-medium text-muted-foreground'>Tracking number</span>
              <div className='flex items-center gap-2'>
                <span className='font-mono font-bold text-sm text-foreground'>
                  {displayForwardingNumber || liveData?.trackingNumber || hawbNumber || 'N/A'}
                </span>
                {displayForwardingNumber && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => handleCopy(displayForwardingNumber)}
                    className='h-6 w-6 text-muted-foreground hover:text-foreground'
                    title='Copy tracking number'
                  >
                    {copied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5' />}
                  </Button>
                )}
              </div>
            </div>

            {/* Carrier Row with External Link */}
            <div className='flex items-center justify-between pb-3 border-b border-border/60'>
              <span className='font-medium text-muted-foreground'>Carrier</span>
              <div className='flex items-center gap-1.5 font-bold text-foreground'>
                <span>{displayForwardingCompany}</span>
                {carrierUrl && (
                  <a
                    href={carrierUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline inline-flex items-center gap-0.5'
                  >
                    <ExternalLink className='h-3 w-3' />
                  </a>
                )}
              </div>
            </div>

            {/* Route & Cargo Specs */}
            <div className='grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-0.5'>
              <div>
                <span className='font-medium text-foreground'>Route:</span>{' '}
                {liveData?.origin || 'Kathmandu, NP'} ➔ {liveData?.destination || 'Overseas'}
              </div>
              <div>
                <span className='font-medium text-foreground'>Cargo:</span>{' '}
                {liveData?.pieces ? `${liveData.pieces} Box(es)` : 'Consignment'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scale Photo Lightbox Modal ── */}
        {/* ── Scale Photo Lightbox Modal ── */}
        {selectedPhotoIndex !== null && proofImages[selectedPhotoIndex] && (() => {
          const currentUrl = proofImages[selectedPhotoIndex]
          const displayUrl = currentUrl.startsWith('http') ? currentUrl : `${API_BASE}${currentUrl}`
          const hasMultiple = proofImages.length > 1

          return (
            <div
              className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in-50 duration-200'
              onClick={() => setSelectedPhotoIndex(null)}
            >
              <div
                className='relative max-w-2xl w-full bg-background rounded-xl p-3 sm:p-4 shadow-2xl overflow-hidden space-y-3'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='flex items-center justify-between pb-2 border-b'>
                  <div className='flex items-center gap-2'>
                    <Scale className='h-4 w-4 text-primary' />
                    <span className='text-xs font-bold text-foreground'>Warehouse Weighing Scale Photo Proof</span>
                    {hasMultiple && (
                      <Badge variant='outline' className='text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                        Photo {selectedPhotoIndex + 1} of {proofImages.length}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7 rounded-full'
                    onClick={() => setSelectedPhotoIndex(null)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>

                <div className='relative overflow-hidden rounded-lg bg-black flex items-center justify-center min-h-[300px] max-h-[70vh] select-none'>
                  <img
                    src={displayUrl}
                    alt={`Warehouse Scale Proof ${selectedPhotoIndex + 1}`}
                    className='max-h-[70vh] max-w-full object-contain'
                  />

                  {hasMultiple && (
                    <>
                      <button
                        type='button'
                        onClick={() => setSelectedPhotoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : proofImages.length - 1))}
                        className='absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg border border-white/20 cursor-pointer active:scale-95 transition-all'
                        title='Previous photo'
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => setSelectedPhotoIndex(prev => (prev !== null && prev < proofImages.length - 1 ? prev + 1 : 0))}
                        className='absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg border border-white/20 cursor-pointer active:scale-95 transition-all'
                        title='Next photo'
                      >
                        <ChevronRight className='h-4 w-4' />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                {hasMultiple && (
                  <div className='flex items-center gap-2 overflow-x-auto py-1 px-1 bg-muted/30 rounded-lg no-scrollbar'>
                    {proofImages.map((u, idx) => {
                      const tUrl = u.startsWith('http') ? u : `${API_BASE}${u}`
                      const isSel = idx === selectedPhotoIndex
                      return (
                        <button
                          key={idx}
                          type='button'
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`relative shrink-0 h-12 w-14 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                            isSel ? 'border-primary ring-2 ring-primary/30' : 'border-border opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={tUrl} alt={`Thumb ${idx + 1}`} className='h-full w-full object-cover' />
                          <span className='absolute bottom-0 right-0 bg-black/70 text-[9px] font-mono text-white px-1'>
                            {idx + 1}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className='pt-1 flex items-center justify-between'>
                  <span className='text-[11px] text-muted-foreground'>
                    Scale Weight: <strong className='text-foreground'>{liveData?.weight || 'N/A'} kg</strong>
                  </span>
                  <a
                    href={displayUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline'
                  >
                    Open Original Image
                    <ExternalLink className='h-3.5 w-3.5' />
                  </a>
                </div>
              </div>
            </div>
          )
        })()}
      </DialogContent>
    </Dialog>
  )
}


