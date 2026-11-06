import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  CheckCircle2,
  Truck,
  Warehouse,
  PackageOpen,
  AlertTriangle,
  ExternalLink,
  Plane,
  Copy,
  Check,
  MapPin,
  Share2,
  X,
  Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { SERVER_URL } from '@/constants/endpoint'

interface Checkpoint {
  timestamp?: string
  location?: string
  status?: string
  activity?: string
  country?: string
  source?: string
}

interface TrackingData {
  found: boolean
  trackingNumber?: string
  masterTrackingNumber?: string
  hawbNumber?: string
  forwardingNumber?: string
  forwardingCompany?: string
  carrierTrackingUrl?: string
  currentStatus?: string
  status?: string
  origin?: string
  destination?: string
  senderName?: string
  receiverName?: string
  receiverCountry?: string
  weight?: number
  chargeableWeight?: number
  pieces?: number
  boxes?: any[]
  weightProofImageUrl?: string
  weightProofImages?: string[]
  checkpoints?: Checkpoint[]
  message?: string
}

function formatCheckpointTime(rawTs?: string): string {
  if (!rawTs) return 'Recorded'
  try {
    const d = new Date(rawTs)
    if (isNaN(d.getTime())) return rawTs
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return rawTs
  }
}

function getProgressPercent(status?: string): number {
  const s = (status || '').toUpperCase()
  if (s.includes('DELIVERED')) return 100
  if (s.includes('OUT_FOR_DELIVERY')) return 88
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) return 72
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB') || s.includes('CUSTOMS')) return 55
  if (s.includes('IN_TRANSIT') || s.includes('TRANSIT')) return 40
  if (s.includes('SHIPMENT_CREATED')) return 25
  if (s.includes('PACKED') || s.includes('WT_DIMENSION_VERIFIED')) return 20
  if (s.includes('PICKED_UP')) return 14
  return 8
}

function getStatusBadge(status?: string) {
  const s = (status || '').toUpperCase()
  if (s.includes('DELIVERED')) {
    return {
      label: 'Delivered',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      dotClass: 'bg-emerald-500',
      icon: <CheckCircle2 className='w-4 h-4 text-emerald-600' />,
    }
  }
  if (s.includes('OUT_FOR_DELIVERY')) {
    return {
      label: 'Out for Delivery',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-300',
      dotClass: 'bg-amber-500',
      icon: <Truck className='w-4 h-4 text-amber-600' />,
    }
  }
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) {
    return {
      label: 'Carrier Scanned',
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-300',
      dotClass: 'bg-indigo-500',
      icon: <Truck className='w-4 h-4 text-indigo-600' />,
    }
  }
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB')) {
    return {
      label: 'Arrived at Hub',
      bgClass: 'bg-blue-50 text-blue-700 border-blue-300',
      dotClass: 'bg-blue-500',
      icon: <Warehouse className='w-4 h-4 text-blue-600' />,
    }
  }
  if (s.includes('TRANSIT')) {
    return {
      label: 'In Transit',
      bgClass: 'bg-sky-50 text-sky-700 border-sky-300',
      dotClass: 'bg-sky-500',
      icon: <Plane className='w-4 h-4 text-sky-600 rotate-45' />,
    }
  }
  if (s.includes('PICKED_UP')) {
    return {
      label: 'Picked Up',
      bgClass: 'bg-teal-50 text-teal-700 border-teal-300',
      dotClass: 'bg-teal-500',
      icon: <PackageOpen className='w-4 h-4 text-teal-600' />,
    }
  }
  return {
    label: s.replace(/_/g, ' ') || 'Order Processing',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-500',
    icon: <PackageOpen className='w-4 h-4 text-slate-600' />,
  }
}

export default function PublicTrackingPage({ trackingId }: { trackingId?: string }) {
  const [queryInput, setQueryInput] = useState<string>(trackingId || '')
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const doSearch = async (code: string) => {
    const clean = (code || '').trim()
    if (!clean) return
    setLoading(true)
    try {
      const res = await fetch(`${SERVER_URL}/api/tracking/${encodeURIComponent(clean)}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json?.found) {
          toast.success(`Tracking details loaded for ${json.trackingNumber || clean}`)
        } else {
          toast.error(json?.message || `No consignment found for ${clean}`)
        }
      } else {
        const errJson = await res.json().catch(() => ({}))
        setData({
          found: false,
          trackingNumber: clean,
          message: errJson?.detail || `Shipment #${clean} was not found. Please verify the number.`,
        })
      }
    } catch {
      setData({
        found: false,
        trackingNumber: clean,
        message: 'Could not connect to tracking server. Please check your network and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (trackingId) {
      setQueryInput(trackingId)
      doSearch(trackingId)
    }
  }, [trackingId])

  const effectiveTracking = data?.trackingNumber || data?.hawbNumber || queryInput
  const effectiveStatus = data?.currentStatus || data?.status || 'IN_TRANSIT'
  const progressPercent = getProgressPercent(effectiveStatus)
  const statusBadge = getStatusBadge(effectiveStatus)

  const proofImages = useMemo(() => {
    if (Array.isArray(data?.weightProofImages) && data.weightProofImages.length > 0) {
      return data.weightProofImages
    }
    if (typeof data?.weightProofImageUrl === 'string' && data.weightProofImageUrl.trim()) {
      return data.weightProofImageUrl.split(',').map((u) => u.trim()).filter(Boolean)
    }
    return []
  }, [data?.weightProofImages, data?.weightProofImageUrl])

  const checkpoints = useMemo(() => {
    return (data?.checkpoints || []).filter(
      (cp) => cp.status !== 'HAWB_SPLIT' && !String(cp.activity || '').toLowerCase().includes('partition')
    )
  }, [data?.checkpoints])

  const copyShareLink = () => {
    const url = `${window.location.origin}/track/${effectiveTracking}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Direct tracking link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/track/${effectiveTracking}`
    const text = encodeURIComponent(
      `Track your NetPack Logistic shipment #${effectiveTracking} live:\n${url}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 font-sans antialiased'>
      {/* ── TOP NAV HEADER ────────────────────────────────────────── */}
      <header className='sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs'>
        <div className='max-w-4xl mx-auto px-4 h-16 flex items-center justify-between'>
          <a href='/' className='flex items-center gap-2 hover:opacity-90 transition'>
            <img src='/alzlogo.png' alt='NetPack Logistic' className='h-8 w-auto object-contain' />
          </a>
          <div className='flex items-center gap-3'>
            <a
              href='tel:+977-1-4245678'
              className='hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition'
            >
              <Phone className='w-3.5 h-3.5 text-slate-400' />
              <span>+977-1-4245678</span>
            </a>
            <button
              onClick={copyShareLink}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#0066CC] hover:bg-blue-100 transition cursor-pointer'
            >
              <Share2 className='w-3.5 h-3.5' />
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────────── */}
      <main className='max-w-4xl mx-auto px-4 py-8 space-y-6'>
        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            doSearch(queryInput)
          }}
          className='relative max-w-xl mx-auto'
        >
          <div className='flex items-center rounded-2xl bg-white border border-slate-300 p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[#0066CC]/30 focus-within:border-[#0066CC] transition'>
            <Search className='w-5 h-5 text-slate-400 ml-3 shrink-0' />
            <input
              type='text'
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder='Enter Tracking, AWB, or Forwarding Number...'
              className='w-full px-3 py-2 text-sm bg-transparent outline-none font-medium text-slate-900'
            />
            <button
              type='submit'
              disabled={loading}
              className='px-5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0055AA] text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shrink-0'
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {/* Loading state */}
        {loading && (
          <div className='text-center py-12'>
            <div className='inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <p className='mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Retrieving live carrier checkpoints...
            </p>
          </div>
        )}

        {/* Not Found state */}
        {!loading && data && !data.found && (
          <div className='bg-white rounded-3xl p-8 border border-red-200 text-center shadow-xs max-w-lg mx-auto'>
            <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-3' />
            <h3 className='text-lg font-bold text-slate-900'>Shipment Not Found</h3>
            <p className='mt-1 text-sm text-slate-600'>{data.message}</p>
            <p className='mt-4 text-xs text-slate-400'>
              Please verify your tracking number or contact NetPack support at info@netpacklogistic.com.
            </p>
          </div>
        )}

        {/* Loaded Tracking Result */}
        {!loading && data && data.found && (
          <div className='bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden'>
            {/* Header Strip */}
            <div className='p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div>
                <span className='text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block'>
                  Consignment Tracking
                </span>
                <div className='flex items-center gap-2 mt-0.5'>
                  <h1 className='text-xl sm:text-2xl font-mono font-extrabold text-slate-900'>
                    {effectiveTracking}
                  </h1>
                  <button
                    onClick={copyShareLink}
                    className='p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition'
                    title='Copy Tracking Number'
                  >
                    {copied ? <Check className='w-4 h-4 text-emerald-600' /> : <Copy className='w-4 h-4' />}
                  </button>
                </div>
                {data.receiverName && (
                  <p className='text-xs text-slate-500 mt-1'>
                    Consignee: <span className='font-semibold text-slate-700'>{data.receiverName}</span>
                  </p>
                )}
              </div>

              <div className='flex items-center gap-2 shrink-0'>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${statusBadge.bgClass}`}
                >
                  {statusBadge.icon}
                  <span>{statusBadge.label}</span>
                </div>
              </div>
            </div>

            {/* Route & Progress Card */}
            <div className='p-6 bg-slate-50/70 border-b border-slate-200 space-y-4'>
              <div className='flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-slate-800'>
                <div className='flex items-center gap-1.5 shrink-0'>
                  <MapPin className='w-4 h-4 text-[#0066CC]' />
                  <span>{data.origin || 'Kathmandu, Nepal'}</span>
                </div>
                <div className='flex-1 flex items-center justify-center relative px-2'>
                  <div className='w-full border-t-2 border-dashed border-slate-300' />
                  <span className='absolute bg-white px-2 py-1 rounded-full border border-slate-200 shadow-xs text-blue-600'>
                    <Plane className='w-4 h-4 rotate-45' />
                  </span>
                </div>
                <div className='flex items-center gap-1.5 shrink-0'>
                  <span>{data.destination || 'Destination'}</span>
                  <MapPin className='w-4 h-4 text-emerald-600' />
                </div>
              </div>

              {/* Progress bar */}
              <div className='space-y-1.5'>
                <div className='relative w-full h-2.5 rounded-full bg-slate-200 overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 rounded-full transition-all duration-700'
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className='flex justify-between text-[11px] text-slate-500 font-medium'>
                  <span>Kathmandu Dispatch</span>
                  <span className='font-bold text-[#0066CC]'>{progressPercent}% Completed</span>
                  <span>Final Delivery</span>
                </div>
              </div>

              {/* Info Chips Grid */}
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2'>
                {/* Forwarding courier */}
                <div className='p-3 rounded-2xl bg-white border border-slate-200'>
                  <span className='text-[10px] uppercase font-bold text-slate-400 block tracking-wider'>
                    Courier Forwarding
                  </span>
                  <span className='text-xs font-mono font-bold text-slate-800 block mt-0.5 truncate'>
                    {data.forwardingCompany || 'Air Express'}: {data.forwardingNumber || 'Assigned'}
                  </span>
                  {data.carrierTrackingUrl && (
                    <a
                      href={data.carrierTrackingUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-[10px] font-semibold text-[#0066CC] hover:underline inline-flex items-center gap-1 mt-1'
                    >
                      <span>Track with Carrier</span>
                      <ExternalLink className='w-2.5 h-2.5' />
                    </a>
                  )}
                </div>

                {/* Verified Weight */}
                <div className='p-3 rounded-2xl bg-white border border-slate-200'>
                  <span className='text-[10px] uppercase font-bold text-slate-400 block tracking-wider'>
                    Chargeable Weight
                  </span>
                  <span className='text-xs font-bold text-slate-800 block mt-0.5'>
                    {data.chargeableWeight || data.weight || '—'} KG
                  </span>
                  <span className='text-[10px] text-slate-400 block'>
                    Gross Wt: {data.weight || '—'} KG
                  </span>
                </div>

                {/* Boxes & Scale Proof */}
                <div className='p-3 rounded-2xl bg-white border border-slate-200 col-span-2 sm:col-span-1 flex items-center justify-between'>
                  <div>
                    <span className='text-[10px] uppercase font-bold text-slate-400 block tracking-wider'>
                      Package Count
                    </span>
                    <span className='text-xs font-bold text-slate-800 block mt-0.5'>
                      {data.pieces || (data.boxes && data.boxes.length) || 1} Box(es)
                    </span>
                  </div>
                  {proofImages.length > 0 && (
                    <button
                      onClick={() => setSelectedPhoto(proofImages[0])}
                      className='px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition'
                    >
                      {proofImages.length} Scale Proof
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Checkpoints Timeline */}
            <div className='p-6 space-y-6'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-[#0066CC]' />
                  <span>Consignment Journey & Scans ({checkpoints.length})</span>
                </h2>
                <span className='text-xs font-medium text-slate-400'>Newest First</span>
              </div>

              {checkpoints.length === 0 ? (
                <div className='text-center py-8 text-xs text-slate-400'>
                  No milestones recorded yet. Tracking updates will appear as your shipment progresses.
                </div>
              ) : (
                <div className='relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200'>
                  {checkpoints.map((cp, idx) => {
                    const isLatest = idx === 0
                    const isOpNote = cp.source === 'OPERATIONS_NOTE' || cp.source === 'MANUAL_NOTE'

                    return (
                      <div key={idx} className='relative group'>
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform ${
                            isLatest
                              ? 'border-emerald-500 scale-110 shadow-xs'
                              : isOpNote
                              ? 'border-blue-400'
                              : 'border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLatest
                                ? 'bg-emerald-500'
                                : isOpNote
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>

                        {/* Content Card */}
                        <div
                          className={`p-3.5 rounded-2xl transition border ${
                            isLatest
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isOpNote
                              ? 'bg-blue-50/40 border-blue-200'
                              : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1'>
                            <div className='flex items-center gap-2'>
                              <span
                                className={`text-xs font-bold ${
                                  isLatest
                                    ? 'text-emerald-950 font-extrabold'
                                    : 'text-slate-900'
                                }`}
                              >
                                {cp.activity || cp.status?.replace(/_/g, ' ')}
                              </span>
                              {isOpNote && (
                                <span className='px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 tracking-wide'>
                                  Operations Note
                                </span>
                              )}
                            </div>
                            <span className='text-[11px] font-mono text-slate-400 shrink-0'>
                              {formatCheckpointTime(cp.timestamp)}
                            </span>
                          </div>

                          {cp.location && (
                            <p className='text-xs text-slate-500 mt-1 flex items-center gap-1'>
                              <MapPin className='w-3 h-3 text-slate-400 shrink-0' />
                              <span>{cp.location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Share Footer Strip */}
            <div className='p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs'>
              <span className='text-slate-500'>Share real-time tracking with shipper or consignee:</span>
              <div className='flex items-center gap-2 w-full sm:w-auto'>
                <button
                  onClick={shareWhatsApp}
                  className='flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition cursor-pointer'
                >
                  <Share2 className='w-3.5 h-3.5' />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={copyShareLink}
                  className='flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer'
                >
                  <Copy className='w-3.5 h-3.5' />
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Scale photo lightbox modal */}
      {selectedPhoto && (
        <div
          className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4'
          onClick={() => setSelectedPhoto(null)}
        >
          <div className='relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2'>
            <button
              onClick={() => setSelectedPhoto(null)}
              className='absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition'
            >
              <X className='w-5 h-5' />
            </button>
            <img
              src={selectedPhoto}
              alt='Verified Weight Calibration Proof'
              className='w-full h-auto max-h-[80vh] object-contain rounded-xl'
            />
            <p className='text-center text-xs text-slate-500 mt-2 font-medium'>
              Verified Scale Calibration Proof — NetPack Central Sorting Hub
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
