import { useAuthStore } from '@/stores/authStore'

export const useCheckRole = (...targetRoles: string[]): boolean => {
  const userRole = useAuthStore((state) => {
    const user = state.auth.user
    if (user?.role) {
      if (Array.isArray(user.role)) return user.role[0]
      return user.role
    }
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('userRole') ||
        localStorage.getItem('role') ||
        ''
      )
    }
    return ''
  })

  if (!userRole) return false

  // Convert current user role(s) to a normalized lower-case array
  const currentRoles = Array.isArray(userRole)
    ? userRole.map((r) => r.toLowerCase())
    : [userRole.toLowerCase()]

  // Check if any of the target roles exist in the user's current roles (case-insensitive)
  return targetRoles.some((target) =>
    currentRoles.includes(target.toLowerCase())
  )
}
