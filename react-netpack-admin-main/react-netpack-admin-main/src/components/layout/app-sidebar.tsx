import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
// import { TeamSwitcher } from '@/components/layout/team-switcher'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Try to get role from multiple possible sources for robustness
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

  const filteredNavGroups = useMemo(() => {
    const filterByTitles = (allowedTitles: string[]) => {
      const titlesLower = allowedTitles.map((t) => t.toLowerCase())
      return sidebarData.navGroups
        .map((group) => ({
          ...group,
          items: group.items?.filter((item) =>
            titlesLower.includes(item.title.toLowerCase())
          ),
        }))
        .filter((group) => group.items && group.items.length > 0)
    }

    const roleUpper = (userRole || '').toUpperCase().trim()

    if (roleUpper === 'ADMIN') {
      return sidebarData.navGroups
    } else if (roleUpper === 'USER' || roleUpper === 'CUSTOMER') {
      return filterByTitles(['Dashboard', 'Pickups', 'Enquiry'])
    } else if (roleUpper === 'OPERATION' || roleUpper === 'OPERATIONS') {
      return filterByTitles([
        'Dashboard',
        'Pickups',
        'Enquiry',
        'Shipment',
        'MAWB',
        'Forwarding Companies',
        'Customer',
        'Agents',
        'Rate Enquiry',
      ])
    } else if (roleUpper === 'CSD') {
      return filterByTitles([
        'Dashboard',
        'Pickups',
        'Enquiry',
        'Shipment',
        'MAWB',
        'Forwarding Companies',
        'Agents',
        'Customer',
        'Rate Enquiry',
      ])
    } else if (roleUpper === 'PICKUP') {
      return filterByTitles(['Pickups'])
    } else if (roleUpper === 'ACCOUNTS') {
      return filterByTitles(['Dashboard', 'Customer', 'Shipment'])
    }

    // Default for any non-admin or unknown role: ONLY Dashboard, Pickups, and Enquiry
    return filterByTitles(['Dashboard', 'Pickups', 'Enquiry'])
  }, [userRole])

  useEffect(() => {
    const roleUpper = (userRole || '').toUpperCase().trim()
    // ADMIN has access to everything
    if (roleUpper === 'ADMIN') return

    // Collect all allowed URLs from filteredNavGroups
    const getAllowedUrls = (groups: typeof sidebarData.navGroups) => {
      const urls: string[] = []
      groups.forEach((group) => {
        group.items?.forEach((item: any) => {
          if (item.url) urls.push(item.url)
          if (item.items) {
            item.items.forEach((subItem: any) => {
              if (subItem.url) urls.push(subItem.url)
            })
          }
        })
      })
      return urls
    }

    const allowedUrls = getAllowedUrls(filteredNavGroups)

    // Check if the current path is allowed
    const isAllowed = allowedUrls.some((url) => {
      if (url === '/') return pathname === '/'
      return pathname === url || pathname.startsWith(`${url}/`)
    })

    // Essential routes that should never trigger redirect
    const isEssentialRoute = [
      '/login',
      '/sign-in',
      '/404',
      '/500',
      '/otp',
      '/forgot-password',
      '/',
      '/pwa',
    ].includes(pathname)

    if (!isAllowed && !isEssentialRoute) {
      const fallbackUrl = allowedUrls.find((u) => u !== '/') || '/dashboard'
      console.warn(
        `Unauthorized access attempt to ${pathname} by role ${roleUpper}. Redirecting to ${fallbackUrl}.`
      )
      navigate({ to: fallbackUrl })
    }
  }, [pathname, userRole, filteredNavGroups, navigate])

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={sidebarData.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
