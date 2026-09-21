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
  Scale,
  Boxes,
  X,
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

function getProgressPercent(status: string): number {
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
  if (s.includes('PICKED_UP') || s.includes('PICKUP')) {
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [isMilestonesFolded, setIsMilestonesFolded] = useState<boolean>(true)
  const [isPackageDetailsOpen, setIsPackageDetailsOpen] = useState<boolean>(false)
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  const queryParam = trackingNumber || (enquiryId !== undefined ? String(enquiryId) : null)

  const fetchTracking = () => {
    if (!queryParam) return
    setLoading(true)
    fetch(`${API_BASE}/api/tracking/${encodeURIComponent(queryParam)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setLiveData(data))
      .catch(() => setLiveData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open && queryParam) {
      fetchTracking()
      setIsExpanded(false)
      setIsMilestonesFolded(true)
      setIsPackageDetailsOpen(false)
      setSelectedPhotoUrl(null)
    }
    if (!open) {
      setLiveData(null)
      setIsExpanded(false)
      setIsPackageDetailsOpen(false)
      setSelectedPhotoUrl(null)
    }
  }, [open, queryParam])

  const handleCopy = (text?: string | null) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const effectiveStatus = liveData?.currentStatus || currentStatus
  const statusCfg = getStatusConfig(effectiveStatus)
  const checkpoints: CheckpointItem[] = liveData?.checkpoints || []
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

  // Milestone Stages Definition (Clean 7 primary lifecycle stages)
  const milestoneStages = useMemo(() => {
    const enquiryCp = checkpoints.find((cp) => (cp.status || '').toUpperCase() === 'ENQUIRY_GENERATED')
    const pickupCp = checkpoints.find((cp) => (cp.status || '').toUpperCase() === 'PICKED_UP')
    const createdCp = checkpoints.find((cp) => (cp.status || '').toUpperCase() === 'SHIPMENT_CREATED')
    const airlineTransitCp = checkpoints.find(
      (cp) => (cp.status || '').toUpperCase() === 'IN_TRANSIT' && (!cp.source || cp.source.includes('AIRLINE') || cp.source.includes('INTERNAL') || cp.source.includes('MAWB'))
    )
    const hubCp = checkpoints.find(
      (cp) => (cp.status || '').toUpperCase() === 'ARRIVED_AT_HUB'
    )
    const carrierCp = checkpoints.find(
      (cp) => (cp.status || '').toUpperCase() === 'CARRIER_SCANNED' ||
              (cp.status || '').toUpperCase() === 'OUT_FOR_DELIVERY' ||
              (cp.source || '').includes('CARRIER') ||
              (cp.source || '').includes('TRACKINGMORE')
    )
    const deliveredCp = checkpoints.find((cp) => (cp.status || '').toUpperCase() === 'DELIVERED')

    const dest = liveData?.destination || 'Overseas'
    const displayHawb = liveData?.hawbNumber || hawbNumber || 'Consignment'
    const isSelfDrop = liveData?.isSelfDrop || liveData?.pickupRequired === false

    const stages: any[] = [
      {
        id: 'ENQUIRY_GENERATED',
        label: 'Enquiry Generated',
        description: 'Shipment enquiry registered with NetPack Logistics',
        timestamp: enquiryCp?.timestamp || liveData?.enquiryCreatedAt,
        icon: <PackageSearch className='h-3.5 w-3.5' />,
      },
      {
        id: 'PICKED_UP',
        label: isSelfDrop ? 'Counter Drop-off (Self Drop)' : 'Cargo Picked Up',
        description:
          isSelfDrop
            ? 'Consignment dropped off at counter by customer'
            : (pickupCp?.activity || 'Cargo picked up by NetPack courier & received at warehouse'),
        timestamp: pickupCp?.timestamp || liveData?.pickedUpAt,
        icon: <Truck className='h-3.5 w-3.5' />,
        badge: isSelfDrop ? 'Self Drop' : undefined,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
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
        description:
          airlineTransitCp?.activity ||
          (liveData?.airlineName
            ? `Departed on ${liveData.airlineName} scheduled flight to ${dest}`
            : `Air cargo accepted & departed on scheduled route to ${dest}`),
        timestamp: airlineTransitCp?.timestamp || liveData?.departureDate,
        icon: <Plane className='h-3.5 w-3.5' />,
      },
      {
        id: 'ARRIVED_AT_HUB',
        label: 'Arrived at Hub',
        description:
          hubCp?.activity ||
          `Landed & cleared through ${dest} destination cargo terminal`,
        timestamp: hubCp?.timestamp || liveData?.arrivalDate,
        icon: <Warehouse className='h-3.5 w-3.5' />,
      },
      {
        id: 'CARRIER_SCANNED',
        label: 'Carrier Scanned',
        description:
          carrierCp?.activity
            ? (carrierCp.location ? `${carrierCp.activity} • ${carrierCp.location}` : carrierCp.activity)
            : `Scanned by ${displayForwardingCompany} for final courier delivery`,
        timestamp: carrierCp?.timestamp,
        icon: <Truck className='h-3.5 w-3.5' />,
      },
      {
        id: 'DELIVERED',
        label: 'Delivered',
        description:
          deliveredCp?.activity ||
          `Consignment successfully delivered to ${liveData?.receiverName || 'Consignee'}`,
        timestamp: deliveredCp?.timestamp,
        icon: <CheckCircle2 className='h-3.5 w-3.5' />,
      },
    ]

    return stages
  }, [checkpoints, liveData, hawbNumber, displayForwardingCompany])

  // Determine stage progression index based on active stages
  const stageIndex = useMemo(() => {
    const s = (effectiveStatus || '').toUpperCase()
    let highestIdx = 0
    milestoneStages.forEach((stage, idx) => {
      if (stage.id === 'CARRIER_SCANNED' && (s.includes('CARRIER') || s.includes('OUT_FOR_DELIVERY'))) {
        highestIdx = idx
      } else if (stage.id === 'ARRIVED_AT_HUB' && (s.includes('ARRIVED_AT_HUB') || s.includes('HUB'))) {
        highestIdx = idx
      } else if (stage.id === 'IN_TRANSIT' && s.includes('TRANSIT')) {
        highestIdx = idx
      } else if (stage.id === 'SHIPMENT_CREATED' && s.includes('SHIPMENT_CREATED')) {
        highestIdx = idx
      } else if (stage.id === 'PICKED_UP' && (s.includes('PICKED_UP') || s.includes('PICKUP'))) {
        highestIdx = idx
      } else if (stage.id === 'DELIVERED' && s.includes('DELIVERED')) {
        highestIdx = idx
      }
    })
    return highestIdx
  }, [effectiveStatus, milestoneStages])

  // Display items based on packed collapsible logic
  const canCollapse = checkpoints.length > 3
  const displayedItems = useMemo(() => {
    if (!canCollapse || isExpanded) {
      return checkpoints.map((cp, i) => ({ cp, originalIdx: i, isBottomSummary: false }))
    }
    // Collapsed: Top 2, and bottom 1
    const topTwo = checkpoints.slice(0, 2).map((cp, i) => ({ cp, originalIdx: i, isBottomSummary: false }))
    const bottomOne = { cp: checkpoints[checkpoints.length - 1], originalIdx: checkpoints.length - 1, isBottomSummary: true }
    return [...topTwo, bottomOne]
  }, [checkpoints, canCollapse, isExpanded])

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

          {/* ── HERO STATUS & LATEST UPDATE SECTION ───────────────── */}
          <div className='space-y-3'>
            <div>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold tracking-tight text-foreground'>
                  {statusCfg.heroTitle}
                </h2>
              </div>
              <p className='text-xs text-muted-foreground font-medium mt-1'>
                {latestCheckpoint?.activity ? (
                  <span className='text-foreground font-semibold'>
                    {latestCheckpoint.activity}
                    {latestCheckpoint.location ? ` • ${latestCheckpoint.location}` : ''}
                    {latestCheckpoint.timestamp ? ` • ${formatDateTime(latestCheckpoint.timestamp)}` : ''}
                  </span>
                ) : (
                  arrivalSubtitle
                )}
              </p>
            </div>

            {/* Horizontal Progress Bar */}
            <div className='relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
              <div
                className='h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-500 ease-out'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* ── MILESTONES LIFECYCLE SECTION (In Folding Format) ─────── */}
          <div className='rounded-xl border bg-card p-4 space-y-3 shadow-xs'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Milestones & Lifecycle
                </span>
                <Badge variant='outline' className='text-[10px] font-bold py-0 h-5'>
                  Stage {stageIndex + 1} of {milestoneStages.length}: {milestoneStages[stageIndex]?.label}
                </Badge>
              </div>
              <button
                type='button'
                onClick={() => setIsMilestonesFolded(!isMilestonesFolded)}
                className='inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer'
              >
                <span>{isMilestonesFolded ? 'Expand Milestones' : 'Fold Milestones'}</span>
                {isMilestonesFolded ? (
                  <ChevronDown className='h-3.5 w-3.5' />
                ) : (
                  <ChevronUp className='h-3.5 w-3.5' />
                )}
              </button>
            </div>

            {/* Folded View: Single Horizontal Line Stepper (Picture 5) */}
            {isMilestonesFolded ? (
              <div className='w-full overflow-x-auto py-3 px-1 scrollbar-none'>
                <div className='flex items-center justify-between min-w-[540px] sm:min-w-full relative px-2'>
                  {/* Background connecting line */}
                  <div className='absolute left-6 right-6 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0' />
                  {/* Completed progress line */}
                  <div
                    className='absolute left-6 top-4 h-0.5 bg-emerald-500 -z-0 transition-all duration-300'
                    style={{
                      width:
                        milestoneStages.length > 1
                          ? `${Math.min(100, Math.max(0, (stageIndex / (milestoneStages.length - 1)) * 100))}%`
                          : '0%',
                    }}
                  />

                  {milestoneStages.map((stg: any, sIdx: number) => {
                    const isCompleted =
                      sIdx < stageIndex ||
                      (sIdx === stageIndex && stageIndex === milestoneStages.length - 1)
                    const isActive =
                      sIdx === stageIndex && stageIndex < milestoneStages.length - 1

                    return (
                      <div
                        key={stg.id}
                        className='flex flex-col items-center relative z-10 min-w-[62px] text-center'
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isActive
                              ? 'bg-sky-600 text-white shadow-md ring-4 ring-sky-200 dark:ring-sky-900 animate-pulse'
                              : 'bg-muted border border-slate-300 dark:border-slate-700 text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className='h-4 w-4 stroke-[2.5]' />
                          ) : (
                            <span className='scale-85'>{stg.icon}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 font-semibold text-center whitespace-nowrap leading-none ${
                            isActive
                              ? 'text-sky-600 dark:text-sky-400 font-bold'
                              : isCompleted
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {stg.label.split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Expanded View: Full Authentic Stepper with Connecting Line */
              <div className='relative pl-6 pt-2 before:absolute before:left-[11px] before:top-3.5 before:bottom-3.5 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800'>
                {milestoneStages.map((stg: any, sIdx: number) => {
                  const isCompleted = sIdx < stageIndex || (sIdx === stageIndex && stageIndex === milestoneStages.length - 1)
                  const isActive = sIdx === stageIndex && stageIndex < milestoneStages.length - 1

                  return (
                    <div key={stg.id} className='relative pb-4 last:pb-1 group'>
                      {/* Stepper Node Dot with Icon */}
                      <div
                        className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : isActive
                            ? 'border-sky-500 bg-sky-100 dark:bg-sky-950 text-sky-600 ring-2 ring-sky-200 dark:ring-sky-900'
                            : 'border-slate-300 dark:border-slate-700 bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? <Check className='h-3.5 w-3.5 stroke-[3]' /> : stg.icon}
                      </div>

                      {/* Milestone Details */}
                      <div className='space-y-0.5 text-left ml-2'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isActive
                                  ? 'text-sky-600 dark:text-sky-400'
                                  : isCompleted
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {stg.label}
                            </span>
                            {stg.badge && (
                              <Badge variant='outline' className={`text-[9px] font-bold px-1.5 py-0 h-4 border ${stg.badgeClass || ''}`}>
                                {stg.badge}
                              </Badge>
                            )}
                          </div>
                          {stg.timestamp && (
                            <span className='text-[10px] text-muted-foreground font-mono'>
                              {formatDateTime(stg.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground leading-snug'>
                          {stg.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── OVERSEAS COURIER LEG CARD ── */}
          {(displayForwardingNumber || liveData?.forwardingCompany) && (
            <div className='rounded-xl border bg-card p-4 space-y-3 shadow-xs'>
              <div className='flex items-center justify-between border-b pb-2.5'>
                <div className='flex items-center gap-2'>
                  <Truck className='h-4 w-4 text-indigo-500' />
                  <span className='text-xs font-bold uppercase tracking-wider text-foreground'>
                    Overseas Courier Delivery Leg
                  </span>
                </div>
                <Badge variant='outline' className='bg-indigo-50 dark:bg-indigo-950 font-bold text-xs text-indigo-700 dark:text-indigo-300'>
                  {displayForwardingCompany}
                </Badge>
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1'>
                <div>
                  <span className='text-muted-foreground text-[11px] block'>Carrier Tracking / Forwarding No:</span>
                  <div className='flex items-center gap-1.5 mt-0.5'>
                    <span className='font-mono font-bold text-sm text-foreground'>{displayForwardingNumber || 'Assigned'}</span>
                    {displayForwardingNumber && (
                      <button
                        type='button'
                        onClick={() => handleCopy(displayForwardingNumber)}
                        className='text-muted-foreground hover:text-primary cursor-pointer'
                        title='Copy carrier number'
                      >
                        <Copy className='h-3.5 w-3.5' />
                      </button>
                    )}
                  </div>
                </div>
                {carrierUrl && (
                  <a
                    href={carrierUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3.5 py-2 rounded-lg transition-colors'
                  >
                    Track on Carrier Website
                    <ExternalLink className='h-3.5 w-3.5' />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── TRANSIT CHECKPOINTS SECTION (Descending Order: Freshest at Top) ── */}
          <div className='space-y-2 pt-1'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Transit Checkpoints & Scans ({checkpoints.length})
              </span>
              <span className='text-[11px] text-muted-foreground'>Newest First</span>
            </div>

            {checkpoints.length > 0 ? (
              <div className='relative pl-6 before:absolute before:left-[7px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800'>
                {displayedItems.map(({ cp, originalIdx }, loopIdx) => {
                  const isTopItem = originalIdx === 0
                  const isManualNoteEvent = cp.source === 'MANUAL_NOTE' || (cp.source && cp.source.includes('MANUAL'))
                  const isSelfDropEvent = cp.source === 'COUNTER_DROPOFF'

                  return (
                    <div key={originalIdx} className='relative group pb-5 last:pb-1'>
                      {/* Node Dot on vertical connecting line */}
                      <div
                        className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background transition-all ${
                          isTopItem
                            ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-200 dark:ring-sky-950'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isTopItem && (
                          <div className='h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400' />
                        )}
                      </div>

                      {/* Checkpoint Detail Block */}
                      <div className='space-y-1 text-left'>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <span className='font-bold text-sm text-foreground leading-snug'>
                            {cp.activity}
                          </span>
                          {isManualNoteEvent && (
                            <Badge variant='outline' className='text-[9px] font-bold px-1.5 py-0 h-4 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300'>
                              Manual Operator Note
                            </Badge>
                          )}
                          {isSelfDropEvent && (
                            <Badge variant='outline' className='text-[9px] font-bold px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                              Self Drop
                            </Badge>
                          )}
                        </div>
                        <div className='text-xs text-muted-foreground font-medium'>
                          {cp.location || 'Kathmandu, Nepal'}
                        </div>
                        <div className='text-xs text-muted-foreground/80 font-normal'>
                          {formatDateTime(cp.timestamp)}
                        </div>
                      </div>

                      {/* "SEE ALL UPDATES (N)" Button inserted between Top 2 and Bottom 1 when collapsed */}
                      {!isExpanded && canCollapse && loopIdx === 1 && (
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
                  <div className='pt-1 pb-3 -ml-1'>
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
                    {liveData?.boxes && liveData.boxes.length > 0 && (
                      <Badge variant='outline' className='text-[10px] font-semibold py-0 h-4 px-1.5 bg-background'>
                        {liveData.boxes.length} {liveData.boxes.length === 1 ? 'Box' : 'Boxes'}
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
                      {liveData?.weightProofImageUrl && (
                        <button
                          type='button'
                          onClick={() => setSelectedPhotoUrl(`${API_BASE}${liveData.weightProofImageUrl}`)}
                          className='relative group overflow-hidden rounded-lg border border-border shadow-xs hover:border-primary shrink-0 cursor-pointer text-left'
                        >
                          <img
                            src={`${API_BASE}${liveData.weightProofImageUrl}`}
                            alt='Weighing Scale Proof'
                            className='h-24 w-32 object-cover transition-transform group-hover:scale-105'
                          />
                          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium'>
                            Click to Expand
                          </div>
                        </button>
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

                {/* 2. Box Specifications & Items in Boxes (Packing List without values) */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                      <Boxes className='h-3.5 w-3.5 text-primary' />
                      Box Weights, Dimensions & Item Packing List
                    </span>
                    <span className='text-[11px] text-muted-foreground'>
                      {liveData?.boxes?.length || 1} {(liveData?.boxes?.length || 1) === 1 ? 'Box' : 'Boxes'} Total
                    </span>
                  </div>

                  <div className='space-y-3'>
                    {(liveData?.boxes && liveData.boxes.length > 0 ? liveData.boxes : [
                      {
                        boxNumber: 1,
                        trackingNumber: 'BOX-1',
                        weight: liveData?.weight || 10.0,
                        dimensions: 'Standard Cargo Box',
                        items: [{ item: 'General Goods', pieces: 1 }]
                      }
                    ]).map((box: any, bIdx: number) => (
                      <div key={bIdx} className='rounded-lg border bg-muted/10 p-3.5 space-y-2.5 shadow-2xs'>
                        {/* Box Header: Weight & Dims */}
                        <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs'>
                          <div className='flex items-center gap-2'>
                            <span className='font-bold text-foreground'>Box #{box.boxNumber || bIdx + 1}</span>
                            {box.trackingNumber && (
                              <span className='font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
                                {box.trackingNumber}
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-3 text-[11px]'>
                            <span>
                              <strong className='text-foreground'>Weight:</strong> {box.weight || '-'} kg
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
        {selectedPhotoUrl && (
          <div
            className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-200'
            onClick={() => setSelectedPhotoUrl(null)}
          >
            <div
              className='relative max-w-2xl w-full bg-background rounded-xl p-3 shadow-2xl overflow-hidden'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex items-center justify-between pb-2 mb-2 border-b'>
                <div className='flex items-center gap-2'>
                  <Scale className='h-4 w-4 text-primary' />
                  <span className='text-xs font-bold text-foreground'>Warehouse Weighing Scale Photo Proof</span>
                </div>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7 rounded-full'
                  onClick={() => setSelectedPhotoUrl(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <div className='overflow-hidden rounded-lg bg-black flex items-center justify-center max-h-[75vh]'>
                <img
                  src={selectedPhotoUrl}
                  alt='Warehouse Scale Proof'
                  className='max-h-[75vh] max-w-full object-contain'
                />
              </div>
              <div className='pt-2 flex justify-end gap-2'>
                <a
                  href={selectedPhotoUrl}
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
        )}
      </DialogContent>
    </Dialog>
  )
}


