// utils/http.ts
import { getToken, validateToken, logout } from '@/lib/auth'
import { BASE_URL } from '@/constants/endpoint'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface RequestOptions {
  method?: HttpMethod
  body?: any
  headers?: Record<string, string>
}

// Base fetch function with auth token
async function request(url: string, options: RequestOptions = {}) {
  // Validate token with server before making request
  const token = getToken()
  if (token) {
    try {
      const isValid = await validateToken()
      if (!isValid) {
        throw new Error('Authentication required')
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      throw new Error('Authentication required')
    }
  }

  const headers: HeadersInit = {
    ...options.headers,
  }

  // Only set Content-Type for JSON data, not for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers,
    method: options.method || (options.body ? 'POST' : 'GET'),
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  }

  let fullUrl = url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.startsWith('/api/')) {
      fullUrl = `${BASE_URL}/${url.slice(5)}`
    } else if (url.startsWith('/api')) {
      fullUrl = `${BASE_URL}${url.slice(4)}`
    } else {
      fullUrl = `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
    }
  }

  const response = await fetch(fullUrl, config)

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    console.log('Authentication error, logging out...')
    logout()
    
    const errorData = await response.json().catch(() => ({}))
    const apiErrorMessage =
      errorData.error ||
      errorData.message ||
      errorData.detail ||
      errorData.description

    throw new Error(apiErrorMessage || 'Authentication failed')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    // Try to extract the error message from the API response
    const apiErrorMessage =
      errorData.error ||
      errorData.message ||
      errorData.detail ||
      errorData.description

    if (apiErrorMessage) {
      throw new Error(apiErrorMessage)
    } else {
      // Fallback to generic HTTP error if no API message is provided
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  }

  return response.json()
}

// Helper methods
const http = {
  get: <T>(url: string): Promise<T> => request(url, { method: 'GET' }),
  post: <T>(url: string, data: any): Promise<T> =>
    request(url, { method: 'POST', body: data }),
  put: <T>(url: string, data: any): Promise<T> =>
    request(url, { method: 'PUT', body: data }),
  patch: <T>(url: string, data: any): Promise<T> =>
    request(url, { method: 'PATCH', body: data }),
  delete: <T>(url: string): Promise<T> => request(url, { method: 'DELETE' }),
}

export default http
