import { Outlet } from '@tanstack/react-router'
import {
  IconBrowserCheck,
  IconNotification,
  IconPalette,
  IconTool,
  IconUser,
} from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import SidebarNav from './components/sidebar-nav'

export default function Settings() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
      </Header>

      <Main className='flex-1 overflow-y-auto pb-16'>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex-1 w-full p-1 pb-16'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}

const sidebarNavItems = [
  {
    title: 'Profile',
    icon: <IconUser size={18} />,
    href: '/settings',
  },
  {
    title: 'Account',
    icon: <IconTool size={18} />,
    href: '/settings/account',
  },
  {
    title: 'Appearance',
    icon: <IconPalette size={18} />,
    href: '/settings/appearance',
  },
  {
    title: 'Notifications',
    icon: <IconNotification size={18} />,
    href: '/settings/notifications',
  },
  {
    title: 'Display',
    icon: <IconBrowserCheck size={18} />,
    href: '/settings/display',
  },
]
