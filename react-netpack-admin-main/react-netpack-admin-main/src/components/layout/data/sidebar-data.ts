import {
  IconChecklist,
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconTruckDelivery,
} from '@tabler/icons-react'
// import RateCalculatorPage from '@/ratecalc/index.tsx'
import { Command } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '',
    email: localStorage.getItem('useremail') || '',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'NETPACK LOGISTICS',
      logo: Command,
      plan: '',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Pickups',
          url: '/pickups',
          icon: IconTruckDelivery,
        },
        {
          title: 'Enquiry',
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Shipment',
          url: '/shipment',
          icon: IconChecklist,
        },
        {
          title: 'MAWB',
          url: '/mawb',
          icon: IconChecklist,
        },
        {
          title: 'Customs & Chamber',
          url: '/custom-manifest',
          icon: IconFileText,
        },
        {
          title: 'Forwarding Companies',
          url: '/forwardingcompany',
          icon: IconChecklist,
        },
        {
          title: 'Customer',
          url: '/customers',
          icon: IconChecklist,
        },

        {
          title: 'Agents',
          url: '/agents',
          icon: IconChecklist,
        },
        {
          title: 'Country',
          url: '/country',
          icon: IconChecklist,
        },
        // {
        //   title: 'Apps',
        //   url: '/apps',
        //   icon: IconPackages,
        // },
        // {
        //   title: 'Chats',
        //   url: '/chats',
        //   badge: '3',
        //   icon: IconMessages,
        // },
        {
          title: 'Users',
          url: '/users',
          icon: IconUsers,
        },
        {
          title: 'Terms & Policies',
          url: '/terms-and-policies',
          icon: IconFileText,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        // {
        //   title: 'Country',
        //   icon: IconLockAccess,
        //   items: [
        //     {
        //       title: 'Rates',
        //       url: '/sign-in',
        //     },
        //     {
        //       title: 'Country',
        //       url: '/country',
        //     },
        // {
        //   title: 'Sign Up',
        //   url: '/sign-up',
        // },
        // {
        //   title: 'Forgot Password',
        //   url: '/forgot-password',
        // },
        // {
        //   title: 'OTP',
        //   url: '/otp',
        // },
        //   ],
        // },
        {
          title: 'Rate Enquiry',
          items: [
            {
              title: 'Calculator',
              url: '/ratecalc',
            },
          ],
        },
      ],
    },
    // {
    //   title: 'Other',
    //   items: [
    //     {
    //       title: 'Settings',
    //       icon: IconSettings,
    //       items: [
    //         {
    //           title: 'Profile',
    //           url: '/settings',
    //           icon: IconUserCog,
    //         },
    //         {
    //           title: 'Account',
    //           url: '/settings/account',
    //           icon: IconTool,
    //         },
    //         {
    //           title: 'Appearance',
    //           url: '/settings/appearance',
    //           icon: IconPalette,
    //         },
    //         {
    //           title: 'Notifications',
    //           url: '/settings/notifications',
    //           icon: IconNotification,
    //         },
    //         {
    //           title: 'Display',
    //           url: '/settings/display',
    //           icon: IconBrowserCheck,
    //         },
    //       ],
    //     },
    //     {
    //       title: 'Help Center',
    //       url: '/help-center',
    //       icon: IconHelp,
    //     },
    //   ],
    // },
  ],
}
