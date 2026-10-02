import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Scissors,
  Package,
  Truck,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Loader2,
  Building2,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { SHIPMENT_ENDPOINT, AGENTS_ENDPOINTS } from '@/constants/endpoint'
import { ShipmentItem } from '@/type/shipment'

interface HawbBucket {
  id: string
  isOriginal: boolean
  hawbNumber: string
  forwardingNumber: string
  boxIds: number[]
}

interface BreakHawbDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: ShipmentItem | any
  onSuccess?: () => void
}

export function BreakHawbDialog({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: BreakHawbDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingHawbs, setLoadingHawbs] = useState(false)
  const [boxes, setBoxes] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [breakCount, setBreakCount] = useState<string>('2')
  const [buckets, setBuckets] = useState<HawbBucket[]>([])

  // Load fresh shipment details, boxes, and available overseas agents on open
  useEffect(() => {
    if (!open || !shipment?.id) return

    let isMounted = true
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const [shipmentRes, agentsRes] = await Promise.all([
          http.get<any>(`${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}/${shipment.id}`),
          http.get<any>(AGENTS_ENDPOINTS.GET_ALL_AGENTS).catch(() => ({ data: [] })),
        ])

        if (!isMounted) return

        const data = shipmentRes?.data || shipmentRes
        const rawAgents = Array.isArray(agentsRes?.data)
          ? agentsRes.data
          : Array.isArray(agentsRes)
          ? agentsRes
          : []
        setAgents(rawAgents)

        const rawBoxes =
          Array.isArray(data?.boxDetails) && data.boxDetails.length > 0
            ? data.boxDetails
            : Array.isArray(data?.boxes) && data.boxes.length > 0
            ? data.boxes
            : Array.isArray(shipment.boxDetails) && shipment.boxDetails.length > 0
            ? shipment.boxDetails
            : Array.isArray(shipment.boxes) && shipment.boxes.length > 0
            ? shipment.boxes
            : []

        setBoxes(rawBoxes)

        // Pre-select agent if shipment already has one
        const currentAgentCode = data?.agent || shipment?.agent
        const currentAgentId = data?.agentId || shipment?.agentId

        let matchedAgent = null
        if (currentAgentId) {
          matchedAgent = rawAgents.find((a: any) => String(a.id) === String(currentAgentId))
        }
        if (!matchedAgent && currentAgentCode) {
          matchedAgent = rawAgents.find(
            (a: any) => String(a.code).toUpperCase() === String(currentAgentCode).toUpperCase()
          )
        }

        const agentToSet = matchedAgent ? String(matchedAgent.id) : (rawAgents[0] ? String(rawAgents[0].id) : '')
        setSelectedAgentId(agentToSet)

        // Default break count is 2 (or 2 if multiple boxes)
        const initialCount = 2
        setBreakCount(String(initialCount))

        if (agentToSet) {
          fetchSerialHawbs(agentToSet, initialCount, data)
        }
      } catch (err: any) {
        console.error('Failed fetching data for break HAWB:', err)
        toast.error('Failed to load shipment packages')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchInitialData()

    return () => {
      isMounted = false
    }
  }, [open, shipment?.id])

  // Fetch sequential serial HAWBs for the selected agent and count
  const fetchSerialHawbs = async (
    agentId: string,
    count: number,
    existingShipmentData?: any
  ) => {
    if (!agentId || count < 2) return
    setLoadingHawbs(true)
    try {
      const activeShipment = existingShipmentData || shipment
      const res: any = await http.get(
        SHIPMENT_ENDPOINT.GET_AGENT_SHIPMENT_HAWBNO(agentId, count)
      )
      const data = res?.data || res
      const hawbnos: string[] = Array.isArray(data?.hawbnos) && data.hawbnos.length > 0
        ? data.hawbnos
        : [data?.hawbno || activeShipment?.hawbNumber || 'HAWB-1']

      // Ensure we have enough sequential numbers
      const generatedBuckets: HawbBucket[] = []
      const origHawb = hawbnos[0] || activeShipment?.hawbNumber || activeShipment?.hawbno || 'HAWB-1'
      const origFwd = activeShipment?.forwardingNumber || ''

      // Retain existing box assignments where valid
      const existingAssignments = new Map<number, string>()
      buckets.forEach((b) => {
        b.boxIds.forEach((bid) => existingAssignments.set(bid, b.id))
      })

      for (let i = 0; i < count; i++) {
        const bucketId = `bucket-${i + 1}`
        const hawbNum = hawbnos[i] || `${origHawb}-P${i + 1}`
        const isOrig = i === 0

        // Restore boxes assigned to this index if already assigned
        const previousBucket = buckets[i]
        const boxIds = previousBucket ? previousBucket.boxIds : []

        generatedBuckets.push({
          id: bucketId,
          isOriginal: isOrig,
          hawbNumber: hawbNum,
          forwardingNumber: isOrig ? origFwd : (previousBucket?.forwardingNumber || ''),
          boxIds: boxIds,
        })
      }

      setBuckets(generatedBuckets)
    } catch (err) {
      console.warn('Could not auto-generate serial HAWBs:', err)
      toast.error('Could not auto-generate sequential HAWBs. Please check agent')
    } finally {
      setLoadingHawbs(false)
    }
  }

  // Handle agent selection change
  const handleAgentChange = (newAgentId: string) => {
    setSelectedAgentId(newAgentId)
    const count = parseInt(breakCount, 10) || 2
    fetchSerialHawbs(newAgentId, count)
  }

  // Handle number of HAWBs selection change
  const handleCountChange = (newCountStr: string) => {
    setBreakCount(newCountStr)
    const count = parseInt(newCountStr, 10) || 2
    if (selectedAgentId) {
      fetchSerialHawbs(selectedAgentId, count)
    }
  }

  // Total boxes in consignment
  const totalBoxesCount = boxes.length

  // Calculate assigned box set
  const assignedBoxMap = useMemo(() => {
    const map = new Map<number, string>() // boxId -> bucketId
    for (const b of buckets) {
      for (const bid of b.boxIds) {
        map.set(bid, b.id)
      }
    }
    return map
  }, [buckets])

  const assignedCount = assignedBoxMap.size
  const isAllBoxesAssigned = totalBoxesCount > 0 && assignedCount === totalBoxesCount

  // Helper to calculate total weight for a bucket
  const getBucketWeights = (bucketBoxIds: number[]) => {
    let actualWeight = 0
    for (const bid of bucketBoxIds) {
      const b = boxes.find((bx) => bx.id === bid)
      if (b) {
        const wt = parseFloat(String(b.weight || 0))
        if (!isNaN(wt)) actualWeight += wt
      }
    }
    return {
      actualWeight: Math.round(actualWeight * 100) / 100,
    }
  }

  // Assign a box to a specific bucket
  const handleAssignBox = (boxId: number, targetBucketId: string) => {
    setBuckets((prev) =>
      prev.map((b) => {
        if (b.id === targetBucketId) {
          if (b.boxIds.includes(boxId)) {
            // Already in this bucket, keep or unselect
            return { ...b, boxIds: b.boxIds.filter((id) => id !== boxId) }
          } else {
            return { ...b, boxIds: [...b.boxIds, boxId] }
          }
        } else {
          // Remove from all other buckets
          return { ...b, boxIds: b.boxIds.filter((id) => id !== boxId) }
        }
      })
    )
  }

  // Update bucket fields (hawbNumber, forwardingNumber)
  const handleUpdateBucketField = (
    bucketId: string,
    field: 'hawbNumber' | 'forwardingNumber',
    value: string
  ) => {
    setBuckets((prev) =>
      prev.map((b) => (b.id === bucketId ? { ...b, [field]: value } : b))
    )
  }

  // Submit break HAWB request
  const handleSubmitBreak = async () => {
    if (!isAllBoxesAssigned) {
      toast.error(`Please assign all ${totalBoxesCount} packages across your HAWBs before breaking`)
      return
    }

    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i]
      if (b.boxIds.length === 0) {
        toast.error(`HAWB #${i + 1} (${b.hawbNumber || 'HAWB'}) has 0 boxes assigned. Each HAWB must have at least 1 box`)
        return
      }
      if (!b.hawbNumber || !b.hawbNumber.trim()) {
        toast.error(`HAWB #${i + 1} must have a valid HAWB number`)
        return
      }
    }

    const selectedAgentObj = agents.find((a) => String(a.id) === String(selectedAgentId))
    const agentCodeToSubmit = selectedAgentObj?.code || shipment?.agent || undefined

    setSubmitting(true)
    try {
      const payload = {
        agent: agentCodeToSubmit,
        hawbGroups: buckets.map((b) => ({
          isOriginal: b.isOriginal,
          hawbNumber: b.hawbNumber.trim() || undefined,
          forwardingNumber: b.forwardingNumber.trim() || undefined,
          boxIds: b.boxIds,
        })),
      }

      const res: any = await http.post(
        SHIPMENT_ENDPOINT.BREAK_HAWB(shipment.id),
        payload
      )

      if (res) {
        toast.success(
          res.message || `Successfully partitioned into ${buckets.length} HAWBs!`
        )
        onOpenChange(false)
        onSuccess?.()

        // Redirect/reload shipments tab with partitioned HAWBs
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.reload()
          }, 300)
        }
      }
    } catch (err: any) {
      console.error('Error breaking HAWB:', err)
      const errorMsg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to break HAWB. Please check details and try again.'
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const masterTrackingNo =
    shipment?.enquiryDetails?.trackingNumber ||
    shipment?.enquiry?.trackingNumber ||
    shipment?.trackingNumber ||
    'NP-PENDING'

  const totalConsignmentWeight = useMemo(() => {
    const total = boxes.reduce((acc, b) => acc + parseFloat(String(b.weight || 0)), 0)
    return Math.round(total * 100) / 100
  }, [boxes])

  // Generate options for number of breaks: minimum 2, up to max boxes (or minimum 2 to 5)
  const breakCountOptions = useMemo(() => {
    const maxSplits = Math.max(2, Math.min(totalBoxesCount || 4, 10))
    const opts: number[] = []
    for (let i = 2; i <= maxSplits; i++) {
      opts.push(i)
    }
    return opts
  }, [totalBoxesCount])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden'>
        {/* Header */}
        <DialogHeader className='p-5 pb-3 border-b bg-muted/20 text-left'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2.5'>
              <div className='h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                <Scissors className='h-5 w-5' />
              </div>
              <div>
                <DialogTitle className='text-base font-bold text-foreground flex items-center gap-2'>
                  <span>Break HAWB (Split Consignment)</span>
                  <Badge variant='outline' className='bg-background font-mono text-[11px] font-semibold'>
                    {shipment?.hawbNumber || shipment?.hawbno || 'HAWB'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className='text-xs text-muted-foreground mt-0.5'>
                  Partition boxes across multiple HAWBs for international carrier limits.
                </DialogDescription>
              </div>
            </div>

            <div className='text-right'>
              <span className='text-muted-foreground text-[10px] uppercase font-bold tracking-wider block'>
                Master Tracking
              </span>
              <span className='font-mono font-bold text-foreground text-xs'>
                {masterTrackingNo}
              </span>
            </div>
          </div>

          {/* Consignment Overview Banner */}
          <div className='mt-3.5 p-3 rounded-lg bg-background border flex flex-wrap items-center justify-between gap-3 text-xs'>
            <div>
              <span className='text-muted-foreground text-[10px] uppercase font-bold tracking-wider block'>
                Shipper / Destination
              </span>
              <span className='font-medium text-foreground'>
                {shipment?.senderName || shipment?.customerName || 'Customer'} &rarr;{' '}
                <strong className='text-foreground'>{shipment?.destinationCountryName || 'International'}</strong>
              </span>
            </div>

            <div>
              <span className='text-muted-foreground text-[10px] uppercase font-bold tracking-wider block'>
                Total Consignment
              </span>
              <span className='font-semibold text-foreground flex items-center gap-1.5'>
                <Boxes className='h-3.5 w-3.5 text-primary' />
                {totalBoxesCount} {totalBoxesCount === 1 ? 'Box' : 'Boxes'} ({totalConsignmentWeight} KG)
              </span>
            </div>

            <div className='border-l pl-3'>
              <span className='text-muted-foreground text-[10px] uppercase font-bold tracking-wider block'>
                Allocation Status
              </span>
              <div className='flex items-center gap-1.5'>
                <span
                  className={`font-bold text-xs ${
                    isAllBoxesAssigned ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {assignedCount} of {totalBoxesCount} Assigned
                </span>
                {isAllBoxesAssigned ? (
                  <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                ) : (
                  <AlertCircle className='h-3.5 w-3.5 text-amber-500' />
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className='flex-1 overflow-y-auto p-5 space-y-6'>
          {loading ? (
            <div className='py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs'>
              <Loader2 className='h-6 w-6 animate-spin text-primary' />
              <span>Loading packages and shipment details...</span>
            </div>
          ) : boxes.length === 0 ? (
            <div className='rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground space-y-2'>
              <Package className='h-8 w-8 mx-auto text-muted-foreground/60' />
              <p className='font-bold text-foreground text-sm'>No packages found for this shipment</p>
              <p>Add boxes to this consignment before splitting HAWBs.</p>
            </div>
          ) : (
            <>
              {/* ── STEP 1 & 2: Agent Selection & Number of Breaks ── */}
              <div className='rounded-xl border bg-muted/20 p-4 space-y-3.5 shadow-2xs'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Agent Selector */}
                  <div className='space-y-1.5 text-left'>
                    <label className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                      <Building2 className='h-3.5 w-3.5 text-primary' />
                      1. Select Overseas Agent:
                    </label>
                    <Select
                      value={selectedAgentId}
                      onValueChange={handleAgentChange}
                    >
                      <SelectTrigger className='w-full h-9 bg-background text-xs font-semibold'>
                        <SelectValue placeholder='Choose overseas agent...' />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((ag) => (
                          <SelectItem key={ag.id} value={String(ag.id)}>
                            <span className='font-mono font-bold text-primary mr-1.5'>{ag.code}</span>
                            <span>{ag.name || ag.companyName || ag.city || 'Agent'}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Number of HAWB Breaks Selector */}
                  {selectedAgentId && (
                    <div className='space-y-1.5 text-left'>
                      <label className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                        <Layers className='h-3.5 w-3.5 text-primary' />
                        2. Break into How Many HAWBs:
                      </label>
                      <Select
                        value={breakCount}
                        onValueChange={handleCountChange}
                      >
                        <SelectTrigger className='w-full h-9 bg-background text-xs font-semibold'>
                          <SelectValue placeholder='Select number of HAWBs...' />
                        </SelectTrigger>
                        <SelectContent>
                          {breakCountOptions.map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num} HAWBs {num === 2 ? '(2-way split)' : `(${num}-way split)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* ── STEP 3: Auto-Generated Sequential HAWBs ── */}
              {buckets.length > 0 && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                      Sequential HAWBs ({buckets.length})
                    </span>
                    {loadingHawbs && (
                      <span className='text-xs text-primary font-medium flex items-center gap-1 animate-pulse'>
                        <Loader2 className='h-3 w-3 animate-spin' />
                        Updating serial numbers...
                      </span>
                    )}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {buckets.map((b, bIdx) => {
                      const { actualWeight } = getBucketWeights(b.boxIds)

                      return (
                        <div
                          key={b.id}
                          className={`rounded-xl border p-4 space-y-3 transition-all ${
                            b.isOriginal
                              ? 'bg-card border-border shadow-2xs'
                              : 'bg-card border-primary/40 shadow-2xs ring-1 ring-primary/20'
                          }`}
                        >
                          <div className='flex items-center justify-between border-b pb-2'>
                            <Badge
                              variant='outline'
                              className={`text-[10px] font-bold px-2 py-0.5 ${
                                b.isOriginal
                                  ? 'bg-muted text-foreground'
                                  : 'bg-primary/10 text-primary border-primary/30'
                              }`}
                            >
                              {b.isOriginal ? 'HAWB 1 (Original)' : `HAWB ${bIdx + 1} (New)`}
                            </Badge>

                            <div className='text-xs font-semibold text-muted-foreground'>
                              {b.boxIds.length} Box{b.boxIds.length === 1 ? '' : 'es'} |{' '}
                              <strong className='text-foreground'>{actualWeight} KG</strong>
                            </div>
                          </div>

                          {/* HAWB Number (Auto-Populated Serially) */}
                          <div className='space-y-1 text-left'>
                            <label className='text-[11px] font-semibold text-muted-foreground'>
                              HAWB Number:
                            </label>
                            <Input
                              value={b.hawbNumber}
                              onChange={(e) =>
                                handleUpdateBucketField(b.id, 'hawbNumber', e.target.value)
                              }
                              placeholder='e.g. UKNP 2026 046'
                              className='h-8 text-xs font-mono font-bold'
                            />
                          </div>

                          {/* Carrier Forwarding Number */}
                          <div className='space-y-1 text-left'>
                            <label className='text-[11px] font-semibold text-muted-foreground flex items-center justify-between'>
                              <span className='flex items-center gap-1.5'>
                                <Truck className='h-3 w-3 text-primary' />
                                Carrier Forwarding Number:
                              </span>
                              <span className='text-[10px] font-normal text-muted-foreground'>
                                UPS / DHL / Aramex
                              </span>
                            </label>
                            <Input
                              value={b.forwardingNumber}
                              onChange={(e) =>
                                handleUpdateBucketField(b.id, 'forwardingNumber', e.target.value)
                              }
                              placeholder='e.g. 1Z9999999999999999'
                              className='h-8 text-xs font-mono'
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Box Allocation (Clean & Minimalist: Only Box Number and Weight) ── */}
              {buckets.length > 0 && (
                <div className='space-y-3 pt-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                      <Boxes className='h-3.5 w-3.5 text-primary' />
                      Assign Boxes to HAWBs (Select Box &rarr; Choose HAWB)
                    </span>
                    <span className='text-[11px] text-muted-foreground'>
                      Only box number and weight shown
                    </span>
                  </div>

                  <div className='divide-y rounded-xl border bg-card overflow-hidden shadow-2xs'>
                    {boxes.map((bx, idx) => {
                      const currentBucketId = assignedBoxMap.get(bx.id)
                      const isAssigned = !!currentBucketId

                      return (
                        <div
                          key={bx.id}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                            isAssigned ? 'bg-background' : 'bg-muted/15'
                          }`}
                        >
                          {/* ONLY Box Number and Weight */}
                          <div className='flex items-center gap-3'>
                            <span className='font-bold text-foreground text-sm'>
                              Box #{bx.boxNumber || idx + 1}
                            </span>
                            <Badge
                              variant='secondary'
                              className='text-xs font-bold font-mono px-2.5 py-0.5'
                            >
                              {bx.weight ? `${bx.weight} KG` : '0 KG'}
                            </Badge>
                          </div>

                          {/* HAWB Selection Buttons */}
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            {buckets.map((b, bIdx) => {
                              const isSelected = b.boxIds.includes(bx.id)

                              return (
                                <button
                                  key={b.id}
                                  type='button'
                                  onClick={() => handleAssignBox(bx.id, b.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                  }`}
                                >
                                  {isSelected && <CheckCircle2 className='inline h-3 w-3 mr-1 stroke-[2.5]' />}
                                  {b.isOriginal ? 'HAWB 1' : `HAWB ${bIdx + 1}`}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className='p-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='text-xs text-muted-foreground'>
            {isAllBoxesAssigned ? (
              <span className='text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5'>
                <CheckCircle2 className='h-4 w-4' />
                All {totalBoxesCount} packages assigned across {buckets.length} HAWBs
              </span>
            ) : (
              <span className='text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5'>
                <AlertCircle className='h-4 w-4' />
                {totalBoxesCount - assignedCount} package(s) still unassigned
              </span>
            )}
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className='flex-1 sm:flex-initial'
            >
              Cancel
            </Button>

            <Button
              type='button'
              size='sm'
              onClick={handleSubmitBreak}
              disabled={submitting || !isAllBoxesAssigned || boxes.length === 0}
              className='flex-1 sm:flex-initial gap-1.5 font-bold'
            >
              {submitting ? (
                <>
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  <span>Breaking HAWBs...</span>
                </>
              ) : (
                <>
                  <Scissors className='h-3.5 w-3.5' />
                  <span>Okay (Confirm Break into {buckets.length} HAWBs)</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
