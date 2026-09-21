'use client'

import { usePolicy } from '../context/policy-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Calendar, Clock, X } from 'lucide-react'

export function PolicyPreviewDialog() {
  const { state, setOpen } = usePolicy()
  const isOpen = state.open === 'preview'
  const policy = state.currentRow

  if (!policy) return null

  const formattedCreatedAt = (() => {
    try {
      return format(new Date(policy.createdAt), 'MMMM d, yyyy')
    } catch {
      return '-'
    }
  })()

  const formattedUpdatedAt = (() => {
    try {
      return format(new Date(policy.updatedAt), 'MMMM d, yyyy · HH:mm')
    } catch {
      return '-'
    }
  })()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setOpen('')}>
      <DialogContent
        className='max-w-4xl w-[95vw] h-[92vh] flex flex-col p-0 overflow-hidden gap-0'
      >
        {/* Custom Header */}
        <DialogHeader className='px-8 pt-6 pb-4 border-b shrink-0 bg-card'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <Badge variant={policy.isActive ? 'default' : 'secondary'} className='shrink-0 text-xs'>
                  {policy.isActive ? 'Active Policy' : 'Inactive'}
                </Badge>
                <code className='text-xs text-muted-foreground font-mono truncate'>/{policy.slug}</code>
              </div>
              <DialogTitle className='text-2xl font-bold leading-tight mt-1'>
                {policy.title}
              </DialogTitle>
              <div className='flex items-center gap-4 mt-2 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <Calendar className='h-3 w-3' />
                  Created {formattedCreatedAt}
                </span>
                <span className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  Updated {formattedUpdatedAt}
                </span>
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 shrink-0'
              onClick={() => setOpen('')}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        {/* Rendered HTML Content */}
        <ScrollArea className='flex-1 min-h-0'>
          <div className='px-8 py-6 max-w-3xl mx-auto'>
            <div
              className='html-preview'
              dangerouslySetInnerHTML={{
                __html: policy.content || '<p class="text-muted-foreground italic">No content available.</p>',
              }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
