'use client'

import { useEffect, useState } from 'react'
// adjust as needed
import { Enquiry } from '@/type/enquiry'
import {
  PackageSearch,
  Clock,
  PackageCheck,
  PackageOpen,
  Truck,
  Warehouse,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react'
import http from '@/utils/http'
import { ENQUIRY_ENDPOINTS } from '@/constants/endpoint'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// make sure this is correctly defined

export function RecentEnquiry() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const result = await http.get<{ data: Enquiry[] }>(
          `${ENQUIRY_ENDPOINTS.ALL_ENQUIRY}?limit=5`
        )
        if (result?.data) {
          const mappedData = result.data.map((enquiry: Enquiry) => {
            return {
              id: enquiry.id,
              name: enquiry.senderName || 'Unknown',
              email: enquiry.senderPhone || 'No Phone',
              destinationCountryName:
                enquiry.receiverCountry ||
                enquiry.destinationCountryName ||
                'N/A',
              status: enquiry.status || 'N/A',
              avatarFallback:
                enquiry.senderName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'NA',
              destination: enquiry.destinationLocation || 'No Destination',
              weight: enquiry.weight || 0,
            }
          })
          setData(mappedData)
        }
      } catch (error) {
        console.error(error)
        setError('Failed to load enquiries.')
      } finally {
        setLoading(false)
      }
    }

    fetchEnquiries()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ENQUIRY_GENERATED':
        return {
          label: 'Enquiry Created',
          variant: 'secondary' as const,
          icon: PackageSearch,
        }
      case 'PENDING':
        return { label: 'Pending', variant: 'outline' as const, icon: Clock }
      case 'PICKED_UP':
        return {
          label: 'Picked Up',
          variant: 'default' as const,
          icon: PackageCheck,
        }
      case 'SHIPMENT_CREATED':
        return {
          label: 'Shipment Created',
          variant: 'secondary' as const,
          icon: PackageOpen,
        }
      case 'IN_TRANSIT':
        return { label: 'In Transit', variant: 'default' as const, icon: Truck }
      case 'ARRIVED_AT_HUB':
        return {
          label: 'Arrived at Hub',
          variant: 'secondary' as const,
          icon: Warehouse,
        }
      case 'CARRIER_SCANNED':
        return {
          label: 'Carrier Scanned',
          variant: 'secondary' as const,
          icon: Truck,
        }
      case 'DELIVERED':
        return {
          label: 'Delivered',
          variant: 'default' as const,
          icon: CheckCircle2,
        }
      default:
        return { label: status, variant: 'outline' as const, icon: HelpCircle }
    }
  }

  return (
    <div className='space-y-8'>
      {data.map((enquiry) => (
        <div key={enquiry.id} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarImage
              src={`/avatars/${Math.floor(Math.random() * 5) + 1}.png`}
              alt='Avatar'
            />
            <AvatarFallback>{enquiry.avatarFallback}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{enquiry.name}</p>
              <div className='flex items-center gap-2'>
                <p className='text-muted-foreground text-xs font-medium'>
                  {enquiry.email}
                </p>
                <span className='text-muted-foreground text-xs'>•</span>
                <p className='text-muted-foreground text-xs'>
                  {enquiry.destinationCountryName || 'N/A'}
                </p>
              </div>
            </div>
            <Badge
              variant={getStatusConfig(enquiry.status).variant}
              className='flex items-center gap-1 px-2 py-0.5'
            >
              {(() => {
                const Config = getStatusConfig(enquiry.status)
                const Icon = Config.icon
                return (
                  <>
                    <Icon className='h-3 w-3' />
                    <span>{Config.label}</span>
                  </>
                )
              })()}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
