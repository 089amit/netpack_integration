import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/lib/auth'
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
    const storeRole = state.auth.user?.role?.[0]
    if (storeRole) return storeRole

    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('role') || localStorage.getItem('userRole') || ''
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

    if (userRole === 'ADMIN') {
      return sidebarData.navGroups
    } else if (userRole === 'OPERATIONS') {
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
    } else if (userRole === 'CSD') {
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
    } else if (userRole === 'CUSTOMER') {
      return filterByTitles(['Dashboard', 'Enquiry', 'Rate Enquiry'])
    } else if (userRole === 'PICKUP') {
      return filterByTitles(['Pickups'])
    } else if (userRole === 'ACCOUNTS') {
      return filterByTitles(['Dashboard', 'Customer', 'Shipment'])
    }

    return sidebarData.navGroups // Default to everything if role unknown (might want to change to [] if security is strict)
  }, [userRole])

  useEffect(() => {
    // ADMIN has access to everything
    if (userRole === 'ADMIN' || !userRole) return

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

    // Essential routes that should never trigger logout
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
      // Special case: If user is on root '/' but it's not explicitly allowed,
      // try to redirect them to their first allowed route instead of logging out.
      if (pathname === '/') {
        const firstAllowed = allowedUrls.find((u) => u !== '/')
        if (firstAllowed) {
          console.log(
            `Redirecting role ${userRole} from '/' to ${firstAllowed}`
          )
          navigate({ to: firstAllowed })
          return
        }
      }

      console.warn(
        `Unauthorized access attempt to ${pathname} by role ${userRole}. Logging out.`
      )
      logout()
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
