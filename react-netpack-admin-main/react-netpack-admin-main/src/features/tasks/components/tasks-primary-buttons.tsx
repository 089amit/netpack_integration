import { IconPlus } from '@tabler/icons-react'
import { useCheckRole } from '@/utils/role-utils'
import { Button } from '@/components/ui/button'
import { useTasks } from '../context/tasks-context'

interface EnquiryPrimaryButtonProps {
  onClick?: () => void
}

export function EnquiryPrimaryButton({ onClick }: EnquiryPrimaryButtonProps) {
  const { setOpen } = useTasks()
  const isPickup = useCheckRole('Pickup')

  return (
    <div className='flex gap-2'>
      {!isPickup && (
        <Button
          className='space-x-1'
          onClick={onClick || (() => setOpen('create'))}
        >
          <span>Create</span> <IconPlus size={18} />
        </Button>
      )}
    </div>
  )
}
