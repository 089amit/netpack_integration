'use client'

import { useEffect, useState } from 'react'
import http from '@/utils/http'
import { SHIPMENT_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: { id: number } | null
}

export function GetShipmentInfoDrawer({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const [shipmentData, setShipmentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && currentRow?.id) {
      setLoading(true)
      http
        .get(`${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}/${currentRow.id}`)
        .then((res) => setShipmentData(res))
        .catch(() => setShipmentData(null))
        .finally(() => setLoading(false))
    } else {
      setShipmentData(null)
    }
  }, [open, currentRow])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle className='text-lg font-bold'>
            Shipment Informations
          </SheetTitle>
          <SheetDescription className='text-muted-foreground'>
            View full shipment details including box and pickup info.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='flex-1 overflow-y-auto px-4 pt-4'>
          {loading ? (
            <p className='text-muted-foreground'>Loading...</p>
          ) : shipmentData ? (
            <div className='space-y-6 pb-6'>
              {/* Section: Basic Info */}
              <div>
                <h3 className='text-primary mb-2 text-base font-semibold'>
                  Basic Info
                </h3>
                <dl className='grid grid-cols-2 gap-x-4 gap-y-3 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Status</dt>
                    <dd>{shipmentData.status}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Customer Phone</dt>
                    <dd>{shipmentData.customerPhone}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>
                      Forwarding Company
                    </dt>
                    <dd>{shipmentData.forwardingCompanyName}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Service</dt>
                    <dd>{shipmentData.serviceName}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>
                      Destination Country
                    </dt>
                    <dd>{shipmentData.destinationCountryName}</dd>
                  </div>
                </dl>
              </div>

              <Separator />

              {/* Section: Pickup Locations */}
              <div>
                <h3 className='text-primary mb-2 text-base font-semibold'>
                  Pickup Locations
                </h3>
                <ul className='text-muted-foreground list-disc pl-5 text-sm'>
                  {shipmentData.pickupLocations?.map((loc: any) => (
                    <li key={loc.id}>{loc.location}</li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Section: Boxes */}
              <div>
                <h3 className='text-primary mb-2 text-base font-semibold'>
                  Boxes
                </h3>
                <div className='space-y-4'>
                  {shipmentData.boxDetails?.map((box: any, index: number) => (
                    <div
                      key={box.id}
                      className='bg-muted/20 rounded-md border p-4 shadow-sm'
                    >
                      <p className='mb-2 text-sm font-medium'>
                        Box #{index + 1}
                      </p>
                      <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                        <div>
                          <dt className='text-muted-foreground'>Weight</dt>
                          <dd>{box.weight} kg</dd>
                        </div>
                        <div>
                          <dt className='text-muted-foreground'>
                            Tracking Number
                          </dt>
                          <dd>{box.trackingNumber || 'N/A'}</dd>
                        </div>
                      </dl>
                      <div className='mt-2'>
                        <Label className='text-muted-foreground text-sm'>
                          Items:
                        </Label>
                        <ul className='list-disc pl-5 text-sm'>
                          {box.items?.map((item: any) => (
                            <li key={item.id}>
                              Quantity: {item.quantity} (Item ID:{' '}
                              {item.enquiryItemId})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Section: MAWB */}
              <div>
                <h3 className='text-primary mb-2 text-base font-semibold'>
                  MAWB Details
                </h3>
                <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>MAWB Number</dt>
                    <dd>{shipmentData.mawbDetails?.mawbNumber || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Departure Date</dt>
                    <dd>
                      {shipmentData.mawbDetails?.departureDate?.slice(0, 10) ||
                        'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Section: Enquiry Details */}
              {shipmentData.enquiryDetails && (
                <div className='bg-muted/30 rounded-lg border p-4 shadow-sm'>
                  <h3 className='text-primary mb-4 border-b pb-2 text-lg font-bold'>
                    Enquiry Details
                  </h3>
                  <div className='mb-4 grid grid-cols-2 gap-x-8 gap-y-3'>
                    <div>
                      <Label className='text-muted-foreground'>
                        Sender Name
                      </Label>
                      <div className='font-medium'>
                        {shipmentData.enquiryDetails.senderName}
                      </div>
                    </div>
                    <div>
                      <Label className='text-muted-foreground'>
                        Sender Phone
                      </Label>
                      <div>{shipmentData.enquiryDetails.senderPhone}</div>
                    </div>
                    <div>
                      <Label className='text-muted-foreground'>
                        Receiver Name
                      </Label>
                      <div className='font-medium'>
                        {shipmentData.enquiryDetails.receiverName}
                      </div>
                    </div>
                    <div>
                      <Label className='text-muted-foreground'>
                        Receiver Phone
                      </Label>
                      <div>{shipmentData.enquiryDetails.receiverTelephone}</div>
                    </div>
                    <div>
                      <Label className='text-muted-foreground'>
                        Destination Location
                      </Label>
                      <div>
                        {shipmentData.enquiryDetails.destinationLocation}
                      </div>
                    </div>
                    <div>
                      <Label className='text-muted-foreground'>Status</Label>
                      <div>{shipmentData.enquiryDetails.status}</div>
                    </div>
                  </div>
                  {/* Enquiry Items */}
                  {shipmentData.enquiryDetails.items &&
                    shipmentData.enquiryDetails.items.length > 0 && (
                      <div className='mb-4'>
                        <Label className='text-muted-foreground mb-2 block text-base'>
                          Items
                        </Label>
                        <div className='grid gap-2'>
                          {shipmentData.enquiryDetails.items.map(
                            (item: any) => (
                              <div
                                key={item.id}
                                className='flex flex-wrap items-center gap-x-4 gap-y-1 rounded border bg-white/80 p-2'
                              >
                                <span className='font-semibold'>
                                  {item.description}
                                </span>
                                <span>
                                  Qty:{' '}
                                  <span className='font-medium'>
                                    {item.quantity}
                                  </span>
                                </span>
                                <span>Weight: {item.weight}</span>
                                <span>Value: {item.value}</span>
                                <span>Unit Price: {item.unitPrice}</span>
                                <span>HS Code: {item.hsCode}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  {/* Enquiry Boxes */}
                  {shipmentData.enquiryDetails.boxes &&
                    shipmentData.enquiryDetails.boxes.length > 0 && (
                      <div>
                        <Label className='text-muted-foreground mb-2 block text-base'>
                          Boxes
                        </Label>
                        <div className='grid gap-4'>
                          {shipmentData.enquiryDetails.boxes.map(
                            (box: any, idx: number) => (
                              <div
                                key={box.id || idx}
                                className='rounded border bg-white/80 p-3'
                              >
                                <div className='mb-2 flex items-center justify-between'>
                                  <span className='text-primary font-bold'>
                                    Box {idx + 1}
                                  </span>
                                  <span className='text-muted-foreground text-xs'>
                                    ID: {box.id}
                                  </span>
                                </div>
                                <div className='mb-2 grid grid-cols-2 gap-x-8 gap-y-1'>
                                  <div>
                                    Dimensions:{' '}
                                    <span className='font-medium'>
                                      {box.length} x {box.breadth} x{' '}
                                      {box.height}
                                    </span>
                                  </div>
                                  <div>
                                    Weight:{' '}
                                    <span className='font-medium'>
                                      {box.weight}
                                    </span>
                                  </div>
                                  <div>
                                    Value:{' '}
                                    <span className='font-medium'>
                                      {box.value}
                                    </span>
                                  </div>
                                  <div>
                                    Quantity:{' '}
                                    <span className='font-medium'>
                                      {box.quantity}
                                    </span>
                                  </div>
                                  <div>
                                    Multiplier:{' '}
                                    <span className='font-medium'>
                                      {box.multiplier}
                                    </span>
                                  </div>
                                </div>
                                {box.items && box.items.length > 0 && (
                                  <div className='mt-2'>
                                    <Label className='text-muted-foreground mb-1 block text-sm'>
                                      Items in this box:
                                    </Label>
                                    <div className='grid gap-1'>
                                      {box.items.map((boxItem: any) => (
                                        <div
                                          key={boxItem.id}
                                          className='bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-1 rounded px-2 py-1'
                                        >
                                          <span>
                                            {boxItem.enquiryItem?.description ||
                                              'Item'}
                                          </span>
                                          <span>Qty: {boxItem.quantity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <p className='text-destructive'>No shipment data found.</p>
          )}
        </ScrollArea>

        <div className='mt-4 flex justify-end px-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
