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
import { Textarea } from '@/components/ui/textarea'

type BulkNoteDialogProps = {
  open: boolean
  onClose: () => void
  onApply: (note: string) => void
}

export function BulkNoteDialog({
  open,
  onClose,
  onApply,
}: BulkNoteDialogProps) {
  const [note, setNote] = useState<string>('')

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note to Selected Shipments</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <Label htmlFor='note'>Note</Label>
          <Textarea
            id='note'
            placeholder='Enter your note here...'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className='min-h-[100px]'
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApply(note)
              setNote(' ')
              onClose()
            }}
          >
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
