import { IconPlus, IconMail } from '@tabler/icons-react'
import { useAuthStore } from '@/stores/authStore'
import { useCheckRole } from '@/utils/role-utils'
import { Button } from '@/components/ui/button'
import { useTasks } from '../context/tasks-context'

export function CustomerPrimaryButton() {
  const { setOpen } = useTasks()
  const localRole =
    typeof window !== 'undefined'
      ? localStorage.getItem('userRole') || localStorage.getItem('role')
      : null
  const userRole =
    localRole || useAuthStore((state) => state.auth.user?.role?.[0] || '')
  const isCustomer = userRole === 'Customer'

  return (
    <div className='flex gap-2'>
      {!useCheckRole('ACCOUNTS') ? (
        <Button className='space-x-1' onClick={() => setOpen('create')}>
          <span>Create</span> <IconPlus size={18} />
        </Button>
      ) : (
        <></>
      )}
      {!isCustomer && (
        <>
          <Button
            variant='outline'
            className='space-x-1'
            onClick={() => setOpen('bulk-email')}
          >
            <span>Bulk Email</span> <IconMail size={18} />
          </Button>
          <Button
            variant='outline'
            className='space-x-1'
            onClick={() => setOpen('bulk-notifcation')}
          >
            <span>Bulk Notifcation</span> <IconMail size={18} />
          </Button>
        </>
      )}
    </div>
  )
}
