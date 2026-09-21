import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Customer } from '@/type/customer'
import * as XLSX from 'xlsx'
import http from '@/utils/http'
import { USER_ENDPOINTS } from '@/constants/endpoint'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CustomerHistoryData {
  customer: Customer
  enquiries: any[]
  shipments: any[]
  pagination: {
    page: number
    limit: number
    totalEnquiries: number
    totalShipments: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Customer | null
}

export function CustomerHistoryDrawer({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const [historyData, setHistoryData] = useState<CustomerHistoryData | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && currentRow?.id) {
      fetchCustomerHistory(currentRow.id)
    } else {
      setHistoryData(null)
    }
  }, [open, currentRow])

  const fetchCustomerHistory = async (customerId: number) => {
    try {
      setLoading(true)
      const response = await http.get<CustomerHistoryData>(
        USER_ENDPOINTS.CUSTOMER_HISTORY(customerId)
      )
      setHistoryData(response)
    } catch (error) {
      console.error('Failed to fetch customer history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportEnquiryItems = (enquiry: any) => {
    if (!enquiry.items || enquiry.items.length === 0) {
      alert('No items to export for this enquiry.')
      return
    }
    const worksheet = XLSX.utils.json_to_sheet(enquiry.items)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items')
    XLSX.writeFile(workbook, `enquiry_${enquiry.id}_items.xlsx`)
  }

  if (!currentRow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0 sm:h-[80vh] sm:w-[80vw] sm:max-w-[80vw]'>
        <DialogHeader className='border-b p-6'>
          <DialogTitle>
            Customer History:{' '}
            <span className='text-primary'>{currentRow.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-hidden'>
          {loading ? (
            <div className='flex h-full items-center justify-center'>
              <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600'></div>
            </div>
          ) : historyData ? (
            <ScrollArea className='h-full'>
              <div className='p-6'>
                <Tabs defaultValue='enquiries' className='w-full'>
                  <TabsList className='mb-6'>
                    <TabsTrigger value='enquiries'>Enquiries</TabsTrigger>
                    <TabsTrigger value='shipments'>Shipments</TabsTrigger>
                  </TabsList>
                  <TabsContent value='enquiries' className='flex-1'>
                    {historyData.enquiries.length > 0 ? (
                      <div className='mx-auto max-w-5xl overflow-x-auto rounded-lg bg-white/90 shadow'>
                        <table className='min-w-full border text-sm'>
                          <thead>
                            <tr className='bg-muted'>
                              <th className='border p-3'>ID</th>
                              <th className='border p-3'>Destination</th>
                              <th className='border p-3'>Receiver</th>
                              <th className='border p-3'>Items</th>
                              <th className='border p-3'>Created</th>
                              <th className='border p-3'>Status</th>
                              <th className='border p-3'>Export</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyData.enquiries.map((enquiry) => (
                              <tr
                                key={enquiry.id}
                                className='transition hover:bg-gray-50'
                              >
                                <td className='border p-3'>{enquiry.id}</td>
                                <td className='border p-3'>
                                  {enquiry.destinationLocation},{' '}
                                  {enquiry.destinationCountry}
                                </td>
                                <td className='border p-3'>
                                  {enquiry.receiverName}
                                </td>
                                <td className='border p-3'>
                                  {enquiry.items?.length || 0}
                                </td>
                                <td className='border p-3'>
                                  {enquiry.createdAt
                                    ? format(new Date(enquiry.createdAt), 'PPP')
                                    : 'N/A'}
                                </td>
                                <td className='border p-3'>
                                  <Badge
                                    className={getStatusColor(enquiry.status)}
                                  >
                                    {enquiry.status}
                                  </Badge>
                                </td>
                                <td className='border p-3'>
                                  <button
                                    className='rounded bg-blue-600 px-3 py-1 text-xs text-white transition hover:bg-blue-700'
                                    onClick={() =>
                                      handleExportEnquiryItems(enquiry)
                                    }
                                  >
                                    Export Items
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className='py-8 text-center text-gray-500'>
                        No enquiries found for this customer.
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value='shipments' className='flex-1'>
                    {historyData.shipments.length > 0 ? (
                      <div className='mx-auto max-w-5xl overflow-x-auto rounded-lg bg-white/90 shadow'>
                        <table className='min-w-full border text-sm'>
                          <thead>
                            <tr className='bg-muted'>
                              <th className='border p-3'>ID</th>
                              <th className='border p-3'>Forwarding Company</th>
                              <th className='border p-3'>Service</th>
                              <th className='border p-3'>MAWB Number</th>
                              <th className='border p-3'>Created</th>
                              <th className='border p-3'>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyData.shipments.map((shipment) => (
                              <tr
                                key={shipment.id}
                                className='transition hover:bg-gray-50'
                              >
                                <td className='border p-3'>{shipment.id}</td>
                                <td className='border p-3'>
                                  {shipment.forwardingCompanyName}
                                </td>
                                <td className='border p-3'>
                                  {shipment.serviceName}
                                </td>
                                <td className='border p-3'>
                                  {shipment.mawbNumber}
                                </td>
                                <td className='border p-3'>
                                  {shipment.createdAt
                                    ? format(
                                        new Date(shipment.createdAt),
                                        'PPP'
                                      )
                                    : 'N/A'}
                                </td>
                                <td className='border p-3'>
                                  <Badge
                                    className={getStatusColor(shipment.status)}
                                  >
                                    {shipment.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className='py-8 text-center text-gray-500'>
                        No shipments found for this customer.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          ) : (
            <div className='flex h-full items-center justify-center text-gray-500'>
              Failed to load customer history.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
