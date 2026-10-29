import React, { useState, useEffect } from 'react'
import { SERVER_URL } from '@/constants/endpoint'
import {
  Search,
  CheckCircle2,
  MapPin,
  Copy,
  Check,
  AlertCircle,
  PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export interface TrackingTimelineStep {
  id: number
  title: string
  location: string
  timestamp: string
  completed: boolean
  current: boolean
  notes?: string
}

export interface TrackingResult {
  found: boolean
  trackingNumber: string
  status?: string
  origin?: string
  destination?: string
  senderName?: string
  receiverName?: string
  serviceType?: string
  pieces?: number
  actualWeight?: number
  chargeableWeight?: number
  estimatedDelivery?: string
  timeline?: TrackingTimelineStep[]
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

/**
 * Queries the real backend tracking API for live verified consignment checkpoints.
 */
export async function fetchTracking(trackingId: string): Promise<TrackingResult> {
  const query = trackingId.trim().toUpperCase()

  try {
    const res = await fetch(`${SERVER_URL}/api/tracking/${encodeURIComponent(query)}`)
    if (res.ok) {
      const data = await res.json()
      if (data && (data.found || data.shipmentId || data.trackingNumber)) {
        const rawCheckpoints: any[] = Array.isArray(data.checkpoints) ? data.checkpoints : []

        const mappedTimeline: TrackingTimelineStep[] = rawCheckpoints.map((cp, idx) => ({
          id: idx + 1,
          title: cp.activity || (cp.status ? cp.status.replace(/_/g, ' ') : 'Status Recorded'),
          location: cp.location || (cp.country ? `${cp.country} Facility` : 'En Route'),
          timestamp: formatCheckpointTime(cp.timestamp),
          completed: idx > 0,
          current: idx === 0,
          notes: cp.source && cp.source !== 'INTERNAL' ? `Verified via ${cp.source.replace(/_/g, ' ')}` : undefined,
        }))

        return {
          found: true,
          trackingNumber: data.trackingNumber || data.masterTrackingNumber || data.hawbNumber || query,
          status: data.currentStatus || data.status || 'IN_TRANSIT',
          origin: data.origin || 'Kathmandu, Nepal',
          destination: data.destination || 'International Destination',
          senderName: data.senderName || '',
          receiverName: data.receiverName || '',
          serviceType: data.hawbNumber ? `HAWB #${data.hawbNumber}` : (data.forwardingCompany || 'Air Express Freight'),
          pieces: data.pieces || (Array.isArray(data.boxes) ? data.boxes.length : 1),
          actualWeight: data.weight || 0,
          chargeableWeight: data.chargeableWeight || data.weight || 0,
          estimatedDelivery: data.arrivalDate
            ? formatCheckpointTime(data.arrivalDate)
            : 'Scheduled Route',
          timeline: mappedTimeline,
        }
      }
    } else {
      let errMsg = `No shipment found for '${query}'`
      try {
        const errJson = await res.json()
        if (errJson && errJson.detail) errMsg = errJson.detail
      } catch {
        // use default
      }
      return {
        found: false,
        trackingNumber: query,
        message: errMsg,
      }
    }
  } catch (err) {
    console.warn('Real tracking endpoint lookup error:', err)
  }

  return {
    found: false,
    trackingNumber: query,
    message: `Unable to connect to tracking server. Please verify your connection and try again.`,
  }
}

export const TrackingWidget: React.FC<{ initialTrackingId?: string }> = ({ initialTrackingId = '' }) => {
  const [inputVal, setInputVal] = useState(initialTrackingId)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Query immediately if initialTrackingId is passed
  useEffect(() => {
    if (initialTrackingId) {
      setInputVal(initialTrackingId)
      doSearch(initialTrackingId)
    }
  }, [initialTrackingId])

  const doSearch = async (codeToQuery: string) => {
    const trimmed = codeToQuery.trim()
    if (!trimmed) {
      toast.error('Please enter a valid tracking number or consignment ID.')
      return
    }

    setLoading(true)
    try {
      const data = await fetchTracking(trimmed)
      setResult(data)
      if (data.found) {
        toast.success(`Tracking data loaded for ${data.trackingNumber}`)
      } else {
        toast.error(data.message || 'Shipment not found.')
      }
    } catch {
      toast.error('Could not retrieve tracking details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(inputVal)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Tracking number copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id='tracking' className='relative w-full py-24 md:py-32 bg-[#0D1B2A] text-white border-t border-white/10'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Clean Minimal Section Header */}
        <div className='text-center max-w-2xl mx-auto mb-10'>
          <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#FF7A1A] uppercase mb-3'>
            <span className='w-2 h-2 rounded-full bg-[#FF7A1A]' />
            <span>REAL-TIME TRACKING</span>
          </div>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase font-display tracking-tight leading-none'>
            TRACK YOUR SHIPMENT.
          </h2>
          <p className='mt-3 text-slate-400 text-sm sm:text-base'>
            Enter your AWB or consignment number to view real-time chain-of-custody checkpoints.
          </p>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSubmit} className='relative max-w-2xl mx-auto mb-8'>
          <div className='relative flex items-center rounded-2xl bg-[#132238] border border-white/15 p-2 shadow-2xl focus-within:border-[#2F6BFF] transition-all'>
            <Search className='w-6 h-6 text-slate-400 ml-3 shrink-0' />
            <input
              type='text'
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder='e.g. NP-TEST-1001'
              className='w-full bg-transparent px-4 py-3 text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none font-mono'
            />
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-3 rounded-xl bg-[#FF7A1A] hover:bg-[#e66c14] text-white font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-[#FF7A1A]/30 shrink-0 disabled:opacity-50'
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>

          {/* Single Clean Example Hint */}
          <div className='mt-3 flex items-center justify-center gap-2 text-xs font-mono text-slate-400'>
            <span>Example:</span>
            <button
              type='button'
              onClick={() => {
                setInputVal('NP-TEST-1001')
                doSearch('NP-TEST-1001')
              }}
              className='px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 transition text-[#38BDF8] hover:text-white font-bold'
            >
              NP-TEST-1001
            </button>
          </div>
        </form>

        {/* Not Found State */}
        {result && !result.found && (
          <div className='p-8 rounded-3xl bg-[#132238]/80 border border-red-500/30 text-center max-w-2xl mx-auto backdrop-blur-xl shadow-2xl animate-in fade-in duration-300'>
            <AlertCircle className='w-10 h-10 text-red-400 mx-auto mb-3' />
            <h3 className='text-lg sm:text-xl font-bold font-display uppercase text-white mb-2'>
              Shipment Not Found
            </h3>
            <p className='text-sm text-slate-300 mb-4 font-sans'>
              {result.message || `No consignment matches '${result.trackingNumber}'. Please double-check your tracking code.`}
            </p>
            <button
              onClick={() => {
                setInputVal('NP-TEST-1001')
                doSearch('NP-TEST-1001')
              }}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold uppercase text-white transition'
            >
              <PackageCheck className='w-4 h-4 text-[#FF7A1A]' />
              <span>Try Verified Consignment NP-TEST-1001</span>
            </button>
          </div>
        )}

        {/* Real Tracking Result Card */}
        {result && result.found && (
          <div className='p-6 sm:p-10 rounded-3xl bg-[#132238]/90 border border-white/10 backdrop-blur-xl shadow-2xl animate-in fade-in duration-300'>
            {/* Header / Summary Bar */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10'>
              <div>
                <div className='flex items-center gap-3'>
                  <span className='text-xs font-mono text-[#2F6BFF] uppercase tracking-wider'>CONSIGNMENT AWB</span>
                  <button
                    onClick={() => handleCopy(result.trackingNumber)}
                    className='text-slate-400 hover:text-white transition'
                    title='Copy Tracking Number'
                  >
                    {copied ? <Check className='w-4 h-4 text-green-400' /> : <Copy className='w-4 h-4' />}
                  </button>
                </div>
                <h3 className='text-2xl sm:text-3xl font-extrabold font-mono text-white mt-1'>
                  {result.trackingNumber}
                </h3>
              </div>

              <div className='flex items-center gap-3'>
                <span className='px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'>
                  {result.status?.replace(/_/g, ' ') || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-white/10 text-xs font-mono'>
              <div>
                <span className='text-slate-400 block uppercase'>Origin</span>
                <span className='text-white font-bold text-sm truncate block mt-0.5'>{result.origin}</span>
                {result.senderName && (
                  <span className='text-slate-400 text-[11px] truncate block mt-0.5'>{result.senderName}</span>
                )}
              </div>
              <div>
                <span className='text-slate-400 block uppercase'>Destination</span>
                <span className='text-white font-bold text-sm truncate block mt-0.5'>{result.destination}</span>
                {result.receiverName && (
                  <span className='text-slate-400 text-[11px] truncate block mt-0.5'>{result.receiverName}</span>
                )}
              </div>
              <div>
                <span className='text-slate-400 block uppercase'>Weight / Pieces</span>
                <span className='text-white font-bold text-sm block mt-0.5'>
                  {result.chargeableWeight || result.actualWeight} kg • {result.pieces} {result.pieces === 1 ? 'Box' : 'Boxes'}
                </span>
              </div>
              <div>
                <span className='text-slate-400 block uppercase'>Estimated Arrival</span>
                <span className='text-[#38BDF8] font-bold text-sm block mt-0.5'>{result.estimatedDelivery}</span>
              </div>
            </div>

            {/* Chronological Real Checkpoints Timeline */}
            <div className='mt-8'>
              <div className='flex items-center justify-between mb-6'>
                <h4 className='text-xs font-mono uppercase tracking-widest text-slate-400'>
                  VERIFIED CHAIN-OF-CUSTODY CHECKPOINTS
                </h4>
                <span className='text-[11px] font-mono text-emerald-400 font-bold'>
                  ● {result.timeline?.length || 0} Checkpoints Logged
                </span>
              </div>

              {result.timeline && result.timeline.length > 0 ? (
                <div className='relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/15'>
                  {result.timeline.map((step) => (
                    <div key={step.id} className='relative group'>
                      {/* Checkpoint Dot */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                          step.current
                            ? 'bg-[#FF7A1A] text-white ring-4 ring-[#FF7A1A]/30 shadow-lg shadow-[#FF7A1A]/40'
                            : 'bg-[#10B981] text-white'
                        }`}
                      >
                        {step.current ? (
                          <span className='w-2 h-2 rounded-full bg-white animate-ping' />
                        ) : (
                          <CheckCircle2 className='w-3.5 h-3.5' />
                        )}
                      </div>

                      <div className='flex flex-col sm:flex-row sm:items-baseline justify-between gap-1'>
                        <div>
                          <h5
                            className={`text-sm sm:text-base font-bold font-display uppercase tracking-tight ${
                              step.current ? 'text-[#FF7A1A]' : 'text-white'
                            }`}
                          >
                            {step.title}
                          </h5>
                          <p className='text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5'>
                            <MapPin className='w-3 h-3 text-[#2F6BFF] shrink-0' />
                            <span>{step.location}</span>
                          </p>
                        </div>

                        <span className='text-xs font-mono text-slate-400 shrink-0'>
                          {step.timestamp}
                        </span>
                      </div>

                      {step.notes && (
                        <div className='mt-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-sans'>
                          {step.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-slate-400 font-sans'>No checkpoints recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
