// src/app/shipments/components/bulk-status-change-dialog.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type BulkStatusChangeDialogProps = {
  open: boolean
  onClose: () => void
  onApply: (status: string) => void
}

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Picked Up', value: 'PICKED_UP' },
  { label: 'Shipment Created', value: 'SHIPMENT_CREATED' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Arrived At Hub', value: 'ARRIVED_AT_HUB' },
  { label: 'Carrier Scanned', value: 'CARRIER_SCANNED' },
  { label: 'Delivered', value: 'DELIVERED' },
]

export function BulkStatusChangeDialog({
  open,
  onClose,
  onApply,
}: BulkStatusChangeDialogProps) {
  const [status, setStatus] = useState<string>('')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Status Change</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <Label>Select new status</Label>
          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger>
              <SelectValue placeholder='Choose status' />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (status) {
                onApply(status)
                onClose()
              }
            }}
            disabled={!status}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
