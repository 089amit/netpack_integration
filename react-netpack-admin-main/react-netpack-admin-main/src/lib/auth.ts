// lib/auth.ts
import { AUTH_ENDPOINTS } from '@/constants/endpoint'

const AUTH_TOKEN_KEY = 'token'
const AUTH_FULLNAME_KEY = 'fullName'
const AUTH_USER_ID_KEY = 'userId'
const AUTH_USER_ROLE_KEY = 'userRole'
const AUTH_USER_EMAIL_KEY = 'userEmail'
const VALIDATION_CACHE_KEY = 'token_validation_cache'
const AUTH_ADMIN_ROLE = 'role'
// const VALIDATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Check if current page is an auth page or public customer/rider PWA (no validation needed)
const isAuthPage = (): boolean => {
  if (typeof window === 'undefined') return true
  const path = window.location.pathname
  return (
    path === '/' ||
    path.startsWith('/landing') ||
    path.startsWith('/pwa') ||
    path.startsWith('/pickup-pwa') ||
    path.includes('/sign-in') ||
    path.includes('/sign-up') ||
    path.includes('/forgot-password') ||
    path.includes('/otp')
  )
}

// Call backend API to validate token
export const validateTokenWithServer = async (
  token: string
): Promise<boolean> => {
  // Skip cache - always make fresh API call for instant validation
  try {
    const response = await fetch(
      AUTH_ENDPOINTS.VALIDATED_TOKEN,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      }
    )

    let isValid = false

    if (response.ok) {
      const data = await response.json()
      isValid = data.valid === true

      // Save user data from response if available - update localStorage EVERY TIME on success
      if (data.admin) {
        if (data.admin.fullName) {
          setFullName(data.admin.fullName)
        }
        if (data.admin.id) {
          setUserId(data.admin.id.toString())
        }
        if (data.admin.email) {
          setUserEmail(data.admin.email)
        }
        const roleName =
          typeof data.admin.role === 'object'
            ? data.admin.role?.name
            : data.admin.role
        if (roleName) {
          setUserRole(roleName)
          setAdminRole(roleName)
        }
      } else {
        console.log('No admin data in response')
      }
    } else if (response.status === 404) {
      // If endpoint doesn't exist (404), assume token is valid for now
      console.log(
        'Token validation endpoint not found, skipping server validation'
      )
      isValid = true
    } else {
      isValid = false
    }

    return isValid
  } catch (error) {
    console.error('Error validating token with server:', error)
    // If server is not available, assume token is valid for now
    console.log('Server validation failed, skipping server validation')
    return true
  }
}

// JWT decode function (simple implementation) - fallback for local validation
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

// Check if token is expired locally (fallback)
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token)
    if (!decoded || !decoded.exp) return true

    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}

// Validate token structure - be more flexible for different token formats
const validateTokenStructure = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token)
    if (!decoded) return false

    // Accept tokens with userId/email/role OR just exp field
    // This allows for different token formats
    return !!(decoded.exp || (decoded.userId && decoded.email))
  } catch (error) {
    console.error('Error validating token structure:', error)
    return false
  }
}

// Validate token with server and logout if invalid
export const validateToken = async (): Promise<boolean> => {
  // Don't validate on auth pages
  if (isAuthPage()) {
    return true
  }

  const token = getToken()
  if (!token) {
    logout()
    return false
  }

  // First check locally if token is expired
  if (isTokenExpired(token)) {
    console.log('Token expired locally, logging out...')
    logout()
    return false
  }

  // Check token structure
  if (!validateTokenStructure(token)) {
    console.log('Invalid token structure, logging out...')
    logout()
    return false
  }

  // Then validate with server (but don't fail if server is not available)
  const isValid = await validateTokenWithServer(token)
  if (!isValid) {
    console.log('Token invalid on server, logging out...')
    logout()
    return false
  }

  return true
}

// Synchronous version for immediate checks (uses local validation only)
export const validateTokenSync = (): boolean => {
  // Don't validate on auth pages
  if (isAuthPage()) {
    return true
  }

  const token = getToken()
  if (!token) {
    return false
  }

  if (isTokenExpired(token)) {
    console.log('Token expired, logging out...')
    logout()
    return false
  }
  // Check token structure
  if (!validateTokenStructure(token)) {
    console.log('Invalid token structure, logging out...')
    logout()
    return false
  }

  return true
}

// Logout function
export const logout = (): void => {
  removeToken()
  removeFullName()
  clearValidationCache()
  // Clear only admin auth-related keys without wiping customer/rider tokens or themes
  localStorage.removeItem('user')
  localStorage.removeItem('admin')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('fullName')
  localStorage.removeItem('userRole')
  localStorage.removeItem('role')
  localStorage.removeItem('userId')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('admin')

  // Only redirect if currently on an authenticated admin page
  if (!isAuthPage()) {
    window.location.href = '/sign-in'
  }
}

export const isAuthenticated = (): boolean => {
  const token = getToken()
  if (!token) return false
  if (isTokenExpired(token)) return false
  if (!validateTokenStructure(token)) return false
  return true
}

export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export const getFullName = (): string | null => {
  return localStorage.getItem(AUTH_FULLNAME_KEY)
}

export const setFullName = (fullName: string): void => {
  localStorage.setItem(AUTH_FULLNAME_KEY, fullName)
}

export const getUserId = (): string | null => {
  return localStorage.getItem(AUTH_USER_ID_KEY)
}

export const setUserId = (userId: string): void => {
  localStorage.setItem(AUTH_USER_ID_KEY, userId)
}

export const removeUserId = (): void => {
  localStorage.removeItem(AUTH_USER_ID_KEY)
}

export const getUserRole = (): string | null => {
  return localStorage.getItem(AUTH_USER_ROLE_KEY)
}

export const setUserRole = (role: string): void => {
  localStorage.setItem(AUTH_USER_ROLE_KEY, role)
}
export const setAdminRole = (role: string): void => {
  localStorage.setItem(AUTH_ADMIN_ROLE, role)
}

export const removeUserRole = (): void => {
  localStorage.removeItem(AUTH_USER_ROLE_KEY)
}

export const getUserEmail = (): string | null => {
  return localStorage.getItem(AUTH_USER_EMAIL_KEY)
}

export const setUserEmail = (email: string): void => {
  localStorage.setItem(AUTH_USER_EMAIL_KEY, email)
}

export const removeUserEmail = (): void => {
  localStorage.removeItem(AUTH_USER_EMAIL_KEY)
}
export const removeFullName = (): void => {
  localStorage.removeItem(AUTH_FULLNAME_KEY)
}

// Cache management for token validation
// const getValidationCache = (): {
//   isValid: boolean
//   timestamp: number
// } | null => {
//   try {
//     const cached = localStorage.getItem(VALIDATION_CACHE_KEY)
//     if (!cached) return null

//     const parsed = JSON.parse(cached)
//     const now = Date.now()

//     // Check if cache is still valid (within 5 minutes)
//     if (now - parsed.timestamp < VALIDATION_CACHE_DURATION) {
//       return parsed
//     }

//     // Cache expired, remove it
//     localStorage.removeItem(VALIDATION_CACHE_KEY)
//     return null
//   } catch (error) {
//     console.error('Error reading validation cache:', error)
//     return null
//   }
// }

// const setValidationCache = (isValid: boolean): void => {
//   try {
//     const cache = {
//       isValid,
//       timestamp: Date.now(),
//     }
//     localStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify(cache))
//   } catch (error) {
//     console.error('Error setting validation cache:', error)
//   }
// }

const clearValidationCache = (): void => {
  localStorage.removeItem(VALIDATION_CACHE_KEY)
}

// Export function to manually clear validation cache
export const clearTokenValidationCache = (): void => {
  clearValidationCache()
}
