// src/app/shipments/components/tasks-primary-buttons.tsx
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useTasks } from '../context/shipments-context'

interface ShipmentPrimaryButtonProps {
  onClick?: () => void
}

export function ShipmentPrimaryButton({ onClick }: ShipmentPrimaryButtonProps) {
  const { setOpen } = useTasks()
  return (
    <div className='flex gap-2'>
      <Button
        className='space-x-1'
        onClick={onClick || (() => setOpen('create'))}
      >
        <span>Create Shipment</span> <IconPlus size={18} />
      </Button>
    </div>
  )
}
