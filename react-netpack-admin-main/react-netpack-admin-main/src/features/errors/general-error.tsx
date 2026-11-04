import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean
}

export default function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()

  const isCustomerApp = typeof window !== 'undefined' && window.location.pathname.startsWith('/pwa')
  const isRiderApp = typeof window !== 'undefined' && window.location.pathname.startsWith('/pickup-pwa')

  const handleHomeClick = () => {
    if (isCustomerApp) {
      window.location.href = '/pwa'
      return
    }
    if (isRiderApp) {
      window.location.href = '/pickup-pwa'
      return
    }
    navigate({ to: '/' })
  }

  const handleBackClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      history.go(-1)
    } else {
      handleHomeClick()
    }
  }

  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>500</h1>
        )}
        <span className='font-medium'>Oops! Something went wrong {`:')`}</span>
        <p className='text-muted-foreground text-center'>
          We apologize for the inconvenience. <br /> Please try again later.
        </p>
        {!minimal && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={handleBackClick}>
              Go Back
            </Button>
            <Button onClick={handleHomeClick}>
              {isCustomerApp || isRiderApp ? 'Reload App' : 'Back to Home'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
