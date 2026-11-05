import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className='flex flex-col items-center justify-center p-8 my-6 text-center border border-red-200 rounded-xl bg-red-50/50 text-red-900'>
          <div className='p-3 mb-3 bg-red-100 rounded-full text-red-600'>
            <AlertTriangle className='w-6 h-6' />
          </div>
          <h3 className='text-base font-bold text-gray-900'>
            Something went wrong while rendering this section
          </h3>
          <p className='mt-1 text-xs text-gray-500 max-w-md'>
            {this.state.error?.message || 'An unexpected rendering error occurred. The rest of the portal is unaffected.'}
          </p>
          <Button
            size='sm'
            variant='outline'
            onClick={this.resetError}
            className='mt-4 flex items-center gap-1.5 border-red-200 bg-white hover:bg-red-50 text-red-700 font-semibold cursor-pointer'
          >
            <RefreshCw className='w-3.5 h-3.5' />
            <span>Try Again</span>
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
