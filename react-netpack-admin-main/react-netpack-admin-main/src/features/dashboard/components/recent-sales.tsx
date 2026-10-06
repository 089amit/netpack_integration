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
import { ShipmentTrackingDialog } from '@/features/tasks/components/shipment-tracking-dialog'

export function RecentEnquiry() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTracking, setSelectedTracking] = useState<any | null>(null)

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
              receiverName: enquiry.receiverName || 'Consignee',
              senderPhone: enquiry.senderPhone || '',
              trackingNumber: (enquiry as any).trackingNumber,
              hawbNumber: (enquiry as any).hawbNumber || (enquiry as any).hawb,
              forwardingNumber: (enquiry as any).forwardingNumber,
              forwardingCompanyName: (enquiry as any).forwardingCompanyName,
              additionalNote: (enquiry as any).additionalNote,
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
                  To: {enquiry.receiverName}
                </p>
                <span className='text-muted-foreground text-xs'>•</span>
                <p className='text-muted-foreground text-xs'>
                  {enquiry.destinationCountryName || 'N/A'}
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => setSelectedTracking(enquiry)}
              className='cursor-pointer transition-transform hover:scale-105 focus:outline-none'
              title='Click to view full shipment tracking timeline'
            >
              <Badge
                variant={getStatusConfig(enquiry.status).variant}
                className='flex items-center gap-1 px-2.5 py-1 transition-colors hover:ring-2 hover:ring-primary/40'
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
            </button>
          </div>
        </div>
      ))}

      {selectedTracking && (
        <ShipmentTrackingDialog
          open={!!selectedTracking}
          onOpenChange={(isOpen) => !isOpen && setSelectedTracking(null)}
          currentStatus={selectedTracking.status}
          additionalNote={selectedTracking.additionalNote}
          enquiryId={selectedTracking.id}
          trackingNumber={selectedTracking.trackingNumber}
          hawbNumber={selectedTracking.hawbNumber}
          forwardingNumber={selectedTracking.forwardingNumber}
          forwardingCompanyName={selectedTracking.forwardingCompanyName}
        />
      )}
    </div>
  )
}
