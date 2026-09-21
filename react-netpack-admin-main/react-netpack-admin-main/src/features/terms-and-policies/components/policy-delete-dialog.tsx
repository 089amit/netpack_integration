'use client'

import { useState } from 'react'
import { usePolicy } from '../context/policy-context'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'

interface PolicyDeleteDialogProps {
  onSuccess?: () => void
}

export function PolicyDeleteDialog({ onSuccess }: PolicyDeleteDialogProps) {
  const { state, setOpen, deletePolicy } = usePolicy()
  const [isLoading, setIsLoading] = useState(false)

  const isOpen = state.open === 'delete'
  const policy = state.currentRow

  const handleConfirm = async () => {
    if (!policy) return
    setIsLoading(true)
    try {
      const result = await deletePolicy(policy.id)
      if (result) {
        toast.success('Terms & policy deleted successfully')
        setOpen('')
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error('Failed to delete terms & policy')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred while deleting')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && setOpen('')}
      title='Delete Terms & Policies?'
      desc={
        <span>
          Are you sure you want to delete the policy{' '}
          <strong className='text-foreground'>"{policy?.title}"</strong>? This action cannot be
          undone.
        </span>
      }
      confirmText='Delete'
      destructive
      isLoading={isLoading}
      handleConfirm={handleConfirm}
    />
  )
}
