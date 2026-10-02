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
  Scissors,
  Plus,
  Trash2,
  Package,
  Truck,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Loader2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { SHIPMENT_ENDPOINT } from '@/constants/endpoint'
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
  const [boxes, setBoxes] = useState<any[]>([])
  const [buckets, setBuckets] = useState<HawbBucket[]>([])

  // Load fresh shipment details and boxes on open
  useEffect(() => {
    if (!open || !shipment?.id) return

    let isMounted = true
    const fetchShipmentBoxes = async () => {
      setLoading(true)
      try {
        const res: any = await http.get(`${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}/${shipment.id}`)
        const data = res?.data || res

        if (!isMounted) return

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

        // Try to fetch next sequence preview for Bucket 2 if agent exists
        let nextHawbPreview = ''
        const agentId = data?.agentId || shipment?.agentId || data?.agent || shipment?.agent
        if (agentId) {
          try {
            const nextRes: any = await http.get(
              SHIPMENT_ENDPOINT.GET_AGENT_SHIPMENT_HAWBNO(agentId)
            )
            nextHawbPreview = nextRes?.hawbno || ''
          } catch (e) {
            console.warn('Could not prefetch next sequential HAWB:', e)
          }
        }

        // Initialize 2 buckets: Bucket 1 (Original) and Bucket 2 (New)
        // With NO default box threshold: all boxes initially in bucket 1, or unassigned for operator selection
        const origHawb = data?.hawbNumber || data?.hawbno || shipment?.hawbNumber || shipment?.hawbno || ''
        const origFwd = data?.forwardingNumber || shipment?.forwardingNumber || ''

        setBuckets([
          {
            id: 'bucket-1',
            isOriginal: true,
            hawbNumber: origHawb,
            forwardingNumber: origFwd,
            boxIds: [],
          },
          {
            id: 'bucket-2',
            isOriginal: false,
            hawbNumber: nextHawbPreview || `${origHawb ? `${origHawb}-P2` : 'NEW-HAWB-2'}`,
            forwardingNumber: '',
            boxIds: [],
          },
        ])
      } catch (err: any) {
        console.error('Failed fetching shipment boxes for break HAWB:', err)
        toast.error('Failed to load shipment packages')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchShipmentBoxes()

    return () => {
      isMounted = false
    }
  }, [open, shipment?.id])

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

  // Helper to calculate total weight and volumetric weight for a bucket
  const getBucketWeights = (bucketBoxIds: number[]) => {
    let actualWeight = 0
    let volWeight = 0

    for (const bid of bucketBoxIds) {
      const b = boxes.find((bx) => bx.id === bid)
      if (b) {
        const wt = parseFloat(String(b.weight || 0))
        if (!isNaN(wt)) actualWeight += wt

        const l = parseFloat(String(b.length || 0))
        const br = parseFloat(String(b.breadth || 0))
        const h = parseFloat(String(b.height || 0))
        if (!isNaN(l) && !isNaN(br) && !isNaN(h) && l > 0 && br > 0 && h > 0) {
          volWeight += (l * br * h) / 5000
        }
      }
    }

    return {
      actualWeight: Math.round(actualWeight * 100) / 100,
      volWeight: Math.round(volWeight * 100) / 100,
    }
  }

  // Assign a box to a specific bucket
  const handleAssignBox = (boxId: number, targetBucketId: string) => {
    setBuckets((prev) =>
      prev.map((b) => {
        if (b.id === targetBucketId) {
          // Toggle assignment
          if (b.boxIds.includes(boxId)) {
            return { ...b, boxIds: b.boxIds.filter((id) => id !== boxId) }
          } else {
            return { ...b, boxIds: [...b.boxIds, boxId] }
          }
        } else {
          // Remove from other buckets to prevent duplicate assignment
          return { ...b, boxIds: b.boxIds.filter((id) => id !== boxId) }
        }
      })
    )
  }

  // Add another HAWB bucket
  const handleAddBucket = async () => {
    const newIdx = buckets.length + 1
    const newBucketId = `bucket-${Date.now()}`

    let previewHawb = ''
    const agentId = shipment?.agentId || shipment?.agent
    if (agentId) {
      try {
        const nextRes: any = await http.get(
          SHIPMENT_ENDPOINT.GET_AGENT_SHIPMENT_HAWBNO(agentId)
        )
        previewHawb = nextRes?.hawbno || ''
      } catch (e) {
        console.warn(e)
      }
    }

    const baseHawb = buckets[0]?.hawbNumber || shipment?.hawbNumber || 'HAWB'
    setBuckets((prev) => [
      ...prev,
      {
        id: newBucketId,
        isOriginal: false,
        hawbNumber: previewHawb || `${baseHawb}-P${newIdx}`,
        forwardingNumber: '',
        boxIds: [],
      },
    ])
  }

  // Remove a non-original bucket
  const handleRemoveBucket = (bucketId: string) => {
    setBuckets((prev) => prev.filter((b) => b.id !== bucketId))
  }

  // Update bucket field (hawbNumber, forwardingNumber)
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
        toast.error(`HAWB #${i + 1} has 0 boxes assigned. Each HAWB must have at least 1 box`)
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
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
        onSuccess?.()
        onOpenChange(false)
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
                  Partition boxes into separate HAWBs for international courier & air cargo carrier limits.
                </DialogDescription>
              </div>
            </div>

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleAddBucket}
              className='h-8 text-xs font-semibold gap-1.5 shrink-0 bg-background hover:bg-muted'
            >
              <Plus className='h-3.5 w-3.5 text-primary' />
              <span>Add Another HAWB</span>
            </Button>
          </div>

          {/* Consignment Overview Banner */}
          <div className='mt-3.5 p-3 rounded-lg bg-background border flex flex-wrap items-center justify-between gap-3 text-xs'>
            <div>
              <span className='text-muted-foreground text-[10px] uppercase font-bold tracking-wider block'>
                In-House Master Tracking
              </span>
              <span className='font-mono font-bold text-foreground text-sm'>
                {masterTrackingNo}
              </span>
            </div>

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
              {/* Info banner */}
              <div className='rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 p-3 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200'>
                <Info className='h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5' />
                <div className='space-y-0.5 leading-snug'>
                  <span className='font-semibold'>Manual Box Allocation & Tracking Independence:</span> Select which boxes belong to each HAWB below. Total weight calculates automatically. Each HAWB gets its own carrier forwarding number and label piece sequence, while in-house master tracking ({masterTrackingNo}) remains unified.
                </div>
              </div>

              {/* HAWB Buckets */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    Configured HAWBs ({buckets.length})
                  </span>
                  <span className='text-[11px] text-muted-foreground'>
                    Click the HAWB buttons on each box below to assign
                  </span>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {buckets.map((b, bIdx) => {
                    const { actualWeight, volWeight } = getBucketWeights(b.boxIds)

                    return (
                      <div
                        key={b.id}
                        className={`rounded-xl border p-4 space-y-3.5 transition-all ${
                          b.isOriginal
                            ? 'bg-card border-border shadow-xs'
                            : 'bg-card border-primary/30 shadow-xs ring-1 ring-primary/20'
                        }`}
                      >
                        {/* Bucket Header */}
                        <div className='flex items-center justify-between gap-2 border-b pb-2.5'>
                          <div className='flex items-center gap-2'>
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
                          </div>

                          {!b.isOriginal && buckets.length > 2 && (
                            <button
                              type='button'
                              onClick={() => handleRemoveBucket(b.id)}
                              className='text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md'
                              title='Remove this HAWB bucket'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </button>
                          )}
                        </div>

                        {/* HAWB Number Input */}
                        <div className='space-y-1 text-left'>
                          <label className='text-[11px] font-semibold text-muted-foreground'>
                            HAWB Number:
                          </label>
                          <Input
                            value={b.hawbNumber}
                            onChange={(e) =>
                              handleUpdateBucketField(b.id, 'hawbNumber', e.target.value)
                            }
                            placeholder='Enter HAWB Number (e.g. AUNP 2026 022)'
                            className='h-8 text-xs font-mono font-bold'
                          />
                        </div>

                        {/* Carrier Forwarding Number Input */}
                        <div className='space-y-1 text-left'>
                          <label className='text-[11px] font-semibold text-muted-foreground flex items-center justify-between'>
                            <span className='flex items-center gap-1.5'>
                              <Truck className='h-3 w-3 text-primary' />
                              Carrier Forwarding Number:
                            </span>
                            <span className='text-[10px] font-normal text-muted-foreground'>
                              DHL / FedEx / Aramex
                            </span>
                          </label>
                          <Input
                            value={b.forwardingNumber}
                            onChange={(e) =>
                              handleUpdateBucketField(b.id, 'forwardingNumber', e.target.value)
                            }
                            placeholder='e.g. 7812345678 or carrier tracking'
                            className='h-8 text-xs font-mono'
                          />
                        </div>

                        {/* Weight & Piece Badge for this HAWB */}
                        <div className='rounded-lg bg-muted/40 p-2.5 flex items-center justify-between gap-2 text-xs border border-border/60'>
                          <div className='flex items-center gap-1.5'>
                            <Package className='h-3.5 w-3.5 text-primary' />
                            <span className='font-bold text-foreground'>
                              {b.boxIds.length} {b.boxIds.length === 1 ? 'Box' : 'Boxes'}
                            </span>
                          </div>
                          <div className='flex items-center gap-2 text-[11px] font-medium'>
                            <span className='text-muted-foreground'>
                              Total Weight: <strong className='text-foreground'>{actualWeight} KG</strong>
                            </span>
                            {volWeight > 0 && (
                              <span className='text-muted-foreground border-l pl-2'>
                                Vol: {volWeight} KG
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Package Allocation Matrix */}
              <div className='space-y-3 pt-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                    <Boxes className='h-3.5 w-3.5 text-primary' />
                    Select HAWB for Each Package ({boxes.length} Total)
                  </span>
                  <span className='text-[11px] text-muted-foreground'>
                    Click a HAWB button to assign that box
                  </span>
                </div>

                <div className='divide-y rounded-xl border bg-card overflow-hidden shadow-2xs'>
                  {boxes.map((bx, idx) => {
                    const currentBucketId = assignedBoxMap.get(bx.id)
                    const currentBucketIndex = buckets.findIndex((b) => b.id === currentBucketId)
                    const assignedBucket = buckets.find((b) => b.id === currentBucketId)

                    const dimsStr =
                      bx.dimensions ||
                      (bx.length && bx.breadth && bx.height
                        ? `${bx.length} x ${bx.breadth} x ${bx.height} cm`
                        : 'Standard Size')

                    return (
                      <div
                        key={bx.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                          currentBucketId ? 'bg-background' : 'bg-muted/15'
                        }`}
                      >
                        {/* Package Details */}
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='font-bold text-foreground text-sm'>
                              Box #{bx.boxNumber || idx + 1}
                            </span>
                            {bx.trackingNumber && (
                              <span className='font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
                                {bx.trackingNumber}
                              </span>
                            )}
                            {assignedBucket ? (
                              <Badge
                                variant='outline'
                                className={`text-[10px] font-semibold py-0 h-4.5 px-2 ${
                                  assignedBucket.isOriginal
                                    ? 'bg-muted border-border text-foreground'
                                    : 'bg-primary/10 border-primary/40 text-primary'
                                }`}
                              >
                                Assigned to {assignedBucket.hawbNumber || `HAWB #${currentBucketIndex + 1}`}
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='text-[10px] font-semibold py-0 h-4.5 px-2 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              >
                                Unassigned
                              </Badge>
                            )}
                          </div>

                          <div className='flex items-center gap-3 text-[11px] text-muted-foreground'>
                            <span>
                              <strong className='text-foreground font-semibold'>Weight:</strong>{' '}
                              {bx.weight ? `${bx.weight} KG` : 'N/A'}
                            </span>
                            <span>•</span>
                            <span>
                              <strong className='text-foreground font-semibold'>Dimensions:</strong>{' '}
                              {dimsStr}
                            </span>
                            {bx.items && bx.items.length > 0 && (
                              <>
                                <span>•</span>
                                <span className='truncate max-w-[200px]'>
                                  {bx.items.map((it: any) => it?.enquiryItem?.description || it?.description || 'Item').join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* HAWB Selector Buttons */}
                        <div className='flex items-center gap-1.5 shrink-0'>
                          {buckets.map((b, bIdx) => {
                            const isSelected = b.boxIds.includes(bx.id)

                            return (
                              <button
                                key={b.id}
                                type='button'
                                onClick={() => handleAssignBox(bx.id, b.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className='p-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='text-xs text-muted-foreground'>
            {isAllBoxesAssigned ? (
              <span className='text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5'>
                <CheckCircle2 className='h-4 w-4' />
                All {totalBoxesCount} packages allocated across {buckets.length} HAWBs
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
                  <span>Partitioning HAWBs...</span>
                </>
              ) : (
                <>
                  <Scissors className='h-3.5 w-3.5' />
                  <span>Confirm Break into {buckets.length} HAWBs</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
