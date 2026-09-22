import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { validateTokenSync } from '@/lib/auth'
import { handleServerError } from '@/utils/handle-server-error'
import { FontProvider } from '@/context/font-context'
import { SearchProvider } from '@/context/search-context'
import { ThemeProvider } from '@/context/theme-context'
import './index.css'
// Generated Routes
import { routeTree } from './routeTree.gen'

// Register PWA Service Workers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.location.pathname.startsWith('/pickup-pwa') ? '/sw-pickup.js' : '/sw.js'
    navigator.serviceWorker
      .register(swPath)
      .catch((err) => console.warn('SW registration warning:', err))
  })
}

// Check if current page is an auth page or public customer/rider PWA
const isAuthPage = (): boolean => {
  const path = window.location.pathname
  return (
    path.startsWith('/pwa') ||
    path.startsWith('/pickup-pwa') ||
    path.startsWith('/landing') ||
    path === '/' ||
    path.includes('/sign-in') ||
    path.includes('/sign-up') ||
    path.includes('/forgot-password') ||
    path.includes('/otp')
  )
}

// Validate token on app startup (skip on auth pages) with delay
if (!isAuthPage()) {
  // Add delay to prevent immediate logout after login
  setTimeout(() => {
    if (!validateTokenSync()) {
      console.log('Invalid token on startup, redirecting to login...')
    }
  }, 3000) // 3 second delay
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('Session expired!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance with queryClient context
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <SearchProvider>
              <RouterProvider router={router} />
            </SearchProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
